const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
// أعدتها كما كانت في ملفك الأصلي تماماً
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
const { MONGO_URI, EXA_API_KEY, PORT } = process.env;

/* ================= EXA (ESM SAFE) ================= */
let exa = null;

(async () => {
  try {
    if (!EXA_API_KEY) return;
    const { default: Exa } = await import("exa-js");
    exa = new Exa(EXA_API_KEY);
    console.log("✅ Exa initialized");
  } catch (e) {
    console.warn("⚠️ Exa disabled, Hybrid mode active");
  }
})();

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function extractPriceFromText(text) {
  if (!text) return 0;
  const match =
    text.match(/(\$|€|£|SAR|AED)\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
    text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s?(USD|EUR|SAR|AED|Dollar)/i);
  if (match) return parseFloat(match[2] || match[1].replace(/,/g,'')) || 0;
  return 0;
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
}

function productHash(item){
  return (item.title + item.source).toLowerCase().replace(/\s+/g,'');
}

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
  const price = cleanPrice(item.price);
  const prices = allItems.map(i=>cleanPrice(i.price)).filter(p=>p>0);
  const avg = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : price;
  const min = prices.length ? Math.min(...prices) : price;
  const hash = productHash(item);

  try {
    if (mongoose.connection.readyState === 1 && price > 0) {
      await PriceHistory.create({ productHash:hash, price, store:item.source });
    }
  } catch {}

  let verdict =
    price && price <= min * 1.05
      ? {emoji:'💎',title:'Top Find',summary:'Buy now'}
      : {emoji:'🔍',title:'Result',summary:'Wait'};

  return {
    name:item.title,
    price:item.price || 'N/A',
    thumbnail:item.thumbnail,
    link:finalizeUrl(item.link),
    source:item.source,
    verdict,
    valueScore:{score: price ? 80 : 60},
    trustScore:{score:90,riskLevel:'Low',reasons:['Hybrid AI Verified']},
    riskAnalysis:{warnings: price ? [] : ['Price not detected']},
    timing:{recommendation:verdict.summary,reason:''},
    comparison:{
      market_average:Math.round(avg),
      savings_percentage:avg && price ? Math.round(((avg-price)/avg)*100) : 0,
      competitors:allItems.slice(0,3).map(i=>({
        store:i.source,
        price:i.price,
        link:finalizeUrl(i.link)
      }))
    }
  };
}

/* ================= ROOT ROUTE (الإضافة الوحيدة الضرورية) ================= */
// هذا السطر ضروري جداً لكي لا تظهر رسالة Cannot GET /
app.get('/', (req, res) => {
    res.status(200).send('✅ Server is running properly.');
});

/* ================= SEARCH (EXA + HYBRID FALLBACK) ================= */
app.get('/search', async(req,res)=>{
  const { q, uid, lang='en' } = req.query;
  if (!q) return res.status(400).json({error:'Query required'});

  if (mongoose.connection.readyState === 1 && uid) {
    SearchLog.create({uid,query:q}).catch(()=>{});
  }

  try {
    let rawItems = [];

    /* ---------- PRIMARY: EXA ---------- */
    if (exa) {
      // وضعنا هذا في try/catch لضمان عدم توقف السيرفر إذا فشلت Exa
      try {
          const result = await exa.searchAndContents(q,{
            type:"magic",
            useAutoprompt:true,
            numResults:5,
            text:true
          });

          if (result && result.results) {
              rawItems = result.results.map(item => ({
                title:item.title,
                link:item.url,
                source:item.url ? new URL(item.url).hostname.replace('www.','') : 'unknown',
                price:extractPriceFromText(item.text),
                thumbnail:'',
              }));
          }
      } catch(err) { console.log("Exa Error, trying fallback"); }
    }

    /* ---------- FALLBACK: DUCKDUCKGO ---------- */
    if (!rawItems.length) {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1`;
      
      // التعديل الضروري: إضافة User-Agent لكي يقبل DuckDuckGo الطلب
      const r = await fetch(ddgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const d = await r.json();

      (d.RelatedTopics || []).forEach(it=>{
        if (it.Text && it.FirstURL) {
          rawItems.push({
            title: it.Text,
            link: it.FirstURL,
            source: new URL(it.FirstURL).hostname.replace('www.',''),
            price: extractPriceFromText(it.Text),
            thumbnail:''
          });
        }
      });
    }

    const results = [];
    for (const item of rawItems.slice(0,5)) {
      results.push(await ProductIntelligenceEngine(item, rawItems, lang));
    }

    res.json({query:q,results});
  } catch (e) {
    console.error(e);
    res.status(500).json({error:'Server Error',details:e.message});
  }
});

/* ================= ALERTS ================= */
app.post('/alerts', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
      await new Alert(req.body).save();
      res.json({success:true});
    } else res.status(503).json({error:'DB Offline'});
  }catch(e){res.status(500).json({error:e.message});}
});

/* ================= WATCHLIST ================= */
app.post('/watchlist', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
      await new Watchlist(req.body).save();
      res.json({success:true});
    } else res.status(503).json({error:'DB Offline'});
  }catch(e){res.status(500).json({error:e.message});}
});

app.get('/watchlist/:uid', async(req,res)=>{
  try{
    if (mongoose.connection.readyState === 1) {
      const list = await Watchlist.find({uid:req.params.uid}).sort({addedAt:-1});
      res.json(list);
    } else res.json([]);
  }catch(e){res.status(500).json({error:e.message});}
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
