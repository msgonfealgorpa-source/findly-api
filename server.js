const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ DB Error:", err.message));

// --- Schemas ---
const Alert = mongoose.model('Alert', new mongoose.Schema({
    email: String, productName: String, targetPrice: Number, link: String, lang: String, uid: String
}));

const SearchLog = mongoose.model('SearchLog', new mongoose.Schema({
    uid: String, query: String, timestamp: { type: Date, default: Date.now }
}));

const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: String, name: String, price: String, thumbnail: String, link: String, addedAt: { type: Date, default: Date.now }
}));

const transporter = nodemailer.createTransport({
    service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// --- Helper Functions ---
const smartReasonsDict = {
    high_rating: { ar: "⭐ منتج ذو تقييم ممتاز (أعلى من 4.5)", en: "⭐ Top Rated product (4.5+ stars)" },
    popular: { ar: "🔥 الأكثر شعبية (آلاف المراجعات)", en: "🔥 Most Popular (Thousands of reviews)" },
    default: { ar: "✨ أفضل نتيجة تطابق بحثك", en: "✨ Best match for your search" }
};

function analyzeProduct(product, lang) {
    const l = lang || 'ar';
    if (product.rating >= 4.5) return smartReasonsDict.high_rating[l] || smartReasonsDict.high_rating['ar'];
    if (product.reviews > 1000) return smartReasonsDict.popular[l] || smartReasonsDict.popular['ar'];
    return smartReasonsDict.default[l] || smartReasonsDict.default['ar'];
}

// --- Endpoints ---
app.post('/smart-search', async (req, res) => {
    const { query, lang, uid } = req.body;
    if (query && uid) await new SearchLog({ uid, query }).save();

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 20
    }, (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

        // 1. تنظيف ومعالجة البيانات
        let results = data.shopping_results.map(p => ({
            name: p.title,
            price: p.price,
            // استخراج الرقم فقط من النص (مثلاً "$100" تصبح 100)
            priceVal: p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 0,
            thumbnail: p.thumbnail,
            link: p.product_link || p.link,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            reason: analyzeProduct(p, lang)
        }));

        // 2. تصفية المنتجات التي لها سعر صالح فقط
        const validPrices = results.filter(p => p.priceVal > 0).map(p => p.priceVal);

        // 3. حساب متوسط السوق الحقيقي (Real Market Average)
        let realMarketAvg = 0;
        if (validPrices.length > 0) {
            const sum = validPrices.reduce((a, b) => a + b, 0);
            realMarketAvg = Math.floor(sum / validPrices.length);
        }

        // ترتيب النتائج حسب التقييم وإرسال المتوسط معها
        results = results.sort((a, b) => b.rating - a.rating).slice(0, 8);
        
        // إرسال المنتجات + متوسط السعر الحقيقي
        res.json({ products: results, marketAvg: realMarketAvg });
    });
});
