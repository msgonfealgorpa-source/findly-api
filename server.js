const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const SERP_API_KEY = process.env.SERPAPI_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ DB Error:", err.message));

// --- Schemas ---
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

// --- Helper Functions ---
const smartReasonsDict = {
    high_rating: { ar: "تقييمات ممتازة من المشترين", en: "Excellent customer ratings" },
    best_value: { ar: "أفضل قيمة مقابل السعر حالياً", en: "Best value for money right now" },
    trusted_store: { ar: "متجر موثوق وذو سمعة طيبة", en: "Trusted and reputable store" },
    price_drop: { ar: "انخفاض ملحوظ في السعر", en: "Significant price drop detected" }
};

function analyzeProduct(product, lang) {
    if (product.rating >= 4.5 && product.reviews > 100) return smartReasonsDict.high_rating[lang];
    if (product.price && product.price.includes('sale')) return smartReasonsDict.price_drop[lang];
    return smartReasonsDict.best_value[lang];
}

// --- Routes ---
app.post('/search', async (req, res) => {
    const { query, lang, uid } = req.body;
    if (query && uid) await new SearchLog({ uid, query }).save();

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 20
    }, (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [], marketAvg: 0 });

        // 1. تنظيف ومعالجة البيانات
        let results = data.shopping_results.map(p => ({
            name: p.title,
            price: p.price,
            // استخراج الرقم فقط من النص (مثلاً "$100" تصبح 100)
            priceVal: p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 0,
            thumbnail: p.thumbnail,
            link: p.product_link || p.link,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            reason: analyzeProduct(p, lang)
        }));

        // 2. تصفية المنتجات التي لها سعر صالح فقط
        const validPrices = results.filter(p => p.priceVal > 0).map(p => p.priceVal);

        // 3. حساب متوسط السوق الحقيقي (Real Market Average)
        let realMarketAvg = 0;
        if (validPrices.length > 0) {
            const sum = validPrices.reduce((a, b) => a + b, 0);
            realMarketAvg = Math.floor(sum / validPrices.length);
        }

        res.json({
            products: results,
            marketAvg: realMarketAvg
        });
    });
});

app.post('/alerts', async (req, res) => {
    try {
        const newAlert = new Alert(req.body);
        await newAlert.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Background Task (Price Tracker) ---
cron.schedule('0 */12 * * *', async () => {
    console.log("🔍 Checking price alerts...");
    const alerts = await Alert.find();

    for (const alert of alerts) {
        getJson({
            engine: "google_shopping", q: alert.productName, api_key: SERP_API_KEY, num: 5
        }, async (data) => {
            if (!data.shopping_results) return;

            for (const p of data.shopping_results) {
                const currentPrice = p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 999999;
                
                if (currentPrice <= alert.targetPrice) {
                    // Send Email
                    const mailOptions = {
                        from: EMAIL_USER,
                        to: alert.email,
                        subject: alert.lang === 'ar' ? 'انخفاض في السعر!' : 'Price Drop Alert!',
                        text: `المنتج: ${alert.productName} متوفر الآن بسعر ${currentPrice}. الرابط: ${alert.link}`
                    };
                    transporter.sendMail(mailOptions);
                    // Remove alert after notification
                    await Alert.findByIdAndDelete(alert._id);
                    break;
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
