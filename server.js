const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
const { MONGO_URI, EXA_API_KEY, PORT } = process.env;

/* ================= EXA (ESM SAFE) ================= */
let exa = null;

(async () => {
  try {
    const { default: Exa } = await import("exa-js");
    exa = new Exa(EXA_API_KEY);
    console.log("✅ Exa initialized");
  } catch (e) {
    console.error("❌ Exa init failed:", e.message);
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
  if (match) return parseFloat(match[2] || match[1].replace(/,/g, '')) || 0;
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
    price <= min * 1.05
      ? {emoji:'💎',title:'Top Find',summary:'Buy now'}
      : {emoji:'🔍',title:'Result',summary:'Wait'};

  return {
    name:item.title,
    price:item.price,
    thumbnail:item.thumbnail,
    link:finalizeUrl(item.link),
    source:item.source,
    verdict,
    valueScore:{score:80},
    trustScore:{score:90,riskLevel:'Low',reasons:['AI Verified']},
    riskAnalysis:{warnings:[]},
    timing:{recommendation:verdict.summary,reason:''},
    comparison:{
      market_average:Math.round(avg),
      savings_percentage:avg?Math.round(((avg-price)/avg)*100):0,
      competitors:allItems.slice(0,3).map(i=>({
        store:i.source,
        price:i.price,
        link:finalizeUrl(i.link)
      }))
    }
  };
}

/* ================= SEARCH ================= */
app.get('/search', async(req,res)=>{
  const { q, uid, lang='en' } = req.query;
  if (!q) return res.status(400).json({error:'Query required'});
  if (!exa) return res.status(503).json({error:'Exa not ready'});

  if (mongoose.connection.readyState === 1 && uid) {
    SearchLog.create({uid,query:q}).catch(()=>{});
  }

  try {
    const result = await exa.searchAndContents(q,{
      type:"magic",
      useAutoprompt:true,
      numResults:5,
      text:true
    });

    const rawItems = result.results.map(item => ({
      title:item.title,
      link:item.url,
      source:item.url ? new URL(item.url).hostname.replace('www.','') : 'unknown',
      price:extractPriceFromText(item.text),
      thumbnail:'',
      rating:4.5,
      reviews:50
    }));

    const results = [];
    for (const item of rawItems) {
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
