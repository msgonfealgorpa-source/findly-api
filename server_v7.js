/* =========================================
   FINDLY SERVER v7.0 - CONNECTED TO SAGE CORE v5.0
   =========================================
   تم التحديث ليرتبط بالعقل المحدث بالكامل
   =========================================
*/

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const admin = require('firebase-admin');

// ================================
// 🔮 IMPORT SAGE CORE v5.0
// ================================
const SageCore = require('./SageCore_Local_AI_v2.js');
const {
  TechnicalAnalysis,
  PricePredictionEngine,
  PatternRecognition,
  AnomalyDetector,
  PersonalityEngine,
  PriceIntelligence,
  MerchantTrustEngine,
  ScoringEngine,
  SAGE_TRANSLATIONS,
  t,
  cleanPrice
} = require('./SageCore_Local_AI_v2.js');

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
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Server v7.0 Starting...');
console.log('🔮 Sage Core v5.0 Connected');

/* ================= FIREBASE ================= */
let firebaseInitialized = false;
try {
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        firebaseInitialized = true;
        console.log('✅ Firebase Initialized');
    }
} catch (e) {
    console.log('⚠️ Firebase guest mode');
}

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
  hasFreePass: { type: Boolean, default: false },
  wasPro: { type: Boolean, default: false },
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
  wishlistAdditions: { type: Number, default: 0 },
  priceChecks: { type: Number, default: 0 },
  comparisonViews: { type: Number, default: 0 },
  quickPurchases: { type: Number, default: 0 },
  brandSearches: { type: Number, default: 0 },
  dealsViewed: { type: Number, default: 0 },
  alertsSet: { type: Number, default: 0 },
  reviewsRead: { type: Number, default: 0 },
  clickedAnalysis: { type: Boolean, default: false },
  budgetSet: { type: Boolean, default: false },
  usedCoupons: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

const Energy = mongoose.model('Energy', EnergySchema);
const Review = mongoose.model('Review', ReviewSchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);
const UserBehavior = mongoose.model('UserBehavior', UserBehaviorSchema);

/* ================= CACHE ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 ساعة

/* ================= AUTH HELPER ================= */
async function authenticateUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || !firebaseInitialized) {
        return { uid: 'guest', isGuest: true };
    }
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        return { uid: decoded.uid, isGuest: false };
    } catch { 
        return { uid: 'guest', isGuest: true }; 
    }
}

/* ================= USER BEHAVIOR HELPERS ================= */
async function getUserBehavior(uid) {
    if (!dbConnected || uid === 'guest') {
        return {
            wishlistAdditions: 0,
            priceChecks: 0,
            comparisonViews: 0,
            quickPurchases: 0,
            brandSearches: 0,
            dealsViewed: 0
        };
    }
    
    const behavior = await UserBehavior.findOne({ uid });
    return behavior || {
        wishlistAdditions: 0,
        priceChecks: 0,
        comparisonViews: 0,
        quickPurchases: 0,
        brandSearches: 0,
        dealsViewed: 0
    };
}

async function updateUserBehavior(uid, action) {
    if (!dbConnected || uid === 'guest') return;
    
    const updateField = {};
    switch(action) {
        case 'wishlist_add': updateField.$inc = { wishlistAdditions: 1 }; break;
        case 'price_check': updateField.$inc = { priceChecks: 1 }; break;
        case 'comparison_view': updateField.$inc = { comparisonViews: 1 }; break;
        case 'quick_purchase': updateField.$inc = { quickPurchases: 1 }; break;
        case 'brand_search': updateField.$inc = { brandSearches: 1 }; break;
        case 'deal_view': updateField.$inc = { dealsViewed: 1 }; break;
        case 'analysis_click': updateField.$set = { clickedAnalysis: true }; break;
        default: return;
    }
    
    updateField.$set = { ...updateField.$set, lastActive: new Date() };
    
    await UserBehavior.findOneAndUpdate({ uid }, updateField, { upsert: true });
}

/* ================= PRICE HISTORY HELPERS ================= */
async function getPriceHistory(productId) {
    if (!dbConnected) return [];
    
    const history = await PriceHistory.find({ productId })
        .sort({ timestamp: -1 })
        .limit(90) // آخر 90 يوم
        .lean();
    
    return history.reverse(); // ترتيب من الأقدم للأحدث
}

async function savePriceHistory(product) {
    if (!dbConnected) return;
    
    const productId = crypto.createHash('md5').update(product.title + product.source).digest('hex');
    
    // التحقق من عدم وجود نفس السعر اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await PriceHistory.findOne({
        productId,
        timestamp: { $gte: today }
    });
    
    if (!existing) {
        await PriceHistory.create({
            productId,
            title: product.title,
            price: cleanPrice(product.price),
            store: product.source,
            source: product.source,
            thumbnail: product.thumbnail,
            link: product.link
        });
    }
}

/* ================= ENDPOINTS ================= */

// Health Check
app.get('/health', (req, res) => res.json({ 
    status: 'ok', 
    version: '7.0',
    sageCore: 'v5.0',
    database: dbConnected ? 'connected' : 'disconnected'
}));

// Root
app.get('/', (req, res) => res.json({ 
    name: 'Findly API', 
    version: '7.0',
    sageCore: 'v5.0 - Local AI Engine',
    endpoints: [
        'GET /search?q=product',
        'GET /analyze/:productId',
        'GET /predict/:productId',
        'GET /technical/:productId',
        'GET /patterns/:productId',
        'POST /behavior/:action',
        'POST /chat',
        'GET /reviews',
        'POST /reviews'
    ]
}));

// ================= SEARCH ENDPOINT =================
app.get('/search', async (req, res) => {
    const { q, lang = 'ar' } = req.query;
    if (!q || !q.trim()) {
        return res.json({ success: false, results: [], error: 'no_query' });
    }

    const auth = await authenticateUser(req);
    let energy = { searchesUsed: 0, hasFreePass: false };

    if (dbConnected) {
        energy = await Energy.findOne({ uid: auth.uid }) || await Energy.create({ uid: auth.uid });

        // فحص انتهاء الاشتراك
        if (energy.hasFreePass && energy.proExpiresAt) {
            if (new Date() > energy.proExpiresAt) {
                energy.hasFreePass = false;
                await Energy.updateOne({ uid: energy.uid }, { $set: { hasFreePass: false } });
            }
        }

        // فحص الحصة
        if (!energy.hasFreePass && energy.searchesUsed >= 3) {
            if (energy.wasPro) {
                return res.status(429).json({
                    error: 'PRO_EXPIRED',
                    message: 'Subscription expired',
                    energy: { left: 0, limit: 3 }
                });
            }
            return res.status(429).json({
                error: 'ENERGY_EMPTY',
                message: 'Free searches exhausted',
                energy: { left: 0, limit: 3 }
            });
        }
    }

    // Cache
    const cacheKey = q.toLowerCase() + '_' + lang;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        cached.data.energy = { 
            left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), 
            limit: energy.hasFreePass ? '∞' : 3 
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

        // معالجة النتائج مع Sage Core v5.0
        const results = await Promise.all(rawResults.map(async (item) => {
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown',
                price: item.price || '$0',
                link: item.product_link || item.link || '',
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping',
                rating: item.rating,
                reviewsCount: item.reviews || item.reviews_count
            };

            // حفظ في تاريخ الأسعار
            await savePriceHistory(product);

            // جلب تاريخ الأسعار
            const priceHistory = await getPriceHistory(product.id);

            // استخدام Sage Core v5.0
            const intelligence = await SageCore(
                product,
                rawResults,
                priceHistory,
                await getUserBehavior(auth.uid),
                auth.uid,
                {},
                lang
            );

            return { 
                ...product, 
                intelligence 
            };
        }));

        // تحديث عداد البحث
        if (dbConnected && !energy.hasFreePass) {
            await Energy.updateOne({ uid: auth.uid }, { $inc: { searchesUsed: 1 } });
            energy.searchesUsed++;
        }

        // تحديث سلوك المستخدم
        await updateUserBehavior(auth.uid, 'price_check');

        const response = {
            success: true, 
            query: q, 
            results,
            energy: { 
                left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), 
                limit: energy.hasFreePass ? '∞' : 3 
            },
            user: { 
                isGuest: auth.isGuest, 
                uid: auth.isGuest ? 'guest' : auth.uid 
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

// ================= ANALYZE ENDPOINT =================
app.get('/analyze/:productId', async (req, res) => {
    const { productId } = req.params;
    const { lang = 'ar' } = req.query;
    
    const auth = await authenticateUser(req);
    
    // البحث عن المنتج في تاريخ الأسعار
    const priceHistory = await getPriceHistory(productId);
    
    if (priceHistory.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'PRODUCT_NOT_FOUND',
            message: 'No price history found for this product'
        });
    }
    
    // أحدث بيانات للمنتج
    const latest = priceHistory[priceHistory.length - 1];
    const product = {
        id: productId,
        title: latest.title,
        price: latest.price,
        source: latest.source,
        link: latest.link,
        thumbnail: latest.thumbnail
    };
    
    // جلب كل أسعار المنتج
    const allPrices = priceHistory.map(h => h.price);
    
    // تحليل Sage Core
    const intelligence = await SageCore(
        product,
        allPrices.map(p => ({ price: p })),
        priceHistory.map(h => ({ price: h.price, timestamp: h.timestamp })),
        await getUserBehavior(auth.uid),
        auth.uid,
        {},
        lang
    );
    
    // تحديث سلوك المستخدم
    await updateUserBehavior(auth.uid, 'analysis_click');
    
    res.json({
        success: true,
        product,
        intelligence
    });
});

// ================= TECHNICAL ANALYSIS ENDPOINT =================
app.get('/technical/:productId', async (req, res) => {
    const { productId } = req.params;
    const { lang = 'ar' } = req.query;
    
    const priceHistory = await getPriceHistory(productId);
    
    if (priceHistory.length < 14) {
        return res.status(400).json({
            success: false,
            error: 'INSUFFICIENT_DATA',
            message: 'Need at least 14 days of price history',
            currentDays: priceHistory.length
        });
    }
    
    const prices = priceHistory.map(h => cleanPrice(h.price));
    
    // حساب جميع المؤشرات التقنية
    const rsi = TechnicalAnalysis.calculateRSI(prices);
    const macd = TechnicalAnalysis.calculateMACD(prices);
    const bollinger = TechnicalAnalysis.calculateBollingerBands(prices);
    const ema20 = TechnicalAnalysis.calculateEMA(prices, 20);
    const ema50 = TechnicalAnalysis.calculateEMA(prices, 50);
    const sma = TechnicalAnalysis.calculateSMA(prices, 20);
    
    // تحليل الاتجاه
    let trend = 'neutral';
    let trendStrength = 0;
    
    if (ema20 && ema50) {
        const lastEma20 = ema20[ema20.length - 1];
        const lastEma50 = ema50[ema50.length - 1];
        trend = lastEma20 > lastEma50 ? 'bullish' : 'bearish';
        trendStrength = Math.abs((lastEma20 - lastEma50) / lastEma50 * 100);
    }
    
    // تحليل RSI
    let rsiSignal = 'neutral';
    const lastRsi = rsi ? rsi[rsi.length - 1] : 50;
    if (lastRsi < 30) rsiSignal = 'oversold';
    else if (lastRsi > 70) rsiSignal = 'overbought';
    
    res.json({
        success: true,
        productId,
        currentPrice: prices[prices.length - 1],
        technicalIndicators: {
            rsi: {
                value: lastRsi.toFixed(2),
                signal: rsiSignal,
                description: rsiSignal === 'oversold' ? 
                    t(lang, 'oversold') : 
                    rsiSignal === 'overbought' ? 
                    t(lang, 'overbought') : 'محايد'
            },
            macd: macd ? {
                trend: macd.trend,
                crossover: macd.crossover,
                histogram: macd.histogram.slice(-5)
            } : null,
            bollinger: bollinger ? {
                upper: bollinger.upper.toFixed(2),
                middle: bollinger.middle.toFixed(2),
                lower: bollinger.lower.toFixed(2),
                position: bollinger.position,
                squeeze: bollinger.squeeze,
                bandwidth: bollinger.bandwidth.toFixed(2)
            } : null,
            ema: {
                ema20: ema20 ? ema20[ema20.length - 1].toFixed(2) : null,
                ema50: ema50 ? ema50[ema50.length - 1].toFixed(2) : null
            },
            sma: sma ? sma[sma.length - 1].toFixed(2) : null
        },
        trend: {
            direction: trend,
            strength: trendStrength.toFixed(2) + '%',
            description: trend === 'bullish' ? 
                t(lang, 'bullish_trend') : 
                trend === 'bearish' ? 
                t(lang, 'bearish_trend') : 
                t(lang, 'sideways')
        },
        volatility: {
            stdDev: TechnicalAnalysis.calculateStdDev(prices).toFixed(2),
            level: bollinger?.bandwidth > 20 ? 'high' : bollinger?.bandwidth > 10 ? 'medium' : 'low'
        }
    });
});

// ================= PREDICTION ENDPOINT =================
app.get('/predict/:productId', async (req, res) => {
    const { productId } = req.params;
    const { days = 7, lang = 'ar' } = req.query;
    
    const priceHistory = await getPriceHistory(productId);
    
    if (priceHistory.length < 7) {
        return res.status(400).json({
            success: false,
            error: 'INSUFFICIENT_DATA',
            message: 'Need at least 7 days of price history',
            currentDays: priceHistory.length
        });
    }
    
    const prices = priceHistory.map(h => cleanPrice(h.price));
    
    // استخدام محرك التنبؤ
    const prediction = PricePredictionEngine.predictPrice(prices, parseInt(days));
    
    if (!prediction) {
        return res.status(500).json({
            success: false,
            error: 'PREDICTION_FAILED'
        });
    }
    
    // تحليل أفضل وقت للشراء
    const currentPrice = prices[prices.length - 1];
    const bestTimeToBuy = PricePredictionEngine.predictBestTimeToBuy(
        currentPrice, 
        priceHistory, 
        prediction
    );
    
    res.json({
        success: true,
        productId,
        currentPrice,
        prediction: {
            forecast: prediction.currentForecast.toFixed(2),
            predictions: prediction.predictions.map(p => p.toFixed(2)),
            trend: prediction.trend,
            trendStrength: prediction.trendStrength.toFixed(4),
            confidence: prediction.confidence.toFixed(1) + '%'
        },
        recommendation: {
            shouldWait: bestTimeToBuy.shouldWait,
            reason: bestTimeToBuy.reason,
            expectedDrop: bestTimeToBuy.expectedDrop,
            confidence: bestTimeToBuy.confidence
        },
        trendDescription: prediction.trend === 'rising' ? 
            t(lang, 'price_rise_expected') : 
            prediction.trend === 'falling' ? 
            t(lang, 'price_drop_expected') : 
            t(lang, 'market_stable')
    });
});

// ================= PATTERNS ENDPOINT =================
app.get('/patterns/:productId', async (req, res) => {
    const { productId } = req.params;
    const { lang = 'ar' } = req.query;
    
    const priceHistory = await getPriceHistory(productId);
    
    if (priceHistory.length < 10) {
        return res.status(400).json({
            success: false,
            error: 'INSUFFICIENT_DATA',
            message: 'Need at least 10 days of price history',
            currentDays: priceHistory.length
        });
    }
    
    const prices = priceHistory.map(h => cleanPrice(h.price));
    
    // كشف الأنماط
    const patterns = PatternRecognition.detectPricePatterns(prices);
    
    // حساب الدعم والمقاومة
    const supportResistance = PatternRecognition.calculateSupportResistance(prices);
    
    // كشف الشذوذ
    const anomalies = AnomalyDetector.detectPriceAnomalies(prices);
    
    res.json({
        success: true,
        productId,
        currentPrice: prices[prices.length - 1],
        patterns: patterns ? patterns.map(p => ({
            name: p.name,
            description: p.description,
            strength: p.strength
        })) : [],
        supportResistance: supportResistance ? {
            levels: {
                strongSupport: supportResistance.levels.strongSupport.toFixed(2),
                weakSupport: supportResistance.levels.weakSupport.toFixed(2),
                pivot: supportResistance.levels.pivot.toFixed(2),
                weakResistance: supportResistance.levels.weakResistance.toFixed(2),
                strongResistance: supportResistance.levels.strongResistance.toFixed(2)
            },
            currentPosition: supportResistance.currentPosition,
            distanceToSupport: supportResistance.distanceToSupport + '%',
            distanceToResistance: supportResistance.distanceToResistance + '%'
        } : null,
        anomalies: anomalies.length > 0 ? anomalies.map(a => ({
            index: a.index,
            price: a.price.toFixed(2),
            type: a.type,
            severity: a.severity,
            zScore: a.zScore.toFixed(2)
        })) : [],
        anomalyDetected: anomalies.length > 0
    });
});

// ================= ANOMALY DETECTION ENDPOINT =================
app.post('/detect-anomaly', async (req, res) => {
    const { product, marketPrices, lang = 'ar' } = req.body;
    
    if (!product || !marketPrices) {
        return res.status(400).json({
            success: false,
            error: 'MISSING_DATA'
        });
    }
    
    const fakeDealCheck = AnomalyDetector.detectFakeDeal(
        product, 
        marketPrices, 
        null // priceHistory
    );
    
    res.json({
        success: true,
        product: {
            title: product.title,
            price: cleanPrice(product.price)
        },
        analysis: {
            isSuspicious: fakeDealCheck.isSuspicious,
            riskScore: fakeDealCheck.riskScore,
            riskLevel: fakeDealCheck.riskLevel,
            warnings: fakeDealCheck.warnings,
            recommendation: fakeDealCheck.riskScore >= 60 ? 
                'تجنب هذا العرض' : 
                fakeDealCheck.riskScore >= 30 ? 
                'تحقق جيداً قبل الشراء' : 
                'عرض آمن'
        }
    });
});

// ================= USER BEHAVIOR ENDPOINT =================
app.post('/behavior/:action', async (req, res) => {
    const { action } = req.params;
    const auth = await authenticateUser(req);
    
    await updateUserBehavior(auth.uid, action);
    
    const behavior = await getUserBehavior(auth.uid);
    
    res.json({
        success: true,
        action,
        behavior
    });
});

app.get('/behavior', async (req, res) => {
    const auth = await authenticateUser(req);
    const behavior = await getUserBehavior(auth.uid);
    
    // تحليل الشخصية
    const personality = PersonalityEngine.analyze(behavior, 0, 0, {});
    
    res.json({
        success: true,
        uid: auth.uid,
        behavior,
        personality: {
            type: personality.type,
            confidence: personality.confidence,
            traits: personality.traits
        }
    });
});

// ================= CHAT ENDPOINT =================
const chatResponses = {
    ar: {
        greeting: ['مرحباً! 👋 أنا Sage، مساعدك الذكي للتسوق. كيف أقدر أساعدك؟', 'أهلاً! 🔮 اسألني عن أي منتج وسأساعدك في اتخاذ القرار المناسب!'],
        search: ['سأبحث لك عن أفضل الأسعار. ما هو المنتج الذي تريده؟', 'أنا جاهز للبحث! أخبرني اسم المنتج.'],
        price: ['دعني أحلل السعر لك. أبحث عن المنتج أولاً.', 'سأتحقق من تاريخ السعر وأعطيك توقعات.'],
        technical: ['يمكنني تحليل RSI و MACD ومؤشرات تقنية أخرى. ما المنتج؟', 'التحليل الفني متاح! ابحث عن المنتج وسأظهر لك المؤشرات.'],
        general: ['كيف أساعدك اليوم؟', 'أنا هنا لمساعدتك في التسوق الذكي 🛍️', 'اسألني عن أي منتج!']
    },
    en: {
        greeting: ['Hello! 👋 I\'m Sage, your smart shopping assistant.', 'Hi! 🔮 Ask me about any product!'],
        search: ['I\'ll search for the best prices. What product?', 'Ready to search! Tell me the product name.'],
        price: ['Let me analyze the price for you.', 'I\'ll check price history and predictions.'],
        technical: ['I can analyze RSI, MACD and other indicators.', 'Technical analysis available! Search for a product.'],
        general: ['How can I help you today?', 'I\'m here for smart shopping 🛍️']
    }
};

app.post('/chat', async (req, res) => {
    const { message, lang = 'ar' } = req.body;
    const lower = (message || '').toLowerCase();
    
    let intent = 'general';
    
    if (lower.match(/مرحبا|اهلا|hello|hi|hey/)) {
        intent = 'greeting';
    } else if (lower.match(/ابحث|بحث|search|find|دور/)) {
        intent = 'search';
    } else if (lower.match(/سعر|price|كم|تحليل/)) {
        intent = 'price';
    } else if (lower.match(/مؤشر|تقني|technical|rsi|macd/)) {
        intent = 'technical';
    }
    
    const arr = chatResponses[lang]?.[intent] || chatResponses.ar[intent] || chatResponses.ar.general;
    const reply = arr[Math.floor(Math.random() * arr.length)];
    
    res.json({ success: true, reply, response: reply, intent });
});

// ================= REVIEWS ENDPOINTS =================
app.get('/reviews', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.json({ success: true, reviews: [], todayCount: 0 });
        }
        
        const reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Review.countDocuments({ createdAt: { $gte: today } });

        res.json({ 
            success: true, 
            reviews, 
            todayCount, 
            total: await Review.countDocuments() 
        });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FETCH_FAILED', message: e.message });
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
            return res.json({ 
                success: true, 
                message: 'Review received (demo)', 
                review: { name, text, rating: ratingNum } 
            });
        }

        const review = await Review.create({ 
            name: name.trim(), 
            text: text.trim(), 
            rating: ratingNum 
        });
        
        res.status(201).json({ success: true, message: 'Review submitted', review });
    } catch (e) {
        res.status(500).json({ success: false, error: 'CREATE_FAILED', message: e.message });
    }
});

app.post('/reviews/:id/helpful', async (req, res) => {
    try {
        if (!dbConnected) return res.json({ success: true });
        
        const review = await Review.findByIdAndUpdate(
            req.params.id, 
            { $inc: { helpful: 1 } }, 
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND' });
        }
        
        res.json({ success: true, helpful: review.helpful });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FAILED' });
    }
});

// ================= PAYMENT ENDPOINTS =================
app.post('/create-payment', async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'UID_REQUIRED' });
    if (!NOWPAYMENTS_API_KEY) {
        return res.status(503).json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' });
    }

    try {
        const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
            price_amount: 10,
            price_currency: 'usd',
            pay_currency: 'usdttrc20',
            order_id: uid,
            order_description: 'Findly Pro - 30 Days',
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
            const now = new Date();
            const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 يوم

            await Energy.findOneAndUpdate(
                { uid: data.order_id },
                {
                    hasFreePass: true,
                    wasPro: true,
                    searchesUsed: 0,
                    proExpiresAt: expires
                },
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

// ================= START SERVER =================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Findly Server v7.0 running on port ${PORT}`);
    console.log(`🔮 Sage Core v5.0 - Local AI Engine Connected`);
    console.log(`📊 Technical Analysis: RSI, MACD, Bollinger Bands, EMA`);
    console.log(`🔮 Price Prediction: EWMA + Trend Analysis`);
    console.log(`🔍 Pattern Recognition: Support/Resistance, Anomalies`);
});
