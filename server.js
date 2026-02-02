const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();

// ================= إصلاح مشكلة الاتصال (CORS) =================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ================= ENV VARIABLES =================
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERP_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ================= HELPERS (الجذور) =================
function finalizeUrl(url) {
    if (!url) return "";
    let clean = url.trim();
    if (clean.startsWith('//')) return 'https:' + clean;
    if (!clean.startsWith('http')) return 'https://' + clean;
    return clean;
}

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
const AlertSchema = new mongoose.Schema({
  email: String, productName: String, targetPrice: Number, link: String, lang: String, uid: String
});
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

const SearchLogSchema = new mongoose.Schema({
  uid: String, query: String, timestamp: { type: Date, default: Date.now }
});
const SearchLog = mongoose.models.SearchLog || mongoose.model('SearchLog', SearchLogSchema);

const WatchlistSchema = new mongoose.Schema({
  uid: String, name: String, price: String, thumbnail: String, link: String, addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ================= INTELLIGENCE ENGINE (تطوير الذكاء) =================
function ProductIntelligenceEngine(item, allItems, { market = 'us' } = {}) {
  const cleanPrice = (p) => parseFloat(p?.toString().replace(/[^0-9.]/g, '')) || 0;
  
  const price = cleanPrice(item.price);
  const rating = Number(item.rating || 0);
  const reviews = Number(item.reviews || 0);
  const source = (item.source || '').toLowerCase();

  const prices = allItems.map(i => cleanPrice(i.price)).filter(p => p > 0);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
  const minPrice = Math.min(...prices);

  const percentile = prices.length ? Math.round((prices.filter(p => p > price).length / prices.length) * 100) : 0;

  // ذكاء المقارنة الحسابي
  const savings = price < avgPrice ? Math.round(((avgPrice - price) / avgPrice) * 100) : 0;
  
  const comparison = {
    market_average: Math.round(avgPrice),
    savings_percentage: savings,
    is_best_deal: price <= minPrice * 1.05,
    competitors: allItems.slice(0, 3).map(i => ({
        store: i.source || 'متجر آخر',
        price: i.price,
        link: finalizeUrl(i.link)
    }))
  };

  const marketPosition = {
    percentile,
    label: percentile > 80 ? 'أرخص من السوق بكثير' :
            percentile > 50 ? 'أقل من متوسط السوق' :
            percentile > 25 ? 'حول سعر السوق' : 'أعلى من متوسط السوق',
    avgMarketPrice: Math.round(avgPrice)
  };

  let valueScoreNum = (rating * 20) + Math.min(reviews / 50, 20) + Math.max(((avgPrice - price) / avgPrice) * 40, 0);
  valueScoreNum = Math.min(Math.round(valueScoreNum), 100);

  const valueScore = {
    score: valueScoreNum,
    label: valueScoreNum >= 85 ? 'صفقة ممتازة' : valueScoreNum >= 70 ? 'قيمة رائعة' : 'قيمة عادلة'
  };

  const trustScoreNum = Math.min((reviews / 30) + (rating * 15) + (source ? 20 : 0), 100);
  const trustScore = {
    score: trustScoreNum,
    riskLevel: trustScoreNum >= 80 ? 'منخفض' : trustScoreNum >= 60 ? 'متوسط' : 'مخاطرة',
    reasons: [`${reviews} مراجعة`, `تقييم ${rating}/5`]
  };

  const timing = {
    recommendation: price <= minPrice * 1.05 ? 'اشترِ الآن' : 'انتظر التخفيض',
    reason: price <= minPrice * 1.05 ? 'أقل سعر حالياً' : 'السعر فوق المتوسط'
  };

  const verdict = 
    valueScoreNum >= 85 && trustScoreNum >= 80 ? { emoji: '💎', title: 'صفقة لقطة', summary: 'قيمة عالية جداً' } :
    { emoji: '💡', title: 'خيار ذكي', summary: 'جيد للاستخدام اليومي' };

  return {
    name: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    link: finalizeUrl(item.link), // إصلاح الرابط هنا (الجذور)
    source: item.source,
    verdict,
    marketPosition,
    valueScore,
    trustScore,
    timing,
    comparison // إضافة ذكاء المقارنة للنتيجة
  };
}

// ================= API ROUTES =================

app.get('/search', async (req, res) => {
  const { q, uid, lang = 'en' } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  if (uid) SearchLog.create({ uid, query: q }).catch(e => console.error('Log Error', e));

  const langConfig = SUPPORTED_LANGS[lang] || SUPPORTED_LANGS.en;

  try {
    getJson({
      engine: 'google_shopping',
      q,
      api_key: SERP_API_KEY,
      hl: langConfig.hl,
      gl: langConfig.gl,
      num: 15
    }, (data) => {
      if (!data || !data.shopping_results) return res.json({ query: q, results: [] });

      const items = data.shopping_results;
      // هنا نقوم بمعالجة النتائج وأخذ أفضل 5 فقط (تحقيق طلبك الثالث)
      const results = items
        .map(item => ProductIntelligenceEngine(item, items, { market: langConfig.gl }))
        .sort((a, b) => b.valueScore.score - a.valueScore.score)
        .slice(0, 5);

      res.json({ query: q, results });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// بقية المسارات (Alerts, Watchlist) تبقى كما هي دون تغيير للحفاظ على المنطق الخاص بك
app.post('/alerts', async (req, res) => {
    try {
      const { email, productName, targetPrice, link, lang, uid } = req.body;
      await new Alert({ email, productName, targetPrice, link: finalizeUrl(link), lang, uid }).save();
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/watchlist', async (req, res) => {
    try { await new Watchlist(req.body).save(); res.json({ success: true }); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/watchlist/:uid', async (req, res) => {
    try {
      const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
      res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => { res.send('<h1>✅ Findly Brain is Online</h1>'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Intelligence running on port ${PORT}`));
