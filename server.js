const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();

// ================= إصلاح مشكلة الاتصال (CORS) =================
// هذا السطر يسمح للموقع بالاتصال بالسيرفر من أي مكان
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
  email: String,
  productName: String,
  targetPrice: Number,
  link: String,
  lang: String,
  uid: String
});
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

const SearchLogSchema = new mongoose.Schema({
  uid: String,
  query: String,
  timestamp: { type: Date, default: Date.now }
});
const SearchLog = mongoose.models.SearchLog || mongoose.model('SearchLog', SearchLogSchema);

const WatchlistSchema = new mongoose.Schema({
  uid: String,
  name: String,
  price: String,
  thumbnail: String,
  link: String,
  addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', WatchlistSchema);

// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ================= INTELLIGENCE ENGINE =================
function ProductIntelligenceEngine(item, allItems, { market = 'us' } = {}) {
  const cleanPrice = (p) => parseFloat(p?.toString().replace(/[^0-9.]/g, '')) || 0;
  
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
    label: percentile > 80 ? 'أرخص من السوق بكثير' :
           percentile > 50 ? 'أقل من متوسط السوق' :
           percentile > 25 ? 'حول سعر السوق' : 'أعلى من متوسط السوق',
    avgMarketPrice: Math.round(avgPrice)
  };

  let valueScoreNum = (rating * 20) + Math.min(reviews / 50, 20) + Math.max(((avgPrice - price) / avgPrice) * 40, 0);
  valueScoreNum = Math.min(Math.round(valueScoreNum), 100);

  const valueScore = {
    score: valueScoreNum,
    label: valueScoreNum >= 85 ? 'صفقة ممتازة' :
           valueScoreNum >= 70 ? 'قيمة رائعة' :
           valueScoreNum >= 50 ? 'قيمة عادلة' : 'قيمة ضعيفة'
  };

  const trustedStores = ['amazon', 'noon', 'jarir', 'extra', 'walmart', 'bestbuy'];
  const isTrusted = trustedStores.some(s => source.includes(s));
  let trustScoreNum = (isTrusted ? 40 : 15) + Math.min(reviews / 30, 30) + (rating >= 4.5 ? 30 : rating >= 4 ? 20 : 10);
  trustScoreNum = Math.min(trustScoreNum, 100);

  const trustScore = {
    score: trustScoreNum,
    riskLevel: trustScoreNum >= 80 ? 'منخفض' : trustScoreNum >= 60 ? 'متوسط' : 'مخاطرة',
    reasons: [isTrusted ? 'بائع موثوق' : 'بائع غير معروف', `${reviews} مراجعة`, `تقييم ${rating}/5`]
  };

  const timing = {
    recommendation: price <= minPrice * 1.05 ? 'اشترِ الآن' : price < avgPrice ? 'وقت جيد للشراء' : 'انتظر',
    reason: price <= minPrice * 1.05 ? 'أقل سعر حالياً' : price < avgPrice ? 'أقل من المتوسط' : 'السعر مرتفع'
  };

  const verdict = 
    valueScoreNum >= 85 && trustScoreNum >= 80 ? { emoji: '💎', title: 'صفقة لقطة', summary: 'قيمة عالية ومخاطرة منعدمة' } :
    valueScoreNum >= 70 ? { emoji: '🔥', title: 'خيار ذكي', summary: 'توازن جيد بين السعر والجودة' } :
    { emoji: '⚠️', title: 'فكر جيداً', summary: 'يوجد بدائل أفضل' };

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
    timing
  };
}

// ================= API ROUTES =================

// 1. Search Route
app.get('/search', async (req, res) => {
  const { q, uid, lang = 'en' } = req.query;
  console.log(`🔎 Searching for: ${q} [${lang}]`);

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
      num: 12
    }, (data) => {
      if (!data || !data.shopping_results) {
        return res.json({ query: q, results: [] });
      }

      const items = data.shopping_results;
      const results = items.map(item => 
        ProductIntelligenceEngine(item, items, { market: langConfig.gl })
      );

      res.json({ query: q, results });
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Alerts Route
app.post('/alerts', async (req, res) => {
  try {
    const { email, productName, targetPrice, link, lang, uid } = req.body;
    await new Alert({ email, productName, targetPrice, link, lang, uid }).save();
    console.log(`🔔 Alert set for ${email}`);
    res.json({ success: true });
  } catch (e) {
    console.error("Alert Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 3. Watchlist Routes
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

// 4. Root Route
app.get('/', (req, res) => {
  res.send('<h1>✅ Findly Server is Online</h1>');
});

// ================= CRON JOB =================
cron.schedule('0 */6 * * *', async () => {
  console.log("⏰ Running Price Check...");
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
      if (!data.shopping_results) return;
      
      for (const p of data.shopping_results) {
        const current = parseFloat(p.price?.replace(/[^0-9.]/g, '')) || 999999;
        
        if (current <= alert.targetPrice) {
          await transporter.sendMail({
            from: EMAIL_USER,
            to: alert.email,
            subject: '🚨 Findly: Price Drop Alert!',
            html: `<h3>Good News!</h3><p>The product <b>${alert.productName}</b> is now <b>${p.price}</b>.</p><a href="${p.link}">Buy Now</a>`
          });
          console.log(`Email sent to ${alert.email}`);
          await Alert.findByIdAndDelete(alert._id);
          break;
        }
      }
    });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
