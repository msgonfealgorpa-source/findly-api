/* =========================================
FINDLY SERVER v6.1 - CLEAN VERSION
- No Gemini (Removed)
- Fixed Syntax Error (Code Completion)
- Real Auth & Energy Logic
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const admin = require('firebase-admin');

// تهيئة Firebase
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (e) {
        console.warn('Firebase initialization warning:', e.message);
    }
}

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());
app.use(express.json({ limit: '10mb' }));

/* ================= ENVIRONMENT VARIABLES ================= */
const MONGO_URI = process.env.MONGO_URI || '';
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY || '';
// تم حذف GEMINI_API_KEY نهائياً بناءً على طلبك

console.log('🚀 Findly Server Starting...');
console.log('🔑 SEARCHAPI_KEY:', SEARCHAPI_KEY ? '✅ Set' : '❌ Not Set');
console.log('🔑 MONGO_URI:', MONGO_URI ? '✅ Set' : '❌ Not Set');

/* ================= CACHE SYSTEM ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 2;

const getCache = (key) => {
    const cached = searchCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.time > CACHE_TTL) {
        searchCache.delete(key);
        return null;
    }
    return cached.data;
};

const setCache = (key, data) => {
    searchCache.set(key, { time: Date.now(), data });
};

/* ================= DATABASE CONNECTION ================= */
let dbConnected = false;

if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('✅ MongoDB Connected');
            dbConnected = true;
        })
        .catch(e => console.log('❌ MongoDB Error:', e.message));
} else {
    console.log('⚠️ No MONGO_URI - running without database');
}

/* ================= DATABASE SCHEMAS ================= */
const EnergySchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    searchesUsed: { type: Number, default: 0 },
    hasFreePass: { type: Boolean, default: false }, // الإعداد الذي تحدثت عنه
    createdAt: { type: Date, default: Date.now }
});

const PriceHistorySchema = new mongoose.Schema({
    productId: { type: String, index: true },
    title: String,
    price: Number,
    currency: { type: String, default: 'USD' },
    store: String,
    source: String,
    thumbnail: String,
    link: String,
    inStock: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

const UserBehaviorSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    eventType: { 
        type: String, 
        enum: ['search', 'view', 'click', 'wishlist', 'purchase', 'abandon', 'analysis', 'chat'] 
    },
    productId: String,
    query: String,
    price: Number,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true }
});

const PriceAlertSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    productId: { type: String, index: true },
    productTitle: String,
    productImage: String,
    productLink: String,
    targetPrice: Number,
    currentPrice: Number,
    notifyOn: { type: String, enum: ['drop', 'percentage', 'specific'], default: 'drop' },
    threshold: { type: Number, default: 10 },
    active: { type: Boolean, default: true },
    notified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastChecked: Date
});

const UserProfileSchema = new mongoose.Schema({
    userId: { type: String, unique: true, required: true },
    personality: { type: String, default: 'neutral' },
    preferences: {
        categories: [String],
        brands: [String],
        priceRange: { min: Number, max: Number }
    },
    stats: {
        totalSearches: { type: Number, default: 0 },
        totalPurchases: { type: Number, default: 0 },
        totalSaved: { type: Number, default: 0 },
        averageSpent: Number
    },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
});

const MerchantRatingSchema = new mongoose.Schema({
    domain: { type: String, unique: true },
    name: String,
    overallScore: { type: Number, default: 50 },
    trustScore: { type: Number, default: 50 },
    totalProducts: { type: Number, default: 0 },
    avgPriceDeviation: Number,
    lastUpdated: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    text: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true }
});

const Models = {
    Energy: mongoose.model('Energy', EnergySchema),
    PriceHistory: mongoose.model('PriceHistory', PriceHistorySchema),
    UserBehavior: mongoose.model('UserBehavior', UserBehaviorSchema),
    PriceAlert: mongoose.model('PriceAlert', PriceAlertSchema),
    UserProfile: mongoose.model('UserProfile', UserProfileSchema),
    MerchantRating: mongoose.model('MerchantRating', MerchantRatingSchema),
    Review: mongoose.model('Review', ReviewSchema)
};

/* ================= HELPER FUNCTIONS ================= */
const cleanPrice = (p) => {
    if (!p) return 0;
    const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, ''));
    return isNaN(cleaned) ? 0 : cleaned;
};

const finalizeUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
};

const normalizeQuery = (q) => q.trim().toLowerCase().replace(/\s+/g, ' ');
const pendingSearches = new Map();

/* ================= SAFE MODULE LOADING ================= */
// نحاول تحميل الملفات الخارجية إذا وجدت، وإلا نستخدم دالة فارغة لتجنب تعطل السيرفر
let SageCore, processChatMessage;

try {
    SageCore = require('./sage-core.js');
} catch (e) {
    console.warn('⚠️ sage-core.js not found.');
    SageCore = async () => ({ score: 0, insights: 'Core analysis unavailable' });
}

try {
    ({ processChatMessage } = require('./chat-engine.js'));
} catch (e) {
    console.warn('⚠️ chat-engine.js not found.');
    processChatMessage = async (msg) => ({ response: "Chat unavailable", intent: 'error' });
}

/* ================= TRACKING FUNCTIONS ================= */
async function trackUserBehavior(userId, eventType, data) {
    if (!dbConnected || !userId || userId === 'guest') return;
    try {
        await Models.UserBehavior.create({
            userId, eventType,
            productId: data.productId,
            query: data.query,
            price: data.price,
            metadata: data.metadata
        });
        await Models.UserProfile.findOneAndUpdate(
            { userId },
            { 
                $inc: { 'stats.totalSearches': eventType === 'search' ? 1 : 0 },
                $set: { lastActive: new Date() }
            },
            { upsert: true }
        );
    } catch (e) { console.log('Tracking error:', e.message); }
}

async function savePriceHistory(product) {
    if (!dbConnected) return;
    try {
        await Models.PriceHistory.create({
            productId: product.id || crypto.createHash('md5').update(product.title).digest('hex'),
            title: product.title,
            price: cleanPrice(product.price),
            store: product.source,
            source: product.source,
            thumbnail: product.thumbnail,
            link: product.link
        });
    } catch (e) { console.log('Price history error:', e.message); }
}

async function getUserHistory(userId) {
    if (!dbConnected || !userId || userId === 'guest') return {};
    try {
        const behaviors = await Models.UserBehavior.find({ userId })
            .sort({ timestamp: -1 }).limit(100).lean();
        const profile = await Models.UserProfile.findOne({ userId }).lean();
        const userEvents = {
            searches: behaviors.filter(b => b.eventType === 'search').length,
            views: behaviors.filter(b => b.eventType === 'view').length,
            wishlistAdditions: behaviors.filter(b => b.eventType === 'wishlist').length,
            purchases: behaviors.filter(b => b.eventType === 'purchase').length,
            clickedAnalysis: behaviors.some(b => b.eventType === 'analysis')
        };
        return { userEvents, profile };
    } catch (e) { return {}; }
}

/* ================= API ENDPOINTS ================= */

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '6.1-clean',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Findly Sage API',
        status: 'running',
        message: 'Server is operational. No Gemini used.'
    });
});

// Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, userId, lang = 'ar', history = [] } = req.body;
        if (!message) return res.json({ reply: 'Empty message' });
        
        const result = await processChatMessage(message.trim(), userId, lang, history);
        res.json({
            reply: result.response,
            response: result.response,
            intent: result.intent
        });
    } catch (error) {
        res.status(500).json({ reply: 'Error processing chat', error: error.message });
    }
});

// Smart Search Endpoint
app.get('/search', async (req, res) => {
    const authHeader = req.headers.authorization;

    // التحقق من التوكن (يجب أن يكون صالحاً لأنك لا تريد إعدادات وهمية)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    let uid;

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
  
    const { q, lang = 'ar' } = req.query;
    
    if (!q) return res.json({ results: [], error: 'no_query' });

    // منطق الطاقة والرصيد الحقيقي
    let energy = { searchesUsed: 0, hasFreePass: false };
    
    if (dbConnected) {
        try {
            energy = await Models.Energy.findOne({ uid }) || await Models.Energy.create({ uid });
            // إذا لم يكن لديه Free Pass وتجاوز الحد
            if (!energy.hasFreePass && energy.searchesUsed >= 3) {
                return res.status(429).json({ 
                    error: 'ENERGY_EMPTY',
                    message: 'Free searches exhausted. Please upgrade.'
                });
            }
        } catch (e) { console.error('DB Energy Error', e); }
    }

    const cacheKey = normalizeQuery(q) + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) {
        cached.energy.left = energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed);
        return res.json(cached);
    }

    try {
        if (!SEARCHAPI_KEY) throw new Error('SEARCHAPI_KEY not configured');

        let apiRes;
        if (pendingSearches.has(cacheKey)) {
            apiRes = await pendingSearches.get(cacheKey);
        } else {
            const searchPromise = axios.get('https://www.searchapi.io/api/v1/search', {
                params: {
                    api_key: SEARCHAPI_KEY,
                    engine: 'google_shopping',
                    q: q,
                    hl: lang === 'ar' ? 'ar' : 'en',
                },
                timeout: 15000
            });
            pendingSearches.set(cacheKey, searchPromise);
            try {
                apiRes = await searchPromise;
            } finally {
                pendingSearches.delete(cacheKey);
            }
        }

        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];
        
        await trackUserBehavior(uid, 'search', { query: q });

        const userHistory = await getUserHistory(uid);

        const results = await Promise.all(rawResults.map(async (item) => {
            const price = cleanPrice(item.price || item.extracted_price);
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown Product',
                price: item.price || '$0',
                numericPrice: price,
                link: finalizeUrl(item.product_link || item.link),
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping'
            };

            await savePriceHistory(product);

            let priceHistory = [];
            if (dbConnected) {
                try {
                    priceHistory = await Models.PriceHistory.find({ title: { $regex: item.title?.substring(0, 30), $options: 'i' } })
                        .sort({ timestamp: -1 }).limit(30).lean();
                } catch (e) {}
            }

            let intelligence = {};
            try {
                intelligence = await SageCore(
                    product, rawResults, priceHistory, 
                    userHistory.userEvents, uid, userHistory.profile, lang
                );
            } catch (e) { console.log('SageCore error:', e.message); }

            return { ...product, intelligence };
        }));

        // تحديث عدد عمليات البحث إذا لم يكن Free Pass
        if (dbConnected && !energy.hasFreePass) {
            try {
                energy.searchesUsed += 1;
                await energy.save();
            } catch (e) {}
        }

        const responseData = {
            query: q,
            results: results,
            energy: {
                used: energy.searchesUsed,
                limit: energy.hasFreePass ? '∞' : 3,
                left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed)
            }
        };

        setCache(cacheKey, responseData);
        res.json(responseData);

    } catch (error) {
        console.error('❌ SEARCH ERROR:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'SEARCH_FAILED', 
            message: error.message,
            results: [] 
        });
    }
});

// Deep Analysis Endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { product, marketProducts, userId, lang = 'ar' } = req.body;
        if (!product) return res.status(400).json({ error: 'product_required' });

        await trackUserBehavior(userId, 'analysis', { productId: product.id, price: cleanPrice(product.price) });

        let priceHistory = [];
        if (dbConnected && product.title) {
            try {
                priceHistory = await Models.PriceHistory.find({ 
                    title: { $regex: product.title?.substring(0, 30), $options: 'i' } 
                }).sort({ timestamp: -1 }).limit(30).lean();
            } catch (e) {}
        }

        const userHistory = await getUserHistory(userId);
        const intelligence = await SageCore(product, marketProducts || [], priceHistory, userHistory.userEvents, userId, userHistory.profile, lang);

        res.json({ product, intelligence });
    } catch (error) {
        res.status(500).json({ error: 'ANALYSIS_FAILED', message: error.message });
    }
});

// Price Alert Endpoint
app.post('/alerts', async (req, res) => {
    try {
        const { userId, productId, productTitle, productImage, productLink, targetPrice, currentPrice, notifyOn = 'drop' } = req.body;
        if (!userId || !productId || !targetPrice) return res.status(400).json({ error: 'missing_fields' });
        
        if (!dbConnected) return res.json({ success: true, message: 'Alert accepted (demo)' });

        await Models.PriceAlert.create({ userId, productId, productTitle, productImage, productLink, targetPrice, currentPrice, notifyOn });
        res.json({ success: true, message: 'Alert created' });
    } catch (error) {
        res.status(500).json({ error: 'ALERT_FAILED' });
    }
});

// Get User Alerts
app.get('/alerts/:userId', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ alerts: [] });
        const alerts = await Models.PriceAlert.find({ userId: req.params.userId, active: true }).sort({ createdAt: -1 }).limit(20);
        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ error: 'FETCH_FAILED' });
    }
});

// Price History Endpoint - تم إصلاح الكود المقطوع هنا
app.get('/history/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;

        if (!dbConnected) return res.json({ history: [], message: 'Database not connected' });

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const history = await Models.PriceHistory.find({
            $or: [
                { productId },
                { title: { $regex: productId, $options: 'i' } }
            ],
            timestamp: { $gte: since }
        }).sort({ timestamp: -1 }).lean();

        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: 'FETCH_FAILED', message: error.message });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server is listening on port ${PORT}`);
});
