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
// ضع رابط المونجو ومفتاح SerpApi هنا
const MONGO_URI = 'رابط_قاعدة_بيانات_مونجو_الخاص_بك';
const SERP_API_KEY = 'مفتاح_SERPAPI_الخاص_بك';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Error:", err));

const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lang: String
});
const Alert = mongoose.model('Alert', AlertSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});

// --- 2. قاموس الذكاء المنطقي (Rule-Based Intelligence) ---
// هذا القاموس يختار الجملة المناسبة بناءً على تحليل أرقام المنتج
const smartReasonsDict = {
    high_rating: {
        ar: "⭐ منتج ذو تقييم ممتاز (أعلى من 4.5)",
        en: "⭐ Top Rated product (4.5+ stars)",
        fr: "⭐ Très bien noté (4.5+)",
        es: "⭐ Mejor valorado (4.5+)",
        de: "⭐ Bestbewertet (4.5+)",
        zh: "⭐ 高评分产品 (4.5+)"
    },
    popular: {
        ar: "🔥 الأكثر شعبية (آلاف المراجعات)",
        en: "🔥 Most Popular (Thousands of reviews)",
        fr: "🔥 Le plus populaire",
        es: "🔥 Más popular",
        de: "🔥 Beliebteste Wahl",
        zh: "🔥 最受欢迎"
    },
    budget: {
        ar: "💰 خيار اقتصادي ومناسب للميزانية",
        en: "💰 Budget-friendly choice",
        fr: "💰 Choix économique",
        es: "💰 Opción económica",
        de: "💰 Günstige Wahl",
        zh: "💰 经济实惠"
    },
    default: {
        ar: "✨ أفضل نتيجة تطابق بحثك",
        en: "✨ Best match for your search",
        fr: "✨ Meilleur résultat",
        es: "✨ Mejor resultado",
        de: "✨ Bestes Ergebnis",
        zh: "✨ 最佳匹配"
    }
};

// دالة تحليل المنتج لتحديد "السبب الذكي"
function analyzeProduct(product, lang) {
    const l = lang || 'ar';
    const rating = product.rating || 0;
    const reviews = product.reviews || 0;

    // القواعد المنطقية للذكاء:
    if (rating >= 4.5) return smartReasonsDict.high_rating[l] || smartReasonsDict.high_rating['en'];
    if (reviews > 1000) return smartReasonsDict.popular[l] || smartReasonsDict.popular['en'];
    // يمكن إضافة منطق للسعر المنخفض هنا إذا كنا نقارن المتوسط
    
    return smartReasonsDict.default[l] || smartReasonsDict.default['en'];
}

// --- 3. مسار البحث الذكي (Smart Search) ---
app.post('/smart-search', (req, res) => {
    let { query, lang } = req.body;
    lang = lang || 'ar'; 

    console.log(`🔍 Searching: ${query} [${lang}]`);

    // استخراج الميزانية من النص (جزء مهم جداً للذكاء)
    let budgetLimit = null;
    const budgetMatch = query.match(/\(Budget:\s*(\d+)\)/i);
    if (budgetMatch) {
        budgetLimit = parseFloat(budgetMatch[1]);
        // نحذف الميزانية من نص البحث عشان جوجل يفهم الكلمة صح
        query = query.replace(/\(Budget:\s*\d+\)/i, '').trim(); 
    }

    getJson({
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY,
        hl: lang,         // طلب النتائج بلغة المستخدم
        gl: "us",         // الدولة (يمكنك جعلها ديناميكية أيضاً)
        google_domain: "google.com",
        num: 20           // جلب 20 نتيجة لنقوم نحن بالفلترة
    }, (data) => {
        
        if (!data.shopping_results) {
            return res.json({ products: [] });
        }

        // 1. تنظيف البيانات وتحويل السعر لرقم
        let processed = data.shopping_results.map(p => {
            const priceNum = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : 0;
            return {
                name: p.title,
                price: p.price,      // النص الأصلي (مثلاً $100)
                priceNum: priceNum,  // الرقم للمقارنة (100)
                thumbnail: p.thumbnail,
                link: p.product_link || p.link,
                rating: p.rating || 0,
                reviews: p.reviews || 0
            };
        });

        // 2. تطبيق فلتر الميزانية (إذا حدد المستخدم ميزانية في واجهتك)
        if (budgetLimit) {
            processed = processed.filter(p => p.priceNum > 0 && p.priceNum <= budgetLimit);
        }

        // 3. الترتيب الذكي: نرتب حسب التقييم الأعلى أولاً
        processed.sort((a, b) => b.rating - a.rating);

        // 4. اختيار أفضل 6 وتطبيق التحليل
        const finalProducts = processed.slice(0, 6).map(p => ({
            ...p,
            reason: analyzeProduct(p, lang) // هنا يتم استدعاء الذكاء التحليلي
        }));

        res.json({ products: finalProducts });
    });
});

// --- 4. نظام التنبيهات (Cron Job) ---
app.post('/set-alert', async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        res.status(200).send({ message: "Alert Saved" });
    } catch (e) {
        res.status(500).send({ error: "Error" });
    }
});

// مراقبة الأسعار كل 12 ساعة
cron.schedule('0 */12 * * *', async () => {
    console.log("⏰ Running Price Check...");
    const alerts = await Alert.find();
    
    for (let alert of alerts) {
        // تأخير صغير لتجنب الضغط على SerpApi
        await new Promise(r => setTimeout(r, 2000)); 

        getJson({
            engine: "google_shopping",
            q: alert.productName,
            api_key: SERP_API_KEY,
            hl: alert.lang || 'ar'
        }, async (data) => {
            if (data.shopping_results && data.shopping_results.length > 0) {
                // نأخذ أرخص نتيجة مطابقة
                const bestResult = data.shopping_results[0]; 
                const currentPrice = parseFloat(bestResult.price.replace(/[^0-9.]/g, ''));
                
                if (currentPrice <= alert.targetPrice) {
                    console.log(`Price Drop! ${alert.email}`);
                    
                    const mailOptions = {
                        from: 'Findly AI',
                        to: alert.email,
                        subject: alert.lang === 'en' ? '🚨 Price Drop Alert!' : '🚨 تنبيه انخفاض السعر!',
                        text: `${alert.productName}\nNow: ${bestResult.price}\nLink: ${bestResult.product_link}`
                    };

                    await transporter.sendMail(mailOptions);
                    await Alert.findByIdAndDelete(alert._id);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Findly Server (SerpApi Only) running on port ${PORT}`));
