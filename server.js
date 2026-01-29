const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. إعدادات المتغيرات من رندر ---
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;

if (!MONGO_URI || !SERP_API_KEY) {
    console.error("❌ تحذير: MONGO_URI أو SERPAPI_KEY غير معرف في إعدادات رندر!");
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ تم الاتصال بنجاح بـ MongoDB Atlas"))
    .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err.message));

// نموذج تنبيهات الأسعار (كما هو)
const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lang: String,
    userId: String // أضفت هذا الحقل اختيارياً لربط التنبيه بالمستخدم مستقبلاً
});
const Alert = mongoose.model('Alert', AlertSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.EMAIL_USER || 'your-email@gmail.com', 
        pass: process.env.EMAIL_PASS || 'your-app-password' 
    }
});

// --- 2. منطق تحليل المنتجات (كما هو) ---
const smartReasonsDict = {
    high_rating: { ar: "⭐ منتج ذو تقييم ممتاز (أعلى من 4.5)", en: "⭐ Top Rated product (4.5+ stars)" },
    popular: { ar: "🔥 الأكثر شعبية (آلاف المراجعات)", en: "🔥 Most Popular (Thousands of reviews)" },
    budget: { ar: "💰 خيار اقتصادي ومناسب للميزانية", en: "💰 Budget-friendly choice" },
    default: { ar: "✨ أفضل نتيجة تطابق بحثك", en: "✨ Best match for your search" }
};

function analyzeProduct(product, lang) {
    const l = lang || 'ar';
    const rating = product.rating || 0;
    const reviews = product.reviews || 0;
    if (rating >= 4.5) return smartReasonsDict.high_rating[l] || smartReasonsDict.high_rating['ar'];
    if (reviews > 1000) return smartReasonsDict.popular[l] || smartReasonsDict.popular['ar'];
    return smartReasonsDict.default[l] || smartReasonsDict.default['ar'];
}

// --- 3. مسار البحث الذكي (تم تحديثه ليدعم UID) ---
app.post('/smart-search', (req, res) => {
    // استقبال الـ uid من الكود الجديد في الواجهة
    const { query, lang, uid } = req.body; 
    const currentLang = lang || 'ar';

    // طباعة المستخدم في الكونسول للمراقبة
    console.log(`🔎 بحث من مستخدم [${uid || 'Guest'}]: ${query}`);

    getJson({
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY,
        hl: currentLang,
        gl: "sa",
        num: 20
    }, (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [] });

        let processedProducts = data.shopping_results.map(p => {
            const priceClean = p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 0;
            return {
                name: p.title,
                price: p.price,
                priceVal: priceClean,
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                rating: p.rating || 0,
                reviews: p.reviews || 0
            };
        });

        processedProducts.sort((a, b) => b.rating - a.rating);

        const finalResults = processedProducts.slice(0, 8).map(p => ({
            ...p,
            reason: analyzeProduct(p, currentLang)
        }));

        res.json({ products: finalResults });
    });
});

// --- 4. مسار مراقبة الأسعار (كما هو) ---
app.post('/set-alert', async (req, res) => {
    try {
        console.log("📥 طلب مراقبة جديد لـ:", req.body.productName);
        const alert = new Alert(req.body);
        await alert.save(); 
        res.status(200).send({ message: "تم حفظ التنبيه بنجاح" });
    } catch (e) {
        console.error("❌ فشل حفظ التنبيه:", e.message);
        res.status(500).send({ error: "خطأ في السيرفر عند الحفظ" });
    }
});

// تشغيل الفحص الدوري (كما هو)
cron.schedule('0 */6 * * *', async () => {
    console.log("⏰ جاري فحص الأسعار...");
    const alerts = await Alert.find();
    
    for (let alert of alerts) {
        getJson({
            engine: "google_shopping",
            q: alert.productName,
            api_key: SERP_API_KEY,
            hl: alert.lang || 'ar'
        }, async (data) => {
            if (data.shopping_results && data.shopping_results.length > 0) {
                const currentPrice = parseFloat(data.shopping_results[0].price.toString().replace(/[^0-9.]/g, ''));
                if (currentPrice <= alert.targetPrice) {
                    const mailOptions = {
                        from: 'Findly AI',
                        to: alert.email,
                        subject: alert.lang === 'en' ? '🚨 Price Drop Alert!' : '🚨 تنبيه: انخفاض السعر!',
                        text: `${alert.productName}\nNew Price: ${data.shopping_results[0].price}\nLink: ${alert.link}`
                    };
                    await transporter.sendMail(mailOptions);
                    await Alert.findByIdAndDelete(alert._id);
                    console.log(`✅ تم إرسال إيميل لـ ${alert.email} وحذف التنبيه.`);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Server running on port ${PORT}`));
