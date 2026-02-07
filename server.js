/* =========================================
   FINDLY SAGE ULTIMATE - SERVER FIX
   ========================================= */

const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV VARIABLES & KEYS ================= */
// ملاحظة: قمت بوضع المفاتيح هنا كاحتياط لضمان عملها فوراً
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

// مفاتيح البحث الجديدة
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
  }
  // يمكن إضافة باقي اللغات هنا لتخفيف حجم الكود، الكود يعمل بدونها إذا لم تكن ضرورية الآن
};

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('/url') || u.startsWith('/shopping')) return 'https://www.google.com' + u;
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
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

/* ================= DB MODELS ================= */
const alertSchema = new mongoose.Schema({
  email: String, productName: String, targetPrice: Number, currentPrice: Number, productLink: String, uid: String, createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String, title: String, price: Number, link: String, thumbnail: String, addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(e => console.log("❌ DB Error:", e));
}

/* ================= ROOT ROUTE (لحل مشكلة الشاشة البيضاء) ================= */
app.get('/', (req, res) => {
    res.send(`<h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">🚀 Findly Server is Running Successfully!</h1>`);
});

/* ================= SEARCH ENGINE ================= */

app.get('/search', async (req, res) => {
    const { q, lang = 'ar', uid = 'guest' } = req.query;
    console.log(`🔎 Start Searching for: ${q} (Lang: ${lang})`);

    if (!q) return res.json({ results: [] });

    try {
        // الحل الجذري: تغيير المحرك إلى google_shopping بدلاً من amazon لتجنب خطأ الـ Unsupported Engine
        const response = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: {
                api_key: SEARCHAPI_KEY,
                engine: "google_shopping", // هذا المحرك متوفر للجميع وأكثر دقة
                q: q,
                hl: lang === 'ar' ? 'ar' : 'en',
                gl: 'us' // يمكنك تغييرها لـ 'sa' إذا كنت تستهدف السعودية فقط
            }
        });

        // استخراج النتائج من هيكلية Google Shopping
        const rawResults = response.data?.shopping_results || [];
        console.log(`✅ Found ${rawResults.length} items from SearchApi`);

        const results = rawResults.map(item => {
            const currentPrice = parseFloat(item.price?.replace(/[^\d.]/g, '')) || 0;
            
            // تحويل البيانات لتناسب الواجهة
            const standardizedItem = {
                title: item.title,
                price: item.price,
                numericPrice: currentPrice,
                link: item.product_link || item.link,
                thumbnail: item.thumbnail,
                source: item.source || 'Marketplace'
            };
    const results = [];

    for (const item of "google_shopping",  ) {
      const currentPrice = cleanPrice(item.product_price);

      const standardizedItem = {
        name: item.product_title,
        title: item.product_title,
        price: item.product_price,
        numericPrice: currentPrice,
        link: finalizeUrl(item.product_url),
        thumbnail: item.product_photo,
        source: ' "google_shopping", '
      };

      // تحليل SageCore (تأكد أن ملف sage-core.js موجود في نفس المجلد)
      const intelligenceRaw = SageCore(
        standardizedItem,
        google_shoppingItems, 
        {}, {}, uid, null
      );

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
        priceIntel: intelligenceRaw.priceIntel,
        valueIntel: intelligenceRaw.valueIntel,
        forecastIntel: intelligenceRaw.forecastIntel,
        trustIntel: intelligenceRaw.trustIntel
      };

      const comparison = {
        market_average: intelligence.priceIntel.average ? `$${intelligence.priceIntel.average}` : '—',
        savings_percentage: intelligence.valueIntel.score || 0,
        competitors: intelligence.valueIntel.competitors || google_shoppingItems.length
      };

      const coupons = generateCoupons(standardizedItem, intelligence);

      results.push({
        ...standardizedItem,
        intelligence,
        comparison,
        coupons
      });
    }

    res.json({ query: q, results });

  } catch (err) {
    console.error('❌ Search Error Details:', err.response?.data || err.message);
    // إرجاع مصفوفة فارغة بدل الخطأ حتى لا يتوقف التطبيق
    res.json({ error: 'Search Failed', results: [] });
  }
});

/* ================= ROUTES ================= */
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
const PORT_FINAL = PORT || 10000;
app.listen(PORT_FINAL, () => {
  console.log(`🚀 Findly Server running on port ${PORT_FINAL}`);
});
