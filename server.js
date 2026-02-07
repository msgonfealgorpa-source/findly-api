/* =========================================
   FINDLY SAGE ULTIMATE - ORIGINAL SERVER FIXED
   ========================================= */

const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
// ================= CACHE =================
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 دقيقة
const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV VARIABLES & KEYS ================= */
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

// ✅ حافظت على المفاتيح الخاصة بك كما هي
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY || "gMpzK88KLyBu3GxPzjwW6h2G"; 
const SERPER_API_KEY = process.env.SERPER_API_KEY || "40919ff7b9e5b2aeea7ad7acf8c5df0a64cf54b9";

/* ================= TRANSLATION DICTIONARY ================= */
const DICT = {
  ar: {
    buy: "صفقة ممتازة", wait: "انتظر", fair: "سعر عادل",
    reason_cheap: "أقل من متوسط السوق بـ",
    reason_expensive: "السعر أعلى من السوق",
    reason_fair: "السعر مستقر حالياً",
    analysis: "تحليل ذكي", loading: "جاري التحليل..."
  },
  en: {
    buy: "Great Deal", wait: "Wait", fair: "Fair Price",
    reason_cheap: "Below market average by",
    reason_expensive: "Price is above market",
    reason_fair: "Price is stable now",
    analysis: "Smart Analysis", loading: "Analyzing..."
  },
  fr: {
    buy: "Bonne Affaire", wait: "Attendez", fair: "Prix Justه",
    reason_cheap: "Moins cher que la moyenne de",
    reason_expensive: "Prix supérieur au marché",
    reason_fair: "Prix stable actuellement",
    analysis: "Analyse Intel", loading: "Analyse..."
  },
  de: {
    buy: "Gutes Geschäft", wait: "Warten", fair: "Fairer Preis",
    reason_cheap: "Unter dem Marktdurchschnitt um",
    reason_expensive: "Preis über dem Markt",
    reason_fair: "Preis ist stabil",
    analysis: "Smarte Analyse", loading: "Analyse..."
  },
  es: {
    buy: "Buena Oferta", wait: "Espera", fair: "Precio Justo",
    reason_cheap: "Bajo el promedio por",
    reason_expensive: "Precio sobre el mercado",
    reason_fair: "Precio estable ahora",
    analysis: "Análisis Intel", loading: "Analizando..."
  },
  tr: {
    buy: "Harika Fırsat", wait: "Bekle", fair: "Adil Fiyat",
    reason_cheap: "Piyasa ortalamasının altında:",
    reason_expensive: "Fiyat piyasanın üzerinde",
    reason_fair: "Fiyat şu an istikrarlı",
    analysis: "Akıllı Analiz", loading: "Analiz ediliyor..."
  }
};

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '#';
  let u = url.trim();
  if (u.startsWith('/url') || u.startsWith('/shopping')) return 'https://www.google.com' + u;
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g,'')) || 0;
}

function generateCoupons(item, intelligence) {
  const coupons = [];
  if (!item || !intelligence) return coupons;
  const valueIntel = intelligence.valueIntel || {};
  const priceIntel = intelligence.priceIntel || {};
  const score = Number(valueIntel.score) || 0;
  const avg = Number(priceIntel.average) || 0;
  const price = typeof item.numericPrice === 'number' ? item.numericPrice : 0;

  if (price <= 0) return coupons;
  if (score >= 80) coupons.push({ code: 'SMART10', type: 'percent', discount: 10, reason: 'High value deal' });
  if (avg > 0 && price > (avg * 1.05)) coupons.push({ code: 'SAVE25', type: 'fixed', discount: 25, reason: 'Above market price' });
  return coupons;
}

/* ================= DB MODELS (ORIGINAL) ================= */
const alertSchema = new mongoose.Schema({
  email: String, productName: String, targetPrice: Number, currentPrice: Number, productLink: String, uid: String, createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String, title: String, price: Number, link: String, thumbnail: String, addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

// 🧠 Brain Energy Model
const energySchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  searchesUsed: { type: Number, default: 0 },
  hasFreePass: { type: Boolean, default: false },
  lastReset: { type: Date, default: Date.now }
});

const Energy = mongoose.model('Energy', energySchema);
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(e => console.log("❌ DB Error:", e));
}

/* ================= ROOT ROUTE ================= */
app.get('/', (req, res) => {
    res.send(`<h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">🚀 Findly Server is Running!</h1>`);
});

/* ================= SEARCH ENGINE (FIXED LOGIC) ================= */

app.get('/search', async (req, res) => {
    const { q, lang = 'ar', uid = 'guest' } = req.query;
    console.log(`🔎 Start Searching for: ${q} (Lang: ${lang})`);

    // ✅ تعريف المتغير TEXTS هنا لتجنب الأخطاء
    const TEXTS = DICT[lang] || DICT.ar;

// ================= 🧠 BRAIN ENERGY CHECK =================
let energy = await Energy.findOne({ uid });

if (!energy) {
  energy = await Energy.create({
    uid,
    searchesUsed: 0,
    hasFreePass: false
  });
}

if (energy.hasFreePass !== true && energy.searchesUsed >= 3) {
  return res.status(429).json({
    error: 'ENERGY_EMPTY',
    message: 'تم استهلاك طاقة العقل المجانية 🧠'
  });
}
   
   if (!q) return res.json({ results: [] });
// ================= CACHE CHECK =================
const cacheKey = `${q}_${lang}`;

if (searchCache.has(cacheKey)) {
  const cached = searchCache.get(cacheKey);

  if (Date.now() - cached.time < CACHE_TTL) {
    console.log('⚡ Served from cache');
    return res.json(cached.data);
  } else {
    searchCache.delete(cacheKey);
  }
}

    try {
        // ✅ استخدام SearchAPI مع محرك Google Shopping (الأكثر استقراراً)
        const response = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: {
                api_key: SEARCHAPI_KEY, // استخدام مفتاحك الأصلي
                engine: "google_shopping",
                q: q,
                hl: lang === 'ar' ? 'ar' : 'en',
                gl: 'us'
            }
        });

        // استخراج النتائج
        let rawResults = response.data?.shopping_results || [];
let serperContext = [];

// 👉 شرط واحد واضح: لو النتائج قليلة
if (rawResults.length < 3) {
  const serperRes = await axios.post(
    'https://google.serper.dev/search',
    { q, gl: 'us', hl: lang },
    { headers: { 'X-API-KEY': SERPER_API_KEY } }
  );

  serperContext = serperRes.data?.organic || [];
}
        console.log(`✅ Found ${rawResults.length} items`);

        // ✅ هنا كان الخطأ (Loop Syntax)، تم إصلاحه ليعمل بشكل سليم
        const results = rawResults.map(item => {
            const currentPrice = cleanPrice(item.price || item.extracted_price);

            const standardizedItem = {
                title: item.title,
                price: item.price,
                numericPrice: currentPrice,
                link: finalizeUrl(item.product_link || item.link),
                thumbnail: item.thumbnail || item.product_image,
                source: 'Google Shopping'
            };

            // تشغيل منطق SageCore الخاص ب
           const intelligenceRaw = SageCore(
  standardizedItem,
  rawResults,
  serperContext,
  {},
  uid,
  null
) || {};
           
           let decisionTitle = TEXTS.fair;
            let decisionReason = TEXTS.reason_fair;
            let decisionEmoji = '⚖️';

            const avg = Number(intelligenceRaw?.priceIntel?.average || 0);
            const score = intelligenceRaw?.valueIntel?.score || 0;

            if (avg > 0) {
                if (currentPrice > avg * 1.1) {
                    decisionTitle = TEXTS.wait;
                    decisionReason = TEXTS.reason_expensive;
                    decisionEmoji = '🤖';
                } else if (currentPrice < avg * 0.95) {
                    decisionTitle = TEXTS.buy;
                    decisionReason = `${TEXTS.reason_cheap} ${score}%`;
                    decisionEmoji = '🟢';
                }
            }

            const intelligence = {
                finalVerdict: { emoji: decisionEmoji, title: decisionTitle, reason: decisionReason },
                priceIntel: intelligenceRaw.priceIntel || {},
                valueIntel: intelligenceRaw.valueIntel || {},
                forecastIntel: intelligenceRaw.forecastIntel || {},
                trustIntel: intelligenceRaw.trustIntel || {}
            };

            const comparison = {
                market_average: intelligence.priceIntel.average ? `$${intelligence.priceIntel.average}` : '—',
                savings_percentage: intelligence.valueIntel.score || 0,
                competitors: intelligence.valueIntel.competitors || rawResults.length
            };

            const coupons = generateCoupons(standardizedItem, intelligence);

            return {
                ...standardizedItem,
                intelligence,
                comparison,
                coupons
            };
        });


       // 🧠 ENERGY CONSUME (real search)
if (energy.hasFreePass !== true) {
  energy.searchesUsed += 1;
  await energy.save();
}

const responseData = {
  query: q,
  results,
  energy: {
    used: energy.searchesUsed,
    limit: energy.hasFreePass ? '∞' : 3,
    left: energy.hasFreePass
      ? '∞'
      : Math.max(0, 3 - energy.searchesUsed)
  }
};
   

// حفظ في الكاش
searchCache.set(cacheKey, {
  time: Date.now(),
  data: responseData
});
       
       res.json(responseData);

    } catch (err) {
        console.error('❌ Search Error Details:', err.response?.data || err.message);
        res.json({ error: 'Search Failed', results: [] });
    }
});

/* ================= ROUTES (ALERTS & WATCHLIST) ================= */
// ✅ هذه الروابط بقيت كما هي لتعمل مع قاعدة بياناتك
app.post('/alerts', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      await new Alert(req.body).save(); 
      res.json({ success: true }); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/watchlist', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      await new Watchlist(req.body).save(); 
      res.json({ success: true }); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/watchlist/:uid', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 }); 
      res.json(list); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Findly Server running on port ${PORT}`);
});
