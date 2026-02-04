const express = require('express');
const cors = require('cors');
const axios = require('axios'); // تم استبدال مكتبة serpapi بـ axios لجلب بيانات أمازون
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV (إعدادات البيئة) ================= */
// تأكد من وضع هذه الأسماء بدقة في إعدادات Render
const { MONGO_URI, X_RAPIDAPI_KEY, EMAIL_USER, EMAIL_PASS, PORT } = process.env;
const X_RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";

/* ================= HELPERS (بقي كما هو تماماً لضمان سلامة الروابط) ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('/url') || u.startsWith('/shopping')) {
    return 'https://www.google.com' + u;
  }
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
}

function productHash(item){
  return (item.title + item.source).toLowerCase().replace(/\s+/g,'');
}

/* ================= LANGUAGES ================= */
const SUPPORTED_LANGS = {
  ar:{hl:'ar',gl:'eg'},
  en:{hl:'en',gl:'us'}
};

/* ================= DB MODELS (نماذج قاعدة البيانات - لم تُلمس) ================= */
const alertSchema = new mongoose.Schema({
  email: String,
  productName: String,
  targetPrice: Number,
  currentPrice: Number,
  productLink: String,
  uid: String,
  createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String,
  title: String,
  price: Number,
  link: String,
  thumbnail: String,
  addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

if(MONGO_URI){
  mongoose.connect(MONGO_URI).then(()=>console.log("DB Connected")).catch(e=>console.log("DB Error:",e));
}

/* ================= PRODUCT INTELLIGENCE ENGINE (عقل الذكاء الاصطناعي - محفوظ بالكامل) ================= */
async function ProductIntelligenceEngine(item, allItems, lang){
  const price = cleanPrice(item.price);
  // حساب المتوسط بناءً على أسعار النتائج القادمة
  const avg = allItems.reduce((acc,curr)=> acc + cleanPrice(curr.price || curr.product_price), 0) / allItems.length;
  
  let score = 0;
  let label = lang === 'ar' ? 'جيد' : 'Good';
  let color = '#8b5cf6';

  if(price < avg * 0.8) { 
    score = 95; label = lang === 'ar' ? 'لقطة ممتازة!' : 'Amazing Deal!'; color = '#10b981';
  } else if(price <= avg) {
    score = 75; label = lang === 'ar' ? 'سعر مناسب' : 'Fair Price'; color = '#3b82f6';
  } else {
    score = 40; label = lang === 'ar' ? 'مرتفع قليلاً' : 'Pricey'; color = '#ef4444';
  }

  return {
    ...item,
    intelligence: { score, label, color, average: avg.toFixed(2) }
  };
}

/* ================= SEARCH ENDPOINT (تم تطويعه لبيانات أمازون وتوافق الواجهة) ================= */
app.get('/search', async(req,res)=>{
  const { q, lang='ar' } = req.query;
  if(!q) return res.json({results:[]});

  try {
    const options = {
      method: 'GET',
      url: `https://${X_RAPIDAPI_HOST}/search`,
      params: { query: q, country: 'US', category_id: 'aps' },
      headers: {
        'x-rapidapi-key': X_RAPIDAPI_KEY,
        'x-rapidapi-host': X_RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const amazonItems = response.data.data.products || [];

    const results = [];
    for(const item of amazonItems){
      // هنا "التطويع": نحول أسماء أمازون لتتوافق مع ما يتوقعه ملف index.html و "العقل"
      const standardizedItem = {
        title: item.product_title,
        price: item.product_price,
        link: item.product_url,
        thumbnail: item.product_photo,
        source: "Amazon"
      };
      // استدعاء العقل بنفس منطقه الأصلي
      results.push(await ProductIntelligenceEngine(standardizedItem, amazonItems, lang));
    }
    res.json({query:q, results});

  } catch(err) {
    console.error("Search Error:", err);
    res.status(500).json({error:'Search Failed'});
  }
});

/* ================= ALERTS & WATCHLIST (بقي كما هو تماماً) ================= */
app.post('/alerts', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
        await new Alert(req.body).save();
        res.json({success:true});
    } else { res.status(503).json({error:'DB Offline'}); }
  }catch(e){res.status(500).json({error:e.message});}
});

app.post('/watchlist', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
        await new Watchlist(req.body).save();
        res.json({success:true});
    } else { res.status(503).json({error:'DB Offline'}); }
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/watchlist/:uid', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
        const list = await Watchlist.find({uid:req.params.uid}).sort({addedAt:-1});
        res.json(list);
    } else { res.status(503).json({error:'DB Offline'}); }
  }catch(e){res.status(500).json({error:e.message});}
});

const PORT_FINAL = PORT || 3000;
app.listen(PORT_FINAL, () => console.log(`Server running on port ${PORT_FINAL}`));
