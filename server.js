const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi"); // تأكد من تثبيت: npm install serpapi
const mongoose = require('mongoose');
require('dotenv').config(); // تأكد من تثبيت: npm install dotenv

const app = express();
app.use(cors());
app.use(express.json());

// --- إعدادات قاعدة البيانات ---
// هام: يجب وضع رابط المونجو الحقيقي هنا أو في ملف .env
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.mongodb.net/findlyDB?retryWrites=true&w=majority";
const SERP_API_KEY = process.env.SERPAPI_KEY || "YOUR_SERPAPI_KEY_HERE";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB (Intelligent Engine Ready)"))
    .catch(err => console.error("❌ DB Error:", err.message));

// ==========================================
// 🏛️ الموديلات (Database Models)
// ==========================================

// موديل قائمة المراقبة
const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: { type: String, required: true },
    name: String,
    price: String, // تخزين السعر كنص للعرض
    link: String,
    addedAt: { type: Date, default: Date.now }
}));

// موديل ملف المستخدم (الطبقة 2)
const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    budget: { type: Number, default: 0 },
    searchHistory: [String],
    preferredCategories: [String],
    lastActive: { type: Date, default: Date.now }
}));

// موديل تاريخ الأسعار (الطبقة 3)
const PriceHistory = mongoose.model('PriceHistory', new mongoose.Schema({
    productName: String,
    priceVal: Number,
    date: { type: Date, default: Date.now },
    source: String
}));

// ==========================================
// 🧠 محرك الذكاء (Intelligence Engine)
// ==========================================

function extractPrice(priceStr) {
    if (!priceStr) return 0;
    // تحويل "$1,200.00" إلى 1200.00
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

// 🟣 الطبقة 1: فهم مواصفات المنتج
function parseSpecifications(title) {
    const specs = { cpu: null, ram: null, storage: null, gpu: null, category: 'general' };
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.match(/i[3579]|core\s?i\d/)) specs.cpu = "Intel Core";
    else if (lowerTitle.match(/ryzen\s?[3579]/)) specs.cpu = "AMD Ryzen";
    else if (lowerTitle.match(/m1|m2|m3/)) specs.cpu = "Apple Silicon";

    const ramMatch = title.match(/(\d+)\s?GB\s?RAM/i);
    if (ramMatch) specs.ram = parseInt(ramMatch[1]);

    const storageMatch = title.match(/(\d+)(TB|GB)\s?(SSD|HDD)/i);
    if (storageMatch) specs.storage = storageMatch[0];

    if (lowerTitle.includes('rtx')) specs.gpu = "NVIDIA RTX";
    else if (lowerTitle.includes('gtx')) specs.gpu = "NVIDIA GTX";
    else if (lowerTitle.includes('radeon')) specs.gpu = "AMD Radeon";

    if (specs.gpu && specs.gpu.includes('RTX')) specs.category = 'gaming';
    else if (lowerTitle.includes('macbook') || lowerTitle.includes('ultrabook')) specs.category = 'productivity';

    return specs;
}

// 🟡 الطبقة 4: محرك القرار المتقدم
function advancedDecisionEngine(product, marketAvg, userProfile, specs, lang = 'ar', deepMode = false) {
    let pros = [];
    let cons = [];
    let score = 50;
    let decisionTag = "";
    let marketPosition = "Fair Price";
    let userMatchScore = 50;

    // 1. تحليل السعر
    const priceDiff = ((product.priceVal - marketAvg) / marketAvg) * 100;
    
    if (priceDiff < -10) {
        score += 25;
        marketPosition = "Under Market";
        pros.push(lang === 'ar' ? "أرخص من متوسط السوق" : "Below market average");
    } else if (priceDiff > 15) {
        score -= 25;
        marketPosition = "Overpriced";
        cons.push(lang === 'ar' ? "أعلى من سعر السوق المعتاد" : "Higher than market avg");
    }

    // 2. تحليل المواصفات (إذا كان Deep Mode مفعلاً نزيد الدقة)
    if (deepMode) {
        if (specs.category === 'gaming' && (!specs.gpu)) {
            score -= 30;
            cons.push(lang === 'ar' ? "لا يصلح للألعاب الحديثة" : "Not for modern gaming");
        }
    }

    // 3. تحليل التوافق مع ميزانية المستخدم
    if (userProfile && userProfile.budget > 0) {
        if (product.priceVal <= userProfile.budget) {
            userMatchScore = 95;
            pros.push(lang === 'ar' ? "مناسب لميزانيتك تماماً" : "Fits your budget perfectly");
            score += 10;
        } else if (product.priceVal <= userProfile.budget * 1.15) {
            userMatchScore = 75;
            cons.push(lang === 'ar' ? "يتجاوز ميزانيتك قليلاً" : "Slightly over budget");
        } else {
            userMatchScore = 40;
            cons.push(lang === 'ar' ? "غالي جداً بالنسبة لميزانيتك" : "Way over budget");
            score -= 10;
        }
    }

    // 4. القرار النهائي
    if (score >= 80 && userMatchScore >= 70) decisionTag = "Perfect for You";
    else if (score >= 65) decisionTag = "Best Buy";
    else if (score >= 45) decisionTag = "Good Deal";
    else if (score < 30) decisionTag = "Avoid";
    else decisionTag = "Standard";

    // ترجمة الوسوم
    if (lang === 'ar') {
        const tagsMap = {
            "Perfect for You": "مثالي لك", "Best Buy": "أفضل شراء",
            "Good Deal": "صفقة جيدة", "Avoid": "تجنبه", "Standard": "خيار عادي"
        };
        decisionTag = tagsMap[decisionTag] || decisionTag;
    }

    return {
        pros, cons, decisionTag, marketPosition, userMatchScore,
        savingsLabel: priceDiff < 0 ? `${Math.abs(priceDiff).toFixed(0)}%` : null
    };
}

// ==========================================
// 🚀 Endpoints
// ==========================================

// 1. البحث الذكي
app.post('/smart-search', async (req, res) => {
    const { query, lang, uid, filterType, deepMode } = req.body;

    try {
        // جلب البروفايل أو إنشاء وهمي
        let userProfile = uid ? await UserProfile.findOne({ uid }) : null;
        if (!userProfile) userProfile = { budget: 0, preferredCategories: [] };

        // تحديث سجل البحث
        if (userProfile && uid && !userProfile.searchHistory?.includes(query)) {
            if(userProfile.searchHistory) userProfile.searchHistory.push(query);
            // حفظ التحديث إذا كان مسجلاً
            if(uid) await UserProfile.updateOne({ uid }, { $push: { searchHistory: query } }); 
        }

        // استدعاء SerpApi
        getJson({
            engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 20
        }, async (data) => {
            if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

            let rawProducts = data.shopping_results
                .map(p => ({ ...p, priceVal: extractPrice(p.price || p.extracted_price) }))
                .filter(p => p.priceVal > 0 && p.thumbnail);

            // حساب متوسط السوق
            const validPrices = rawProducts.map(p => p.priceVal);
            const marketAvg = validPrices.length > 0 ? 
                Math.floor(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

            // بناء النتائج
            let products = rawProducts.map(p => {
                const specs = parseSpecifications(p.title);
                const analysis = advancedDecisionEngine(p, marketAvg, userProfile, specs, lang, deepMode);

                return {
                    name: p.title,
                    price: p.price,
                    priceVal: p.priceVal,
                    thumbnail: p.thumbnail,
                    link: p.product_link || p.link,
                    store_name: p.source || "Unknown Store",
                    real_rating: p.rating || 0, // البيانات الحقيقية
                    reviews_count: p.reviews || 0, // البيانات الحقيقية
                    specs: specs,
                    analysis: analysis
                };
            });

            // تطبيق الفلاتر
            if (filterType === 'cheap') products.sort((a, b) => a.priceVal - b.priceVal);
            if (filterType === 'top-rated') products.sort((a, b) => b.real_rating - a.real_rating);
            
            res.json({ products: products.slice(0, 15), marketAvg });
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
    }
});

// 2. تحديث التفضيلات
app.post('/user/preferences', async (req, res) => {
    const { uid, budget, categories } = req.body;
    if(!uid) return res.status(400).json({error: "No UID"});
    try {
        await UserProfile.findOneAndUpdate(
            { uid },
            { budget, preferredCategories: categories, lastActive: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "Profile Updated" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. إضافة للمراقبة (Watchlist Add) - تم الإصلاح
app.post('/watchlist/add', async (req, res) => {
    const { uid, product } = req.body;
    if (!uid || !product) return res.status(400).json({ error: "Missing data" });

    try {
        const exists = await Watchlist.findOne({ uid, name: product.name });
        if (exists) return res.json({ message: "موجود بالفعل" });

        await Watchlist.create({
            uid,
            name: product.name,
            price: product.price,
            link: product.link
        });
        res.json({ success: true, message: "Added" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. جلب قائمة المراقبة (Watchlist Get) - تم الإصلاح
app.get('/watchlist/:uid', async (req, res) => {
    try {
        const list = await Watchlist.find({ uid: req.params.uid });
        res.json({ watchlist: list });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Intelligent Decision Engine running on port ${PORT}`));
