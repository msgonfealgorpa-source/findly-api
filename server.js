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

function deepAIAnalysis(product, marketAvg, lang = 'ar') {
    let pros = [];
    let cons = [];
    let verdict = "";

    const priceVal = product.priceVal;

    if (priceVal > 0 && marketAvg > 0) {
        if (priceVal < marketAvg * 0.9) {
            pros.push(lang === 'ar' ? "سعر لقطة (أرخص من السوق)" : "Great price (Below market)");
        } else if (priceVal > marketAvg * 1.1) {
            cons.push(lang === 'ar' ? "السعر مرتفع حالياً" : "Price is high right now");
        }
    }

    // تحليل بناءً على التقييم الحقيقي القادم من جوجل
    if (product.rating >= 4.5) {
        pros.push(lang === 'ar' ? "تقييم ممتاز من المستخدمين" : "Excellent user ratings");
    } else if (product.rating > 0 && product.rating < 3.5) {
        cons.push(lang === 'ar' ? "تقييمات سلبية لبعض المشترين" : "Some negative feedback");
    }

    if (pros.length > cons.length) {
        verdict = lang === 'ar' ? "ننصح بالشراء الآن" : "Highly Recommended";
    } else if (cons.length > pros.length) {
        verdict = lang === 'ar' ? "انتظر انخفاض السعر أو ابحث عن بديل" : "Wait for drop or look for alternatives";
    } else {
        verdict = lang === 'ar' ? "صفقة عادلة" : "Fair Deal";
    }

    return { pros, cons, verdict };
}

// --- المسارات (Endpoints) ---

// 1. البحث الذكي (Smart Search)
app.post('/smart-search', async (req, res) => {
    const { query, lang } = req.body;

    getJson({
        engine: "google_shopping",
        q: query,
        api_key: SERP_API_KEY,
        hl: lang || 'ar',
        gl: "sa"
    }, (data) => {
        if (!data || !data.shopping_results) {
            return res.json({ products: [], marketAvg: 0 });
        }

        const rawProducts = data.shopping_results.map(p => ({
            ...p,
            priceVal: extractPrice(p.price)
        }));

        const prices = rawProducts.map(p => p.priceVal).filter(p => p > 0);
        const marketAvg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

        const products = rawProducts.slice(0, 10).map(p => {
            return {
                name: p.title,
                price: p.price,
                priceVal: p.priceVal,
                thumbnail: p.thumbnail,
                link: p.link,
                store_name: p.source,
                rating: p.rating || 0,
                reviews: p.reviews || 0,
                snippet: p.snippet || "",
                analysis: deepAIAnalysis(p, marketAvg, lang)
            };
        });

        res.json({ products, marketAvg });
    });
});

// 2. زر مقارنة الأسعار (Real Comparison)
app.post('/compare-prices', (req, res) => {
    const { productName, lang } = req.body;
    getJson({
        engine: "google_shopping",
        q: productName,
        api_key: SERP_API_KEY,
        hl: lang || 'ar',
        gl: "sa"
    }, (data) => {
        const competitors = (data.shopping_results || []).slice(0, 8).map(c => ({
            store: c.source,
            price: c.price,
            priceVal: extractPrice(c.price),
            link: c.link,
            rating: c.rating || null // تقييم المتجر الحقيقي
        }));
        res.json({ competitors });
    });
});

// 3. قائمة المراقبة (Watchlist)
app.get('/watchlist/:uid', async (req, res) => {
    try {
        const list = await Watchlist.find({ uid: req.params.uid });
        res.json({ watchlist: list });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/watchlist/add', async (req, res) => {
    try {
        const { uid, product } = req.body;
        const newItem = new Watchlist({ ...product, uid });
        await newItem.save();
        res.json({ message: "Added to watchlist" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/watchlist/remove', async (req, res) => {
    try {
        const { uid, name } = req.body;
        await Watchlist.deleteOne({ uid, name });
        res.json({ message: "Removed" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. تتبع السعر النشط (Cron Job)
cron.schedule('0 */12 * * *', async () => {
    console.log("Running Price Check Cron...");
    const alerts = await Alert.find();
    for (const alert of alerts) {
        getJson({ engine: "google_shopping", q: alert.productName, api_key: SERP_API_KEY }, async (data) => {
            const topResult = data.shopping_results?.[0];
            if (topResult) {
                const currentPrice = extractPrice(topResult.price);
                if (currentPrice <= alert.targetPrice) {
                    console.log(`Price alert triggered for ${alert.productName}`);
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
