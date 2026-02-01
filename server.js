const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./')); // لعرض ملف index.html والملفات المرافقة له
// --- استدعاء المتغيرات من رندر ---
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// الاتصال بقاعدة البيانات باستخدام الرابط الذي وجدته
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ تم الاتصال بقاعدة بيانات مونجو بنجاح"))
    .catch(err => console.error("❌ فشل الاتصال بمونجو:", err.message));

// --- نماذج البيانات ---
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

/**
 * 🚀 محرك الذكاء خماسي الطبقات (5-Layer Intelligence Engine)
 * الطبقة 1: الفرز الإحصائي للأسعار (أرخص، أغلى، متوسط)
 * الطبقة 2: تحليل الجودة والتقييمات (أعلى نجوم، عدد المراجعات)
 * الطبقة 3: موثوقية المتجر (أمازون، نون، المتاجر الرسمية)
 * الطبقة 4: ميزان القيمة مقابل السعر (Best Value Score)
 * الطبقة 5: التوليد السياقي للنصائح البشرية (Contextual Tips)
 */
function runFiveLayerIntelligence(item, allItems, lang) {
    const isAr = lang === 'ar';
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0;
    const rating = parseFloat(item.rating) || 0;
    const reviews = parseInt(item.reviews) || 0;
    const source = (item.source || "").toLowerCase();

    // حساب إحصائيات السوق
    const prices = allItems.map(i => parseFloat(i.price?.toString().replace(/[^0-9.]/g, ''))).filter(p => p > 0);
    const minPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);

    // منطق الطبقات
    const isMinPrice = price <= minPrice && price > 0;
    const isTrusted = source.includes('amazon') || source.includes('noon') || source.includes('jarir') || source.includes('extra');
    const isHighlyRated = rating >= 4.7 && reviews > 10;
    const isGoodValue = price < (avgPrice * 0.9); // خصم 10% عن المتوسط

    // النتيجة النهائية للذكاء
    if (isMinPrice && isHighlyRated) 
        return isAr ? "💎 لقطة خرافية: هذا هو السعر الأقل وبأفضل جودة في السوق!" : "💎 Ultimate Find: Lowest price and top quality!";
    
    if (isMinPrice) 
        return isAr ? "💰 الأرخص حالياً: هذا هو الخيار الأوفر لميزانيتك الآن." : "💰 Current Cheapest: Best budget-friendly option now.";
    
    if (isHighlyRated && isTrusted) 
        return isAr ? "👑 اختيار الخبراء: منتج موثوق جداً بتقييمات استثنائية." : "👑 Expert's Choice: Highly trusted with stellar ratings.";
    
    if (isGoodValue) 
        return isAr ? "🔥 صفقة ذكية: السعر أقل من متوسط السوق لمثل هذا المنتج." : "🔥 Smart Deal: Price is below market average.";
    
    if (isTrusted)
        return isAr ? "✅ مصدر آمن: متوفر من متجر رسمي ومضمون." : "✅ Secure Source: Available from an official store.";

    return isAr ? "🔎 خيار مناسب: يتوافق مع معايير البحث العامة." : "🔎 Solid Option: Matches general search criteria.";
}

// --- مسارات الـ API ---

app.get('/search', async (req, res) => {
    const { q, uid, lang = 'ar' } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    // تسجيل البحث للذكاء المستقبلي
    if (uid) SearchLog.create({ uid, query: q }).catch(() => {});

    try {
        getJson({
            engine: "google_shopping",
            q: q,
            api_key: SERP_API_KEY,
            hl: lang,
            gl: lang === 'ar' ? 'sa' : 'us',
            direct_link: true
        }, (data) => {
            if (data.error) return res.status(500).json({ error: data.error });

            const rawItems = data.shopping_results || [];
            const results = rawItems.map(item => ({
                name: item.title,
                price: item.price,
                thumbnail: item.thumbnail,
                link: item.link,
                source: item.source,
                rating: item.rating || 0,
                reviews: item.reviews || 0,
                // استدعاء الذكاء الخماسي
                smartReason: runFiveLayerIntelligence(item, rawItems, lang)
            }));

            res.json({ results });
        });
    } catch (err) {
        res.status(500).json({ error: "Intelligence Engine Timeout" });
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

// مهمة مجدولة لتتبع الأسعار
cron.schedule('0 */12 * * *', async () => {
    const alerts = await Alert.find();
    for (const alert of alerts) {
        getJson({ engine: "google_shopping", q: alert.productName, api_key: SERP_API_KEY, num: 3 }, async (data) => {
            if (!data.shopping_results) return;
            for (const p of data.shopping_results) {
                const currentPrice = parseFloat(p.price?.toString().replace(/[^0-9.]/g, '')) || 999999;
                if (currentPrice > 0 && currentPrice <= alert.targetPrice) {
                    transporter.sendMail({
                        from: EMAIL_USER,
                        to: alert.email,
                        subject: alert.lang === 'ar' ? '🚨 هبط السعر!' : '🚨 Price Drop Alert!',
                        html: `<h3>فرصة شراء!</h3><p>المنتج <b>${alert.productName}</b> أصبح بسعر <b>${p.price}</b>.</p><a href="${p.link}">عرض المنتج</a>`
                    });
                    await Alert.findByIdAndDelete(alert._id);
                    break;
                }
            }
        });
    }
});
// أضف هذا في نهاية ملف server (1).js تماماً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
