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

// ================= SEARCH ROUTE =================
app.get('/search', async (req, res) => {
  const { q, uid, market = 'us' } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  if (uid) SearchLog.create({ uid, query: q }).catch(() => {});

  getJson({
    engine: 'google_shopping',
    q,
    api_key: SERP_API_KEY,
    gl: market,
    num: 10
  }, (data) => {
    const items = data.shopping_results || [];
    const results = items.map(item =>
      ProductIntelligenceEngine(item, items, { market })
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
    getJson({
      engine: 'google_shopping',
      q: alert.productName,
      api_key: SERP_API_KEY,
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

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Smart Intelligence Server running on ${PORT}`)
);
// أضف هذا في server.js ليعمل الرابط بنجاح
app.get('/', (req, res) => {
    res.send('Findly Intelligence Engine is Active! 🚀');
});

// تأكد أن هذا السطر موجود في بداية الملف (مهم جداً للاتصال بالواجهة)
app.use(cors());
