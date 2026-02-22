/* =========================================
FINDLY SERVER v7.2 - SAGE ULTIMATE AI
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

// Import Sage Core v5.0
const SageCore = require('./sage-core-v5.js');

const app = express();
// ===== Affiliate Config =====
const AFFILIATE = {
    url: "https://s.click.aliexpress.com/e/_c41hZR8P",
    id: "LY20260129XmLf",
    source: "AliExpress"
};
/* ================= BASIC MIDDLEWARE ================= */
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.options("*", cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

/* ================= ENVIRONMENT VARIABLES ================= */
const MONGO_URI = process.env.MONGO_URI || '';
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Server v7.2 with SAGE ULTIMATE Starting...');
console.log('🔮 Sage Core v5.0 Loaded Successfully');

/* ================= DATABASE ================= */
let dbConnected = false;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => { 
            dbConnected = true; 
            console.log('✅ MongoDB Connected'); 
        })
        .catch(e => console.log('❌ MongoDB:', e.message));
}

/* ================= SCHEMAS ================= */
const EnergySchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    searchesUsed: { type: Number, default: 0 },
    proExpiresAt: { type: Date, default: null }
});

const ReviewSchema = new mongoose.Schema({
    name: String,
    text: String,
    rating: { type: Number, min: 1, max: 5 },
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const PriceHistorySchema = new mongoose.Schema({
    productId: String,
    title: String,
    price: Number,
    store: String,
    source: String,
    thumbnail: String,
    link: String,
    timestamp: { type: Date, default: Date.now }
});

const UserBehaviorSchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    searches: [{ query: String, timestamp: Date }],
    clicks: [{ productId: String, timestamp: Date }],
    purchases: [{ productId: String, price: Number, timestamp: Date }],
    wishlistAdditions: { type: Number, default: 0 },
    priceChecks: { type: Number, default: 0 },
    comparisonViews: { type: Number, default: 0 },
    quickPurchases: { type: Number, default: 0 },
    preferredCategories: [String],
    avgPurchasePrice: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const Energy = mongoose.model('Energy', EnergySchema);
const Review = mongoose.model('Review', ReviewSchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);
const UserBehavior = mongoose.model('UserBehavior', UserBehaviorSchema);

/* ================= CACHE ================= */
const searchCache = new Map();
const CACHE_TTL = 75 * 60 * 60 * 1000; // 75 ساعة

/* ================= AUTH HELPER ================= */
async function authenticateUser(req, res) {
    let uid = req.cookies?.uid;

    // إذا لا يوجد uid، ننشئ واحد جديد
    if (!uid) {
        uid = uuidv4();

        // نحفظه في كوكي لمدة سنة
        res.cookie('uid', uid, {
            httpOnly: true,
            sameSite: 'Lax',
            maxAge: 365 * 24 * 60 * 60 * 1000
        });
    }

    return { uid };
}

/* ================= USER BEHAVIOR TRACKER ================= */
async function trackUserBehavior(uid, action, data = {}) {
    if (!dbConnected) return;
    
    try {
        const update = { lastUpdated: new Date() };
        
        switch (action) {
            case 'search':
                update.$push = { searches: { query: data.query, timestamp: new Date() } };
                break;
            case 'click':
                update.$push = { clicks: { productId: data.productId, timestamp: new Date() } };
                break;
            case 'purchase':
                update.$push = { purchases: { productId: data.productId, price: data.price, timestamp: new Date() } };
                break;
            case 'wishlist':
                update.$inc = { wishlistAdditions: 1 };
                break;
            case 'price_check':
                update.$inc = { priceChecks: 1 };
                break;
            case 'comparison':
                update.$inc = { comparisonViews: 1 };
                break;
            case 'quick_purchase':
                update.$inc = { quickPurchases: 1 };
                break;
        }
        
        await UserBehavior.findOneAndUpdate({ uid }, update, { upsert: true });
    } catch (e) {
        console.error('Behavior tracking error:', e.message);
    }
}

async function getUserBehavior(uid) {
    if (!dbConnected) return null;
    
    try {
        const behavior = await UserBehavior.findOne({ uid }).lean();
        if (!behavior) return null;
        
        return {
            wishlistAdditions: behavior.wishlistAdditions || 0,
            priceChecks: behavior.priceChecks || 0,
            comparisonViews: behavior.comparisonViews || 0,
            quickPurchases: behavior.quickPurchases || 0,
            searches: behavior.searches?.length || 0,
            purchases: behavior.purchases || [],
            avgPurchasePrice: behavior.avgPurchasePrice || 0,
            preferredCategories: behavior.preferredCategories || []
        };
    } catch (e) {
        return null;
    }
}

/* ================= CHAT PROCESSOR ================= */
const chatResponses = {
    ar: {
        greeting: ['مرحباً! 👋 أنا Sage، كيف أقدر أساعدك؟', 'أهلاً! 🔮 اسألني عن أي منتج!'],
        search: ['سأبحث لك. ما المنتج؟'],
        price: ['سعر جيد 💰', 'قارن مع متاجر أخرى'],
        general: ['كيف أساعدك؟', 'أنا هنا لمساعدتك 🛍️']
    },
    en: {
        greeting: ['Hello! 👋 I\'m Sage, how can I help?'],
        search: ['I\'ll search for you. What product?'],
        price: ['Good price 💰'],
        general: ['How can I help?']
    }
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

app.get('/health', (req, res) => res.json({
    status: 'ok',
    version: '7.2',
    sage: 'v5.0 Ultimate',
    database: dbConnected ? 'connected' : 'disconnected',
    features: [
        'Price Intelligence',
        'Trend Analysis',
        'Technical Indicators',
        'Merchant Trust',
        'Fake Deal Detection',
        'Price Prediction',
        'Personality Analysis',
        'Learning Engine',
        'Cookie-based UID'
    ]
}));

app.get('/', (req, res) => res.json({
    name: 'Findly API',
    version: '7.2',
    sage: 'SAGE Core v5.0 Ultimate',
    endpoints: [
        'GET /search?q=product',
        'POST /chat',
        'GET /reviews',
        'POST /reviews',
        'GET /behavior/:uid'
    ]
}));

// Chat
app.post('/chat', async (req, res) => {
    const { message, lang = 'ar' } = req.body;
    const result = await processChat(message, lang);
    res.json({ success: true, reply: result.reply, response: result.reply });
});

// Search - Enhanced with Full Sage Intelligence
app.get('/search', async (req, res) => {
    const { q, lang = 'ar' } = req.query;
    if (!q || !q.trim()) return res.json({ success: false, results: [], error: 'no_query' });

    const auth = await authenticateUser(req, res);
    let energy = { searchesUsed: 0, proExpiresAt: null };

    if (dbConnected) {
        energy = await Energy.findOne({ uid: auth.uid }) || await Energy.create({ uid: auth.uid });

        // New subscription logic
        const now = new Date();
        const isSubscribed = energy.proExpiresAt && energy.proExpiresAt > now;

        if (!isSubscribed && energy.searchesUsed >= 3) {
            return res.status(429).json({
                error: 'ENERGY_EMPTY',
                message: 'Subscription required',
                energy: { left: 0, limit: 3 }
            });
        }
    }

    // Check cache
    const cacheKey = q.toLowerCase() + '_' + lang;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        const now = new Date();
        const isSubscribed = energy.proExpiresAt && energy.proExpiresAt > now;
        cached.data.energy = {
            left: isSubscribed ? '∞' : Math.max(0, 3 - energy.searchesUsed),
            limit: isSubscribed ? '∞' : 3
        };
        return res.json(cached.data);
    }

    if (!SEARCHAPI_KEY) {
        return res.status(503).json({
            success: false,
            error: 'SEARCH_NOT_CONFIGURED',
            results: [],
            energy: { left: 3, limit: 3 }
        });
    }

    try {
        // Track search behavior
        await trackUserBehavior(auth.uid, 'search', { query: q });
        
        // Get user behavior for personalization
        const userBehavior = await getUserBehavior(auth.uid);

        const apiRes = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: {
                api_key: SEARCHAPI_KEY,
                engine: 'google_shopping',
                q,
                hl: lang === 'ar' ? 'ar' : 'en'
            },
            timeout: 15000
        });

        
        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];

        // Process each product with FULL Sage Intelligence
        const results = rawResults.map(item => {
    const product = {
        id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
        title: item.title || 'Unknown',
        price: item.price || '$0',
        originalPrice: item.original_price || null,
        link: item.product_link || item.link || '',
        thumbnail: item.thumbnail || item.product_image || '',
        source: item.source || 'Google Shopping',
        rating: item.rating,
        reviewCount: item.review_count
    };

    const intelligence = SageCore(
        product,
        rawResults,
        [],
        userBehavior || {},
        auth.uid,
        { purchases: userBehavior?.purchases || [], avgMarketPrice: userBehavior?.avgPurchasePrice },
        lang,
        { geminiApiKey: GEMINI_API_KEY }
    );

    return {
        ...product,
        intelligence
    };
});


// ✅ هنا تضيف الأفلييت (المكان الصحيح)
const finalResults = results.map(p => ({
    ...p,
    affiliate: {
        link: AFFILIATE.url,
        id: AFFILIATE.id,
        source: AFFILIATE.source
    }
}));

        // Update energy for non-subscribers
        if (dbConnected) {
            const now = new Date();
            const isSubscribed = energy.proExpiresAt && energy.proExpiresAt > now;
            
            if (!isSubscribed) {
                energy.searchesUsed += 1;
                await energy.save();
            }
        }

        // Calculate personality from user behavior
        let personality = null;
        if (userBehavior) {
            const behaviorScores = {
                wishlistAdditions: userBehavior.wishlistAdditions,
                priceChecks: userBehavior.priceChecks,
                comparisonViews: userBehavior.comparisonViews,
                quickPurchases: userBehavior.quickPurchases
            };
            
            // Simple personality detection
            if (behaviorScores.priceChecks > 3 || behaviorScores.comparisonViews > 2) {
                personality = { type: 'analyst', icon: '📊', name: 'المحلل' };
            } else if (behaviorScores.quickPurchases > 2) {
                personality = { type: 'impulse', icon: '⚡', name: 'المتسرع' };
            } else if (behaviorScores.wishlistAdditions > 3) {
                personality = { type: 'hunter', icon: '🎯', name: 'صياد الصفقات' };
            }
        }

        const now = new Date();
        const isSubscribed = energy.proExpiresAt && energy.proExpiresAt > now;

        // ✅ زيادة العداد بعد كل عملية بحث
if (dbConnected && !isSubscribed) {
    await Energy.updateOne(
        { uid: auth.uid },
        { $inc: { searchesUsed: 1 } }
    );

    // حدث القيمة المحلية أيضاً
    energy.searchesUsed += 1;
}
        const response = {
            success: true,
            query: q,
            results: finalResults,
            personality,
            energy: {
                left: isSubscribed ? '∞' : Math.max(0, 3 - energy.searchesUsed),
                limit: isSubscribed ? '∞' : 3
            },
            user: {
                uid: auth.uid
            },
            sage: {
                version: 'v5.0 Ultimate',
                features: [
                    'Price Intelligence',
                    'Trend Analysis',
                    'Technical Indicators (RSI, MACD, Bollinger)',
                    'Merchant Trust Analysis',
                    'Fake Deal Detection',
                    'Price Prediction',
                    'Personality Analysis',
                    'Learning Engine'
                ]
            }
        };

        searchCache.set(cacheKey, { time: Date.now(), data: response });
        res.json(response);

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({
            success: false,
            error: 'SEARCH_FAILED',
            message: error.message,
            results: [],
            energy: { left: 3, limit: 3 }
        });
    }
});

// Get user behavior
app.get('/behavior/:uid', async (req, res) => {
    const { uid } = req.params;
    if (!dbConnected) {
        return res.json({ success: true, behavior: null });
    }
    
    const behavior = await getUserBehavior(uid);
    res.json({ success: true, behavior });
});

// Track behavior events
app.post('/behavior/:uid/:action', async (req, res) => {
    const { uid, action } = req.params;
    const data = req.body;
    
    await trackUserBehavior(uid, action, data);
    res.json({ success: true });
});

// ================= REVIEWS =================

app.get('/reviews', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ success: true, reviews: [], todayCount: 0 });

        const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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
            price_amount: 10,
            price_currency: 'usd',
            pay_currency: 'usdttrc20',
            order_id: uid,
            order_description: 'Findly Pro',
            success_url: 'https://findly.source.github.io/?upgrade=success',
            cancel_url: 'https://findly.source.github.io/?upgrade=cancel'
        }, {
            headers: { 'x-api-key': NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
            timeout: 10000
        });

        res.json({ success: true, url: response.data.invoice_url });
    } catch (e) {
        res.status(500).json({ success: false, error: 'PAYMENT_FAILED' });
    }
});

app.post('/nowpayments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const data = JSON.parse(req.body.toString());
        if (data.payment_status === 'finished' && dbConnected) {
            const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            await Energy.updateOne(
                { uid: data.order_id },
                { $set: { proExpiresAt: expires } },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'WEBHOOK_ERROR' });
    }
});

// Redirect
app.get('/go', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL');
    try {
        res.redirect(decodeURIComponent(url));
    } catch {
        res.status(500).send('Error');
    }
});

// ================= START =================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Findly Server v7.2 with SAGE ULTIMATE running on port ' + PORT);
    console.log('🔮 Sage Core v5.0 Intelligence Engine Active');
    console.log('🍪 Cookie-based UID System Active');
});
