/* =========================================
   FINDLY SAGE ULTIMATE - MULTI-LANG SERVER
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

/* ================= ENV VARIABLES ================= */
// تم إضافة EMAIL_USER و EMAIL_PASS واستبدال مفاتيح RapidAPI بالمفاتيح الجديدة
// يتم جلب القيم الآن من بيئة رندر (Render Environment Variables)
const { 
  MONGO_URI, 
  PORT, 
  EMAIL_USER, 
  EMAIL_PASS, 
  SEARCHAPI_KEY, 
  SERPER_API_KEY 
} = process.env;

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
    buy: "Bonne Affaire", wait: "Attendez", fair: "Prix Juste",
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

// دالة الكوبونات
function generateCoupons(item, intelligence) {
  const coupons = [];
  if (!item || !intelligence) return coupons;

  const valueIntel = intelligence.valueIntel || {};
  const priceIntel = intelligence.priceIntel || {};
  const score = Number(valueIntel.score) || 0;
  const avg = Number(priceIntel.average) || 0;
  const price = typeof item.numericPrice === 'number' ? item.numericPrice : 0;

  if (price <= 0) return coupons;

  if (score >= 80) {
    coupons.push({ code: 'SMART10', type: 'percent', discount: 10, reason: 'High value deal' });
  }
  if (avg > 0 && price > (avg * 1.05)) {
    coupons.push({ code: 'SAVE25', type: 'fixed', discount: 25, reason: 'Above market price' });
  }
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

/* ================= SEARCH ENGINE ================= */
app.get('/search', async (req, res) => {
  const { q, lang = 'ar', uid = 'guest' } = req.query;
  const selectedLang = DICT[lang] ? lang : 'ar';
  const TEXTS = DICT[selectedLang];

  if (!q) return res.json({ results: [] });

  try {
    // تم التبديل لاستخدام SEARCHAPI_KEY من البيئة
    // نستخدم محرك أمازون للحصول على بيانات متوافقة مع هيكلية كودك
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        api_key: SEARCHAPI_KEY,
        engine: 'amazon',
        q: q,
        page: 1
      }
    });

    const rawResults = response.data?.organic_results || [];

    // تحويل البيانات (Mapping) لتتناسب مع بقية الكود دون تغيير المنطق
    const amazonItems = rawResults.map(item => ({
        product_title: item.title,
        product_price: item.price?.current_price || item.price || 0,
        product_url: item.link,
        product_photo: item.thumbnail,
        product_asin: item.asin
    }));

    const results = [];

    // التكرار عبر المنتجات المجلوبة
    for (const item of amazonItems) {
      const currentPrice = cleanPrice(item.product_price);

      const standardizedItem = {
        name: item.product_title,
        title: item.product_title,
        price: item.product_price,
        numericPrice: currentPrice,
        link: finalizeUrl(item.product_url),
        thumbnail: item.product_photo,
        source: 'Amazon'
      };

      // تحليل SageCore
      const intelligenceRaw = SageCore(
        standardizedItem,
        amazonItems,
        {}, 
        {},
        uid,
        null
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
        competitors: intelligence.valueIntel.competitors || amazonItems.length
      };

      // إضافة الكوبونات للمنتج
      const coupons = generateCoupons(standardizedItem, intelligence);

      results.push({
        ...standardizedItem,
        intelligence,
        comparison,
        coupons
      });
    }

    // إرسال النتائج النهائية
    res.json({ query: q, results });

  } catch (err) {
    console.error('❌ Search Error:', err.message);
    res.status(500).json({ error: 'Search Failed', results: [] });
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
const PORT_FINAL = PORT || 3000;
app.listen(PORT_FINAL, () => {
  console.log(`🚀 Findly Server running on port ${PORT_FINAL}`);
});
