/* =========================================
FINDLY SERVER v7.1 - SAFE STABLE VERSION
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

console.log('🚀 Findly Server v7.1 Starting...');

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
const EnergySchema = new mongoose.Schema({
  uid: { type: String, unique: true, required: true },
  searchesUsed: { type: Number, default: 0 },
  hasFreePass: { type: Boolean, default: false },
  wasPro: { type: Boolean, default: false },
  proExpiresAt: { type: Date, default: null }
});
const ReviewSchema = new mongoose.Schema({ name: String, text: String, rating: { type: Number, min: 1, max: 5 }, helpful: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } });
const PriceHistorySchema = new mongoose.Schema({ productId: String, title: String, price: Number, store: String, source: String, thumbnail: String, link: String, timestamp: { type: Date, default: Date.now } });

const Energy = mongoose.model('Energy', EnergySchema);
const Review = mongoose.model('Review', ReviewSchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);

/* ================= CACHE ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24;

/* ================= SAGE CORE v5 - ENHANCED ================= */
function cleanPrice(p) { 
    if (!p) return 0; 
    if (typeof p === 'number') return p; 
    const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, '')); 
    return isNaN(cleaned) ? 0 : cleaned; 
}

function calculateMean(data) {
    if (!data || data.length === 0) return 0;
    return data.reduce(function(a, b) { return a + b; }, 0) / data.length;
}

function calculateMedian(data) {
    if (!data || data.length === 0) return 0;
    var sorted = data.slice().sort(function(a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(data) {
    if (!data || data.length < 2) return 0;
    var mean = calculateMean(data);
    var variance = data.reduce(function(sum, val) { return sum + Math.pow(val - mean, 2); }, 0) / data.length;
    return Math.sqrt(variance);
}

function removeOutliers(data) {
    if (!data || data.length < 4) return data || [];
    var sorted = data.slice().sort(function(a, b) { return a - b; });
    var q1Index = Math.floor(sorted.length * 0.25);
    var q3Index = Math.floor(sorted.length * 0.75);
    var q1 = sorted[q1Index];
    var q3 = sorted[q3Index];
    var iqr = q3 - q1;
    var lowerBound = q1 - 1.5 * iqr;
    var upperBound = q3 + 1.5 * iqr;
    return sorted.filter(function(p) { return p >= lowerBound && p <= upperBound; });
}

function calculateSMA(data, period) {
    if (!data || data.length < period) return null;
    var result = [];
    for (var i = period - 1; i < data.length; i++) {
        var sum = data.slice(i - period + 1, i + 1).reduce(function(a, b) { return a + b; }, 0);
        result.push(sum / period);
    }
    return result;
}

function calculateEMA(data, period) {
    if (!data || data.length < period) return null;
    var multiplier = 2 / (period + 1);
    var result = [];
    var ema = data.slice(0, period).reduce(function(a, b) { return a + b; }, 0) / period;
    result.push(ema);
    for (var i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
    }
    return result;
}

function calculateRSI(prices, period) {
    period = period || 14;
    if (!prices || prices.length < period + 1) return null;
    var changes = [];
    for (var i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    var gains = changes.map(function(c) { return c > 0 ? c : 0; });
    var losses = changes.map(function(c) { return c < 0 ? Math.abs(c) : 0; });
    var avgGain = gains.slice(0, period).reduce(function(a, b) { return a + b; }, 0) / period;
    var avgLoss = losses.slice(0, period).reduce(function(a, b) { return a + b; }, 0) / period;
    var rsiValues = [];
    for (var j = period; j < changes.length; j++) {
        avgGain = (avgGain * (period - 1) + gains[j]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[j]) / period;
        var rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
    }
    return rsiValues;
}

function linearRegression(data) {
    if (!data || data.length < 2) return null;
    var n = data.length;
    var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (var i = 0; i < data.length; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumX2 += i * i;
    }
    var slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    var intercept = (sumY - slope * sumX) / n;
    return { slope: slope, intercept: intercept };
}

// Translations
var SAGE_TRANSLATIONS = {
    ar: {
        buy_now: "اشتري الآن", strong_buy: "شراء قوي", wait: "انتظر", overpriced: "السعر مرتفع جداً",
        fair_price: "سعر عادل", excellent_deal: "صفقة ممتازة", good_deal: "صفقة جيدة",
        insufficient_data: "بيانات غير كافية للتحليل", price_drop_expected: "متوقع انخفاض السعر",
        tip_wait_sale: "انتظر العروض القادمة", tip_buy_now: "السعر مناسب حالياً", tip_compare: "قارن مع خيارات أخرى"
    },
    en: {
        buy_now: "Buy Now", strong_buy: "Strong Buy", wait: "Wait", overpriced: "Overpriced",
        fair_price: "Fair Price", excellent_deal: "Excellent Deal", good_deal: "Good Deal",
        insufficient_data: "Insufficient data for analysis", price_drop_expected: "Price drop expected",
        tip_wait_sale: "Wait for upcoming sales", tip_buy_now: "Price is good right now", tip_compare: "Compare with other options"
    }
};

function t(lang, key) {
    var shortLang = (lang || "en").split("-")[0];
    return (SAGE_TRANSLATIONS[shortLang] && SAGE_TRANSLATIONS[shortLang][key]) 
        || (SAGE_TRANSLATIONS["en"] && SAGE_TRANSLATIONS["en"][key]) 
        || key;
}

// Trusted stores
var TRUSTED_STORES = [
    'amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra',
    'apple', 'samsung', 'nike', 'adidas', 'zara', 'ikea', 'costco',
    'target', 'bestbuy', 'newegg', 'carrefour', 'lulu'
];

// Main SageCore function - Enhanced but SAFE
function SageCore(product, marketProducts, priceHistory, userEvents, userId, userHistory, lang) {
    // Default values
    marketProducts = marketProducts || [];
    priceHistory = priceHistory || [];
    userEvents = userEvents || {};
    userHistory = userHistory || {};
    lang = lang || 'ar';

    var currentPrice = cleanPrice(product.price);
    var originalPrice = cleanPrice(product.originalPrice) || currentPrice;
    var marketPrices = marketProducts.map(function(p) { 
        return cleanPrice(p.product_price || p.price || p); 
    }).filter(function(p) { return p > 0; });

    // Basic analysis
    var hasEnoughData = marketPrices.length >= 3;

    if (!hasEnoughData) {
        return {
            priceIntel: {
                current: currentPrice,
                average: null,
                median: null,
                score: 50,
                decision: t(lang, 'insufficient_data'),
                color: '#6b7280',
                confidence: 30
            },
            valueIntel: { score: 50, competitors: 0, savingsPercent: 0 },
            trustIntel: { merchantTrust: { trustScore: 50 }, overallRisk: 0 },
            personalityIntel: { type: 'neutral', confidence: 0 },
            trendIntel: { trend: 'unknown' },
            recommendationIntel: { aiInsights: null },
            finalVerdict: {
                decision: 'INSUFFICIENT_DATA',
                confidence: 30,
                reason: t(lang, 'insufficient_data'),
                color: '#6b7280',
                savingsPercent: 0,
                bestStore: null,
                bestPrice: currentPrice,
                bestLink: product.link || null
            }
        };
    }

    // Statistical analysis
    var cleanedPrices = removeOutliers(marketPrices);
    var average = calculateMean(marketPrices);
    var median = calculateMedian(cleanedPrices);
    var min = Math.min.apply(null, cleanedPrices);
    var max = Math.max.apply(null, cleanedPrices);
    var stdDev = calculateStdDev(cleanedPrices);

    // Price scoring
    var priceRatio = currentPrice / median;
    var score = 50;
    var decision = t(lang, 'fair_price');
    var color = '#3b82f6';
    var label = '';

    if (priceRatio < 0.70) {
        score = 95; decision = t(lang, 'excellent_deal'); color = '#059669';
        label = '🔥 صفقة ممتازة';
    } else if (priceRatio < 0.80) {
        score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981';
        label = '✨ صفقة جيدة جداً';
    } else if (priceRatio < 0.90) {
        score = 75; decision = t(lang, 'good_deal'); color = '#22c55e';
        label = '👍 سعر جيد';
    } else if (priceRatio < 0.95) {
        score = 65; decision = t(lang, 'fair_price'); color = '#84cc16';
    } else if (priceRatio < 1.05) {
        score = 55; decision = t(lang, 'fair_price'); color = '#eab308';
    } else if (priceRatio < 1.15) {
        score = 40; decision = t(lang, 'wait'); color = '#f59e0b';
    } else if (priceRatio < 1.30) {
        score = 25; decision = t(lang, 'overpriced'); color = '#ef4444';
    } else {
        score = 10; decision = t(lang, 'overpriced'); color = '#dc2626';
    }

    // Discount bonus
    var discount = originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    if (discount > 30 && score < 80) {
        score = Math.min(90, score + 15);
    }

    // Technical indicators
    var technicalIndicators = null;
    var trendDirection = 'stable';

    if (priceHistory && priceHistory.length >= 5) {
        var prices = priceHistory.map(function(h) { return cleanPrice(h.price); }).filter(function(p) { return p > 0; });
        if (prices.length >= 5) {
            var rsi = calculateRSI(prices);
            var lastRSI = rsi ? rsi[rsi.length - 1] : null;

            technicalIndicators = {
                rsi: lastRSI,
                rsiSignal: lastRSI ? (lastRSI < 30 ? 'oversold' : lastRSI > 70 ? 'overbought' : 'neutral') : null,
                volatility: stdDev / average > 0.1 ? 'high' : 'low'
            };

            // Adjust score based on RSI
            if (technicalIndicators.rsiSignal === 'oversold' && score < 80) {
                score = Math.min(95, score + 10);
            }

            // Trend prediction
            var regression = linearRegression(prices);
            if (regression) {
                trendDirection = regression.slope < 0 ? 'falling' : 'rising';
            }
        }
    }

    // Percentile
    var sortedPrices = cleanedPrices.slice().sort(function(a, b) { return a - b; });
    var position = sortedPrices.filter(function(p) { return p < currentPrice; }).length;
    var percentile = Math.round((position / sortedPrices.length) * 100);

    // Price Intel
    var priceIntel = {
        current: currentPrice,
        original: originalPrice,
        discount: discount,
        average: Math.round(average * 100) / 100,
        median: Math.round(median * 100) / 100,
        min: min,
        max: max,
        stdDev: Math.round(stdDev * 100) / 100,
        score: score,
        decision: decision,
        label: label,
        color: color,
        percentile: percentile,
        confidence: Math.min(100, 40 + marketPrices.length * 3)
    };

    // Merchant Trust
    var store = (product.source || product.store || 'Unknown').toLowerCase();
    var trustScore = 50;
    for (var i = 0; i < TRUSTED_STORES.length; i++) {
        if (store.indexOf(TRUSTED_STORES[i]) !== -1) {
            trustScore += 30;
            break;
        }
    }

    // Check for suspicious pricing
    var riskScore = 0;
    var warnings = [];
    if (currentPrice < average * 0.5) {
        riskScore += 50;
        warnings.push('السعر منخفض بشكل مشبوه');
    } else if (currentPrice < average * 0.6) {
        riskScore += 35;
    }

    if (originalPrice > currentPrice) {
        var discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
        if (discountPercent > 80) {
            riskScore += 45;
        }
    }

    var trustIntel = {
        merchantTrust: {
            store: product.source || 'Unknown',
            trustScore: Math.min(100, trustScore)
        },
        overallRisk: Math.min(100, riskScore),
        riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low'
    };

    // Personality
    var personalityScores = { hunter: 0, analyst: 0, impulse: 0, premium: 0, budget: 0 };
    if (userEvents.wishlistAdditions > 3) personalityScores.hunter += 20;
    if (userEvents.priceChecks > 5) personalityScores.hunter += 15;
    if (userEvents.clickedAnalysis) personalityScores.analyst += 20;
    if (userEvents.quickPurchases > 2) personalityScores.impulse += 30;
    if (userEvents.brandSearches > 3) personalityScores.premium += 20;
    if (userEvents.budgetSet) personalityScores.budget += 25;

    var dominant = 'neutral';
    var maxScore = 0;
    for (var p in personalityScores) {
        if (personalityScores[p] > maxScore) {
            maxScore = personalityScores[p];
            dominant = p;
        }
    }

    var personalityIntel = {
        type: maxScore >= 20 ? dominant : 'neutral',
        confidence: Math.min(100, maxScore)
    };

    // Best store
    var bestStore = null;
    var bestPrice = currentPrice;
    var bestLink = product.link || null;

    if (marketProducts.length > 0) {
        var cheapest = null;
        for (var k = 0; k < marketProducts.length; k++) {
            var item = marketProducts[k];
            var itemPrice = cleanPrice(item.product_price || item.price);
            if (itemPrice > 0 && (!cheapest || itemPrice < cheapest.price)) {
                cheapest = { price: itemPrice, store: item.source || item.store || 'Unknown', link: item.link || null };
            }
        }
        if (cheapest && cheapest.price < currentPrice) {
            bestStore = cheapest.store;
            bestPrice = cheapest.price;
            bestLink = cheapest.link;
        }
    }

    // Final verdict
    var savingsPercent = median ? Math.round((1 - currentPrice / median) * 100) : 0;
    var confidenceScore = Math.round(
        (priceIntel.confidence * 0.35) +
        ((100 - riskScore) * 0.25) +
        (trustScore * 0.20) +
        (personalityIntel.confidence * 0.10) +
        20
    );

    var strategicDecision = 'WAIT';
    var strategicReason = '';
    var strategicColor = '#f59e0b';
    var urgency = 'medium';

    if (riskScore >= 60) {
        strategicDecision = 'AVOID'; strategicReason = 'عرض مشبوه'; strategicColor = '#dc2626'; urgency = 'none';
    } else if (trustScore < 30) {
        strategicDecision = 'CAUTION'; strategicReason = 'تاجر غير موثوق'; strategicColor = '#f59e0b'; urgency = 'low';
    } else if (score >= 85 && riskScore < 25) {
        strategicDecision = 'STRONG_BUY'; strategicReason = 'صفقة ممتازة! وفر ' + savingsPercent + '%'; strategicColor = '#059669'; urgency = 'high';
    } else if (score >= 75 && trendDirection !== 'falling') {
        strategicDecision = 'BUY_NOW'; strategicReason = t(lang, 'excellent_deal'); strategicColor = '#10b981'; urgency = 'high';
    } else if (score >= 65) {
        strategicDecision = 'BUY'; strategicReason = t(lang, 'good_deal'); strategicColor = '#22c55e'; urgency = 'medium';
    } else if (trendDirection === 'falling' && score < 75) {
        strategicDecision = 'SMART_WAIT'; strategicReason = t(lang, 'price_drop_expected'); strategicColor = '#3b82f6'; urgency = 'low';
    } else if (score <= 40) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'overpriced'); strategicColor = '#ef4444'; urgency = 'none';
    } else {
        strategicDecision = 'CONSIDER'; strategicReason = t(lang, 'fair_price'); strategicColor = '#6366f1'; urgency = 'low';
    }

    // RSI signal bonus
    if (technicalIndicators && technicalIndicators.rsiSignal === 'oversold' && strategicDecision !== 'AVOID') {
        strategicReason += ' | RSI: فرصة شراء';
    }

    return {
        priceIntel: {
            current: currentPrice,
            original: originalPrice,
            discount: discount,
            average: priceIntel.average,
            median: priceIntel.median,
            min: min,
            max: max,
            score: score,
            decision: decision,
            label: label,
            color: color,
            percentile: percentile,
            confidence: priceIntel.confidence
        },
        valueIntel: {
            score: score,
            competitors: marketPrices.length,
            savingsPercent: savingsPercent,
            savingsAmount: median ? Math.round((median - currentPrice) * 100) / 100 : 0
        },
        trendIntel: {
            trend: trendDirection,
            technicalIndicators: technicalIndicators
        },
        trustIntel: trustIntel,
        personalityIntel: personalityIntel,
        recommendationIntel: {
            aiInsights: null
        },
        marketIntel: {
            competitorCount: marketPrices.length,
            marketPosition: percentile
        },
        finalVerdict: {
            decision: strategicDecision,
            confidence: confidenceScore,
            reason: strategicReason,
            color: strategicColor,
            urgency: urgency,
            savingsPercent: savingsPercent,
            savingsAmount: median ? Math.round((median - currentPrice) * 100) / 100 : 0,
            bestStore: bestStore,
            bestPrice: bestPrice,
            bestLink: bestLink
        }
    };
}

/* ================= AUTH HELPER ================= */
async function authenticateUser(req) {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || !firebaseInitialized) return { uid: 'guest', isGuest: true };
    try {
        var decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
        return { uid: decoded.uid, isGuest: false };
    } catch (e) { return { uid: 'guest', isGuest: true }; }
}

/* ================= CHAT ================= */
var chatResponses = {
    ar: { greeting: ['مرحباً! 👋 أنا Sage، كيف أقدر أساعدك؟', 'أهلاً! 🔮 اسألني عن أي منتج!'], search: ['سأبحث لك. ما المنتج؟'], price: ['سعر جيد 💰', 'قارن مع متاجر أخرى'], general: ['كيف أساعدك؟', 'أنا هنا لمساعدتك 🛍️'] },
    en: { greeting: ['Hello! 👋 I\'m Sage, how can I help?'], search: ['I\'ll search for you. What product?'], price: ['Good price 💰'], general: ['How can I help?'] }
};

async function processChat(message, lang) {
    var lower = (message || '').toLowerCase();
    var intent = 'general';
    if (lower.match(/مرحبا|اهلا|hello|hi/)) intent = 'greeting';
    else if (lower.match(/ابحث|بحث|search|find/)) intent = 'search';
    else if (lower.match(/سعر|price|كم/)) intent = 'price';
    var arr = (chatResponses[lang] && chatResponses[lang][intent]) || chatResponses.ar[intent] || chatResponses.ar.general;
    return { reply: arr[Math.floor(Math.random() * arr.length)] };
}

/* ================= ENDPOINTS ================= */

app.get('/health', function(req, res) { 
    res.json({ status: 'ok', version: '7.1', database: dbConnected ? 'connected' : 'disconnected' }); 
});

app.get('/', function(req, res) { 
    res.json({ name: 'Findly API', version: '7.1', endpoints: ['GET /search?q=product', 'POST /chat', 'GET /reviews', 'POST /reviews'] }); 
});

// Chat
app.post('/chat', async function(req, res) {
    var message = req.body.message;
    var lang = req.body.lang || 'ar';
    var result = await processChat(message, lang);
    res.json({ success: true, reply: result.reply, response: result.reply });
});

// Search
app.get('/search', async function(req, res) {
    var q = req.query.q;
    var lang = req.query.lang || 'ar';
    
    if (!q || !q.trim()) return res.json({ success: false, results: [], error: 'no_query' });

    var auth = await authenticateUser(req);
    var energy = { searchesUsed: 0, hasFreePass: false };

    if (dbConnected) { 
        energy = await Energy.findOne({ uid: auth.uid }) || await Energy.create({ uid: auth.uid });

        // Check subscription expiry
        if (energy.hasFreePass && energy.proExpiresAt) {
            if (new Date() > energy.proExpiresAt) {
                energy.hasFreePass = false;
                await Energy.updateOne({ uid: energy.uid }, { $set: { hasFreePass: false } });
            }
        }

        // Check quota
        if (!energy.hasFreePass && energy.searchesUsed >= 3) {
            if (energy.wasPro) {
                return res.status(429).json({ error: 'PRO_EXPIRED', message: 'Subscription expired', energy: { left: 0, limit: 3 } });
            }
            return res.status(429).json({ error: 'ENERGY_EMPTY', message: 'Free searches exhausted', energy: { left: 0, limit: 3 } });
        }
    }

    var cacheKey = q.toLowerCase() + '_' + lang;
    var cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        cached.data.energy = { left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), limit: energy.hasFreePass ? '∞' : 3 };
        return res.json(cached.data);
    }

    if (!SEARCHAPI_KEY) return res.status(503).json({ success: false, error: 'SEARCH_NOT_CONFIGURED', results: [], energy: { left: 3, limit: 3 } });

    try {
        var apiRes = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: { api_key: SEARCHAPI_KEY, engine: 'google_shopping', q: q, hl: lang === 'ar' ? 'ar' : 'en' },
            timeout: 15000
        });

        var rawResults = (apiRes.data && apiRes.data.shopping_results) ? apiRes.data.shopping_results.slice(0, 10) : [];

        // Process with SAGE
        var results = [];
        for (var i = 0; i < rawResults.length; i++) {
            var item = rawResults[i];
            var product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown',
                price: item.price || '$0',
                originalPrice: item.original_price || null,
                link: item.product_link || item.link || '',
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping'
            };

            var intelligence = SageCore(product, rawResults, [], {}, 'guest', {}, lang);
            results.push(Object.assign({}, product, { intelligence: intelligence }));
        }

        if (dbConnected && !energy.hasFreePass) {
            await Energy.updateOne({ uid: auth.uid }, { $inc: { searchesUsed: 1 } });
            energy.searchesUsed++;
        }

        var response = {
            success: true,
            query: q,
            results: results,
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

app.get('/reviews', async function(req, res) {
    try {
        if (!dbConnected) return res.json({ success: true, reviews: [], todayCount: 0 });
        
        var reviews = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var todayCount = await Review.countDocuments({ createdAt: { $gte: today } });

        res.json({ success: true, reviews: reviews, todayCount: todayCount, total: await Review.countDocuments() });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FETCH_FAILED', message: e.message });
    }
});

app.post('/reviews', async function(req, res) {
    try {
        var name = req.body.name;
        var text = req.body.text;
        var rating = req.body.rating;

        if (!name || !text || !rating) return res.status(400).json({ success: false, error: 'MISSING_FIELDS' });
        
        var ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ success: false, error: 'INVALID_RATING' });

        if (!dbConnected) return res.json({ success: true, message: 'Review received (demo)', review: { name: name, text: text, rating: ratingNum } });

        var review = await Review.create({ name: name.trim(), text: text.trim(), rating: ratingNum });
        res.status(201).json({ success: true, message: 'Review submitted', review: review });
    } catch (e) {
        res.status(500).json({ success: false, error: 'CREATE_FAILED', message: e.message });
    }
});

app.post('/reviews/:id/helpful', async function(req, res) {
    try {
        if (!dbConnected) return res.json({ success: true });
        var review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpful: 1 } }, { new: true });
        if (!review) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
        res.json({ success: true, helpful: review.helpful });
    } catch (e) {
        res.status(500).json({ success: false, error: 'FAILED' });
    }
});

// ================= PAYMENT =================

app.post('/create-payment', async function(req, res) {
    var uid = req.body.uid;
    if (!uid) return res.status(400).json({ success: false, error: 'UID_REQUIRED' });
    if (!NOWPAYMENTS_API_KEY) return res.status(503).json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' });

    try {
        var response = await axios.post('https://api.nowpayments.io/v1/invoice', {
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

app.post('/nowpayments/webhook', express.raw({ type: 'application/json' }), async function(req, res) {
    try {
        var data = JSON.parse(req.body.toString());
        if (data.payment_status === 'finished' && dbConnected) {
            var now = new Date();
            var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            await Energy.findOneAndUpdate(
                { uid: data.order_id },
                { hasFreePass: true, wasPro: true, searchesUsed: 0, proExpiresAt: expires },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'WEBHOOK_ERROR' }); }
});

// Redirect
app.get('/go', function(req, res) {
    var url = req.query.url;
    if (!url) return res.status(400).send('No URL');
    try { res.redirect(decodeURIComponent(url)); } catch (e) { res.status(500).send('Error'); }
});

// ================= START =================
var PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', function() { console.log('🚀 Findly Server v7.1 running on port ' + PORT); });
