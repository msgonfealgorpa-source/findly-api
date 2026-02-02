// server.js
const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Intelligence Node'))
  .catch(err => console.error('❌ DB Error:', err));

// تعريف المخططات (Schemas)
const SearchLog = mongoose.model('SearchLog', new mongoose.Schema({
    uid: String, query: String, timestamp: { type: Date, default: Date.now }
}));

// ================= محرك ذكاء المنتجات (Intelligence Engine) =================
function calculateIntelligence(item, allItems, market = 'sa') {
    const cleanPrice = (p) => parseFloat(p?.toString().replace(/[^0-9.]/g, '')) || 0;
    const price = cleanPrice(item.price);
    const prices = allItems.map(i => cleanPrice(i.price)).filter(p => p > 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
    
    // حساب التوفير والتقييم
    const savings = Math.round(avgPrice - price);
    const score = Math.min(Math.round((Number(item.rating || 0) * 20) + (savings > 0 ? 20 : 0)), 100);

    return {
        ...item,
        intelligence: {
            verdict: price < avgPrice ? { emoji: '🔥', title: 'صفقة رابحة' } : { emoji: '⚖️', title: 'سعر عادل' },
            marketStatus: `متوسط السعر في السوق: ${Math.round(avgPrice)}`,
            score: score,
            advice: price < avgPrice ? "هذا المنتج أرخص من أغلب المنافسين حالياً." : "السعر ضمن النطاق الطبيعي، تأكد من المميزات."
        }
    };
}

// ================= مسار البحث (Search Route) =================
app.get('/api/search', async (req, res) => {
    const { q, uid, lang = 'ar' } = req.query;
    
    if (uid) SearchLog.create({ uid, query: q });

    getJson({
        engine: "google_shopping",
        q: q,
        api_key: process.env.SERPAPI_KEY,
        hl: lang,
        gl: "sa"
    }, (data) => {
        const rawItems = data.shopping_results || [];
        const smartResults = rawItems.map(item => calculateIntelligence(item, rawItems));
        res.json({ results: smartResults });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Intelligence Active on Port ${PORT}`));
