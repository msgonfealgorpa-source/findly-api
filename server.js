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
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ DB Error:", err.message));

// --- الموديلات (Models) ---
const Alert = mongoose.model('Alert', new mongoose.Schema({
    email: String, productName: String, targetPrice: Number, link: String, uid: String, lastCheckedPrice: Number
}));

const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: String, name: String, price: String, priceVal: Number, thumbnail: String, link: String, addedAt: { type: Date, default: Date.now }
}));

// --- دوال التحليل الذكي (Smart Logic) ---

function extractPrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

// 1. تحليل Deep AI واستخراج العيوب والمميزات
function deepAIAnalysis(product, marketAvg, lang = 'ar') {
    let pros = [];
    let cons = [];
    let verdict = "";

    // تحليل الحالة (Condition)
    const isNew = product.condition === "new" || !product.condition;
    if (!isNew) cons.push(lang === 'ar' ? "المنتج مجدد/مستعمل" : "Refurbished/Used item");

    // تحليل السعر مقابل المتوسط
    const savings = marketAvg > 0 ? ((marketAvg - product.priceVal) / marketAvg) * 100 : 0;
    if (savings > 15) pros.push(lang === 'ar' ? `سعر لقطة (أوفر بـ %${savings.toFixed(0)})` : `Great deal (${savings.toFixed(0)}% cheaper)`);
    if (product.priceVal > marketAvg * 1.2) cons.push(lang === 'ar' ? "السعر مرتفع عن معدل السوق" : "Overpriced compared to average");

    // تحليل التقييمات
    if (product.rating >= 4.5) pros.push(lang === 'ar' ? "جودة تقييم ممتازة" : "High build quality/rating");
    if (product.reviews > 2000) pros.push(lang === 'ar' ? "موثوقية عالية (شعبية ضخمة)" : "Highly trusted by thousands");

    // القرار النهائي
    if (product.rating >= 4 && savings > 5) verdict = (lang === 'ar' ? "ينصح به بشدة كأفضل قيمة" : "Highly Recommended: Best Value");
    else if (product.priceVal > marketAvg) verdict = (lang === 'ar' ? "تنبيه: السعر مرتفع مقارنة بالمواصفات" : "Caution: High price point");
    else verdict = (lang === 'ar' ? "خيار جيد ومتوازن" : "A balanced choice");

    return { pros, cons, verdict, savingsLabel: savings > 0 ? `${savings.toFixed(0)}%` : null };
}

// --- Endpoints ---

app.post('/smart-search', async (req, res) => {
    const { query, lang, uid, filterType } = req.body; // filterType: 'economic', 'top_rated', 'newest'

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 25
    }, async (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

        // تنظيف وفلترة البيانات الأولية (منع السعر 0 والصور المفقودة)
        let rawProducts = data.shopping_results
            .map(p => ({
                ...p,
                priceVal: extractPrice(p.price || p.extracted_price)
            }))
            .filter(p => p.priceVal > 0 && p.thumbnail);

        // حساب متوسط السوق الحقيقي
        const validPrices = rawProducts.map(p => p.priceVal);
        const marketAvg = validPrices.length > 0 ? Math.floor(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

        // تطبيق الفلاتر الذكية (Task 3)
        let filteredResults = [...rawProducts];
        if (filterType === 'economic') {
            filteredResults = rawProducts.filter(p => p.rating >= 4).sort((a, b) => a.priceVal - b.priceVal);
        } else if (filterType === 'top_rated') {
            filteredResults = rawProducts.sort((a, b) => b.reviews - a.reviews);
        } else if (filterType === 'newest') {
            const currentYear = new Date().getFullYear();
            filteredResults = rawProducts.filter(p => p.title.includes(currentYear.toString()) || p.title.includes((currentYear + 1).toString()));
        }

        // بناء استجابة البطاقة المطورة (Task 5)
        const products = filteredResults.slice(0, 12).map(p => {
            const analysis = deepAIAnalysis(p, marketAvg, lang);
            return {
                name: p.title,
                price: p.price,
                priceVal: p.priceVal,
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                store_name: p.source || "Unknown Store", // اسم المتجر الحقيقي
                real_rating: p.rating || 0,
                reviews_count: p.reviews || 0,
                shipping_info: p.delivery || (lang === 'ar' ? "شحن قياسي" : "Standard Shipping"),
                analysis: analysis, // بيانات الـ Deep AI
                competitors: [] // سيتم ملؤها في طلب المقارنة المنفصل
            };
        });

        res.json({ products, marketAvg });
    });
});

// 2. زر مقارنة الأسعار (Task 2)
app.post('/compare-prices', (req, res) => {
    const { productName, lang } = req.body;
    getJson({
        engine: "google_shopping", q: productName, api_key: SERP_API_KEY, hl: lang || 'ar'
    }, (data) => {
        const competitors = (data.shopping_results || []).slice(0, 5).map(c => ({
            store: c.source,
            price: c.price,
            priceVal: extractPrice(c.price),
            link: c.link
        }));
        res.json({ competitors });
    });
});

// 4. تتبع السعر النشط (Task 4)
cron.schedule('0 */12 * * *', async () => {
    console.log("Running Price Check Cron...");
    const alerts = await Alert.find();
    for (const alert of alerts) {
        getJson({ engine: "google_shopping", q: alert.productName, api_key: SERP_API_KEY }, async (data) => {
            const topResult = data.shopping_results?.[0];
            if (topResult) {
                const currentPrice = extractPrice(topResult.price);
                if (currentPrice <= alert.targetPrice) {
                    // إرسال إيميل (Nodemailer logic here...)
                    console.log(`Alert! Price dropped for ${alert.productName}`);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Intelligent Server running on port ${PORT}`));
