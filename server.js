const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ================= ENV VARIABLES =================
// تأكد من وضع هذه المتغيرات في إعدادات Render
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERP_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ================= LANG SUPPORT =================
const SUPPORTED_LANGS = {
  ar: { hl: 'ar', gl: 'sa' },
  en: { hl: 'en', gl: 'us' },
  fr: { hl: 'fr', gl: 'fr' },
  de: { hl: 'de', gl: 'de' },
  es: { hl: 'es', gl: 'es' },
  tr: { hl: 'tr', gl: 'tr' }
};

// ================= DB CONNECTION ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err.message));

// ================= SCHEMAS =================
const Alert = mongoose.model('Alert', new mongoose.Schema({
  email: String,
  productName: String,
  targetPrice: Number,
  link: String,
  lang: String,
  uid: String
}));

const SearchLog = mongoose.model('SearchLog', new mongoose.Schema({
  uid: String,
  query: String,
  timestamp: { type: Date, default: Date.now }
}));

const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
  uid: String,
  name: String,
  price: String,
  thumbnail: String,
  link: String,
  addedAt: { type: Date, default: Date.now }
}));

// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ================= INTELLIGENCE ENGINE (CORE LOGIC) =================
// تم الحفاظ على هذا المنطق كاملاً كما طلبت
function ProductIntelligenceEngine(item, allItems, { market = 'us' } = {}) {
  const cleanPrice = (p) =>
    parseFloat(p?.toString().replace(/[^0-9.]/g, '')) || 0;

  const price = cleanPrice(item.price);
  const rating = Number(item.rating || 0);
  const reviews = Number(item.reviews || 0);
  const source = (item.source || '').toLowerCase();

  const prices = allItems.map(i => cleanPrice(i.price)).filter(p => p > 0);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
  const minPrice = Math.min(...prices);

  const percentile = prices.length
    ? Math.round((prices.filter(p => p > price).length / prices.length) * 100)
    : 0;

  const marketPosition = {
    percentile,
    label:
      percentile > 80 ? 'Much cheaper than market' :
      percentile > 50 ? 'Below market average' :
      percentile > 25 ? 'Around market price' :
      'Above market average',
    avgMarketPrice: Math.round(avgPrice),
    savingsVsAvg: Math.round(avgPrice - price)
  };

  let valueScoreNum =
    (rating * 20) +
    Math.min(reviews / 50, 20) +
    Math.max(((avgPrice - price) / avgPrice) * 40, 0);

  valueScoreNum = Math.min(Math.round(valueScoreNum), 100);

  const valueScore = {
    score: valueScoreNum,
    label:
      valueScoreNum >= 85 ? 'Exceptional Value' :
      valueScoreNum >= 70 ? 'Great Value' :
      valueScoreNum >= 50 ? 'Fair Value' :
      'Poor Value'
  };

  const trustedStores = {
    us: ['amazon', 'walmart', 'bestbuy'],
    eu: ['amazon', 'mediamarkt'],
    sa: ['amazon', 'noon', 'jarir', 'extra']
  }[market] || [];

  const isTrusted = trustedStores.some(s => source.includes(s));

  let trustScoreNum =
    (isTrusted ? 40 : 15) +
    Math.min(reviews / 30, 30) +
    (rating >= 4.5 ? 30 : rating >= 4 ? 20 : 10);

  trustScoreNum = Math.min(trustScoreNum, 100);

  const trustScore = {
    score: trustScoreNum,
    riskLevel:
      trustScoreNum >= 80 ? 'Low' :
      trustScoreNum >= 60 ? 'Medium' : 'High',
    reasons: [
      isTrusted ? 'Trusted retailer' : 'Unknown seller',
      `${reviews} reviews`,
      `Rating ${rating}/5`
    ]
  };

  const timing = {
    recommendation:
      price <= minPrice * 1.05 ? 'Buy Now' :
      price < avgPrice ? 'Good Time to Buy' :
      'Wait',
    confidence:
      price <= minPrice * 1.05 ? 0.85 :
      price < avgPrice ? 0.65 : 0.4,
    reason:
      price <= minPrice * 1.05
        ? 'Near lowest market price'
        : price < avgPrice
        ? 'Below average price'
        : 'Above normal price'
  };

  const regretProbability =
    rating >= 4.5 && price < avgPrice ? 0.15 :
    price > avgPrice * 1.2 ? 0.65 : 0.35;

  const riskAnalysis = {
    regretProbability,
    warnings: [
      reviews < 20 ? 'Low number of reviews' : null,
      price > avgPrice ? 'Higher than market average' : null
    ].filter(Boolean)
  };

  const verdict =
    valueScoreNum >= 85 && trustScoreNum >= 80
      ? { emoji: '💎', title: 'Excellent Buy', summary: 'Top value with very low risk' }
      : valueScoreNum >= 70
      ? { emoji: '🔥', title: 'Smart Choice', summary: 'Good balance of price and quality' }
      : { emoji: '⚠️', title: 'Consider Carefully', summary: 'Average value compared to alternatives' };

  return {
    name: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    link: item.link,
    source: item.source,
    verdict,
    marketPosition,
    valueScore,
    trustScore,
    timing,
    riskAnalysis
  };
}

// ================= API ROUTES =================

// Search Route
app.get('/search', async (req, res) => {
  const { q, uid, lang = 'en' } = req.query;
  console.log("Search request:", { q, uid, lang });

  if (!q) return res.status(400).json({ error: 'Query required' });

  // Log search asynchronously
  if (uid) SearchLog.create({ uid, query: q }).catch(err => console.error("Log Error:", err));

  const langConfig = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  getJson({
    engine: 'google_shopping',
    q,
    api_key: SERP_API_KEY,
    hl: langConfig.hl,
    gl: langConfig.gl,
    num: 10
  }, (data) => {
    try {
      const items = data.shopping_results || [];
      const results = items.map(item =>
        ProductIntelligenceEngine(item, items, { market: langConfig.gl })
      );
      res.json({ query: q, results });
    } catch (error) {
      console.error("Processing Error:", error);
      res.status(500).json({ error: "Failed to process results" });
    }
  });
});

// Watchlist Route
app.post('/watchlist', async (req, res) => {
  try {
    await new Watchlist(req.body).save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/watchlist/:uid', async (req, res) => {
  try {
    const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Alerts Route
app.post('/alerts', async (req, res) => {
  try {
    // التأكد من حفظ البيانات بالشكل الصحيح
    await new Alert(req.body).save();
    console.log("Alert Saved:", req.body.email);
    res.json({ success: true });
  } catch (e) {
    console.error("Alert Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ================= CRON JOB (Periodic Checks) =================
cron.schedule('0 */12 * * *', async () => {
  console.log("Running Price Check Cron Job...");
  const alerts = await Alert.find();
  
  for (const alert of alerts) {
    const langConfig = SUPPORTED_LANGS[alert.lang] || SUPPORTED_LANGS.en;

    getJson({
      engine: 'google_shopping',
      q: alert.productName,
      api_key: SERP_API_KEY,
      hl: langConfig.hl,
      gl: langConfig.gl,
      num: 3
    }, async (data) => {
      for (const p of data.shopping_results || []) {
        const current = parseFloat(p.price?.replace(/[^0-9.]/g, '')) || 999999;
        // مقارنة السعر
        if (current <= alert.targetPrice) {
          await transporter.sendMail({
            from: EMAIL_USER,
            to: alert.email,
            subject: '🚨 Findly Alert: Price Drop Found!',
            html: `
              <h2>Good News!</h2>
              <p>The product <b>${alert.productName}</b> has dropped to your target price.</p>
              <p>Current Price: <b>${p.price}</b></p>
              <br>
              <a href="${p.link}" style="background:#8b5cf6; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Buy Now</a>
            `
          });
          console.log(`Email sent to ${alert.email}`);
          await Alert.findByIdAndDelete(alert._id); // حذف التنبيه بعد الإرسال
          break;
        }
      }
    });
  }
});

// ================= ROOT ROUTE =================
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('<h1>✅ Findly Smart Server is running</h1><p>Ready to serve requests.</p>');
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Smart Intelligence Server running on ${PORT}`)
);
