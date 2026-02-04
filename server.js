const express = require('express');
const cors = require('cors');
const axios = require('axios'); // البديل الرسمي لـ serpapi
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV (تأكد من تسميتها هكذا في رندر) ================= */
const { MONGO_URI, X_RAPIDAPI_KEY, X_RAPIDAPI_HOST, PORT } = process.env;

/* ================= HELPERS (الأصلية كما هي) ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}
function cleanPrice(p) { return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0; }
function productHash(item){ return (item.title + (item.source || 'amazon')).toLowerCase().replace(/\s+/g,''); }

/* ================= الـ 6 لغات كاملة كما طلبت ================= */
const SUPPORTED_LANGS = {
  ar: { country: 'SA', domain: 'com.sa' }, 
  en: { country: 'US', domain: 'com' },    
  fr: { country: 'FR', domain: 'fr' },     
  tr: { country: 'TR', domain: 'com.tr' }, 
  de: { country: 'DE', domain: 'de' },     
  it: { country: 'IT', domain: 'it' }      
};

const I18N = {
  ar:{ buy:'اشترِ الآن', wait:'انتظر، السعر قد ينخفض', explain:['السعر أقل من متوسطه التاريخي','أقل سعر مسجل','السعر مرتفع'] },
  en:{ buy:'Buy now', wait:'Wait, price drop likely', explain:['Below historical average','Lowest recorded price','Price higher than usual'] },
  fr:{ buy:'Acheter', wait:'Attendre', explain:['Prix bas','Prix record','Prix élevé'] },
  tr:{ buy:'Satın al', wait:'Bekle', explain:['Ortalama altı','En düşük fiyat','Yüksek fiyat'] },
  de:{ buy:'Kaufen', wait:'Warten', explain:['Günstiger als sonst','Bestpreis','Hoher Preis'] },
  it:{ buy:'Compra', wait:'Aspetta', explain:['Sotto la media','Prezzo minimo','Prezzo alto'] }
};

/* ================= DB CONNECTION ================= */
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).catch(err=>console.error('❌ DB Error:',err.message));
}
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory', new mongoose.Schema({ productHash:String, price:Number, store:String, date:{type:Date, default:Date.now} }));

/* ================= محرك الذكاء الاصطناعي (Product Intelligence) ================= */
async function ProductIntelligenceEngine(item, allItems, lang='en'){
  const t = I18N[lang] || I18N.en;
  
  // قراءة البيانات بمرونة (لأن أمازون API يغير أسماء الحقول)
  const rawPrice = item.price || item.asin_price || item.product_price || "0";
  const title = item.product_title || item.title || "No Title";
  const image = item.product_photo || item.thumbnail || item.imgUrl || "";
  const link = item.product_url || item.link || item.url || "";
  
  const price = cleanPrice(rawPrice);
  const rating = Number(item.stars || item.rating || 0);
  const reviews = Number(item.reviews_count || item.reviews || 0);
  
  const prices = allItems.map(i=>cleanPrice(i.price || i.asin_price || i.product_price)).filter(p=>p>0);
  const avg = prices.reduce((a,b)=>a+b,0)/(prices.length||1);
  const min = Math.min(...prices);
  const hash = productHash({title, source:'Amazon'});

  try { if (mongoose.connection.readyState === 1) await PriceHistory.create({ productHash:hash, price, store:'Amazon' }); } catch(e) {}

  let histAvg = avg, histMin = min, history = [];
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

  let timingDecision = (price <= histMin*1.05) ? t.buy : (price > histAvg ? t.wait : t.buy);
  let valueScore = Math.min(Math.round((rating*20) + Math.min(reviews/50,20) + Math.max(((avg-price)/avg)*40,0)),100);
  let trustScore = Math.min(Math.round((reviews/30) + (rating*15) + 20),100);

  return {
    name: title,
    price: rawPrice,
    thumbnail: image,
    link: finalizeUrl(link),
    source: 'Amazon',
    verdict: valueScore>=85 && trustScore>=80 ? {emoji:'💎',title: lang==='ar'?'صفقة لقطة':'Gem Deal',summary:t.buy} : {emoji:'💡',title: lang==='ar'?'خيار ذكي':'Smart Choice',summary:t.wait},
    marketPosition:{ percentile: 0, label: price<=avg ? 'Below avg' : 'Above avg', avgMarketPrice:Math.round(avg) },
    valueScore:{score:valueScore,label:valueScore>=85?'Excellent':'Fair'},
    trustScore:{score:trustScore,riskLevel:trustScore>=80?'Low':'High', reasons:[]},
    riskAnalysis: { warnings: trustScore < 50 ? ['Low Trust'] : [] },
    timing:{recommendation:timingDecision, reason: t.explain[0]},
    explanation: [t.explain[0]],
    memory:{avg30d:Math.round(histAvg),min30d:Math.round(histMin),records:history.length},
    comparison: { market_average: Math.round(avg), savings_percentage: Math.round(((avg-price)/avg)*100), competitors: [] }
  };
}

/* ================= مسار البحث (Search Route) ================= */
app.get('/search', async(req,res)=>{
  const { q, lang='en' } = req.query;
  if(!q) return res.status(400).json({error:'Query required'});

  const langSet = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  try {
    const options = {
      method: 'GET',
      url: `https://${X_RAPIDAPI_HOST}/search`,
      params: {
        query: q,
        country: langSet.country,
        domain: langSet.domain
      },
      headers: {
        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': X_RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    
    // محاولة ذكية لاستخراج المنتجات مهما كان اسم الحقل (data أو products أو result)
    const items = response.data.data || response.data.products || response.data.result || response.data.items || [];
    
    const results = [];
    for (const item of items) {
      results.push(await ProductIntelligenceEngine(item, items, lang));
    }
    
    res.json({ query: q, results });
  } catch (err) {
    console.error("Critical Search Error:", err.message);
    res.status(500).json({ error: 'Search Failed', details: err.message });
  }
});

/* ================= START SERVER ================= */
app.get('/', (req, res) => res.send('✅ Findly Amazon Global Server is Online'));
app.listen(PORT || 3000);
