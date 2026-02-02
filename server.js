const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ================= ENV =================
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ================= LANG SUPPORT (NEW) =================
const SUPPORTED_LANGS = {
  ar: { hl: 'ar', gl: 'sa' },
  en: { hl: 'en', gl: 'us' },
  fr: { hl: 'fr', gl: 'fr' },
  de: { hl: 'de', gl: 'de' },
  es: { hl: 'es', gl: 'es' },
  tr: { hl: 'tr', gl: 'tr' }
};

// ================= DB ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err.message));

// ================= SCHEMAS =============
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

// ================= EMAIL ===============
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ================= INTELLIGENCE ENGINE =================
// (لم نغيّر أي شيء هنا)
function ProductIntelligenceEngine(item, allItems, { market = 'us' } = {}) {
  // placeholder مؤقت لتجنب توقف السيرفر
  return {
    name: item.title || 'Unknown',
    price: item.price || 'N/A',
    thumbnail: item.thumbnail || '',
    link: item.link || '',
    source: item.source || '',
    verdict: { emoji: "💡", title: "تحليل", summary: "جارٍ المعالجة" },
    marketPosition: {},
    valueScore: { score: 0 },
    trustScore: { riskLevel: "متوسط" },
    timing: { recommendation: "انتظر", reason: "غير معروف" },
    riskAnalysis: {}
  };
}
// ================= SEARCH ROUTE =================
app.get('/search', async (req, res) => {
  const { q, uid, lang = 'en' } = req.query; // ✅ تعديل هنا فقط
  if (!q) return res.status(400).json({ error: 'Query required' });

  if (uid) SearchLog.create({ uid, query: q }).catch(() => {});

  const langConfig = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  getJson({
    engine: 'google_shopping',
    q,
    api_key: SERP_API_KEY,
    hl: langConfig.hl, // ✅ لغة النتائج
    gl: langConfig.gl, // ✅ السوق
    num: 10
  }, (data) => {
    const items = data.shopping_results || [];
    const results = items.map(item =>
      ProductIntelligenceEngine(item, items, { market: langConfig.gl })
    );
    res.json({ query: q, results });
  });
});

// ================= WATCHLIST =================
app.post('/watchlist', async (req, res) => {
  try {
    await new Watchlist(req.body).save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/watchlist/:uid', async (req, res) => {
  const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
  res.json(list);
});

// ================= ALERTS =================
app.post('/alerts', async (req, res) => {
  try {
    await new Alert(req.body).save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= CRON =================
cron.schedule('0 */12 * * *', async () => {
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
        if (current <= alert.targetPrice) {
          await transporter.sendMail({
            from: EMAIL_USER,
            to: alert.email,
            subject: '🚨 Price Drop Found!',
            html: `<p>${alert.productName}<br><b>${p.price}</b><br><a href="${p.link}">Buy Now</a></p>`
          });
          await Alert.findByIdAndDelete(alert._id);
          break;
        }
      }
    });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Findly Smart Server is running');
});
// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Smart Intelligence Server running on ${PORT}`)
);
