/* =========================================
FINDLY SERVER v6.3 - COMPLETE STANDALONE
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const admin = require('firebase-admin');

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.options("*", cors());
app.use(express.json({ limit: '10mb' }));

/* ================= ENVIRONMENT VARIABLES ================= */
const MONGO_URI = process.env.MONGO_URI || '';
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Server Starting...');

/* ================= FIREBASE ================= */
let firebaseInitialized = false;
try {
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        firebaseInitialized = true;
    }
} catch (e) {
    console.log('⚠️ Firebase guest mode');
}

/* ================= DATABASE ================= */
let dbConnected = false;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI).then(() => { dbConnected = true; console.log('✅ MongoDB Connected'); }).catch(e => console.log('❌ MongoDB:', e.message));
}

/* ================= SCHEMAS ================= */
const EnergySchema = new mongoose.Schema({ uid: { type: String, unique: true, required: true }, searchesUsed: { type: Number, default: 0 }, hasFreePass: { type: Boolean, default: false } });
const ReviewSchema = new mongoose.Schema({ name: String, text: String, rating: { type: Number, min: 1, max: 5 }, helpful: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } });
const PriceHistorySchema = new mongoose.Schema({ productId: String, title: String, price: Number, store: String, source: String, thumbnail: String, link: String, timestamp: { type: Date, default: Date.now } });

const Energy = mongoose.model('Energy', EnergySchema);
const Review = mongoose.model('Review', ReviewSchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);

/* ================= CACHE ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24;

/* ================= SAGE CORE (EMBEDDED) ================= */
function cleanPrice(p) { return p ? parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0 : 0; }

const translations = {
    ar: { buy_now: "اشتري الآن", wait: "انتظر", overpriced: "السعر مرتفع", fair_price: "سعر عادل", excellent_deal: "صفقة ممتازة", good_deal: "صفقة جيدة", insufficient_data: "بيانات غير كافية" },
    en: { buy_now: "Buy Now", wait: "Wait", overpriced: "Overpriced", fair_price: "Fair Price", excellent_deal: "Excellent Deal", good_deal: "Good Deal", insufficient_data: "Insufficient data" }
};

function t(lang, key) { return translations[lang]?.[key] || translations.en[key] || key; }

function analyzePrice(product, marketProducts, lang) {
    const currentPrice = cleanPrice(product.price);
    const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);
    
    if (marketPrices.length < 3) {
        return { score: 50, decision: t(lang, 'insufficient_data'), average: null, median: null, confidence: 30 };
    }
    
    const sorted = [...marketPrices].sort((a, b) => a - b);
    const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...sorted);
    const max = Math.max(...sorted);
    
    let score = 50, decision = t(lang, 'fair_price'), color = '#3b82f6';
    
    if (currentPrice < median * 0.85) { score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981'; }
    else if (currentPrice < median * 0.95) { score = 70; decision = t(lang, 'good_deal'); color = '#22c55e'; }
    else if (currentPrice > median * 1.15) { score = 25; decision = t(lang, 'overpriced'); color = '#ef4444'; }
    else if (currentPrice > median * 1.05) { score = 40; decision = t(lang, 'wait'); color = '#f59e0b'; }
    
    return { current: currentPrice, average: Math.round(average * 100) / 100, median: Math.round(median * 100) / 100, min, max, score, decision, color, confidence: Math.min(100, 40 + marketPrices.length * 3) };
}

function analyzeMerchant(product) {
    const store = product.source || product.store || 'Unknown';
    let trustScore = 50;
    const trusted = ['amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 'apple', 'samsung'];
    if (trusted.some(s => store.toLowerCase().includes(s))) trustScore += 30;
    return { store, trustScore: Math.min(100, trustScore) };
}

function SageCore(product, marketProducts, lang) {
    const priceIntel = analyzePrice(product, marketProducts, lang);
    const merchantTrust = analyzeMerchant(product);
    const currentPrice = cleanPrice(product.price);
    
    let decision = 'CONSIDER', reason = priceIntel.decision, color = priceIntel.color;
    
    if (priceIntel.score >= 75) { decision = 'BUY_NOW'; reason = 'صفقة ممتازة'; color = '#10b981'; }
    else if (priceIntel.score >= 60) { decision = 'BUY'; reason = 'صفقة جيدة'; color = '#22c55e'; }
    else if (priceIntel.score <= 40) { decision = 'WAIT'; reason = 'انتظر'; color = '#f59e0b'; }
    
    let bestStore = null, bestPrice = currentPrice, bestLink = product.link;
    if (marketProducts.length > 0) {
        const cheapest = marketProducts.reduce((min, item) => {
            const p = cleanPrice(item.product_price || item.price);
            if (!p) return min;
            if (!min || p < min.price) return { price: p, store: item.source || 'Unknown', link: item.link };
            return min;
        }, null);
        if (cheapest && cheapest.price < currentPrice) {
            bestStore = cheapest.store;
            bestPrice = cheapest.price;
            bestLink = cheapest.link;
        }
    }
    
    const savingsPercent = priceIntel.median ? Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
    
    return {
        priceIntel,
        valueIntel: { score: priceIntel.score, competitors: marketProducts.length, savingsPercent },
        trustIntel: { merchantTrust, overallRisk: merchantTrust.trustScore < 50 ? 50 : 20 },
        finalVerdict: { decision, reason, color, confidence: priceIntel.confidence, savingsPercent, bestStore, bestPrice, bestLink }
    };
}

/* ================= AUTH HELPER ================= */
async function authenticateUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || !firebaseInitialized) return { uid: 'guest', isGuest: true };
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        return { uid: decoded.uid, isGuest: false };
    } catch { return { uid: 'guest', isGuest: true }; }
}

/* ================= CHAT ================= */
const chatResponses = {
    ar: { greeting: ['مرحباً! 👋 أنا Sage، كيف أقدر أساعدك؟', 'أهلاً! 🔮 اسألني عن أي منتج!'], search: ['سأبحث لك. ما المنتج؟'], price: ['سعر جيد 💰', 'قارن مع متاجر أخرى'], general: ['كيف أساعدك؟', 'أنا هنا لمساعدتك 🛍️'] },
    en: { greeting: ['Hello! 👋 I\'m Sage, how can I help?'], search: ['I\'ll search for you. What product?'], price: ['Good price 💰'], general: ['How can I help?'] }
};

async function processChat(message, lang) {
    const lower = (message || '').toLowerCase();
    let intent = 'general';
    if (lower.match(/مرحبا|اهلا|hello|hi/)) intent = 'greeting';
    else if (lower.match(/ابحث|بحث|search|find/)) intent = 'search';
    else if (lower.match(/سعر|price|كم/)) intent = 'price';
    const arr = chatResponses[lang]?.[intent] || chatResponses.ar[intent] || chatResponses.ar.general;
    return { reply: arr[Math.floor(Math.random() * arr.length)] };
}

/* ================= ENDPOINTS ================= */

app.get('/health', (req, res) => res.json({ status: 'ok', version: '6.3', database: dbConnected ? 'connected' : 'disconnected' }));

app.get('/', (req, res) => res.json({ name: 'Findly API', version: '6.3', endpoints: ['GET /search?q=product', 'POST /chat', 'GET /reviews', 'POST /reviews'] }));

// Chat
app.post('/chat', async (req, res) => {
    const { message, lang = 'ar' } = req.body;
    const result = await processChat(message, lang);
    res.json({ success: true, reply: result.reply, response: result.reply });
});

// Search
app.get('/search', async (req, res) => {
    const { q, lang = 'ar' } = req.query;
    if (!q || !q.trim()) return res.json({ success: false, results: [], error: 'no_query' });

    const auth = await authenticateUser(req);
    let energy = { searchesUsed: 0, hasFreePass: false };

    if (dbConnected) { 
        energy = await Energy.findOne({ uid: auth.uid }) || await Energy.create({ uid: auth.uid });
        if (!energy.hasFreePass && energy.searchesUsed >= 3) {
            return res.status(429).json({ error: 'ENERGY_EMPTY', message: 'Free searches exhausted', energy: { left: 0, limit: 3 } });
        }
    }

    const cacheKey = q.toLowerCase() + '_' + lang;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        cached.data.energy = { left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), limit: energy.hasFreePass ? '∞' : 3 };
        return res.json(cached.data);
    }

    if (!SEARCHAPI_KEY) return res.status(503).json({ success: false, error: 'SEARCH_NOT_CONFIGURED', results: [], energy: { left: 3, limit: 3 } });

    try {
        const apiRes = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: { api_key: SEARCHAPI_KEY, engine: 'google_shopping', q, hl: lang === 'ar' ? 'ar' : 'en' },
            timeout: 15000
        });

        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];

        const results = rawResults.map(item => {
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown',
                price: item.price || '$0',
                link: item.product_link || item.link || '',
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping'
            };
            const intelligence = SageCore(product, rawResults, lang);
            return { ...product, intelligence };
        });

        if (dbConnected && !energy.hasFreePass) {
            await Energy.updateOne({ uid: auth.uid }, { $inc: { searchesUsed: 1 } });
            energy.searchesUsed++;
        }

        const response = {
            success: true, query: q, results,
            energy: { left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), limit: energy.hasFreePass ? '∞' : 3 },
            user: { isGuest: auth.isGuest, uid: auth.isGuest ? 'guest' : auth.uid }
        };

        searchCache.set(cacheKey, { time: Date.now(), data: response });
        res.json(response);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ success: false, error: 'SEARCH_FAILED', message: error.message, results: [], energy: { left: 3, limit: 3 } });
    }
});

// ================= REVIEWS =================

app.get('/reviews', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ success: true, reviews: [], todayCount: 0 });
        
        const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayCount = await Review.countDocuments({ createdAt: { $gte: today } });

        res.json({ success: true, reviews, todayCount, total: await Review.countDocuments() });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FETCH_FAILED', message: e.message });
    }
});

app.post('/reviews', async (req, res) => {
    try {
        const { name, text, rating } = req.body;

        if (!name || !text || !rating) return res.status(400).json({ success: false, error: 'MISSING_FIELDS' });
        
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ success: false, error: 'INVALID_RATING' });

        if (!dbConnected) return res.json({ success: true, message: 'Review received (demo)', review: { name, text, rating: ratingNum } });

        const review = await Review.create({ name: name.trim(), text: text.trim(), rating: ratingNum });
        res.status(201).json({ success: true, message: 'Review submitted', review });
    } catch (e) {
        res.status(500).json({ success: false, error: 'CREATE_FAILED', message: e.message });
    }
});

app.post('/reviews/:id/helpful', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ success: true });
        const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpful: 1 } }, { new: true });
        if (!review) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
        res.json({ success: true, helpful: review.helpful });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FAILED' });
    }
});

// ================= PAYMENT =================

app.post('/create-payment', async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'UID_REQUIRED' });
    if (!NOWPAYMENTS_API_KEY) return res.status(503).json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' });

    try {
        const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
            price_amount: 10, price_currency: 'usd', pay_currency: 'usdttrc20',
            order_id: uid, order_description: 'Findly Pro',
            success_url: 'https://findly.source.github.io/?upgrade=success',
            cancel_url: 'https://findly.source.github.io/?upgrade=cancel'
        }, { headers: { 'x-api-key': NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' }, timeout: 10000 });

        res.json({ success: true, url: response.data.invoice_url });
    } catch (e) {
        res.status(500).json({ success: false, error: 'PAYMENT_FAILED' });
    }
});

app.post('/nowpayments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const data = JSON.parse(req.body.toString());
        if (data.payment_status === 'finished' && dbConnected) {
            await Energy.findOneAndUpdate({ uid: data.order_id }, { hasFreePass: true, searchesUsed: 0 }, { upsert: true });
        }
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'WEBHOOK_ERROR' }); }
});

// Redirect
app.get('/go', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL');
    try { res.redirect(decodeURIComponent(url)); } catch { res.status(500).send('Error'); }
});

// ================= START =================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Findly Server running on port ${PORT}`));
