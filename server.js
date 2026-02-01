const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// الإعدادات
const MONGO_URI = https://findly-api.onrender.com;
const SERP_API_KEY = process.env.SERPAPI_KEY;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB (Intelligent Engine Ready)"))
    .catch(err => console.error("❌ DB Error:", err.message));

// ==========================================
// 🏛️ الموديلات (Database Models)
// ==========================================

const Alert = mongoose.model('Alert', new mongoose.Schema({
    email: String, productName: String, targetPrice: Number, link: String, uid: String
}));

const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: String, name: String, priceVal: Number, link: String, addedAt: { type: Date, default: Date.now }
}));

// 🔵 الطبقة 2: ذكاء ملف المستخدم
const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    budget: { type: Number, default: 0 }, // الميزانية المرصودة
    searchHistory: [String], // سجل البحث لتعلم الاهتمامات
    preferredCategories: [String], // مثلاً: 'gaming', 'office', 'phones'
    lastActive: { type: Date, default: Date.now }
}));

// 🟢 الطبقة 3: تتبع تاريخ السعر
const PriceHistory = mongoose.model('PriceHistory', new mongoose.Schema({
    productName: String, // أو معرف فريد للمنتج
    priceVal: Number,
    date: { type: Date, default: Date.now },
    source: String
}));

// ==========================================
// 🧠 محرك الذكاء (Intelligence Engine)
// ==========================================

function extractPrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

// 🟣 الطبقة 1: فهم مواصفات المنتج (Product Specs Understanding)
function parseSpecifications(title) {
    const specs = {
        cpu: null, ram: null, storage: null, gpu: null, category: 'general'
    };
    
    const lowerTitle = title.toLowerCase();

    // استخراج المعالج (CPU)
    if (lowerTitle.match(/i[3579]|core\s?i\d/)) specs.cpu = "Intel Core";
    else if (lowerTitle.match(/ryzen\s?[3579]/)) specs.cpu = "AMD Ryzen";
    else if (lowerTitle.match(/m1|m2|m3/)) specs.cpu = "Apple Silicon";

    // استخراج الرام (RAM)
    const ramMatch = title.match(/(\d+)\s?GB\s?RAM/i);
    if (ramMatch) specs.ram = parseInt(ramMatch[1]);

    // استخراج التخزين (Storage)
    const storageMatch = title.match(/(\d+)(TB|GB)\s?(SSD|HDD)/i);
    if (storageMatch) specs.storage = storageMatch[0];

    // استخراج كرت الشاشة (GPU)
    if (lowerTitle.includes('rtx')) specs.gpu = "NVIDIA RTX";
    else if (lowerTitle.includes('gtx')) specs.gpu = "NVIDIA GTX";
    else if (lowerTitle.includes('radeon')) specs.gpu = "AMD Radeon";

    // تصنيف الفئة
    if (specs.gpu && specs.gpu.includes('RTX')) specs.category = 'gaming';
    else if (lowerTitle.includes('macbook') || lowerTitle.includes('ultrabook')) specs.category = 'productivity';

    return specs;
}

// 🟡 الطبقة 4: محرك القرار المتقدم (Advanced Decision Engine)
function advancedDecisionEngine(product, marketAvg, userProfile, specs, lang = 'ar') {
    let pros = [];
    let cons = [];
    let score = 50; // نبدأ بـ 50 نقطة
    let decisionTag = "";
    let marketPosition = ""; // Cheap, Fair, Expensive
    let userMatchScore = 0; // 0-100 مدى ملاءمته للمستخدم

    // 1. تحليل السعر السوقي
    const priceDiff = ((product.priceVal - marketAvg) / marketAvg) * 100;
    
    if (priceDiff < -15) {
        score += 30;
        marketPosition = "Under Market Price";
        pros.push(lang === 'ar' ? "صفقة ممتازة (أرخص من السوق)" : "Great Deal (Below Market)");
    } else if (priceDiff > 20) {
        score -= 30;
        marketPosition = "Overpriced";
        cons.push(lang === 'ar' ? "سعر مبالغ فيه" : "Overpriced");
    } else {
        marketPosition = "Fair Price";
    }

    // 2. تحليل المواصفات (Specs Impact)
    if (specs.category === 'gaming' && (!specs.gpu || specs.ram < 16)) {
        score -= 20;
        cons.push(lang === 'ar' ? "مواصفات ضعيفة للألعاب" : "Weak specs for gaming");
    }
    if (specs.storage && specs.storage.includes('HDD')) {
        score -= 10;
        cons.push(lang === 'ar' ? "يستخدم قرص قديم (HDD)" : "Old storage tech (HDD)");
    }

    // 3. تحليل التوافق مع المستخدم (User Match)
    if (userProfile && userProfile.budget > 0) {
        if (product.priceVal <= userProfile.budget) {
            userMatchScore = 100;
            pros.push(lang === 'ar' ? "ضمن ميزانيتك" : "Within your budget");
        } else if (product.priceVal <= userProfile.budget * 1.2) {
            userMatchScore = 70; // أغلى قليلاً
            cons.push(lang === 'ar' ? "يتجاوز الميزانية قليلاً" : "Slightly over budget");
        } else {
            userMatchScore = 30; // غالي جداً عليك
            cons.push(lang === 'ar' ? "خارج نطاق ميزانيتك" : "Way over budget");
        }
    } else {
        userMatchScore = 50; // محايد لعدم وجود بروفايل
    }

    // 4. تحديد الوسم النهائي (Decision Tag)
    if (score >= 80 && userMatchScore >= 70) decisionTag = "Perfect for You";
    else if (score >= 70) decisionTag = "Best Buy";
    else if (score >= 50) decisionTag = "Good Deal";
    else if (score < 30) decisionTag = "Avoid";
    else decisionTag = "Standard";

    // ترجمة الوسوم للعربية إذا لزم الأمر
    if (lang === 'ar') {
        const tagsMap = {
            "Perfect for You": "مثالي لك",
            "Best Buy": "أفضل شراء",
            "Good Deal": "صفقة جيدة",
            "Avoid": "تجنبه",
            "Standard": "خيار عادي"
        };
        decisionTag = tagsMap[decisionTag] || decisionTag;
    }

    return {
        pros,
        cons,
        verdict: decisionTag, // للإبقاء على التوافق القديم
        decisionTag,
        marketPosition,
        userMatchScore,
        savingsLabel: priceDiff < 0 ? `${Math.abs(priceDiff).toFixed(0)}%` : null
    };
}

// ==========================================
// 🚀 Endpoints
// ==========================================

app.post('/smart-search', async (req, res) => {
    const { query, lang, uid, filterType } = req.body;

    // 1. جلب بروفايل المستخدم (إن وجد)
    let userProfile = null;
    if (uid) {
        userProfile = await UserProfile.findOne({ uid });
        // تحديث سجل البحث بذكاء
        if (userProfile) {
            if (!userProfile.searchHistory.includes(query)) {
                userProfile.searchHistory.push(query);
                await userProfile.save();
            }
        } else {
            // إنشاء بروفايل مؤقت في الذاكرة للزائر الجديد
            userProfile = { budget: 0, preferredCategories: [] };
        }
    }

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 25
    }, async (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

        let rawProducts = data.shopping_results
            .map(p => ({ ...p, priceVal: extractPrice(p.price || p.extracted_price) }))
            .filter(p => p.priceVal > 0 && p.thumbnail);

        // حساب متوسط السوق
        const validPrices = rawProducts.map(p => p.priceVal);
        const marketAvg = validPrices.length > 0 ? Math.floor(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

        // 🟢 الطبقة 3: حفظ عينة للسعر في التاريخ (Async - Fire & Forget)
        if (rawProducts.length > 0) {
            PriceHistory.create({
                productName: query, // نخزن باسم البحث لسهولة التتبع العام
                priceVal: marketAvg,
                source: "market_avg"
            }).catch(err => console.error("History Log Error", err));
        }

        // بناء البطاقات الذكية
        const products = rawProducts.slice(0, 12).map(p => {
            // 🟣 الطبقة 1: استخراج المواصفات
            const specs = parseSpecifications(p.title);

            // 🟡 + 🔴 الطبقة 4 و 5: التحليل واتخاذ القرار وبناء الكائن الغني
            const analysis = advancedDecisionEngine(p, marketAvg, userProfile, specs, lang);

            return {
                name: p.title,
                price: p.price,
                priceVal: p.priceVal,
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                store_name: p.source || "Unknown",
                real_rating: p.rating || 0,
                reviews_count: p.reviews || 0,
                specs: specs, // نعيد المواصفات للواجهة أيضاً
                analysis: analysis // الكائن الغني الجديد
            };
        });

        // فلترة (اختيارية حسب الطلب القديم)
        let finalResults = products;
        if (filterType === 'economic') finalResults = products.sort((a, b) => a.priceVal - b.priceVal);
        if (filterType === 'top_rated') finalResults = products.sort((a, b) => b.reviews_count - a.reviews_count);

        res.json({ products: finalResults, marketAvg });
    });
});

// Endpoint لضبط تفضيلات المستخدم (لتغذية الطبقة 2)
app.post('/user/preferences', async (req, res) => {
    const { uid, budget, categories } = req.body;
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

// باقي الـ Endpoints (Compare, Cron) تبقى كما هي...
// (تم اختصارها هنا لأنها لم تتغير جوهرياً، فقط تأكد من وجودها في الملف النهائي)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Intelligent Decision Engine running on port ${PORT}`));
