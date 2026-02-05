/* =========================================
   FINDLY SAGE ULTIMATE - SERVER (FINAL)
   ========================================= */

const SageCore = require('./sage-core'); // تأكد أن ملف sage-core.js بجانب هذا الملف
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV VARIABLES ================= */
// يفضل وضع هذه في ملف .env لكنها هنا لتعمل مباشرة
const { MONGO_URI, X_RAPIDAPI_KEY, EMAIL_USER, EMAIL_PASS, PORT } = process.env;
const X_RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";

/* ================= HELPERS (أدوات مساعدة) ================= */
// 1. تنظيف الروابط
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('/url') || u.startsWith('/shopping')) return 'https://www.google.com' + u;
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

// 2. تنظيف الأسعار (مهم جداً للحسابات)
function cleanPrice(p) {
  if (!p) return 0;
  // يحول "$15.99" إلى 15.99
  return parseFloat(p.toString().replace(/[^0-9.]/g,'')) || 0;
}

/* ================= DB MODELS (قواعد البيانات) ================= */
// نموذج التنبيهات
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

// نموذج قائمة المراقبة
const watchlistSchema = new mongoose.Schema({
  uid: String,
  title: String,
  price: Number,
  link: String,
  thumbnail: String,
  addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

// الاتصال بقاعدة البيانات
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected Successfully"))
    .catch(e => console.log("❌ DB Connection Error:", e));
}

/* ================= SEARCH ENGINE (محرك البحث) ================= */
// هذا هو الكود المعدل الذي طلبت إضافته لضمان وصول التحليلات
app.get('/search', async (req, res) => {
  const { q, lang = 'ar', uid = 'guest' } = req.query;
  
  // إذا لم يكتب المستخدم شيئاً
  if (!q) return res.json({ results: [] });

  try {
    // 1. جلب البيانات من أمازون
    const response = await axios.request({
      method: 'GET',
      url: `https://${X_RAPIDAPI_HOST}/search`,
      params: { query: q, country: 'US', category_id: 'aps' },
      headers: {
        'x-rapidapi-key': X_RAPIDAPI_KEY,
        'x-rapidapi-host': X_RAPIDAPI_HOST
      }
    });

    const amazonItems = response.data?.data?.products || [];
    const results = [];

    // 2. معالجة كل منتج
    for (const item of amazonItems) {
      
      // تجهيز كائن المنتج القياسي
      const standardizedItem = {
        name: item.product_title,
        title: item.product_title,
        price: item.product_price, // السعر كنص مثل "$10"
        numericPrice: cleanPrice(item.product_price), // السعر كرقم للحسابات
        link: finalizeUrl(item.product_url),
        thumbnail: item.product_photo,
        source: 'Amazon'
      };

      // تجهيز قائمة المنافسين (مهم جداً لحساب متوسط السوق)
      // نأخذ جميع الأسعار الموجودة في الصفحة لنقارن هذا المنتج بها
      const competitors = amazonItems.map(p => ({
        price: cleanPrice(p.product_price) // تأكدنا من تنظيف السعر هنا
      })).filter(c => c.price > 0); // استبعاد الأسعار الصفرية

      // 3. استدعاء العقل (SageCore)
      const intelligenceRaw = SageCore(
        standardizedItem, // المنتج الحالي
        competitors,      // قائمة المنافسين للمقارنة
        {}, // User Events (يمكن تفعيلها لاحقاً)
        {}, // User History
        uid,
        null
      );

      // 4. تعبئة بيانات الذكاء (Mapping) لتناسب الواجهة
      const intelligence = {
        finalVerdict: {
          // إذا كان القرار "شراء" نضع دائرة خضراء، وإلا روبوت
          emoji: intelligenceRaw?.priceIntel?.decision?.includes('Buy') || intelligenceRaw?.valueIntel?.score > 70 ? '🟢' : '🤖',
          // العنوان: نأخذ القرار الصادر من العقل (مثلاً: صفقة ممتازة)
          title: intelligenceRaw?.priceIntel?.decision || (lang === 'ar' ? 'تحليل ذكي' : 'Smart Analysis'),
          // السبب: نأخذ التسمية التوضيحية (مثلاً: أقل من السوق بـ 20%)
          reason: intelligenceRaw?.priceIntel?.label || (lang === 'ar' ? 'جاري تجميع البيانات...' : 'Analyzing data...')
        },
        trustIntel: intelligenceRaw?.trustIntel || {},
        priceIntel: intelligenceRaw?.priceIntel || {}, // يحتوي على average و min/max
        valueIntel: intelligenceRaw?.valueIntel || { score: 0 }
      };

      // 5. تعبئة بيانات المقارنة للنافذة المنبثقة (Modal)
      const comparison = {
        market_average: intelligence.priceIntel?.average ? `$${intelligence.priceIntel.average}` : '—',
        savings_percentage: intelligence.valueIntel?.score || 0,
        competitors: competitors.length
      };

      // إضافة المنتج للنتائج النهائية
      results.push({
        ...standardizedItem,
        intelligence,
        comparison
      });
    }

    // إرسال الرد للواجهة
    res.json({ query: q, results });

  } catch (err) {
    console.error('❌ Search Error:', err.message);
    // إرجاع مصفوفة فارغة في حالة الخطأ لتجنب تعليق التطبيق
    res.status(500).json({ error: 'Search Failed', results: [] });
  }
});

/* ================= ALERTS (التنبيهات) ================= */
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

/* ================= WATCHLIST (المفضلة) ================= */
// إضافة للمفضلة
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

// جلب المفضلة
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
  console.log(`🚀 Sage Server running on port ${PORT_FINAL}`);
  console.log(`🧠 Brain (SageCore) is active and linked.`);
});
