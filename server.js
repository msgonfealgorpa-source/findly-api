/* =========================================
FINDLY SERVER - COMPLETE WITH GEMINI AI
Fixed for Railway Deployment
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import modules
let SageCore = null;
let processChatMessage = null;
let supportedLanguages = { ar: {}, en: {}, fr: {}, de: {}, es: {}, tr: {} };

try {
    SageCore = require('./sage-core');
    console.log('✅ SageCore loaded');
} catch (e) {
    console.log('⚠️ SageCore not found, using fallback');
}

try {
    const chatEngine = require('./chat.engine');
    processChatMessage = chatEngine.processChatMessage;
    supportedLanguages = chatEngine.supportedLanguages || supportedLanguages;
    console.log('✅ Chat Engine loaded');
} catch (e) {
    console.log('⚠️ Chat Engine not found, using fallback');
    // Fallback chat function
    processChatMessage = async (message, userId) => {
        return {
            reply: '🤖 مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك؟',
            response: '🤖 مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك؟',
            intent: 'greeting',
            sentiment: 'neutral',
            language: 'ar'
        };
    };
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
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log('🚀 Findly Server Starting...');
console.log('🔑 GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ Set' : '❌ Not Set');
console.log('🔑 SEARCHAPI_KEY:', SEARCHAPI_KEY ? '✅ Set' : '❌ Not Set');
console.log('🔑 MONGO_URI:', MONGO_URI ? '✅ Set' : '❌ Not Set');

/* ================= CACHE SYSTEM ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 2; // 2 days

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

/* ================= MODELS ================= */
const Energy = mongoose.model(
    'Energy',
    new mongoose.Schema({
        uid: { type: String, unique: true, required: true },
        searchesUsed: { type: Number, default: 0 },
        hasFreePass: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    })
);

/* ================= HELPER FUNCTIONS ================= */
const cleanPrice = (price) => {
    if (!price) return 0;
    const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
};

const finalizeUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
};

const normalizeQuery = (q) => {
    return q.trim().toLowerCase().replace(/\s+/g, ' ');
};

const pendingSearches = new Map();

/* ================= HEALTH CHECK ================= */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        gemini: GEMINI_API_KEY ? 'configured' : 'not_configured',
        database: dbConnected ? 'connected' : 'disconnected',
        chatLanguages: Object.keys(supportedLanguages).length
    });
});

/* ================= ROOT ENDPOINT ================= */
app.get('/', (req, res) => {
    res.json({
        name: 'Findly Sage API',
        version: '5.0.0',
        status: 'running',
        ai: GEMINI_API_KEY ? '✅ Gemini Active' : '❌ Gemini Not Configured',
        database: dbConnected ? '✅ Connected' : '⚠️ Not Connected',
        endpoints: {
            chat: 'POST /chat - AI Shopping Assistant',
            search: 'GET /search?q=product - Product Search',
            health: 'GET /health - Server Status',
            languages: 'GET /chat/languages - Supported Languages'
        }
    });
});

/* ================= CHAT ENDPOINT ================= */
app.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;
        
        console.log('📩 Chat Request:', { 
            message: message?.substring(0, 50) + '...', 
            userId: userId || 'guest' 
        });
        
        // Validate input
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.json({
                reply: '👋 مرحباً! كيف يمكنني مساعدتك؟',
                response: '👋 مرحباً! كيف يمكنني مساعدتك؟',
                error: 'empty_message'
            });
        }
        
        // Process message
        const result = await processChatMessage(message.trim(), userId || 'guest');
        
        console.log(`💬 Response: Intent=${result.intent}, Lang=${result.language}`);
        
        res.json({
            reply: result.reply || result.response,
            response: result.reply || result.response,
            intent: result.intent,
            sentiment: result.sentiment,
            language: result.language
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

/* ================= CHAT LANGUAGES ================= */
app.get('/chat/languages', (req, res) => {
    res.json({
        supported: supportedLanguages,
        total: Object.keys(supportedLanguages).length
    });
});

/* ================= SEARCH ENDPOINT ================= */
app.get('/search', async (req, res) => {
    const { q, lang = 'ar', uid = 'guest' } = req.query;
    
    if (!q) {
        return res.json({ results: [], error: 'no_query' });
    }

    // Check energy/limits
    let energy = { searchesUsed: 0, hasFreePass: true };
    
    if (MONGO_URI && uid !== 'guest') {
        try {
            energy = await Energy.findOne({ uid });
            if (!energy) {
                energy = await Energy.create({ uid });
            }
            if (!energy.hasFreePass && energy.searchesUsed >= 3) {
                return res.status(429).json({ 
                    error: 'ENERGY_EMPTY',
                    message: 'Free searches exhausted. Please upgrade.'
                });
            }
        } catch (e) {
            console.log('Energy check error:', e.message);
        }
    }

    // Check cache
    const cacheKey = normalizeQuery(q) + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) {
        cached.energy.left = energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed);
        return res.json(cached);
    }

    try {
        // Check for duplicate requests
        if (pendingSearches.has(cacheKey)) {
            const data = await pendingSearches.get(cacheKey);
            return res.json(data);
        }

        // Create search promise
        const searchPromise = (async () => {
            if (!SEARCHAPI_KEY) {
                throw new Error('SEARCHAPI_KEY not configured');
            }
            
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

        // Process results
        const rawResults = apiRes.data?.shopping_results?.slice(0, 5) || [];
        
        // Filter results
        const filteredResults = rawResults.filter(item =>
            item.title?.toLowerCase().includes(q.toLowerCase())
        );
        const baseResults = filteredResults.length ? filteredResults : rawResults;

        // Build response
        const results = baseResults.map((item, index) => {
            const price = cleanPrice(item.price || item.extracted_price);
            const product = {
                title: item.title || 'Unknown Product',
                price: item.price || '$0',
                numericPrice: price,
                link: finalizeUrl(item.product_link || item.link),
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping'
            };

            // Add intelligence analysis
            let intelligence = {};
            if (index === 0 && SageCore) {
                try {
                    intelligence = SageCore(product, rawResults, [], {}, uid, null, lang);
                } catch (e) {
                    console.log('SageCore error:', e.message);
                }
            }

            return { ...product, intelligence };
        });

        // Update energy usage
        if (MONGO_URI && !energy.hasFreePass && uid !== 'guest') {
            try {
                energy.searchesUsed += 1;
                await energy.save();
            } catch (e) {
                console.log('Energy update error:', e.message);
            }
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

/* ================= CREATE PAYMENT ================= */
app.post('/create-payment', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'UID_REQUIRED' });
        }

        if (!NOWPAYMENTS_API_KEY) {
            return res.status(503).json({ 
                error: 'PAYMENT_NOT_CONFIGURED',
                message: 'Payment service not available'
            });
        }

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
            {
                headers: {
                    'x-api-key': NOWPAYMENTS_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return res.json({ url: response.data.invoice_url });

    } catch (error) {
        console.error('❌ Payment Error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'PAYMENT_FAILED',
            message: error.message 
        });
    }
});

/* ================= WEBHOOK ================= */
app.post('/nowpayments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-nowpayments-sig'];
        const payload = req.body.toString();

        if (NOWPAYMENTS_IPN_SECRET) {
            const expectedSignature = crypto
                .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                .update(payload)
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(403).json({ error: 'INVALID_SIGNATURE' });
            }
        }

        const data = JSON.parse(payload);
        
        if (data.payment_status === 'finished' && MONGO_URI) {
            const uid = data.order_id;
            let energy = await Energy.findOne({ uid });
            if (!energy) {
                energy = await Energy.create({ uid });
            }
            energy.hasFreePass = true;
            energy.searchesUsed = 0;
            await energy.save();
            console.log('✅ Payment confirmed for:', uid);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ error: 'WEBHOOK_ERROR' });
    }
});

/* ================= REDIRECT ================= */
app.get('/go', (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send("No URL provided");
    }
    try {
        const decodedUrl = decodeURIComponent(url);
        if (!/^https?:\/\//i.test(decodedUrl)) {
            return res.status(400).send("Invalid URL");
        }
        return res.redirect(decodedUrl);
    } catch (error) {
        return res.status(500).send("Redirect error");
    }
});

/* ================= PRICE ALERTS ================= */
app.post('/alerts', async (req, res) => {
    try {
        const { email, productName, targetPrice, currentPrice, productLink, lang, uid } = req.body;
        
        // In a real app, save to database
        console.log('🔔 Price Alert Created:', { email, productName, targetPrice });
        
        res.json({ 
            success: true, 
            message: 'Alert created successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: 'ALERT_FAILED' });
    }
});

/* ================= ERROR HANDLING ================= */
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`🚀 Findly Server running on port ${PORT}`);
    console.log(`💬 AI Chat: ${GEMINI_API_KEY ? '✅ Gemini Active' : '❌ Gemini Not Configured'}`);
    console.log(`🔍 Search: ${SEARCHAPI_KEY ? '✅ SearchAPI Active' : '❌ SearchAPI Not Configured'}`);
    console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
    console.log('=================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
