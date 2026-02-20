/* =========================================
FINDLY SERVER v7.0 - SAGE ULTIMATE AI
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

console.log('🚀 Findly Server v7.0 with SAGE ULTIMATE Starting...');

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

/* ============================================================
   🔮 SAGE CORE v5.0 ULTIMATE - ENHANCED INTELLIGENCE
   ============================================================ */

function cleanPrice(p) { return p ? parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0 : 0; }

// Enhanced Translations
const translations = {
    ar: { 
        buy_now: "اشتري الآن", 
        strong_buy: "شراء قوي",
        wait: "انتظر", 
        overpriced: "السعر مرتفع", 
        fair_price: "سعر عادل", 
        excellent_deal: "صفقة ممتازة", 
        good_deal: "صفقة جيدة", 
        insufficient_data: "بيانات غير كافية",
        price_drop_expected: "متوقع انخفاض السعر",
        price_rise_expected: "متوقع ارتفاع السعر",
        oversold: "تشبع بيعي - فرصة شراء",
        overbought: "تشبع شرائي - انتظر",
        low_risk: "مخاطرة منخفضة",
        medium_risk: "مخاطرة متوسطة",
        high_risk: "مخاطرة عالية",
        trusted_merchant: "تاجر موثوق",
        suspicious_price: "سعر مشبوه"
    },
    en: { 
        buy_now: "Buy Now", 
        strong_buy: "Strong Buy",
        wait: "Wait", 
        overpriced: "Overpriced", 
        fair_price: "Fair Price", 
        excellent_deal: "Excellent Deal", 
        good_deal: "Good Deal", 
        insufficient_data: "Insufficient data",
        price_drop_expected: "Price drop expected",
        price_rise_expected: "Price rise expected",
        oversold: "Oversold - Buy opportunity",
        overbought: "Overbought - Wait",
        low_risk: "Low Risk",
        medium_risk: "Medium Risk",
        high_risk: "High Risk",
        trusted_merchant: "Trusted Merchant",
        suspicious_price: "Suspicious price"
    }
};

function t(lang, key) { return translations[lang]?.[key] || translations.en[key] || key; }

// Enhanced Trusted Stores
const TRUSTED_STORES = [
    'amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 
    'apple', 'samsung', 'nike', 'adidas', 'zara', 'ikea', 'costco',
    'target', 'bestbuy', 'newegg', 'carrefour', 'lulu', 'sharafdg'
];

// Statistical Functions
function calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(arr) {
    if (!arr || arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function removeOutliers(arr) {
    if (!arr || arr.length < 4) return arr || [];
    const sorted = [...arr].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

// RSI Calculator
function calculateRSI(prices, period = 14) {
    if (!prices || prices.length < period + 1) return null;
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const rsiValues = [];
    for (let i = period; i < changes.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
    }
    return rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
}

// Simple Moving Average
function calculateSMA(prices, period) {
    if (!prices || prices.length < period) return null;
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result.length > 0 ? result[result.length - 1] : null;
}

// Linear Regression for Trend
function calculateTrend(prices) {
    if (!prices || prices.length < 3) return { direction: 'stable', confidence: 0 };
    const n = prices.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    prices.forEach((y, x) => {
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction = slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable';
    return { direction, slope, confidence: Math.min(100, Math.abs(slope) * 1000 + 30) };
}

// ================= ENHANCED PRICE ANALYSIS =================
function analyzePrice(product, marketProducts, lang) {
    const currentPrice = cleanPrice(product.price);
    const originalPrice = cleanPrice(product.originalPrice) || currentPrice;
    const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);
    
    if (marketPrices.length < 3) {
        return { 
            score: 50, 
            decision: t(lang, 'insufficient_data'), 
            average: null, 
            median: null, 
            confidence: 30,
            discount: 0
        };
    }
    
    // Statistical Analysis
    const cleanedPrices = removeOutliers(marketPrices);
    const sorted = [...marketPrices].sort((a, b) => a - b);
    const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
    const median = calculateMedian(cleanedPrices);
    const min = Math.min(...cleanedPrices);
    const max = Math.max(...cleanedPrices);
    const stdDev = calculateStdDev(cleanedPrices);
    
    // Percentile position
    const percentile = Math.round((sorted.filter(p => p < currentPrice).length / sorted.length) * 100);
    
    // Enhanced Scoring Algorithm
    let score = 50, decision = t(lang, 'fair_price'), color = '#3b82f6';
    const priceRatio = currentPrice / median;
    
    if (priceRatio < 0.70) { 
        score = 95; decision = t(lang, 'excellent_deal'); color = '#059669'; 
    } else if (priceRatio < 0.80) { 
        score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981'; 
    } else if (priceRatio < 0.90) { 
        score = 75; decision = t(lang, 'good_deal'); color = '#22c55e'; 
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
    const discount = originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    if (discount > 30 && score < 80) {
        score = Math.min(95, score + 15);
    }
    
    return { 
        current: currentPrice, 
        original: originalPrice,
        discount,
        average: Math.round(average * 100) / 100, 
        median: Math.round(median * 100) / 100, 
        min, 
        max,
        stdDev: Math.round(stdDev * 100) / 100,
        percentile,
        score, 
        decision, 
        color, 
        confidence: Math.min(100, 40 + marketPrices.length * 3) 
    };
}

// ================= ENHANCED MERCHANT ANALYSIS =================
function analyzeMerchant(product, priceIntel, lang) {
    const store = product.source || product.store || 'Unknown';
    let trustScore = 50;
    let badge = 'bronze';
    let warnings = [];
    
    // Check trusted stores
    const isTrusted = TRUSTED_STORES.some(s => store.toLowerCase().includes(s));
    if (isTrusted) {
        trustScore += 30;
        badge = 'gold';
    }
    
    // Check for suspicious pricing
    if (priceIntel && priceIntel.average && priceIntel.current < priceIntel.average * 0.5) {
        trustScore -= 25;
        badge = 'warning';
        warnings.push(t(lang, 'suspicious_price'));
    }
    
    // Determine badge
    if (trustScore >= 80) badge = 'platinum';
    else if (trustScore >= 70) badge = 'gold';
    else if (trustScore >= 55) badge = 'silver';
    else if (trustScore >= 40) badge = 'bronze';
    else badge = 'warning';
    
    return { 
        store, 
        trustScore: Math.min(100, Math.max(0, trustScore)), 
        badge,
        isTrusted,
        warnings
    };
}

// ================= FAKE DEAL DETECTOR =================
function detectFakeDeal(product, priceIntel, marketProducts, lang) {
    let riskScore = 0;
    let riskLevel = 'low';
    const warnings = [];
    
    const currentPrice = cleanPrice(product.price);
    const originalPrice = cleanPrice(product.originalPrice);
    
    // Price too low check
    if (priceIntel && priceIntel.average) {
        if (currentPrice < priceIntel.average * 0.5) {
            riskScore += 50;
            warnings.push(t(lang, 'suspicious_price'));
        } else if (currentPrice < priceIntel.average * 0.6) {
            riskScore += 30;
        }
    }
    
    // Unrealistic discount check
    if (originalPrice > currentPrice) {
        const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
        if (discountPercent > 80) {
            riskScore += 40;
            warnings.push('خصم غير واقعي');
        } else if (discountPercent > 60) {
            riskScore += 20;
        }
    }
    
    // Trusted store bonus
    const store = (product.source || '').toLowerCase();
    if (TRUSTED_STORES.some(s => store.includes(s))) {
        riskScore = Math.max(0, riskScore - 20);
    }
    
    // Determine risk level
    if (riskScore >= 60) riskLevel = 'critical';
    else if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';
    else riskLevel = 'low';
    
    return {
        riskScore: Math.min(100, riskScore),
        riskLevel,
        warnings,
        isSuspicious: riskScore >= 40
    };
}

// ================= TREND ANALYZER =================
function analyzeTrend(priceIntel, marketProducts, lang) {
    const trend = { direction: 'stable', confidence: 50, prediction: null };
    
    // Use priceIntel data for trend
    if (priceIntel && priceIntel.stdDev) {
        const volatility = priceIntel.stdDev / (priceIntel.average || 1);
        if (volatility > 0.15) {
            trend.volatility = 'high';
        } else if (volatility > 0.08) {
            trend.volatility = 'medium';
        } else {
            trend.volatility = 'low';
        }
    }
    
    // Simple trend prediction based on position
    if (priceIntel && priceIntel.percentile !== undefined) {
        if (priceIntel.percentile < 20) {
            trend.direction = 'falling';
            trend.prediction = t(lang, 'price_drop_expected');
        } else if (priceIntel.percentile > 80) {
            trend.direction = 'rising';
            trend.prediction = t(lang, 'price_rise_expected');
        }
    }
    
    return trend;
}

// ================= MAIN SAGE CORE FUNCTION =================
function SageCore(product, marketProducts, lang) {
    const priceIntel = analyzePrice(product, marketProducts, lang);
    const merchantTrust = analyzeMerchant(product, priceIntel, lang);
    const fakeDealCheck = detectFakeDeal(product, priceIntel, marketProducts, lang);
    const trendIntel = analyzeTrend(priceIntel, marketProducts, lang);
    const currentPrice = cleanPrice(product.price);
    
    // Enhanced Decision Logic
    let decision = 'CONSIDER', reason = priceIntel.decision, color = priceIntel.color;
    let urgency = 'medium';
    
    // Check for fake deals first
    if (fakeDealCheck.riskScore >= 60) {
        decision = 'AVOID'; 
        reason = 'عرض مشبوه - مخاطر عالية'; 
        color = '#dc2626'; 
        urgency = 'none';
    } else if (fakeDealCheck.riskScore >= 40) {
        decision = 'CAUTION'; 
        reason = 'تحقق قبل الشراء'; 
        color = '#f59e0b'; 
        urgency = 'low';
    } else if (priceIntel.score >= 90) {
        decision = 'STRONG_BUY'; 
        reason = 'صفقة ممتازة! 🔥'; 
        color = '#059669'; 
        urgency = 'high';
    } else if (priceIntel.score >= 75) {
        decision = 'BUY_NOW'; 
        reason = t(lang, 'excellent_deal'); 
        color = '#10b981'; 
        urgency = 'high';
    } else if (priceIntel.score >= 60) {
        decision = 'BUY'; 
        reason = t(lang, 'good_deal'); 
        color = '#22c55e'; 
        urgency = 'medium';
    } else if (priceIntel.score <= 40) {
        decision = 'WAIT'; 
        reason = t(lang, 'overpriced'); 
        color = '#ef4444'; 
        urgency = 'low';
    } else if (trendIntel.direction === 'falling' && priceIntel.score < 70) {
        decision = 'SMART_WAIT'; 
        reason = t(lang, 'price_drop_expected'); 
        color = '#3b82f6'; 
        urgency = 'low';
    }
    
    // Find best store
    let bestStore = null, bestPrice = currentPrice, bestLink = product.link;
    let alternatives = [];
    
    if (marketProducts.length > 0) {
        const sortedByPrice = [...marketProducts]
            .filter(p => cleanPrice(p.product_price || p.price) > 0)
            .sort((a, b) => cleanPrice(a.product_price || a.price) - cleanPrice(b.product_price || b.price));
        
        if (sortedByPrice.length > 0) {
            const cheapest = sortedByPrice[0];
            const cheapestPrice = cleanPrice(cheapest.product_price || cheapest.price);
            
            if (cheapestPrice < currentPrice) {
                bestStore = cheapest.source || cheapest.store || 'Unknown';
                bestPrice = cheapestPrice;
                bestLink = cheapest.link || product.link;
            }
            
            // Get top 3 alternatives
            alternatives = sortedByPrice.slice(0, 3).map(p => ({
                store: p.source || p.store || 'Unknown',
                price: cleanPrice(p.product_price || p.price),
                link: p.link
            }));
        }
    }
    
    const savingsPercent = priceIntel.median ? Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
    
    // Calculate overall confidence
    const overallConfidence = Math.round(
        (priceIntel.confidence * 0.40) +
        ((100 - fakeDealCheck.riskScore) * 0.25) +
        (merchantTrust.trustScore * 0.20) +
        (trendIntel.confidence * 0.15)
    );
    
    return {
        priceIntel: {
            ...priceIntel,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0
        },
        valueIntel: { 
            score: priceIntel.score, 
            competitors: marketProducts.length, 
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0
        },
        trendIntel: {
            ...trendIntel
        },
        trustIntel: { 
            merchantTrust, 
            fakeDealCheck,
            overallRisk: fakeDealCheck.riskScore,
            riskLevel: fakeDealCheck.riskLevel
        },
        marketIntel: {
            alternatives,
            competitorCount: marketProducts.length,
            marketPosition: priceIntel.percentile || 50
        },
        finalVerdict: { 
            decision, 
            reason, 
            color, 
            urgency,
            confidence: overallConfidence, 
            savingsPercent, 
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            bestStore, 
            bestPrice, 
            bestLink 
        }
    };
}

/* ============================================================
   END OF SAGE CORE
   ============================================================ */

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

app.get('/health', (req, res) => res.json({ status: 'ok', version: '7.0', sage: 'v5.0 Ultimate', database: dbConnected ? 'connected' : 'disconnected' }));

app.get('/', (req, res) => res.json({ name: 'Findly API', version: '7.0', sage: 'SAGE Core v5.0 Ultimate', endpoints: ['GET /search?q=product', 'POST /chat', 'GET /reviews', 'POST /reviews'] }));

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

// ⭐ فحص انتهاء الاشتراك
if (energy.hasFreePass && energy.proExpiresAt) {
    if (new Date() > energy.proExpiresAt) {
        energy.hasFreePass = false;
        await Energy.updateOne(
            { uid: energy.uid },
            { $set: { hasFreePass: false } }
        );
    }
}

// ⭐ فحص الحصة
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
                originalPrice: item.original_price || null,
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
            user: { isGuest: auth.isGuest, uid: auth.isGuest ? 'guest' : auth.uid },
            sage: { version: 'v5.0 Ultimate', features: ['Enhanced Scoring', 'Fake Deal Detection', 'Trend Analysis', 'Risk Assessment'] }
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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Findly Server v7.0 with SAGE ULTIMATE running on port ${PORT}`));
