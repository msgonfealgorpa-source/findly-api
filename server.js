const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. إعدادات الاتصال ---
// ضع روابطك الخاصة هنا
const MONGO_URI = 'رابط_قاعدة_بيانات_مونجو_الخاص_بك';
const SERP_API_KEY = 'مفتاح_SERPAPI_الخاص_بك';

// إعداد الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// نموذج تنبيهات الأسعار
const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lang: String
});
const Alert = mongoose.model('Alert', AlertSchema);

// إعداد البريد الإلكتروني (لتنبيهات الأسعار الحقيقية)
const transporter = nodemailer.createTransport({
    service: 'gmail', // أو أي مزود آخر
    auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});

// --- 2. قاموس الذكاء المنطقي (Rule-Based Intelligence) ---
// هذا هو "العقل" الذي يحدد سبب اختيار المنتج بناءً على اللغة
const smartReasonsDict = {
    high_rating: {
        ar: "⭐ منتج ذو تقييم ممتاز (أعلى من 4.5)",
        en: "⭐ Top Rated product (4.5+ stars)",
        fr: "⭐ Très bien noté (4.5+)",
        de: "⭐ Bestbewertet (4.5+)",
        es: "⭐ Mejor valorado (4.5+)",
        tr: "⭐ En İyi Puanlı (4.5+)"
    },
    popular: {
        ar: "🔥 الأكثر شعبية (آلاف المراجعات)",
        en: "🔥 Most Popular (Thousands of reviews)",
        fr: "🔥 Le plus populaire",
        de: "🔥 Beliebteste Wahl",
        es: "🔥 Más popular",
        tr: "🔥 En Popüler"
    },
    budget: {
        ar: "💰 خيار اقتصادي ومناسب للميزانية",
        en: "💰 Budget-friendly choice",
        fr: "💰 Choix économique",
        de: "💰 Günstige Wahl",
        es: "💰 Opción económica",
        tr: "💰 Bütçe Dostu"
    },
    default: {
        ar: "✨ أفضل نتيجة تطابق بحثك",
        en: "✨ Best match for your search",
        fr: "✨ Meilleur résultat",
        de: "✨ Bestes Ergebnis",
        es: "✨ Mejor resultado",
        tr: "✨ En İyi Eşleşme"
    }
};

// دالة التحليل الذكي للمنتج
function analyzeProduct(product, lang) {
    const l = lang || 'ar';
    const rating = product.rating || 0;
    const reviews = product.reviews || 0;
    
    // قواعد المنطق:
    if (rating >= 4.5) return smartReasonsDict.high_rating[l] || smartReasonsDict.high_rating['ar'];
    if (reviews > 1000) return smartReasonsDict.popular[l] || smartReasonsDict.popular['ar'];
    
    // الافتراضي
    return smartReasonsDict.default[l] || smartReasonsDict.default['ar'];
}

// --- 3. مسار البحث الذكي (Smart Search Endpoint) ---
app.post('/smart-search', (req, res) => {
    // نستقبل البيانات من الموقع
    const { query, lang, budget } = req.body; 
    const currentLang = lang || 'ar';

    console.log(`🔍 Processing Smart Search: ${query} [${currentLang}]`);

    getJson({
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY,
        hl: currentLang,      // تحديد لغة نتائج جوجل
        gl: "sa",             // الدولة (السعودية كمثال، يمكنك تغييرها لـ us أو جعلها ديناميكية)
        google_domain: "google.com",
        num: 20               // نجلب 20 نتيجة لنقوم بفلترتها
    }, (data) => {
        
        if (!data.shopping_results) {
            return res.json({ products: [] });
        }

        // معالجة البيانات وتنظيفها
        let processedProducts = data.shopping_results.map(p => {
            // استخراج الرقم من السعر (حذف رموز العملة والفواصل)
            const priceClean = p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 0;
            
            return {
                name: p.title,
                price: p.price,       // السعر كنص للعرض (مثلاً: 100 ريال)
                priceVal: priceClean, // السعر كرقم للعمليات الحسابية
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                rating: p.rating || 0,
                reviews: p.reviews || 0
            };
        });

        // 1. ترتيب النتائج حسب التقييم الأفضل لضمان الجودة
        processedProducts.sort((a, b) => b.rating - a.rating);

        // 2. إذا تم إرسال ميزانية من السيرفر، يمكننا فلترة النتائج هنا (اختياري)
        // ملاحظة: الكود في الصفحة يقوم بوضع علامة حمراء، لكن هنا يمكننا استبعاد الغالي جداً تماماً لو أردت
        if (budget) {
             // نترك المنتجات التي تزيد عن الميزانية بنسبة بسيطة (20%) ونحذف الباقي
             // processedProducts = processedProducts.filter(p => p.priceVal <= (budget * 1.2));
        }

        // 3. أخذ أفضل 8 نتائج فقط وإضافة "السبب الذكي"
        const finalResults = processedProducts.slice(0, 8).map(p => ({
            ...p,
            reason: analyzeProduct(p, currentLang) // إضافة سبب الاختيار باللغة المناسبة
        }));

        res.json({ products: finalResults });
    });
});

// --- 4. نظام مراقبة الأسعار الحقيقي (Backend Watchlist) ---
// هذا المسار لحفظ التنبيه في قاعدة البيانات
app.post('/set-alert', async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        res.status(200).send({ message: "Alert Saved Successfully" });
    } catch (e) {
        res.status(500).send({ error: "Error saving alert" });
    }
});

// تشغيل الفحص الدوري (Cron Job) كل 6 ساعات
cron.schedule('0 */6 * * *', async () => {
    console.log("⏰ Running Scheduled Price Check...");
    const alerts = await Alert.find();
    
    for (let alert of alerts) {
        // تأخير بسيط لتجنب حظر API
        await new Promise(r => setTimeout(r, 2000)); 

        getJson({
            engine: "google_shopping",
            q: alert.productName,
            api_key: SERP_API_KEY,
            hl: alert.lang || 'ar'
        }, async (data) => {
            if (data.shopping_results && data.shopping_results.length > 0) {
                const bestResult = data.shopping_results[0]; 
                const currentPrice = parseFloat(bestResult.price.replace(/[^0-9.]/g, ''));
                
                // إذا انخفض السعر عن السعر المستهدف
                if (currentPrice <= alert.targetPrice) {
                    console.log(`✅ Price Drop Detected for ${alert.email}`);
                    
                    const mailOptions = {
                        from: 'Findly AI',
                        to: alert.email,
                        subject: alert.lang === 'en' ? '🚨 Price Drop Alert!' : '🚨 تنبيه: انخفاض السعر!',
                        text: `${alert.productName}\nNew Price: ${bestResult.price}\nLink: ${bestResult.product_link}`
                    };

                    await transporter.sendMail(mailOptions);
                    // حذف التنبيه بعد إرساله لمرة واحدة
                    await Alert.findByIdAndDelete(alert._id);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Ultimate Server running on port ${PORT}`));
