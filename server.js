const express = require('express');
const cors = require('cors');
// تم استبدال SerpApi بـ Axios للتعامل مع RapidAPI
const axios = require('axios'); 
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
// تم تحديث المتغيرات لتشمل مفاتيح RapidAPI
const { MONGO_URI, X_RAPIDAPI_KEY, X_RAPIDAPI_HOST, EMAIL_USER, EMAIL_PASS, PORT } = process.env;

/* ================= HELPERS (تم إصلاح هذه الدالة جذرياً) ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  
  // 1. إذا كان الرابط يبدأ بمسار جوجل النسبي
  if (u.startsWith('/url') || u.startsWith('/shopping')) {
    return 'https://www.google.com' + u;
  }
  
  // 2. إصلاح البروتوكول
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
      'السعر أقل من متوسطه التاريخي',
      'هذا من أقل الأسعار المسجلة',
      'السعر أعلى من المعتاد'
    ]
  },
  en:{
    buy:'Buy now',
    wait:'Wait, price may drop',
    explain:[
      'Price below historical average',
      'One of the lowest recorded prices',
      'Price higher than usual'
    ]
  },
  fr:{
    buy:'Acheter maintenant',
    wait:'Attendre une baisse',
    explain:[
      'Prix inférieur à la moyenne historique',
      'Un des prix les plus bas enregistrés',
      'Prix supérieur à la normale'
    ]
  },
  tr:{
    buy:'Şimdi satın al',
    wait:'Mevcut en iyi fiyattan yüksek',
    explain:[
      'Fiyat tarihi ortalamanın altında',
      'Kaydedilen en düşük fiyatlardan biri',
      'Fiyat alışılmadık şekilde yüksek'
    ]
  }
};

/* ================= DB ================= */
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(()=>console.log('✅ MongoDB Connected'))
    .catch(err=>console.error('❌ DB Error:',err.message));
}

/* ================= SCHEMAS ================= */
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

/* ================= PRICE HISTORY ================= */
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory',
  new mongoose.Schema({
    productHash:String,
    price:Number,
    store:String,
    date:{type:Date, default:Date.now}
  })
);

/* ================= CORE INTELLIGENCE ================= */
async function ProductIntelligenceEngine(item, allItems, lang='en'){
  const t = I18N[lang] || I18N.en;

  const price = cleanPrice(item.price);
  const rating = Number(item.rating || 0);
  const reviews = Number(item.reviews || 0);

  const prices = allItems.map(i=>cleanPrice(i.price)).filter(p=>p>0);
  const avg = prices.reduce((a,b)=>a+b,0)/(prices.length||1);
  const min = Math.min(...prices);

  const hash = productHash(item);

  // 🔹 Save price to history
  try {
     if (mongoose.connection.readyState === 1) {
        await PriceHistory.create({ productHash:hash, price, store:item.source });
     }
  } catch(e) {}

  // 🔹 Load last 90 days history
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

  // 🔹 Timing intelligence
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

  // 🔹 Value & Trust Score
  let valueScore = Math.min(Math.round((rating*20) + Math.min(reviews/50,20) + Math.max(((avg-price)/avg)*40,0)),100);
  let trustScore = Math.min(Math.round((reviews/30) + (rating*15) + 20),100);

  // 🔹 Verdict Emoji & Label
  const verdict = valueScore>=85 && trustScore>=80 ?
    {emoji:'💎',title: lang==='ar'?'صفقة لقطة':'Gem Deal',summary:t.buy} :
    {emoji:'💡',title: lang==='ar'?'خيار ذكي':'Smart Choice',summary:t.wait};

  // 🔹 Competitor comparison
  const competitors = allItems.slice(0,3).map(i=>({
    store:i.source || (lang==='ar'?'متجر آخر':'Other Store'),
    price:i.price,
    link:finalizeUrl(i.link)
  }));

  // FIX: Risk Analysis
  const warnings = [];
  if(trustScore < 50) warnings.push('Trust score low');
  if(price < avg * 0.5) warnings.push('Suspiciously Low Price');

  // FIX: Link Extraction Strategy (Find the best link)
  let finalLink = finalizeUrl(item.link || item.product_link || item.offer_link);

  return {
    name:item.title,
    price:item.price,
    thumbnail:item.thumbnail,
    link: finalLink, 
    source:item.source,
    verdict,
    marketPosition:{
      percentile:prices.length ? Math.round((prices.filter(p=>p>price).length/prices.length)*100) : 0,
      label: price<=avg ? 'Below avg' : 'Above avg',
      avgMarketPrice:Math.round(avg)
    },
    valueScore:{score:valueScore,label:valueScore>=85?'Excellent':valueScore>=70?'Great':'Fair'},
    trustScore:{score:trustScore,riskLevel:trustScore>=80?'Low':trustScore>=60?'Medium':'High', reasons:[]},
    riskAnalysis: { warnings },
    timing:{recommendation:timingDecision, reason:explain[0]},
    explanation:explain,
    memory:{avg30d:Math.round(histAvg),min30d:Math.round(histMin),records:history.length},
    comparison: {
        market_average: Math.round(avg),
        savings_percentage: Math.round(((avg-price)/avg)*100),
        competitors: competitors
    }
  };
}

/* ================= SEARCH ROUTE (MODIFIED FOR RAPIDAPI) ================= */
app.get('/search', async(req,res)=>{
  const {q,uid,lang='en'} = req.query;
  if(!q) return res.status(400).json({error:'Query required'});
  
  if(mongoose.connection.readyState === 1 && uid) {
      SearchLog.create({uid,query:q}).catch(()=>{});
  }

  const langConfig = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  try{
    if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST) return res.status(500).json({error:'RAPIDAPI KEYS MISSING'});

    // إعداد طلب الـ Axios لـ RapidAPI
    const options = {
      method: 'GET',
      url: `https://${X_RAPIDAPI_HOST}/search`,
      params: {
        q: q,
        gl: langConfig.gl,
        hl: langConfig.hl,
        engine: 'google_shopping'
      },
      headers: {
        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': X_RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const data = response.data;

    if(!data?.shopping_results) return res.json({query:q,results:[]});
    
    const items = data.shopping_results;
    const results = [];
    
    // معالجة كل منتج عبر محرك الذكاء الخاص بك
    for(const item of items){
      results.push(await ProductIntelligenceEngine(item,items,lang));
    }
    
    res.json({query:q,results});

  }catch(err){
    console.error('RapidAPI Error:', err.message);
    res.status(500).json({error:'Server Error during RapidAPI request'});
  }
});

/* ================= ALERTS ================= */
app.post('/alerts', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
        await new Alert(req.body).save();
        res.json({success:true});
    } else { res.status(503).json({error:'DB Offline'}); }
  }catch(e){res.status(500).json({error:e.message});}
});

/* ================= WATCHLIST ================= */
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
app.listen(PORT||3000,()=>console.log('🚀 Server Online with RapidAPI Integration'));
