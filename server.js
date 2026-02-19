/* =========================================
FINDLY SERVER v6.2 - FIXED VERSION
Ultimate Shopping Intelligence Platform
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const admin = require('firebase-admin');

// ✅ استدعاء العقل الذكي من ملف خارجي
const SageCore = require('./sageCore');

// Initialize Firebase Admin
let firebaseInitialized = false;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin Initialized');
    }
} catch (error) {
    console.log('⚠️ Firebase running in guest mode');
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Server v6.2 Starting...');

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
    hasFreePass: { type: Boolean, default: false },
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

// ✅ Schema المراجعات
const ReviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    text: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true }
});

// Models
const Energy = mongoose.model('Energy', EnergySchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);
const UserBehavior = mongoose.model('UserBehavior', UserBehaviorSchema);
const PriceAlert = mongoose.model('PriceAlert', PriceAlertSchema);
const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
const Review = mongoose.model('Review', ReviewSchema);

/* ================= CHAT RESPONSES ================= */

const CHAT_RESPONSES = {
    ar: {
        greeting: ['مرحباً! 👋 أنا Sage، مساعدك الذكي للتسوق. كيف يمكنني مساعدتك؟', 'أهلاً! 🔮 أنا هنا لمساعدتك في العثور على أفضل الصفقات!'],
        search: ['سأبحث لك عن أفضل الأسعار. ما المنتج الذي تريده؟', 'دعني أساعدك في العثور على أفضل عرض!'],
        price: ['هذا سعر جيد! 💰', 'أنصحك بالمقارنة مع متاجر أخرى', 'يمكنك انتظار العروض للحصول على سعر أفضل'],
        deal: ['صفقة ممتازة! 🎉 أنصحك بالشراء الآن', 'هذا عرض رائع! لا تفوته'],
        general: ['كيف يمكنني مساعدتك في التسوق اليوم؟', 'أنا هنا لمساعدتك في العثور على أفضل الصفقات 🛍️']
    },
    en: {
        greeting: ['Hello! 👋 I\'m Sage, your smart shopping assistant.', 'Hi! 🔮 I\'m here to help you find the best deals!'],
        search: ['I\'ll search for the best prices. What product do you need?'],
        price: ['That\'s a good price! 💰', 'I recommend comparing with other stores'],
        deal: ['Excellent deal! 🎉 I recommend buying now'],
        general: ['How can I help you shop today?', 'I\'m here to help you find the best deals 🛍️']
    }
};

async function processChatMessage(message, userId, lang = 'ar') {
    if (!message || typeof message !== 'string' || message.trim() === '') {
        const defaultResponses = CHAT_RESPONSES[lang] || CHAT_RESPONSES.ar;
        return { reply: defaultResponses.greeting[0], intent: 'general', sentiment: 'neutral', language: lang };
    }

    const lowerMessage = message.toLowerCase();
    let intent = 'general';
    
    const responses = CHAT_RESPONSES[lang] || CHAT_RESPONSES.ar;

    if (lowerMessage.match(/مرحبا|اهلا|hello|hi|hey|السلام/)) {
        intent = 'greeting';
    } else if (lowerMessage.match(/ابحث|بحث|search|find|lookup|دور/)) {
        intent = 'search';
    } else if (lowerMessage.match(/سعر|price|cost|كم|بكم/)) {
        intent = 'price';
    } else if (lowerMessage.match(/صفقة|deal|offer|discount|خصم|عرض/)) {
        intent = 'deal';
    }

    const responseArray = responses[intent] || responses.general;
    const reply = responseArray[Math.floor(Math.random() * responseArray.length)];

    return { reply, response: reply, intent, sentiment: 'neutral', language: lang };
}

/* ================= HELPER FUNCTIONS ================= */

const finalizeUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
};

const normalizeQuery = (q) => q.trim().toLowerCase().replace(/\s+/g, ' ');

const pendingSearches = new Map();

/* ================= AUTHENTICATION HELPER ================= */
async function authenticateUser(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { uid: 'guest', isGuest: true };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!firebaseInitialized) {
        return { uid: 'guest', isGuest: true };
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return { uid: decoded.uid, isGuest: false };
    } catch (err) {
        return { uid: 'guest', isGuest: true };
    }
}

/* ================= TRACKING FUNCTIONS ================= */

async function trackUserBehavior(userId, eventType, data) {
    if (!dbConnected || !userId || userId === 'guest') return;
    
    try {
        await UserBehavior.create({
            userId,
            eventType,
            productId: data.productId,
            query: data.query,
            price: data.price,
            metadata: data.metadata
        });

        await UserProfile.findOneAndUpdate(
            { userId },
            { 
                $inc: { 'stats.totalSearches': eventType === 'search' ? 1 : 0 },
                $set: { lastActive: new Date() }
            },
            { upsert: true }
        );
    } catch (e) {
        console.log('Tracking error:', e.message);
    }
}

async function savePriceHistory(product) {
    if (!dbConnected) return;
    
    try {
        await PriceHistory.create({
            productId: product.id || crypto.createHash('md5').update(product.title).digest('hex'),
            title: product.title,
            price: parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0,
            store: product.source,
            source: product.source,
            thumbnail: product.thumbnail,
            link: product.link
        });
    } catch (e) {
        console.log('Price history error:', e.message);
    }
}

async function getUserHistory(userId) {
    if (!dbConnected || !userId || userId === 'guest') return {};
    
    try {
        const behaviors = await UserBehavior.find({ userId })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        const profile = await UserProfile.findOne({ userId }).lean();

        const userEvents = {
            searches: behaviors.filter(b => b.eventType === 'search').length,
            views: behaviors.filter(b => b.eventType === 'view').length,
            wishlistAdditions: behaviors.filter(b => b.eventType === 'wishlist').length,
            purchases: behaviors.filter(b => b.eventType === 'purchase').length,
            clickedAnalysis: behaviors.some(b => b.eventType === 'analysis')
        };

        return { userEvents, profile };
    } catch (e) {
        return {};
    }
}

/* ================= API ENDPOINTS ================= */

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '6.2.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        gemini: GEMINI_API_KEY ? 'configured' : 'not_configured',
        database: dbConnected ? 'connected' : 'disconnected',
        firebase: firebaseInitialized ? 'initialized' : 'not_initialized'
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Findly Sage API',
        version: '6.2.0',
        status: 'running',
        endpoints: {
            chat: 'POST /chat',
            search: 'GET /search?q=product',
            analyze: 'POST /analyze',
            alerts: 'POST /alerts',
            reviews: 'GET /reviews, POST /reviews'
        }
    });
});

// Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, userId, lang = 'ar' } = req.body;
        
        if (userId && userId !== 'guest') {
            await trackUserBehavior(userId, 'chat', { query: message });
        }
        
        const result = await processChatMessage(message, userId || 'guest', lang);
        
        res.json({
            success: true,
            reply: result.reply,
            response: result.response,
            intent: result.intent,
            sentiment: result.sentiment,
            language: result.language
        });
        
    } catch (error) {
        res.json({
            success: true,
            reply: '🤔 عذراً، حدث خطأ بسيط. كيف يمكنني مساعدتك؟',
            response: '🤔 عذراً، حدث خطأ بسيط. كيف يمكنني مساعدتك؟',
            intent: 'general',
            sentiment: 'neutral'
        });
    }
});

// ✅ Smart Search Endpoint - مع إرجاع الطاقة
app.get('/search', async (req, res) => {
    const { q, lang = 'ar' } = req.query;
    
    if (!q || q.trim() === '') {
        return res.json({ 
            success: false,
            results: [], 
            error: 'no_query'
        });
    }

    const auth = await authenticateUser(req);
    const uid = auth.uid;
    
    // ✅ التحقق من الطاقة
    let energy = { searchesUsed: 0, hasFreePass: false };
    
    if (dbConnected && !auth.isGuest) {
        try {
            energy = await Energy.findOne({ uid }) || await Energy.create({ uid });
            if (!energy.hasFreePass && energy.searchesUsed >= 3) {
                return res.status(429).json({ 
                    error: 'ENERGY_EMPTY',
                    message: 'Free searches exhausted'
                });
            }
        } catch (e) {}
    }

    // Check cache
    const cacheKey = normalizeQuery(q) + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) {
        cached.energy = {
            used: energy.searchesUsed,
            limit: energy.hasFreePass ? '∞' : 3,
            left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed)
        };
        cached.cached = true;
        return res.json(cached);
    }

    try {
        if (!SEARCHAPI_KEY) {
            return res.status(503).json({ 
                success: false,
                error: 'SEARCH_NOT_CONFIGURED',
                results: [] 
            });
        }

        const apiRes = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: {
                api_key: SEARCHAPI_KEY,
                engine: 'google_shopping',
                q: q,
                hl: lang === 'ar' ? 'ar' : 'en',
            },
            timeout: 15000
        });

        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];

        // Track search
        if (!auth.isGuest) {
            await trackUserBehavior(uid, 'search', { query: q });
        }

        const userHistory = await getUserHistory(uid);

        // Build results with intelligence
        const results = await Promise.all(rawResults.map(async (item) => {
            const price = parseFloat(String(item.price || item.extracted_price).replace(/[^0-9.]/g, '')) || 0;
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown Product',
                price: item.price || '$0',
                numericPrice: price,
                link: finalizeUrl(item.product_link || item.link),
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping' // ✅ اسم المتجر
            };

            await savePriceHistory(product);

            let priceHistory = [];
            if (dbConnected) {
                try {
                    priceHistory = await PriceHistory.find({ title: { $regex: item.title?.substring(0, 30), $options: 'i' } })
                        .sort({ timestamp: -1 })
                        .limit(30)
                        .lean();
                } catch (e) {}
            }

            // ✅ استدعاء SageCore
            let intelligence = {};
            try {
                intelligence = await SageCore(
                    product,
                    rawResults,
                    priceHistory,
                    userHistory.userEvents,
                    uid,
                    userHistory.profile,
                    lang
                );
            } catch (e) {
                console.log('SageCore error:', e.message);
            }

            return { ...product, intelligence };
        }));

        // ✅ تحديث الطاقة
        if (dbConnected && !auth.isGuest && !energy.hasFreePass) {
            try {
                energy.searchesUsed += 1;
                await energy.save();
            } catch (e) {}
        }

        const responseData = {
            success: true,
            query: q,
            results: results,
            // ✅ إرجاع بيانات الطاقة
            energy: {
                used: energy.searchesUsed,
                limit: energy.hasFreePass ? '∞' : 3,
                left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed)
            },
            user: {
                isGuest: auth.isGuest,
                uid: auth.isGuest ? 'guest' : uid
            }
        };

        setCache(cacheKey, responseData);
        res.json(responseData);

    } catch (error) {
        console.error('❌ SEARCH ERROR:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'SEARCH_FAILED', 
            message: error.message,
            results: [],
            energy: { used: 0, limit: 3, left: 3 }
        });
    }
});

// ✅ Deep Analysis Endpoint - مع اسم المتجر
app.post('/analyze', async (req, res) => {
    try {
        const { product, marketProducts, userId, lang = 'ar' } = req.body;
        
        if (!product) {
            return res.status(400).json({ success: false, error: 'product_required' });
        }

        if (userId && userId !== 'guest') {
            await trackUserBehavior(userId, 'analysis', { 
                productId: product.id, 
                price: parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0 
            });
        }

        let priceHistory = [];
        if (dbConnected && product.title) {
            try {
                priceHistory = await PriceHistory.find({ 
                    title: { $regex: product.title?.substring(0, 30), $options: 'i' } 
                })
                .sort({ timestamp: -1 })
                .limit(30)
                .lean();
            } catch (e) {}
        }

        const userHistory = await getUserHistory(userId);

        const intelligence = await SageCore(
            product,
            marketProducts || [],
            priceHistory,
            userHistory.userEvents,
            userId || 'guest',
            userHistory.profile,
            lang
        );

        // ✅ إضافة اسم المتجر للنتيجة
        res.json({
            success: true,
            product: {
                ...product,
                store: product.source || product.store || 'Unknown' // ✅ اسم المتجر
            },
            intelligence
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'ANALYSIS_FAILED', message: error.message });
    }
});

// Price Alert Endpoint
app.post('/alerts', async (req, res) => {
    try {
        const { userId, productId, productTitle, productImage, productLink, targetPrice, currentPrice, notifyOn = 'drop' } = req.body;
        
        if (!userId || !productId || !targetPrice) {
            return res.status(400).json({ success: false, error: 'missing_required_fields' });
        }

        if (!dbConnected) {
            return res.json({ success: true, message: 'Alert created (demo mode)' });
        }

        const alert = await PriceAlert.create({
            userId,
            productId,
            productTitle,
            productImage,
            productLink,
            targetPrice,
            currentPrice,
            notifyOn
        });

        res.json({ success: true, message: 'Alert created successfully', alertId: alert._id });
    } catch (error) {
        
