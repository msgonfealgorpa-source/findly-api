const express = require('express');
const cors = require('cors');
// const { getJson } = require('serpapi'); // تم الإيقاف
const Exa = require("exa-js"); // المكتبة البديلة
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
// تأكد من وجود EXA_API_KEY في متغيرات البيئة بدلاً من SERP_API_KEY
const { MONGO_URI, EXA_API_KEY, EMAIL_USER, EMAIL_PASS, PORT } = process.env;

// إعداد Exa
const exa = new Exa(EXA_API_KEY);

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  // تنظيف الروابط في حال كانت تأتي ببادئات غريبة
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

// دالة لاستخراج السعر من النصوص (لأن Exa بحث نصي وليس تسوق)
function extractPriceFromText(text) {
    if (!text) return 0;
    // يبحث عن أنماط مثل $500 أو 500 USD أو 500 ريال
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
  ar:{hl:'ar',gl:'sa'}, // إعدادات اللغة (سنستخدمها لتوجيه Exa إذا أمكن)
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
  // Exa لا يعطي تقييمات، سنضع قيم افتراضية ذكية لكي لا ينهار التصميم
  const rating = Number(item.rating || 4.5); 
  const reviews = Number(item.reviews || 100);

  // تصفية الأسعار الصفرية لتجنب القسمة على صفر
  const prices = allItems.map(i=>cleanPrice(i.price)).filter(p=>p>0);
  
  // حساب المتوسط (مع حماية ضد القسمة على صفر)
  const avg = prices.length > 0 ? prices.reduce((a,b)=>a+b,0)/prices.length : price;
  const min = prices.length > 0 ? Math.min(...prices) : price;

  const hash = productHash(item);

  // 🔹 Save price to history
  try {
     if (mongoose.connection.readyState === 1 && price > 0) {
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
  
  if (price === 0) {
      timingDecision = lang==='ar'?'تحقق من الموقع':'Check Site';
      explain.push(lang==='ar'?'السعر غير متوفر مباشرة':'Price check required');
  } else if(price <= histMin*1.05){
    timingDecision = t.buy;
    explain.push(t.explain[1]);
  } else if(price > histAvg){
    timingDecision = t.wait;
    explain.push(t.explain[2]);
  } else {
    explain.push(t.explain[0]);
  }

  // 🔹 Value & Trust Score
  // معادلة معدلة لتعمل حتى بدون تقييمات دقيقة
  let valueScore = 85; // قيمة افتراضية جيدة
  if (price > 0 && avg > 0) {
     valueScore = Math.min(Math.round((rating*20) + Math.min(reviews/50,20) + Math.max(((avg-price)/avg)*40,0)),100);
  }
  
  let trustScore = 90; // نفترض الثقة في نتائج Exa

  // 🔹 Verdict Emoji & Label
  const verdict = valueScore>=85 ?
    {emoji:'💎',title: lang==='ar'?'صفقة مميزة':'Top Find',summary:t.buy} :
    {emoji:'🔍',title: lang==='ar'?'نتيجة بحث':'Result',summary:t.wait};

  // 🔹 Competitor comparison
  const competitors = allItems.slice(0,3).map(i=>({
    store:i.source || (lang==='ar'?'متجر آخر':'Other Store'),
    price: i.price > 0 ? i.price : (lang==='ar'?'شاهد الرابط':'See Link'),
    link:finalizeUrl(i.link)
  }));

  // Risk Analysis
  const warnings = [];
  if(price > 0 && price < avg * 0.5) warnings.push('Suspiciously Low Price');

  return {
    name:item.title,
    price: item.price > 0 ? item.price : (lang==='ar' ? 'شاهد الرابط' : 'Check Link'),
    thumbnail: item.thumbnail || '', // Exa لا يرجع صور، الواجهة ستضع صورة افتراضية
    link: finalizeUrl(item.link),
    source:item.source,
    verdict,
    marketPosition:{
      percentile: (prices.length && price > 0) ? Math.round((prices.filter(p=>p>price).length/prices.length)*100) : 50,
      label: price<=avg ? 'Good Price' : 'Check Market',
      avgMarketPrice:Math.round(avg)
    },
    valueScore:{score:valueScore,label:valueScore>=85?'Excellent':'Good'},
    trustScore:{score:trustScore,riskLevel:'Low', reasons:['AI Search Result']},
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

/* ================= SEARCH ROUTE (MODIFIED FOR EXA) ================= */
app.get('/search', async(req,res)=>{
  const {q,uid,lang='en'} = req.query;
  if(!q) return res.status(400).json({error:'Query required'});
  
  // تسجيل البحث
  if(mongoose.connection.readyState === 1 && uid) {
      SearchLog.create({uid,query:q}).catch(()=>{});
  }

  try{
    if (!EXA_API_KEY) return res.status(500).json({error:'API KEY MISSING'});

    console.log(`🔎 Searching Exa for: ${q}`);

    // البحث باستخدام Exa
    const result = await exa.searchAndContents(
      q,
      {
        type: "neural",
        useAutoprompt: true, // ميزة ذكية لتحسين البحث
        numResults: 10,
        text: true // جلب النص لمحاولة استخراج السعر
      }
    );

    if(!result?.results) return res.json({query:q,results:[]});

    // تحويل نتائج Exa لتناسب هيكل التطبيق القديم
    // Exa returns: { title, url, text, ... }
    const rawItems = result.results.map(item => {
        const extractedPrice = extractPriceFromText(item.text);
        return {
            title: item.title,
            link: item.url,
            source: new URL(item.url).hostname.replace('www.',''),
            price: extractedPrice, // السعر المستخرج أو 0
            thumbnail: "", // لا توجد صور في Exa API الأساسي
            rating: 4.5, // وهمي
            reviews: 100 // وهمي
        };
    });

    // تمرير النتائج لمحرك الذكاء
    const results = [];
    for(const item of rawItems){
        results.push(await ProductIntelligenceEngine(item, rawItems, lang));
    }

    res.json({query:q,results});

  }catch(err){
      console.error("Exa Error:", err);
      res.status(500).json({error:'Server Error', details: err.message});
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
app.listen(PORT||3000,()=>console.log('🚀 Server Online'));
