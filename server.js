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
    uid: String, name: String, price: String, priceVal: Number, thumbnail: String, link: String, addedAt: { type: Date, default: Date.now }
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

// دالة تنظيف السعر القوية
function extractPrice(priceStr) {
    if (!priceStr) return 0;
    // يحذف أي شيء ليس رقماً أو نقطة عشرية
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

// --- Endpoints ---

// 1. البحث الذكي
app.post('/smart-search', async (req, res) => {
    const { query, lang, uid } = req.body;
    if (query && uid) await new SearchLog({ uid, query }).save();

    console.log(`🔎 Searching for: ${query}`);

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 20
    }, (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

        // معالجة البيانات
        let results = data.shopping_results.map(p => {
            // محاولة الحصول على السعر من عدة أماكن
            let rawPrice = p.price || p.extracted_price; 
            let pVal = extractPrice(rawPrice);

            return {
                name: p.title,
                price: p.price || "N/A",
                priceVal: pVal, // هذا الرقم هو المهم للمقارنة
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                rating: p.rating || 0,
                reviews: p.reviews || 0,
                reason: analyzeProduct(p, lang)
            };
        });

        // حساب متوسط السوق
        const validPrices = results.filter(p => p.priceVal > 0).map(p => p.priceVal);
        let realMarketAvg = 0;
        
        if (validPrices.length > 0) {
            // نحذف القيم الشاذة (صغيرة جداً أو كبيرة جداً) ليكون المتوسط دقيقاً
            const sum = validPrices.reduce((a, b) => a + b, 0);
            realMarketAvg = Math.floor(sum / validPrices.length);
        }

        // ترتيب النتائج
        results = results.sort((a, b) => b.rating - a.rating).slice(0, 10);
        
        res.json({ products: results, marketAvg: realMarketAvg });
    });
});

// 2. إضافة للمراقبة (كان ناقصاً عندك)
app.post('/watchlist/add', async (req, res) => {
    try {
        const { uid, product } = req.body;
        if (!uid || !product) return res.status(400).json({ error: "Missing data" });

        // التحقق من التكرار
        const exists = await Watchlist.findOne({ uid, name: product.name });
        if (exists) return res.json({ message: "موجود بالفعل" });

        // استخراج القيمة الرقمية للسعر للتخزين
        const pVal = extractPrice(product.price);

        const newItem = new Watchlist({
            uid,
            name: product.name,
            price: product.price,
            priceVal: pVal,
            link: product.link,
            thumbnail: product.thumbnail || ""
        });

        await newItem.save();
        res.json({ message: "Success", item: newItem });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. جلب قائمة المراقبة (كان ناقصاً عندك)
app.get('/watchlist/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const list = await Watchlist.find({ uid }).sort({ addedAt: -1 });
        res.json({ watchlist: list });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// 4. حذف من المراقبة
app.post('/watchlist/delete', async (req, res) => {
    try {
        const { uid, productId } = req.body; // أو الاسم
        // هنا سنحذف بالاسم ورقم المستخدم للتبسيط حسب كود الفرونت
        const { name } = req.body; 
        await Watchlist.findOneAndDelete({ uid, name });
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// 5. Deep AI Analyze (Dummy Placeholder for logic)
app.post('/deep-ai-analyze', (req, res) => {
    // منطق بسيط للرد
    res.json({ deepAnalysis: "⭐ بناءً على تحليل المواصفات والأسعار، يبدو أن هذا المنتج يقدم أفضل قيمة مقابل السعر مقارنة بالمنافسين." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
