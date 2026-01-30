const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();

// إعدادات CORS للسماح للواجهة بالاتصال
app.use(cors());
app.use(express.json());

// --- 1. إعدادات المتغيرات ---
const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!MONGO_URI || !SERP_API_KEY) {
    console.error("❌ تحذير: MONGO_URI أو SERPAPI_KEY غير معرف في إعدادات البيئة!");
}

// الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ تم الاتصال بنجاح بـ MongoDB Atlas"))
    .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err.message));

// --- 2. مخططات قاعدة البيانات (Schemas) ---

// أ. مخطط التنبيهات (للأسعار)
const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lang: String,
    uid: String
});
const Alert = mongoose.model('Alert', AlertSchema);

// ب. مخطط سجل البحث (جديد - لدعم التاريخ والترند)
const SearchLogSchema = new mongoose.Schema({
    uid: String,       // معرف المستخدم
    query: String,     // كلمة البحث
    timestamp: { type: Date, default: Date.now } // وقت البحث
});
const SearchLog = mongoose.model('SearchLog', SearchLogSchema);

// إعدادات البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: EMAIL_USER, 
        pass: EMAIL_PASS 
    }
});

// --- 3. دوال مساعدة ---
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

// --- 4. نقاط النهاية (API Endpoints) ---

// أ. مسار البحث الذكي (يخزن البحث في التاريخ أيضاً)
app.post('/smart-search', async (req, res) => {
    const { query, lang, uid } = req.body; 
    const currentLang = lang || 'ar';

    console.log(`🔎 بحث جديد: "${query}" | المستخدم: ${uid || 'Guest'}`);

    // 1. حفظ عملية البحث في قاعدة البيانات (للسجل والترند)
    if (query && uid) {
        try {
            // نحفظ البحث كعملية جديدة
            await new SearchLog({ uid, query }).save();
        } catch (err) {
            console.error("⚠️ فشل حفظ السجل:", err.message);
        }
    }

    // 2. طلب البيانات من SerpApi
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
                reviews: p.reviews || 0,
                source: p.source
            };
        });

        // ترتيب حسب التقييم
        processedProducts.sort((a, b) => b.rating - a.rating);

        const finalResults = processedProducts.slice(0, 8).map(p => ({
            ...p,
            reason: analyzeProduct(p, currentLang)
        }));

        res.json({ products: finalResults });
    });
});

// ب. مسار جلب سجل البحث لمستخدم معين (جديد)
app.get('/history/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        // نأتي بآخر عمليات البحث، ونزيل التكرار يدوياً أو عبر التجميع
        // هنا سنأتي بآخر 10 عمليات بحث مرتبة زمنياً
        const logs = await SearchLog.find({ uid })
                                    .sort({ timestamp: -1 })
                                    .limit(20);
        
        // تصفية التكرار (لإظهار الكلمة مرة واحدة فقط في القائمة)
        const uniqueQueries = [];
        const uniqueSet = new Set();
        
        logs.forEach(log => {
            if (!uniqueSet.has(log.query)) {
                uniqueSet.add(log.query);
                uniqueQueries.push(log);
            }
        });

        res.json({ history: uniqueQueries.slice(0, 5) }); // إرجاع أحدث 5 عمليات فريدة
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ history: [] });
    }
});

// ج. مسار جلب "التريند" (أكثر الكلمات بحثاً) (جديد)
app.get('/trending', async (req, res) => {
    try {
        // تجميع البيانات لمعرفة الكلمات الأكثر تكراراً
        const trends = await SearchLog.aggregate([
            { "$group": { "_id": "$query", "count": { "$sum": 1 } } }, // تجميع حسب الكلمة وعدها
            { "$sort": { "count": -1 } }, // الترتيب من الأكثر تكراراً
            { "$limit": 5 } // أخذ أول 5
        ]);

        const trendingKeywords = trends.map(t => t._id);
        res.json({ trending: trendingKeywords });
    } catch (error) {
        console.error("Trending Error:", error);
        res.status(500).json({ trending: [] });
    }
});

// د. مسار حفظ التنبيهات
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

// --- 5. المهام المجدولة (Cron Job) ---
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
                    try {
                        await transporter.sendMail(mailOptions);
                        await Alert.findByIdAndDelete(alert._id);
                        console.log(`✅ تم إرسال إيميل لـ ${alert.email} وحذف التنبيه.`);
                    } catch (mailErr) {
                        console.error(`❌ خطأ في إرسال الإيميل: ${mailErr.message}`);
                    }
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Server running on port ${PORT}`));
