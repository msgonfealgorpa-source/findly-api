/* =========================================
FINDLY SERVER v6.1 - COMPLETE WITH SAGE CORE v4.1
Ultimate Shopping Intelligence Platform
+ Fixed Chat Engine (No Gemini Required)
+ Enhanced Sage Core Data Flow
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
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

console.log('🚀 Findly Sage Server v6.1 Starting...');
console.log('🔑 GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ Set' : '❌ Not Set (Using Smart Fallback)');
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

// Import Sage Core and Chat Engine
const SageCore = require('./sage-core.js');
const { processChatMessage } = require('./chat-engine.js');

/* ================= TRACKING FUNCTIONS ================= */

async function trackUserBehavior(userId, eventType, data) {
    if (!dbConnected || !userId || userId === 'guest') return;
    
    try {
        await Models.UserBehavior.create({
            userId,
            eventType,
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
    } catch (e) {
        console.log('Tracking error:', e.message);
    }
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
    } catch (e) {
        console.log('Price history error:', e.message);
    }
}

async function getUserHistory(userId) {
    if (!dbConnected || !userId || userId === 'guest') return {};
    
    try {
        const behaviors = await Models.UserBehavior.find({ userId })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        const profile = await Models.UserProfile.findOne({ userId }).lean();

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
        version: '6.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        gemini: GEMINI_API_KEY ? 'configured' : 'not_configured (smart fallback active)',
        database: dbConnected ? 'connected' : 'disconnected',
        features: ['smart_chat', 'price_intelligence', 'personality_engine', 'merchant_trust', 'fake_deal_detection', 'price_alerts']
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Findly Sage API',
        version: '6.1.0',
        status: 'running',
        ai: GEMINI_API_KEY ? '✅ Gemini Active' : '✅ Smart Fallback Active',
        database: dbConnected ? '✅ Connected' : '⚠️ Not Connected',
        endpoints: {
            chat: 'POST /chat - AI Shopping Assistant (No API Key Required)',
            search: 'GET /search?q=product - Smart Product Search',
            analyze: 'POST /analyze - Deep Product Analysis',
            alerts: 'POST /alerts - Price Alerts',
            health: 'GET /health - Server Status'
        }
    });
});

// Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, userId, lang = 'ar', history = [] } = req.body;
        
        console.log('📩 Chat:', { message: message?.substring(0, 50), userId, lang });
        
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.json({
                reply: lang === 'ar' ? '👋 مرحباً! كيف يمكنني مساعدتك؟' : '👋 Hello! How can I help you?',
                response: lang === 'ar' ? '👋 مرحباً! كيف يمكنني مساعدتك؟' : '👋 Hello! How can I help you?',
                intent: 'empty',
                sentiment: 'neutral',
                language: lang
            });
        }
        
        await trackUserBehavior(userId, 'chat', { query: message });
        
        const result = await processChatMessage(message.trim(), userId, lang, history);
        
        res.json({
            reply: result.response,
            response: result.response,
            intent: result.intent,
            sentiment: result.sentiment,
            language: result.language,
            suggestions: result.suggestions,
            productMention: result.productMention
        });
        
    } catch (error) {
        console.error('❌ Chat Error:', error.message);
        res.status(500).json({
            reply: '🤔 عذراً، حدث خطأ. حاول مرة أخرى!',
            response: '🤔 عذراً، حدث خطأ. حاول مرة أخرى!',
            error: 'internal_error'
        });
    }
});

// Smart Search Endpoint 
app.get('/search', async (req, res) => {
    const authHeader = req.headers.authorization;

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
    
    if (!q) {
        return res.json({ results: [], error: 'no_query' });
    }

    let energy = { searchesUsed: 0, hasFreePass: true };
    
    if (dbConnected) {
        try {
            energy = await Models.Energy.findOne({ uid }) || await Models.Energy.create({ uid });
            if (!energy.hasFreePass && energy.searchesUsed >= 3) {
                return res.status(429).json({ 
                    error: 'ENERGY_EMPTY',
                    message: 'Free searches exhausted. Please upgrade.'
                });
            }
        } catch (e) {}
    }

    const cacheKey = normalizeQuery(q) + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) {
        cached.energy.left = energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed);
        return res.json(cached);
    }

    try {
        if (pendingSearches.has(cacheKey)) {
            const data = await pendingSearches.get(cacheKey);
            return res.json(data);
        }

        const searchPromise = (async () => {
            if (!SEARCHAPI_KEY) throw new Error('SEARCHAPI_KEY not configured');
            
            return await axios.get('https://www.searchapi.io/api/v1/search', {
                params: {
                    api_key: SEARCHAPI_KEY,
                    engine: 'google_shopping',
                    q: q,
                    hl: lang === 'ar' ? 'ar' : 'en',
                },
                timeout: 15000
            });
        })();

        pendingSearches.set(cacheKey, searchPromise);

        let apiRes;
        try {
            apiRes = await searchPromise;
        } finally {
            pendingSearches.delete(cacheKey);
        }

        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];
        const baseResults = rawResults.filter(item => item.title?.toLowerCase().includes(q.toLowerCase())).length ? 
            rawResults.filter(item => item.title?.toLowerCase().includes(q.toLowerCase())) : rawResults;

        await trackUserBehavior(uid, 'search', { query: q });

        const userHistory = await getUserHistory(uid);

        const results = await Promise.all(baseResults.map(async (item) => {
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
                        .sort({ timestamp: -1 })
                        .limit(30)
                        .lean();
                } catch (e) {}
            }

            let intelligence = {};
            try {
                intelligence = await SageCore(
                    product,
                    baseResults,
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

        if (dbConnected && !energy.hasFreePass && uid !== 'guest') {
            try {
                energy.searchesUsed += 1;
                await energy.save();
            } catch (e) {}
        }

        let personality = null;
        if (results.length > 0 && results[0].intelligence?.personalityIntel) {
            personality = results[0].intelligence.personalityIntel;
        }

        const responseData = {
            query: q,
            results: results,
            personality: personality,
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
        
        if (!product) {
            return res.status(400).json({ error: 'product_required' });
        }

        await trackUserBehavior(userId, 'analysis', { productId: product.id, price: cleanPrice(product.price) });

        let priceHistory = [];
        if (dbConnected && product.title) {
            try {
                priceHistory = await Models.PriceHistory.find({ 
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
            userId,
            userHistory.profile,
            lang
        );

        res.json({ product, intelligence });

    } catch (error) {
        console.error('❌ Analysis Error:', error.message);
        res.status(500).json({ error: 'ANALYSIS_FAILED', message: error.message });
    }
});

// Price Alert Endpoint
app.post('/alerts', async (req, res) => {
    try {
        const { userId, productId, productTitle, productImage, productLink, targetPrice, currentPrice, notifyOn = 'drop' } = req.body;
        
        if (!userId || !productId || !targetPrice) {
            return res.status(400).json({ error: 'missing_required_fields' });
        }

        if (!dbConnected) {
            return res.json({ success: true, message: 'Alert created (demo mode)' });
        }

        const alert = await Models.PriceAlert.create({
            userId, productId, productTitle, productImage, productLink,
            targetPrice, currentPrice, notifyOn
        });

        console.log('🔔 Price Alert Created:', { userId, productId, targetPrice });
        
        res.json({ success: true, message: 'Alert created successfully', alertId: alert._id });
    } catch (error) {
        console.error('Alert error:', error.message);
        res.status(500).json({ error: 'ALERT_FAILED' });
    }
});

// Get User Alerts
app.get('/alerts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!dbConnected) {
            return res.json({ alerts: [] });
        }

        const alerts = await Models.PriceAlert.find({ userId, active: true })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ error: 'FETCH_FAILED' });
    }
});

// Price History Endpoint
app.get('/history/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { days = 30 } = req.query;

        if (!dbConnected) {
            return res.json({ history: [], message: 'Database not connected' });
        }

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const history = await Models.PriceHistory.find({
            $or: [
                { productId },
                { title: { $regex: productId, $options: 'i' } }
            ],
            timestamp: { $gte: since }
        })
        .sort({ timestamp: 1 })
        .lean();

        res.json({ 
            productId, history,
            stats: {
                count: history.length,
                lowest: history.length ? Math.min(...history.map(h => h.price)) : null,
                highest: history.length ? Math.max(...history.map(h => h.price)) : null,
                average: history.length ? Math.round(history.reduce((a, b) => a + b.price, 0) / history.length) : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'HISTORY_FAILED' });
    }
});

// Reviews Endpoints
app.get('/reviews', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.json({ success: true, reviews: [], todayCount: 0 });
        }

        const reviews = await Models.Review.find().sort({ createdAt: -1 }).limit(100).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Models.Review.countDocuments({ createdAt: { $gte: today } });

        res.json({ success: true, reviews, todayCount, total: await Models.Review.countDocuments() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'FETCH_REVIEWS_FAILED', message: error.message });
    }
});

app.post('/reviews', async (req, res) => {
    try {
        const { name, text, rating } = req.body;

        if (!name || !text || !rating) {
            return res.status(400).json({ success: false, error: 'MISSING_FIELDS' });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, error: 'INVALID_RATING' });
        }

        if (!dbConnected) {
            return res.json({ success: true, message: 'Review received (demo mode)' });
        }

        const review = await Models.Review.create({ name: name.trim(), text: text.trim(), rating: ratingNum });
        console.log('⭐ New Review:', { name: name.trim(), rating: ratingNum });

        res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(500).json({ success: false, error: 'CREATE_REVIEW_FAILED', message: error.message });
    }
});

app.post('/reviews/:id/helpful', async (req, res) => {
    try {
        const { id } = req.params;

        if (!dbConnected) {
            return res.json({ success: true, message: 'Marked as helpful (demo mode)' });
        }

        const review = await Models.Review.findByIdAndUpdate(id, { $inc: { helpful: 1 } }, { new: true });

        if (!review) {
            return res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND' });
        }

        res.json({ success: true, helpful: review.helpful });
    } catch (error) {
        res.status(500).json({ success: false, error: 'HELPFUL_FAILED', message: error.message });
    }
});

// Payment Endpoint
app.post('/create-payment', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'UID_REQUIRED' });
        if (!NOWPAYMENTS_API_KEY) return res.status(503).json({ error: 'PAYMENT_NOT_CONFIGURED' });

        const response = await axios.post(
            'https://api.nowpayments.io/v1/invoice',
            {
                price_amount: 10,
                price_currency: 'usd',
                pay_currency: 'usdttrc20',
                order_id: uid,
                order_description: 'Findly Pro Subscription',
                success_url: 'https://findly.source.github.io/?upgrade=success',
                cancel_url: 'https://findly.source.github.io/?upgrade=cancel'
            },
            { headers: { 'x-api-key': NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        return res.json({ url: response.data.invoice_url });
    } catch (error) {
        console.error('❌ Payment Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'PAYMENT_FAILED', message: error.message });
    }
});

// Webhook
app.post('/nowpayments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-nowpayments-sig'];
        const payload = req.body.toString();

        if (NOWPAYMENTS_IPN_SECRET) {
            const expectedSignature = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET).update(payload).digest('hex');
            if (signature !== expectedSignature) return res.status(403).json({ error: 'INVALID_SIGNATURE' });
        }

        const data = JSON.parse(payload);
        
        if (data.payment_status === 'finished' && dbConnected) {
            const uid = data.order_id;
            await Models.Energy.findOneAndUpdate({ uid }, { hasFreePass: true, searchesUsed: 0 }, { upsert: true });
            console.log('✅ Payment confirmed for:', uid);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ error: 'WEBHOOK_ERROR' });
    }
});

// Redirect
app.get('/go', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL provided");
    try {
        const decodedUrl = decodeURIComponent(url);
        if (!/^https?:\/\//i.test(decodedUrl)) return res.status(400).send("Invalid URL");
        return res.redirect(decodedUrl);
    } catch (error) {
        return res.status(500).send("Redirect error");
    }
});

// Error Handling
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

// Scheduled Jobs
setInterval(async () => {
    if (!dbConnected) return;
    try {
        const activeAlerts = await Models.PriceAlert.find({ active: true, notified: false }).limit(100);
        for (const alert of activeAlerts) {
            alert.lastChecked = new Date();
            await alert.save();
        }
        console.log(`🔔 Checked ${activeAlerts.length} price alerts`);
    } catch (e) {
        console.log('Alert check error:', e.message);
    }
}, 60 * 60 * 1000);

// ================= START SERVER =================
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`🚀 Findly Sage Server v6.1 running on port ${PORT}`);
    console.log(`🔮 Sage Core: ✅ Active`);
    console.log(`💬 Smart Chat: ✅ Active (No API Required)`);
    console.log(`🔍 Search: ${SEARCHAPI_KEY ? '✅ SearchAPI Active' : '❌ Not Configured'}`);
    console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
    console.log('=================================');
});

process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received'); process.exit(0); });
