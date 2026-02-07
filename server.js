/* =========================================
   FINDLY SAGE ULTIMATE - CLEAN SERVER
   ========================================= */

/* ================= LIBRARIES ================= */
const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV VARIABLES ================= */
const { MONGO_URI, PORT } = process.env;

/* =================================================
   🔑 PLACE FOR FUTURE API KEYS & SEARCH ENGINE
   (ضع أي API جديد هنا لاحقًا)
   ================================================= */
// مثال:
// const NEW_API_KEY = process.env.NEW_API_KEY;
// async function searchWithNewApi(query) {}

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
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
}

/* ================= COUPONS ENGINE ================= */
function generateCoupons(item, intelligence) {
  const coupons = [];
  if (!item || !intelligence) return coupons;

  const score = Number(intelligence?.valueIntel?.score || 0);
  const avg = Number(intelligence?.priceIntel?.average || 0);
  const price = Number(item.numericPrice || 0);

  if (price <= 0) return coupons;

  if (score >= 80) {
    coupons.push({ code: 'SMART10', type: 'percent', discount: 10 });
  }
  if (avg > 0 && price > avg * 1.05) {
    coupons.push({ code: 'SAVE25', type: 'fixed', discount: 25 });
  }
  return coupons;
}

/* ================= DB MODELS ================= */
const alertSchema = new mongoose.Schema({
  email: String,
  productName: String,
  targetPrice: Number,
  currentPrice: Number,
  productLink: String,
  uid: String,
  createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String,
  title: String,
  price: Number,
  link: String,
  thumbnail: String,
  addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(e => console.log("❌ DB Error:", e.message));
}

/* ================= SEARCH (PLACEHOLDER) ================= */
app.get('/search', async (req, res) => {
  const { q, lang = 'ar', uid = 'guest' } = req.query;
  const TEXTS = DICT[lang] || DICT.ar;

  if (!q) return res.json({ results: [] });

  // ❗ لا يوجد API هنا حاليًا
  // هذا مسار جاهز لاستقبال نتائج أي محرك بحث لاحقًا
  res.json({
    query: q,
    message: "Search engine not connected yet",
    results: [],
    ui: {
      status: TEXTS.loading
    }
  });
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/watchlist', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await new Watchlist(req.body).save();
      res.json({ success: true });
    } else {
      res.status(503).json({ error: 'DB Offline' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/watchlist/:uid', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
      res.json(list);
    } else {
      res.status(503).json({ error: 'DB Offline' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= START SERVER ================= */
const PORT_FINAL = PORT || 3000;
app.listen(PORT_FINAL, () => {
  console.log(`🚀 Findly Server running on port ${PORT_FINAL}`);
});
