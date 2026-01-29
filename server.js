const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// السيرفر سيقرأ الرابط من إعدادات النظام وليس من الكود
const MONGO_URI = process.env.MONGO_URI;

const SERP_API_KEY = 'مفتاح_SERPAPI_الخاص_بك';

// إعداد الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ تم الاتصال بنجاح بـ MongoDB Atlas"))
    .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err.message));

// نموذج تنبيهات الأسعار
const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lang: String
});
const Alert = mongoose.model('Alert', AlertSchema);

// إعداد البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: 'your-email@gmail.com', 
        pass: 'your-app-password' 
    }
});

// --- 2. قاموس الذكاء المنطقي (Rule-Based Intelligence) ---
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

// --- 3. مسار البحث الذكي ---
app.post('/smart-search', (req, res) => {
    const { query, lang, budget } = req.body; 
    const currentLang = lang || 'ar';

    getJson({
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY,
        hl: currentLang,
        gl: "sa",
        num: 20
    }, (data) => {
        if (!data.shopping_results) return res.json({ products: [] });

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

// --- 4. إصلاح نظام مراقبة الأسعار (تم إضافة معالجة أفضل للأخطاء) ---
app.post('/set-alert', async (req, res) => {
    try {
        console.log("📥 طلب مراقبة جديد لـ:", req.body.productName);
        const alert = new Alert(req.body);
        await alert.save(); 
        res.status(200).send({ message: "تم حفظ التنبيه بنجاح في قاعدة البيانات" });
    } catch (e) {
        console.error("❌ فشل حفظ التنبيه:", e.message);
        res.status(500).send({ error: "خطأ في السيرفر عند الحفظ في المونجو" });
    }
});

// تشغيل الفحص الدوري
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
                const currentPrice = parseFloat(data.shopping_results[0].price.replace(/[^0-9.]/g, ''));
                if (currentPrice <= alert.targetPrice) {
                    const mailOptions = {
                        from: 'Findly AI',
                        to: alert.email,
                        subject: alert.lang === 'en' ? '🚨 Price Drop Alert!' : '🚨 تنبيه: انخفاض السعر!',
                        text: `${alert.productName}\nNew Price: ${data.shopping_results[0].price}\nLink: ${alert.link}`
                    };
                    await transporter.sendMail(mailOptions);
                    await Alert.findByIdAndDelete(alert._id);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Server running on port ${PORT}`));
