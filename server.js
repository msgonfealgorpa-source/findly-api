const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// ⚠️ هام جداً: ضع رابط المونجو الخاص بك هنا
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.mongodb.net/findlyDB?retryWrites=true&w=majority";
const SERP_API_KEY = process.env.SERPAPI_KEY || "YOUR_SERPAPI_KEY"; 

// الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected (Advisor Engine Ready)"))
    .catch(err => console.error("❌ DB Connection Error:", err.message));

// --- Schemas ---
const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: { type: String, required: true },
    name: String,
    price: String,
    image: String, // أضفنا الصورة هنا لتظهر في القائمة
    link: String,
    addedAt: { type: Date, default: Date.now }
}));

const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    budget: { type: Number, default: 0 },
    searchHistory: [String],
    preferredCategories: [String]
}));

// --- Helper Functions ---
function getGeoLocation(lang) {
    const map = { 'ar': 'sa', 'en': 'us', 'fr': 'fr', 'de': 'de', 'es': 'es', 'it': 'it', 'ru': 'ru' };
    return map[lang] || 'us';
}

function analyzeProduct(product, marketAvg, lang) {
    let score = 50;
    let reasons = [];
    
    // تحليل السعر
    const priceVal = product.priceVal || 0;
    const diff = marketAvg > 0 ? ((priceVal - marketAvg) / marketAvg) * 100 : 0;

    if (diff < -15) { score += 30; reasons.push("Great Deal (Low Price)"); }
    else if (diff > 20) { score -= 20; reasons.push("High Price"); }
    else { score += 10; reasons.push("Standard Market Price"); }

    // تحليل المتجر
    if (product.rating >= 4.5) { score += 20; reasons.push("Trusted Seller"); }
    
    // تصنيف
    let label = "Normal";
    if (score > 80) label = "Top Pick 🏆";
    else if (score > 60) label = "Good Value ✅";
    else if (score < 40) label = "Overpriced ⚠️";

    return { score, label, reasons, diff: Math.round(diff) };
}

// --- Endpoints ---

// 1. البحث الذكي (محسن ليدعم اللغات بدقة)
app.post('/smart-search', async (req, res) => {
    const { query, lang, uid, filterType, deepMode } = req.body;
    const geoLocation = getGeoLocation(lang);

    console.log(`🔍 Searching: ${query} [${lang}-${geoLocation}]`);

    try {
        // حفظ سجل البحث
        if(uid) {
            await UserProfile.updateOne(
                { uid }, 
                { $push: { searchHistory: query }, $set: { lastActive: Date.now() } },
                { upsert: true }
            );
        }

        getJson({
            engine: "google_shopping", 
            q: query, 
            api_key: SERP_API_KEY, 
            hl: lang || 'en', // فرض لغة النتائج
            gl: geoLocation, // فرض دولة البحث للحصول على عملة ومتاجر صحيحة
            num: 15
        }, (data) => {
            if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

            // استخراج وتحليل
            let rawProducts = data.shopping_results.map(p => ({
                ...p,
                priceVal: p.extracted_price || (parseFloat((p.price || "0").replace(/[^0-9.]/g, '')))
            })).filter(p => p.priceVal > 0);

            // حساب متوسط السعر للسوق الحالية
            const sum = rawProducts.reduce((acc, curr) => acc + curr.priceVal, 0);
            const marketAvg = rawProducts.length ? sum / rawProducts.length : 0;

            let products = rawProducts.map(p => {
                const analysis = analyzeProduct(p, marketAvg, lang);
                return {
                    name: p.title,
                    price: p.price,
                    priceVal: p.priceVal,
                    thumbnail: p.thumbnail,
                    link: p.product_link || p.link,
                    source: p.source || "Unknown Store",
                    rating: p.rating || 0,
                    reviews: p.reviews || 0,
                    delivery: p.delivery || (lang==='ar' ? "شحن غير محدد" : "Shipping N/A"), // جلب معلومات الشحن
                    analysis: analysis
                };
            });

            // تطبيق الفلاتر
            if (filterType === 'cheap') products.sort((a, b) => a.priceVal - b.priceVal);
            if (filterType === 'top-rated') products.sort((a, b) => b.rating - a.rating);

            res.json({ products, marketAvg });
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. إضافة للمراقبة (تم الإصلاح: يقبل الصورة الآن)
app.post('/watchlist/add', async (req, res) => {
    const { uid, product } = req.body;
    if (!uid || !product) return res.status(400).json({ error: "Missing Fields" });

    try {
        const exists = await Watchlist.findOne({ uid, name: product.name });
        if (exists) return res.json({ success: false, message: "Exists" });

        await Watchlist.create({
            uid,
            name: product.name,
            price: product.price,
            image: product.thumbnail, // حفظ الصورة
            link: product.link
        });
        res.json({ success: true, message: "Added" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. جلب القائمة
app.get('/watchlist/:uid', async (req, res) => {
    try {
        const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
        res.json({ watchlist: list });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. حذف من القائمة
app.delete('/watchlist/:id', async (req, res) => {
    try {
        await Watchlist.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. تحديث البروفايل
app.post('/user/preferences', async (req, res) => {
    const { uid, budget } = req.body;
    try {
        await UserProfile.findOneAndUpdate({ uid }, { budget }, { upsert: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Advisor Engine running on port ${PORT}`));
