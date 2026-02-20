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

// ================================
// 🔮 IMPORT SAGE CORE v5.0
// ================================
// ================================
// 🔮 IMPORT SAGE CORE v5.0
// ================================
const SageCoreModule = require('./SageCore_Local_AI_v2.js');

const {
    SageCore,
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
} = SageCoreModule;
    // Fallback functions
    cleanPrice = function(price) {
        if (typeof price === 'number') return price;
        if (!price) return 0;
        const cleaned = String(price).replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
    };
    
    t = function(lang, key) { return key; };
    
    SageCore = async function(product, marketPrices, priceHistory, userBehavior, userId, preferences, lang) {
        const price = cleanPrice(product?.price);
        return {
            finalVerdict: {
                decision: 'BUY',
                reason: 'تحليل أساسي',
                overallScore: 50,
                confidence: 50,
                bestLink: product?.link
            },
            priceIntel: {
                price: price,
                average: price,
                score: 50
            },
            technicalIntel: {},
            predictionIntel: {},
            patternIntel: {},
            trustIntel: {
                merchantTrust: { trustScore: 50 },
                overallRisk: 0,
                warnings: []
            }
        };
    };
}

// Firebase Admin - Optional
let admin = null;
let firebaseInitialized = false;

try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        firebaseInitialized = true;
        console.log('✅ Firebase Initialized');
    }
} catch (e) {
    console.log('⚠️ Firebase not available, running in guest mode');
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
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Server v7.0 Starting...');
console.log('🔮 Sage Core v5.0 Connected');

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
    if (!firebaseInitialized || !admin) {
        return { uid: 'guest', isGuest: true };
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    
    try {
        const behavior = await UserBehavior.findOne({ uid });
        return behavior || {
            wishlistAdditions: 0,
            priceChecks: 0,
            comparisonViews: 0,
            quickPurchases: 0,
            brandSearches: 0,
            dealsViewed: 0
        };
    } catch (e) {
        console.error('getUserBehavior error:', e.message);
        return {
            wishlistAdditions: 0,
            priceChecks: 0,
            comparisonViews: 0,
            quickPurchases: 0,
            brandSearches: 0,
            dealsViewed: 0
        };
    }
}

async function updateUserBehavior(uid, action) {
    if (!dbConnected || uid === 'guest') return;
    
    try {
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
    } catch (e) {
        console.error('updateUserBehavior error:', e.message);
    }
}

/* ================= PRICE HISTORY HELPERS ================= */
async function getPriceHistory(productId) {
    if (!dbConnected) return [];
    
    try {
        const history = await PriceHistory.find({ productId })
            .sort({ timestamp: -1 })
            .limit(90)
            .lean();
        
        return history.reverse();
    } catch (e) {
        console.error('getPriceHistory error:', e.message);
        return [];
    }
}

async function savePriceHistory(product) {
    if (!dbConnected) return;
    
    try {
        const productId = crypto.createHash('md5').update(product.title + product.source).digest('hex');
        
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
    } catch (e) {
        console.error('savePriceHistory error:', e.message);
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

    try {
        if (dbConnected) {
            energy = await Energy.findOne({ uid: auth.uid }) || await Energy.create({ uid: auth.uid });

            if (energy.hasFreePass && energy.proExpiresAt) {
                if (new Date() > energy.proExpiresAt) {
                    energy.hasFreePass = false;
                    await Energy.updateOne({ uid: energy.uid }, { $set: { hasFreePass: false } });
                }
            }

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
    } catch (e) {
        console.error('Energy check error:', e.message);
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
            let intelligence = {};
            try {
                intelligence = await SageCore(
                    product,
                    rawResults,
                    priceHistory,
                    await getUserBehavior(auth.uid),
                    auth.uid,
                    {},
                    lang
                );
            } catch (e) {
                console.error('SageCore error:', e.message);
                intelligence = {
                    finalVerdict: {
                        decision: 'BUY',
                        reason: 'تحليل أساسي',
                        overallScore: 50,
                        confidence: 50,
                        bestLink: product.link
                    },
                    priceIntel: { price: cleanPrice(product.price), score: 50 }
                };
            }

            return { 
                ...product, 
                intelligence 
            };
        }));

        // تحديث عداد البحث
        try {
            if (dbConnected && !energy.hasFreePass) {
                await Energy.updateOne({ uid: auth.uid }, { $inc: { searchesUsed: 1 } });
                energy.searchesUsed++;
            }
        } catch (e) {
            console.error('Energy update error:', e.message);
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
    
    try {
        const priceHistory = await getPriceHistory(productId);
        
        if (priceHistory.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'PRODUCT_NOT_FOUND',
                message: 'No price history found for this product'
            });
        }
        
        const latest = priceHistory[priceHistory.length - 1];
        const product = {
            id: productId,
            title: latest.title,
            price: latest.price,
            source: latest.source,
            link: latest.link,
            thumbnail: latest.thumbnail
        };
        
        const allPrices = priceHistory.map(h => h.price);
        
        let intelligence = {};
        try {
            intelligence = await SageCore(
                product,
                allPrices.map(p => ({ price: p })),
                priceHistory.map(h => ({ price: h.price, timestamp: h.timestamp })),
                await getUserBehavior(auth.uid),
                auth.uid,
                {},
                lang
            );
        } catch (e) {
            console.error('SageCore error:', e.message);
            intelligence = {
                finalVerdict: { decision: 'BUY', reason: 'تحليل أساسي', overallScore: 50 }
            };
        }
        
        await updateUserBehavior(auth.uid, 'analysis_click');
        
        res.json({
            success: true,
            product,
            intelligence
        });
    } catch (e) {
        console.error('Analyze error:', e.message);
        res.status(500).json({
            success: false,
            error: 'ANALYZE_FAILED',
            message: e.message
        });
    }
});

// ================= TECHNICAL ANALYSIS ENDPOINT =================
app.get('/technical/:productId', async (req, res) => {
    const { productId } = req.params;
    const { lang = 'ar' } = req.query;
    
    try {
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
        let rsi = null, macd = null, bollinger = null, ema20 = null, ema50 = null, sma = null;
        
        try {
            if (TechnicalAnalysis.calculateRSI) {
                rsi = TechnicalAnalysis.calculateRSI(prices);
            }
            if (TechnicalAnalysis.calculateMACD) {
                macd = TechnicalAnalysis.calculateMACD(prices);
            }
            if (TechnicalAnalysis.calculateBollingerBands) {
                bollinger = TechnicalAnalysis.calculateBollingerBands(prices);
            }
            if (TechnicalAnalysis.calculateEMA) {
                ema20 = TechnicalAnalysis.calculateEMA(prices, 20);
                ema50 = TechnicalAnalysis.calculateEMA(prices, 50);
            }
            if (TechnicalAnalysis.calculateSMA) {
                sma = TechnicalAnalysis.calculateSMA(prices, 20);
            }
        } catch (e) {
            console.error('Technical analysis error:', e.message);
        }
        
        // تحليل الاتجاه
        let trend = 'neutral';
        let trendStrength = 0;
        
        if (ema20 && ema50 && ema20.length > 0 && ema50.length > 0) {
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
                    histogram: macd.histogram ? macd.histogram.slice(-5) : []
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
                stdDev: TechnicalAnalysis.calculateStdDev ? 
                    TechnicalAnalysis.calculateStdDev(prices).toFixed(2) : '0',
                level: bollinger?.bandwidth > 20 ? 'high' : bollinger?.bandwidth > 10 ? 'medium' : 'low'
            }
        });
    } catch (e) {
        console.error('Technical analysis endpoint error:', e.message);
        res.status(500).json({
            success: false,
            error: 'TECHNICAL_ANALYSIS_FAILED',
            message: e.message
        });
    }
});

// ================= PREDICTION ENDPOINT =================
app.get('/predict/:productId', async (req, res) => {
    const { productId } = req.params;
    const { days = 7, lang = 'ar' } = req.query;
    
    try {
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
        
        let prediction = null;
        let bestTimeToBuy = { shouldWait: false, reason: '', expectedDrop: 0, confidence: 0 };
        
        try {
            if (PricePredictionEngine.predictPrice) {
                prediction = PricePredictionEngine.predictPrice(prices, parseInt(days));
                
                if (prediction && PricePredictionEngine.predictBestTimeToBuy) {
                    const currentPrice = prices[prices.length - 1];
                    bestTimeToBuy = PricePredictionEngine.predictBestTimeToBuy(
                        currentPrice, 
                        priceHistory, 
                        prediction
                    );
                }
            }
        } catch (e) {
            console.error('Prediction error:', e.message);
        }
        
        if (!prediction) {
            return res.status(500).json({
                success: false,
                error: 'PREDICTION_FAILED'
            });
        }
        
        const currentPrice = prices[prices.length - 1];
        
        res.json({
            success: true,
            productId,
            currentPrice,
            prediction: {
                forecast: prediction.currentForecast.toFixed(2),
                predictions: prediction.predictions ? prediction.predictions.map(p => p.toFixed(2)) : [],
                trend: prediction.trend,
                trendStrength: prediction.trendStrength ? prediction.trendStrength.toFixed(4) : '0',
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
    } catch (e) {
        console.error('Prediction endpoint error:', e.message);
        res.status(500).json({
            success: false,
            error: 'PREDICTION_FAILED',
            message: e.message
        });
    }
});

// ================= PATTERNS ENDPOINT =================
app.get('/patterns/:productId', async (req, res) => {
    const { productId } = req.params;
    const { lang = 'ar' } = req.query;
    
    try {
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
        
        let patterns = [];
        let supportResistance = null;
        let anomalies = [];
        
        try {
            if (PatternRecognition.detectPricePatterns) {
                patterns = PatternRecognition.detectPricePatterns(prices);
            }
            if (PatternRecognition.calculateSupportResistance) {
                supportResistance = PatternRecognition.calculateSupportResistance(prices);
            }
            if (AnomalyDetector.detectPriceAnomalies) {
                anomalies = AnomalyDetector.detectPriceAnomalies(prices);
            }
        } catch (e) {
            console.error('Pattern recognition error:', e.message);
        }
        
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
                    strongSupport: supportResistance.levels?.strongSupport?.toFixed(2) || '0',
                    weakSupport: supportResistance.levels?.weakSupport?.toFixed(2) || '0',
                    pivot: supportResistance.levels?.pivot?.toFixed(2) || '0',
                    weakResistance: supportResistance.levels?.weakResistance?.toFixed(2) || '0',
                    strongResistance: supportResistance.levels?.strongResistance?.toFixed(2) || '0'
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
    } catch (e) {
        console.error('Patterns endpoint error:', e.message);
        res.status(500).json({
            success: false,
            error: 'PATTERNS_FAILED',
            message: e.message
        });
    }
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
    
    try {
        let fakeDealCheck = { isSuspicious: false, riskScore: 0, riskLevel: 'low', warnings: [] };
        
        if (AnomalyDetector.detectFakeDeal) {
            fakeDealCheck = AnomalyDetector.detectFakeDeal(
                product, 
                marketPrices, 
                null
            );
        }
        
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
    } catch (e) {
        console.error('Anomaly detection error:', e.message);
        res.status(500).json({
            success: false,
            error: 'ANOMALY_DETECTION_FAILED',
            message: e.message
        });
    }
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
    
    let personality = { type: 'explorer', confidence: 50, traits: ['متوازن'] };
    
    try {
        if (PersonalityEngine.analyze) {
            personality = PersonalityEngine.analyze(behavior, 0, 0, {});
        }
    } catch (e) {
        console.error('Personality analysis error:', e.message);
    }
    
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
            const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
