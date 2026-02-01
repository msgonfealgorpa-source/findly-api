const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ================= ENV (تأكد من وجود هذه القيم في Render) =================
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY; // مفتاح SerpApi الخاص بك
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ================= DB CONNECTION ==================
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
  uid: String,
  createdAt: { type: Date, default: Date.now }
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

// ================= EMAIL CONFIG ===============
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ================= INTELLIGENCE ENGINE =================
function ProductIntelligenceEngine(item, allItems, { market = 'us' } = {}) {
  // إصلاح استخراج السعر
  const cleanPrice = (p) => {
    if (!p) return 0;
    return parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0;
  };

  // إصلاح استخراج الرابط (حل مشكلة 404)
  // SerpApi يعيد أحياناً link أو product_link أو offer_link
  const directLink = item.link || item.product_link || item.offer_link || '#';

  const price = cleanPrice(item.price);
  const rating = Number(item.rating || 0);
  const reviews = Number(item.reviews || 0);
  const source = (item.source || '').toLowerCase();

  // تحليل السوق
  const prices = allItems.map(i => cleanPrice(i.price)).filter(p => p > 0);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
  const minPrice = Math.min(...prices) || price;

  // منطق التقييم الذكي
  let valueScoreNum = (rating * 20) + Math.min(reviews / 50, 20);
  if (avgPrice > 0) {
      valueScoreNum += Math.max(((avgPrice - price) / avgPrice) * 40, 0);
  }
  valueScoreNum = Math.min(Math.round(valueScoreNum), 100);

  // المتاجر الموثوقة حسب المنطقة
  const trustedStores = {
    us: ['amazon', 'walmart', 'bestbuy', 'ebay'],
    sa: ['amazon', 'noon', 'jarir', 'extra'], // السعودية
    ae: ['amazon', 'noon', 'sharaf dg'], // الإمارات
    eg: ['amazon', 'noon', 'b.tech'], // مصر
    eu: ['amazon', 'mediamarkt', 'fnac']
  }[market] || ['amazon'];

  const isTrusted = trustedStores.some(s => source.includes(s));
  
  let trustScoreNum = (isTrusted ? 50 : 20) + Math.min(reviews / 30, 30) + (rating >= 4 ? 20 : 0);
  trustScoreNum = Math.min(trustScoreNum, 100);

  const verdict =
    valueScoreNum >= 80 && trustScoreNum >= 70
      ? { emoji: '💎', title: 'Excellent Buy', summary: 'High value & trusted seller' }
      : valueScoreNum >= 60
      ? { emoji: '🔥', title: 'Smart Choice', summary: 'Good price point' }
      : { emoji: '⚖️', title: 'Fair Deal', summary: 'Standard market price' };

  return {
    name: item.title,
    price: item.price,
    cleanPrice: price, // للسيرفر
    thumbnail: item.thumbnail,
    link: directLink, // الرابط المصحح
    source: item.source,
    verdict,
    trustScore: { score: trustScoreNum, label: isTrusted ? 'Trusted' : 'Normal' },
    smartReason: verdict.summary
  };
}

// ================= SEARCH ROUTE =================
app.get('/search', async (req, res) => {
  const { q, uid, lang = 'en' } = req.query;
  
  if (!q) return res.status(400).json({ error: 'Query required' });

  // تسجيل البحث
  if (uid) SearchLog.create({ uid, query: q }).catch(() => {});

  // خريطة لتحديد موقع البحث بناء على لغة المستخدم لضمان نتائج محلية
  const geoMap = {
      'ar': { gl: 'sa', hl: 'ar' }, // السعودية للعربية (أكبر سوق)
      'en': { gl: 'us', hl: 'en' },
      'fr': { gl: 'fr', hl: 'fr' },
      'de': { gl: 'de', hl: 'de' },
      'es': { gl: 'es', hl: 'es' },
      'tr': { gl: 'tr', hl: 'tr' }
  };

  const settings = geoMap[lang] || geoMap['en'];

  console.log(`🔎 Searching for: ${q} in ${settings.gl}`);

  getJson({
    engine: 'google_shopping',
    q,
    api_key: SERP_API_KEY,
    gl: settings.gl, // الدولة
    hl: settings.hl, // اللغة
    num: 20 // تم زيادة النتائج إلى 20
  }, (data) => {
    if (!data) return res.status(500).json({ error: "SerpApi Error" });
    
    const items = data.shopping_results || [];
    const results = items.map(item =>
      ProductIntelligenceEngine(item, items, { market: settings.gl })
    );
    res.json({ query: q, results });
  });
});

// ================= WATCHLIST & ALERTS =================
// مسار واحد يضيف للقائمة وللتنبيهات
app.post('/watchlist', async (req, res) => {
  try {
    const { uid, name, price, link, email } = req.body;

    // 1. الحفظ في قائمة المراقبة للعرض في الواجهة
    const existing = await Watchlist.findOne({ uid, name });
    if (!existing) {
        await new Watchlist({ uid, name, price, link }).save();
    }

    // 2. إذا وجد إيميل، نقوم بإنشاء تنبيه سعري
    if (email && email.includes('@')) {
        const cleanP = parseFloat(price.toString().replace(/[^0-9.]/g, '')) || 0;
        await new Alert({
            email,
            productName: name,
            targetPrice: cleanP * 0.95, // تنبيه إذا انخفض السعر 5%
            link,
            uid
        }).save();
    }

    res.json({ success: true, message: "Added to watchlist & alerts" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/watchlist/:uid', async (req, res) => {
  const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
  res.json(list);
});

// حذف عنصر من القائمة
app.delete('/watchlist/:id', async (req, res) => {
    try {
        await Watchlist.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

// ================= CRON JOB (التنبيهات) =================
cron.schedule('0 10 * * *', async () => { // كل يوم الساعة 10 صباحاً
  console.log('⏰ Checking prices for alerts...');
  const alerts = await Alert.find();
  
  for (const alert of alerts) {
    getJson({
      engine: 'google_shopping',
      q: alert.productName,
      api_key: SERP_API_KEY,
      num: 1
    }, async (data) => {
      const p = data.shopping_results?.[0];
      if (p) {
        const current = parseFloat(p.price?.replace(/[^0-9.]/g, '')) || 999999;
        
        if (current <= alert.targetPrice) {
          await transporter.sendMail({
            from: EMAIL_USER,
            to: alert.email,
            subject: `🔥 Price Drop: ${alert.productName}`,
            html: `
                <h2>Great News!</h2>
                <p>The price for <b>${alert.productName}</b> has dropped to <b>${p.price}</b>.</p>
                <p>Target was: ${alert.targetPrice}</p>
                <a href="${p.link}" style="padding:10px 20px; background:#8b5cf6; color:white; text-decoration:none; border-radius:5px;">Buy Now</a>
            `
          });
          // نحذف التنبيه بعد الإرسال أو نحدث السعر المستهدف (هنا نحذفه)
          await Alert.findByIdAndDelete(alert._id);
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
