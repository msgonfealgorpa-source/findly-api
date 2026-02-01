const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// --- إعدادات البيئة (Render Environment Variables) ---
// تأكد من إضافة هذه القيم في لوحة تحكم Render
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ DB Error:", err.message));

// --- النماذج (Schemas) ---
const Alert = mongoose.model('Alert', new mongoose.Schema({
    email: String, productName: String, targetPrice: Number, link: String, lang: String, uid: String
}));

const SearchLog = mongoose.model('SearchLog', new mongoose.Schema({
    uid: String, query: String, timestamp: { type: Date, default: Date.now }
}));

const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: String, name: String, price: String, thumbnail: String, link: String, addedAt: { type: Date, default: Date.now }
}));

// إعداد خدمة البريد الإلكتروني للتنبيهات
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

/**
 * 🚀 محرك الذكاء خماسي الطبقات (5-Layer Intelligence Engine)
 * الطبقة 1: تنظيف البيانات وتحليل الأرقام.
 * الطبقة 2: مقارنة إحصائية بأسعار السوق.
 * الطبقة 3: فحص موثوقية المصدر والتقييمات.
 * الطبقة 4: حساب "نقاط القيمة" للمنتج.
 * الطبقة 5: صياغة نصيحة بشرية ذكية (عربي/إنجليزي).
 */
function runFiveLayerIntelligence(item, allItems, lang) {
    const isAr = lang === 'ar';
    
    // [1] استخراج البيانات وتحويل الأسعار لأرقام قابلة للحساب
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0;
    const rating = parseFloat(item.rating) || 0;
    const reviews = parseInt(item.reviews) || 0;
    const source = (item.source || "").toLowerCase();

    // [2] تحليل السوق (Market Benchmark)
    const validPrices = allItems.map(i => parseFloat(i.price?.toString().replace(/[^0-9.]/g, ''))).filter(p => p > 0);
    const avgPrice = validPrices.reduce((a, b) => a + b, 0) / (validPrices.length || 1);
    const minPrice = Math.min(...validPrices);

    // [3] منطق الذكاء لاتخاذ القرار
    const isLowest = price <= minPrice && price > 0;
    const isTrusted = source.includes('amazon') || source.includes('noon') || source.includes('jarir') || source.includes('extra');
    const isHighValue = price < (avgPrice * 0.85); // أرخص من المتوسط بـ 15%

    // [4] صياغة النتيجة النهائية (خمس حالات ذكاء رئيسية)
    if (isLowest && rating >= 4.5) 
        return isAr ? "💎 لقطة خرافية: هذا هو السعر الأقل وبأعلى تقييم جودة!" : "💎 Ultimate Find: Lowest price with top-tier quality!";
    
    if (isLowest) 
        return isAr ? "💰 السعر الأفضل: أرخص خيار متاح حالياً لميزانيتك." : "💰 Best Budget: The cheapest current option for you.";
    
    if (isHighValue && isTrusted) 
        return isAr ? "🔥 صفقة ذكية: سعر منافس جداً من متجر موثوق." : "🔥 Smart Deal: Highly competitive price from a trusted store.";
    
    if (rating >= 4.7 && reviews > 100) 
        return isAr ? "👑 الأكثر ثقة: تقييمات ممتازة من مئات المشترين قبلك." : "👑 Most Trusted: Excellent reviews from hundreds of buyers.";
    
    if (source.includes('amazon') || source.includes('noon'))
        return isAr ? "✅ شحن سريع: متوفر من خلال مخازن الشحن السريع." : "✅ Fast Shipping: Available via express delivery fulfillment.";

    return isAr ? "🔎 خيار جيد: منتج مناسب لمواصفات بحثك." : "🔎 Solid Choice: Matches your search parameters.";
}

// --- المسارات (Routes) ---

// المسار الرئيسي للبحث (المدعوم بالذكاء)
app.get('/search', async (req, res) => {
    const { q, uid, lang = 'ar' } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    // تسجيل عمليات البحث لتحليل اهتمامات المستخدم مستقبلاً
    if (uid) SearchLog.create({ uid, query: q }).catch(() => {});

    try {
        getJson({
            engine: "google_shopping",
            q: q,
            api_key: SERP_API_KEY,
            hl: lang,
            gl: lang === 'ar' ? 'sa' : 'us', // استهداف السعودية للغة العربية
            direct_link: true
        }, (data) => {
            if (data.error) return res.status(500).json({ error: data.error });

            const rawItems = data.shopping_results || [];
            
            // تطبيق محرك الذكاء الخماسي على كل نتيجة
            const results = rawItems.map(item => ({
                name: item.title,
                price: item.price,
                thumbnail: item.thumbnail,
                link: item.link,
                source: item.source,
                rating: item.rating || 0,
                reviews: item.reviews || 0,
                smartReason: runFiveLayerIntelligence(item, rawItems, lang)
            }));

            res.json({ results });
        });
    } catch (err) {
        res.status(500).json({ error: "Intelligence Engine Error" });
    }
});

// قائمة المتابعة
app.post('/watchlist', async (req, res) => {
    try {
        const item = new Watchlist(req.body);
        await item.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/watchlist/:uid', async (req, res) => {
    const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
    res.json(list);
});

// نظام التنبيهات بالبريد
app.post('/alerts', async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- مهمة الخلفية (Price Tracking Bot) ---
// يعمل كل 12 ساعة لفحص تغيرات الأسعار وإرسال إيميلات
cron.schedule('0 */12 * * *', async () => {
    console.log("🤖 Price Bot: Scanning for drops...");
    const alerts = await Alert.find();

    for (const alert of alerts) {
        getJson({
            engine: "google_shopping", q: alert.productName, api_key: SERP_API_KEY, num: 3
        }, async (data) => {
            if (!data.shopping_results) return;

            for (const p of data.shopping_results) {
                const currentPrice = parseFloat(p.price?.toString().replace(/[^0-9.]/g, '')) || 999999;
                
                if (currentPrice > 0 && currentPrice <= alert.targetPrice) {
                    transporter.sendMail({
                        from: EMAIL_USER,
                        to: alert.email,
                        subject: alert.lang === 'ar' ? '🚨 هبط السعر! فرصة شراء' : '🚨 Price Drop Found!',
                        html: `<div dir="${alert.lang === 'ar' ? 'rtl' : 'ltr'}">
                                <h3>وجدنا لك سعراً أفضل!</h3>
                                <p>المنتج: ${alert.productName}</p>
                                <p>السعر الجديد: <b>${p.price}</b></p>
                                <a href="${p.link}">اضغط هنا للشراء فوراً</a>
                               </div>`
                    });
                    await Alert.findByIdAndDelete(alert._id);
                    break;
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Intelligence Server Active on Port ${PORT}`));
