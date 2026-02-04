const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV ================= */
const { MONGO_URI, X_RAPIDAPI_KEY, X_RAPIDAPI_HOST, PORT } = process.env;

/* ================= HELPERS (لا تغيير) ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}
function cleanPrice(p) { return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0; }
function productHash(item){ return (item.title + (item.source || 'amazon')).toLowerCase().replace(/\s+/g,''); }

/* ================= LANGUAGES (الست لغات كاملة) ================= */
const SUPPORTED_LANGS = {
  ar: { country: 'SA', domain: 'com.sa' }, // العربية
  en: { country: 'US', domain: 'com' },    // الإنجليزية
  fr: { country: 'FR', domain: 'fr' },     // الفرنسية
  tr: { country: 'TR', domain: 'com.tr' }, // التركية
  de: { country: 'DE', domain: 'de' },     // الألمانية
  it: { country: 'IT', domain: 'it' }      // الإيطالية
};

const I18N = {
  ar:{ buy:'اشترِ الآن', wait:'انتظر، السعر قد ينخفض', explain:['السعر أقل من متوسطه التاريخي','أقل سعر مسجل','السعر مرتفع'] },
  en:{ buy:'Buy now', wait:'Wait, price drop likely', explain:['Below historical average','Lowest recorded price','Price higher than usual'] },
  fr:{ buy:'Acheter', wait:'Attendre', explain:['Prix bas','Prix record','Prix élevé'] },
  tr:{ buy:'Satın al', wait:'Bekle', explain:['Ortalama altı','En düşük fiyat','Yüksek fiyat'] },
  de:{ buy:'Kaufen', wait:'Warten', explain:['Günstiger als sonst','Bestpreis','Hoher Preis'] },
  it:{ buy:'Compra', wait:'Aspetta', explain:['Sotto la media','Prezzo minimo','Prezzo alto'] }
};

/* ================= DB & SCHEMAS (المحرك الأصلي) ================= */
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).catch(err=>console.error('❌ DB Error:',err.message));
}
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory', new mongoose.Schema({ productHash:String, price:Number, store:String, date:{type:Date, default:Date.now} }));

/* ================= CORE INTELLIGENCE (لا حذف لأي حرف) ================= */
async function ProductIntelligenceEngine(item, allItems, lang='en'){
  const t = I18N[lang] || I18N.en;
  const rawPrice = item.price || item.asin_price || "0";
  const price = cleanPrice(rawPrice);
  const rating = Number(item.stars || item.rating || 0);
  const reviews = Number(item.reviews_count || item.reviews || 0);
  const prices = allItems.map(i=>cleanPrice(i.price || i.asin_price)).filter(p=>p>0);
  const avg = prices.reduce((a,b)=>a+b,0)/(prices.length||1);
  const min = Math.min(...prices);
  const hash = productHash(item);

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
    name: item.product_title || item.title,
    price: rawPrice,
    thumbnail: item.product_photo || item.thumbnail || item.imgUrl,
    link: finalizeUrl(item.product_url || item.link),
    source: 'Amazon',
    verdict: valueScore>=85 && trustScore>=80 ? {emoji:'💎',title: lang==='ar'?'صفقة لقطة':'Gem Deal',summary:t.buy} : {emoji:'💡',title: lang==='ar'?'خيار ذكي':'Smart Choice',summary:t.wait},
    marketPosition:{ percentile: 0, label: price<=avg ? 'Below avg' : 'Above avg', avgMarketPrice:Math.round(avg) },
    valueScore:{score:valueScore,label:valueScore>=85?'Excellent':'Fair'},
    trustScore:{score:trustScore,riskLevel:trustScore>=80?'Low':'High', reasons:[]},
    riskAnalysis: { warnings: trustScore < 50 ? ['Low Trust'] : [] },
    timing:{recommendation:timingDecision, reason:explain[0]},
    explanation: [t.explain[0]],
    memory:{avg30d:Math.round(histAvg),min30d:Math.round(histMin),records:history.length},
    comparison: { market_average: Math.round(avg), savings_percentage: Math.round(((avg-price)/avg)*100), competitors: [] }
  };
}

/* ================= SEARCH ROUTE ================= */
app.get('/search', async(req,res)=>{
  const {q, lang='en'} = req.query;
  if(!q) return res.status(400).json({error:'Query required'});

  // اختيار إعدادات اللغة بناءً على طلب المستخدم
  const langSet = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  try{
    const options = {
      method: 'GET',
      url: `https://${X_RAPIDAPI_HOST}/search`,
      params: { 
        query: q, 
        country: langSet.country, // يرسل الدولة لأمازون لجلب البيانات المحلية
        domain: langSet.domain    // يرسل النطاق لضمان لغة النتائج
      },
      headers: { 'X-RapidAPI-Key': X_RAPIDAPI_KEY, 'X-RapidAPI-Host': X_RAPIDAPI_HOST }
    };

    const response = await axios.request(options);
    const items = response.data.data || response.data.products || response.data.result || [];
    
    const results = [];
    for(const item of items){
      results.push(await ProductIntelligenceEngine(item, items, lang));
    }
    res.json({query:q, results});
  } catch(err) {
    res.status(500).json({error:'Search Failed', details: err.message});
  }
});

app.get('/', (req, res) => res.send('✅ Findly Multi-Lang Amazon Server Online'));
app.listen(PORT||3000);
