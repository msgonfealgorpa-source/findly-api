const express = require('express');
const cors = require('cors');
// const { getJson } = require('serpapi'); // تم الاستبدال
const Exa = require("exa-js"); // المكتبة الجديدة
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
// تم تغيير SERP_API_KEY إلى EXA_API_KEY
const { MONGO_URI, EXA_API_KEY, EMAIL_USER, EMAIL_PASS, PORT } = process.env;

// إعداد Exa
const exa = new Exa(EXA_API_KEY);

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

// دالة مساعدة صغيرة لاستخراج السعر من نص Exa لأن Exa لا يعطي خانة سعر منفصلة
function extractPriceFromText(text) {
    if (!text) return 0;
    const match = text.match(/(\$|€|£|SAR|AED)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i) || 
                  text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(USD|EUR|SAR|AED|Dollar)/i);
    if (match) {
        return parseFloat(match[2] || match[1].replace(/,/g, '')) || 0;
    }
    return 0; 
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
}

function productHash(item){
  return (item.title + item.source).toLowerCase().replace(/\s+/g,'');
}

/* ================= LANGUAGES ================= */
const SUPPORTED_LANGS = {
  ar:{hl:'ar',gl:'sa'},
  en:{hl:'en',gl:'us'},
  fr:{hl:'fr',gl:'fr'},
  tr:{hl:'tr',gl:'tr'}
};

const I18N = {
  ar:{
    buy:'اشترِ الآن',
    wait:'انتظر، السعر قد ينخفض',
    explain:[
      'السعر يبدو جيداً بناءً على التحليل',
      'هذا من أقل الأسعار المكتشفة',
      'السعر قد يكون مرتفعاً قليلاً'
    ]
  },
  en:{
    buy:'Buy now',
    wait:'Wait, price may drop',
    explain:[
      'Price looks good based on analysis',
      'One of the lowest detected prices',
      'Price might be slightly high'
    ]
  },
  fr:{
    buy:'Acheter maintenant',
    wait:'Attendre une baisse',
    explain:[
      'Prix semble bon selon l\'analyse',
      'Un des prix les plus bas détectés',
      'Le prix pourrait être légèrement élevé'
    ]
  },
  tr:{
    buy:'Şimdi satın al',
    wait:'Bekle',
    explain:[
      'Analize göre fiyat iyi görünüyor',
      'Tespit edilen en düşük fiyatlardan biri',
      'Fiyat biraz yüksek olabilir'
    ]
  }
};

/* ================= DB (لم يتم تغيير أي شيء هنا) ================= */
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(()=>console.log('✅ MongoDB Connected'))
    .catch(err=>console.error('❌ DB Error:',err.message));
}

/* ================= SCHEMAS (كما هي) ================= */
const Alert = mongoose.models.Alert || mongoose.model('Alert',
  new mongoose.Schema({
    email:String,
    productName:String,
    targetPrice:Number,
    link:String,
    lang:String,
    uid:String
  })
);

const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist',
  new mongoose.Schema({
    uid:String,
    name:String,
    price:String,
    thumbnail:String,
    link:String,
    addedAt:{type:Date, default:Date.now}
  })
);

const SearchLog = mongoose.models.SearchLog || mongoose.model('SearchLog',
  new mongoose.Schema({
    uid:String,
    query:String,
    timestamp:{type:Date, default:Date.now}
  })
);

/* ================= PRICE HISTORY (كما هي) ================= */
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory',
  new mongoose.Schema({
    productHash:String,
    price:Number,
    store:String,
    date:{type:Date, default:Date.now}
  })
);

/* ================= CORE INTELLIGENCE (كما هي) ================= */
async function ProductIntelligenceEngine(item, allItems, lang='en'){
  const t = I18N[lang] || I18N.en;

  const price = cleanPrice(item.price);
  const rating = Number(item.rating || 4.5);
  const reviews = Number(item.reviews || 100);

  const prices = allItems.map(i=>cleanPrice(i.price)).filter(p=>p>0);
  
  const avg = prices.length > 0 ? prices.reduce((a,b)=>a+b,0)/prices.length : price;
  const min = prices.length > 0 ? Math.min(...prices) : price;

  const hash = productHash(item);

  // DB Logic preserved
  try {
     if (mongoose.connection.readyState === 1 && price > 0) {
        await PriceHistory.create({ productHash:hash, price, store:item.source });
     }
  } catch(e) {}

  let histAvg = avg;
  let histMin = min;
  let history = [];
  try {
      if (mongoose.connection.readyState === 1) {
        history = await PriceHistory.find({productHash:hash}).sort({date:-1}).limit(90);
        if(history.length){
            const histPrices = history.map(h=>h.price);
            histAvg = histPrices.reduce((a,b)=>a+b,0)/(histPrices.length||1);
            histMin = Math.min(...histPrices);
        }
      }
  } catch(e) {}

  let timingDecision = t.buy;
  let explain = [];
  
  if(price <= histMin*1.05){
    timingDecision = t.buy;
    explain.push(t.explain[1]);
  } else if(price > histAvg){
    timingDecision = t.wait;
    explain.push(t.explain[2]);
  } else {
    explain.push(t.explain[0]);
  }

  let valueScore = Math.min(Math.round((rating*20) + Math.min(reviews/50,20) + Math.max(((avg-price)/avg)*40,0)),100);
  let trustScore = 90; 

  const verdict = valueScore>=85 ?
    {emoji:'💎',title: lang==='ar'?'صفقة مميزة':'Top Find',summary:t.buy} :
    {emoji:'🔍',title: lang==='ar'?'نتيجة بحث':'Result',summary:t.wait};

  const competitors = allItems.slice(0,3).map(i=>({
    store:i.source || 'Store',
    price: i.price,
    link:finalizeUrl(i.link)
  }));

  const warnings = [];
  if(price > 0 && price < avg * 0.5) warnings.push('Suspiciously Low Price');

  return {
    name:item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    link: finalizeUrl(item.link),
    source:item.source,
    verdict,
    marketPosition:{
      percentile: (prices.length && price > 0) ? Math.round((prices.filter(p=>p>price).length/prices.length)*100) : 50,
      label: price<=avg ? 'Good Price' : 'Check Market',
      avgMarketPrice:Math.round(avg)
    },
    valueScore:{score:valueScore,label:valueScore>=85?'Excellent':'Good'},
    trustScore:{score:trustScore,riskLevel:'Low', reasons:['AI Verified']},
    riskAnalysis: { warnings },
    timing:{recommendation:timingDecision, reason:explain[0]},
    explanation:explain,
    memory:{avg30d:Math.round(histAvg),min30d:Math.round(histMin),records:history.length},
    comparison: {
        market_average: Math.round(avg),
        savings_percentage: (avg > 0 && price > 0) ? Math.round(((avg-price)/avg)*100) : 0,
        competitors: competitors
    }
  };
}

/* ================= SEARCH ROUTE (التعديل الوحيد هنا) ================= */
app.get('/search', async(req,res)=>{
  const {q,uid,lang='en'} = req.query;
  if(!q) return res.status(400).json({error:'Query required'});
  
  // الاحتفاظ بكود تسجيل البحث في القاعدة
  if(mongoose.connection.readyState === 1 && uid) {
      SearchLog.create({uid,query:q}).catch(()=>{});
  }

  try{
    // استبدال كود SerpApi بـ Exa
    // ملاحظة: قمنا بمحاكاة شكل البيانات لتناسب دوال الذكاء الاصطناعي الخاصة بك
    
    if (!EXA_API_KEY) return res.status(500).json({error:'API KEY MISSING'});
    
    // البحث العميق باستخدام Exa
    const result = await exa.searchAndContents(
      q,
      {
        type: "magic",
        useAutoprompt: true,
        numResults: 5,
        text: true // لجلب المحتوى لمحاولة استخراج السعر
      }
    );

    // تحويل نتائج Exa لتشبه نتائج Google Shopping التي يعتمد عليها الكود
    const rawItems = result.results.map(item => {
        const extractedPrice = extractPriceFromText(item.text);
        return {
            title: item.title,
            link: item.url,
            source: new URL(item.url).hostname.replace('www.',''),
            price: extractedPrice, // السعر المستخرج
            thumbnail: "", // Exa لا يدعم الصور، الكود في html سيعالج هذا
            rating: 4.5, // قيم افتراضية لكي لا تتعطل معادلة الذكاء
            reviews: 50
        };
    });

    const results = [];
    for(const item of rawItems){
        results.push(await ProductIntelligenceEngine(item, rawItems, lang));
    }

    res.json({query:q,results});

  }catch(err){
      console.error(err);
      res.status(500).json({error:'Server Error', details: err.message});
  }
});

/* ================= ALERTS (كما هي) ================= */
app.post('/alerts', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
        await new Alert(req.body).save();
        res.json({success:true});
    } else { res.status(503).json({error:'DB Offline'}); }
  }catch(e){res.status(500).json({error:e.message});}
});

/* ================= WATCHLIST (كما هي) ================= */
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
    } else { res.json([]); }
  }catch(e){res.status(500).json({error:e.message});}
});

/* ================= SERVER ================= */
app.listen(PORT||3000,()=>console.log('🚀 Server Online'));
