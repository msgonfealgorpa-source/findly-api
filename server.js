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
    high_rating: { ar: "⭐ منتج ذو تقييم ممتاز (أعلى من 4.5)", en: "⭐ Top Rated product (4.5+ stars)" },
    popular: { ar: "🔥 الأكثر شعبية (آلاف المراجعات)", en: "🔥 Most Popular (Thousands of reviews)" },
    default: { ar: "✨ أفضل نتيجة تطابق بحثك", en: "✨ Best match for your search" }
};

function analyzeProduct(product, lang) {
    const l = lang || 'ar';
    if (product.rating >= 4.5) return smartReasonsDict.high_rating[l] || smartReasonsDict.high_rating['ar'];
    if (product.reviews > 1000) return smartReasonsDict.popular[l] || smartReasonsDict.popular['ar'];
    return smartReasonsDict.default[l] || smartReasonsDict.default['ar'];
}

// --- Endpoints ---

app.post('/smart-search', async (req, res) => {
    const { query, lang, uid } = req.body; 
    if (query && uid) await new SearchLog({ uid, query }).save();

    getJson({
        engine: "google_shopping", q: query, api_key: SERP_API_KEY, hl: lang || 'ar', gl: "sa", num: 20
    }, (data) => {
        if (!data || !data.shopping_results) return res.json({ products: [] });
        let results = data.shopping_results.map(p => ({
            name: p.title, price: p.price,
            priceVal: p.price ? parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) : 0,
            thumbnail: p.thumbnail, link: p.product_link || p.link,
            rating: p.rating || 0, reviews: p.reviews || 0, reason: analyzeProduct(p, lang)
        })).sort((a, b) => b.rating - a.rating).slice(0, 8);
        res.json({ products: results });
    });
});

app.post('/watchlist/add', async (req, res) => {
    const { uid, product } = req.body;
    const exists = await Watchlist.findOne({ uid, link: product.link });
    if (exists) return res.json({ message: "موجود بالفعل" });
    await new Watchlist({ uid, ...product }).save();
    res.json({ message: "تمت الإضافة" });
});

app.get('/watchlist/:uid', async (req, res) => {
    const items = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
    res.json({ watchlist: items });
});

// Deep AI Endpoint
app.post('/deep-ai-analyze', (req, res) => {
    const { products, query, lang } = req.body;
    if (!products || products.length === 0) return res.json({ deepAnalysis: "" });
    
    // Logic to find best value and quality
    const bestPrice = products.reduce((min, p) => (p.priceVal > 0 && p.priceVal < min.priceVal) ? p : min, products[0]);
    const bestRated = products.reduce((max, p) => p.rating > max.rating ? p : max, products[0]);
    
    const analysis = {
        ar: `🔍 <strong>تحليل Findly الذكي:</strong><br>قمنا بمسح السوق من أجلك. إذا كنت تبحث عن التوفير، فإن <strong>"${bestPrice.name}"</strong> هو الخيار الأذكى بسعر (${bestPrice.price}).<br>أما إذا كنت تبحث عن الأداء والجودة، فنحن نرشح <strong>"${bestRated.name}"</strong> بتقييم ${bestRated.rating} نجوم.`,
        en: `🔍 <strong>Findly Smart Analysis:</strong><br>We scanned the market. For savings, <strong>"${bestPrice.name}"</strong> is the smart choice at (${bestPrice.price}).<br>For quality, we recommend <strong>"${bestRated.name}"</strong> with a ${bestRated.rating} star rating.`
    };
    
    res.json({ deepAnalysis: analysis[lang] || analysis['ar'] });
});

app.post('/set-alert', async (req, res) => {
    await new Alert(req.body).save();
    res.send({ message: "Alert set" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
