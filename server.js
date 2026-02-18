/* =========================================
FINDLY SERVER v6.1 - FIXED VERSION
Ultimate Shopping Intelligence Platform
+ Reviews System Added
+ Chat Fixed (Works without Gemini)
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

/* ================= DATABASE SCHEMAS ================= */

// User Energy Schema
const EnergySchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    searchesUsed: { type: Number, default: 0 },
    hasFreePass: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Price History Schema
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

// User Behavior Schema
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

// Price Alert Schema
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

// User Profile Schema
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

// Merchant Rating Schema
const MerchantRatingSchema = new mongoose.Schema({
    domain: { type: String, unique: true },
    name: String,
    overallScore: { type: Number, default: 50 },
    trustScore: { type: Number, default: 50 },
    totalProducts: { type: Number, default: 0 },
    avgPriceDeviation: Number,
    lastUpdated: { type: Date, default: Date.now }
});

// Review Schema
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
const MerchantRating = mongoose.model('MerchantRating', MerchantRatingSchema);
const Review = mongoose.model('Review', ReviewSchema);

/* ================================
   🔮 SAGE CORE v4.1 - EMBEDDED & FIXED
================================ */

// Translations
const SAGE_TRANSLATIONS = {
  ar: {
    buy_now: "اشتري الآن",
    wait: "انتظر",
    overpriced: "السعر مرتفع",
    fair_price: "سعر عادل",
    excellent_deal: "صفقة ممتازة",
    good_deal: "صفقة جيدة",
    bad_deal: "صفقة ضعيفة",
    high_risk: "مخاطرة عالية",
    medium_risk: "مخاطرة متوسطة",
    low_risk: "مخاطرة منخفضة",
    strong_signal: "إشارة قوية",
    weak_signal: "إشارة ضعيفة",
    insufficient_data: "بيانات غير كافية للتحليل",
    market_stable: "السوق مستقر",
    market_rising: "السوق في ارتفاع",
    market_falling: "السوق في انخفاض",
    analysis_learning: "التحليل قيد التعلم",
    fake_offer: "قد يكون العرض غير منطقي مقارنة بالسوق",
    price_drop_expected: "متوقع انخفاض السعر",
    price_rise_expected: "متوقع ارتفاع السعر",
    best_time_to_buy: "أفضل وقت للشراء",
    trusted_merchant: "تاجر موثوق",
    suspicious_merchant: "تاجر مشبوه",
    recommended: "موصى به",
    alternative: "بديل أرخص",
    tip_wait_sale: "انتظر العروض القادمة",
    tip_buy_now: "السعر مناسب حالياً",
    tip_compare: "قارن مع خيارات أخرى"
  },
  en: {
    buy_now: "Buy Now",
    wait: "Wait",
    overpriced: "Overpriced",
    fair_price: "Fair Price",
    excellent_deal: "Excellent Deal",
    good_deal: "Good Deal",
    bad_deal: "Weak Deal",
    high_risk: "High Risk",
    medium_risk: "Medium Risk",
    low_risk: "Low Risk",
    strong_signal: "Strong Signal",
    weak_signal: "Weak Signal",
    insufficient_data: "Insufficient data for analysis",
    market_stable: "Market Stable",
    market_rising: "Market Rising",
    market_falling: "Market Falling",
    analysis_learning: "Analysis in progress",
    fake_offer: "Offer may be unrealistic",
    price_drop_expected: "Price drop expected",
    price_rise_expected: "Price rise expected",
    best_time_to_buy: "Best time to buy",
    trusted_merchant: "Trusted Merchant",
    suspicious_merchant: "Suspicious Merchant",
    recommended: "Recommended",
    alternative: "Cheaper Alternative",
    tip_wait_sale: "Wait for upcoming sales",
    tip_buy_now: "Price is good right now",
    tip_compare: "Compare with other options"
  },
  fr: {
    buy_now: "Acheter maintenant",
    wait: "Attendre",
    overpriced: "Prix élevé",
    fair_price: "Prix juste",
    excellent_deal: "Excellente offre",
    good_deal: "Bonne offre",
    bad_deal: "Mauvaise offre",
    high_risk: "Risque élevé",
    medium_risk: "Risque moyen",
    low_risk: "Risque faible",
    insufficient_data: "Données insuffisantes",
    market_stable: "Marché stable",
    market_rising: "Marché en hausse",
    market_falling: "Marché en baisse",
    fake_offer: "Offre potentiellement irréaliste"
  },
  de: {
    buy_now: "Jetzt kaufen",
    wait: "Warten",
    overpriced: "Überteuert",
    fair_price: "Fairer Preis",
    excellent_deal: "Ausgezeichnetes Angebot",
    good_deal: "Gutes Angebot",
    insufficient_data: "Unzureichende Daten",
    market_stable: "Markt stabil"
  },
  es: {
    buy_now: "Comprar ahora",
    wait: "Esperar",
    overpriced: "Precio alto",
    fair_price: "Precio justo",
    excellent_deal: "Oferta excelente",
    good_deal: "Buena oferta",
    insufficient_data: "Datos insuficientes"
  },
  tr: {
    buy_now: "Şimdi Satın Al",
    wait: "Bekle",
    overpriced: "Fiyat yüksek",
    fair_price: "Adil fiyat",
    excellent_deal: "Mükemmel fırsat",
    good_deal: "İyi fırsat",
    insufficient_data: "Yetersiz veri"
  }
};

// Utility Functions
function t(lang, key) {
    const shortLang = (lang || "en").split("-")[0];
    return SAGE_TRANSLATIONS[shortLang]?.[key] 
        || SAGE_TRANSLATIONS["en"][key] 
        || key;
}

function cleanPrice(p) {
    if (!p) return 0;
    const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, ''));
    return isNaN(cleaned) ? 0 : cleaned;
}

function calculateSMA(data, period) {
    if (data.length < period) return null;
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

function calculateStdDev(data) {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

function removeOutliers(data) {
    if (data.length < 4) return data;
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    return sorted.filter(p => p >= lowerBound && p <= upperBound);
}

// Sage AI Engine Class
class SageAIEngine {
    constructor(apiKey = null) {
        this.apiKey = apiKey || GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async callGemini(prompt) {
        if (!this.apiKey) return null;

        try {
            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                },
                { timeout: 10000 }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                try {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                } catch (e) {}
                return { text };
            }
            return null;
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            return null;
        }
    }

    async generateAdvice(product, analysis, lang = 'ar') {
        const prompt = `You are a smart shopping advisor. Product: "${product.title}", Price: ${product.price}.
Analysis: ${JSON.stringify(analysis)}. Language: ${lang}.
Return JSON: {"advice": "brief advice", "tip": "specific tip", "confidence": 0-100}`;

        const result = await this.callGemini(prompt);
        if (result && result.advice) return result;
        
        if (analysis.priceIntel?.score >= 70) {
            return { advice: t(lang, 'tip_buy_now'), tip: t(lang, 'tip_buy_now'), confidence: 70 };
        }
        return { advice: t(lang, 'tip_compare'), tip: t(lang, 'tip_compare'), confidence: 60 };
    }
}

// Personality Engine
class PersonalityEngine {
    static analyze(userEvents, price, marketAverage, userHistory = {}) {
        const scores = { hunter: 0, analyst: 0, impulse: 0, premium: 0, budget: 0 };

        if (userEvents) {
            if (userEvents.wishlistAdditions > 3) scores.hunter += 20;
            if (userEvents.priceChecks > 5) scores.hunter += 15;
            if (userEvents.clickedAnalysis) scores.analyst += 20;
            if (userEvents.comparisonViews > 3) scores.analyst += 25;
            if (userEvents.quickPurchases > 2) scores.impulse += 30;
            if (userEvents.brandSearches > 3) scores.premium += 20;
            if (userEvents.budgetSet) scores.budget += 25;
        }

        let dominant = 'neutral';
        let maxScore = 0;
        Object.entries(scores).forEach(([p, s]) => {
            if (s > maxScore) { maxScore = s; dominant = p; }
        });

        if (maxScore < 20) dominant = 'neutral';

        const traits = {
            hunter: { description: 'يبحث عن أقل سعر ممكن', style: 'صياد الصفقات', icon: '🎯' },
            analyst: { description: 'يفضل التحليل قبل الشراء', style: 'المحلل', icon: '🔬' },
            impulse: { description: 'يتخذ قرارات سريعة', style: 'المتسرع', icon: '⚡' },
            premium: { description: 'يهتم بالجودة', style: 'محب الجودة', icon: '💎' },
            budget: { description: 'محدود الميزانية', style: 'المخطط', icon: '💰' },
            neutral: { description: 'سلوك متوازن', style: 'متوازن', icon: '🎯' }
        };

        return {
            type: dominant,
            scores,
            confidence: Math.min(100, maxScore),
            traits: traits[dominant],
            icon: traits[dominant]?.icon || '🎯'
        };
    }

    static personalize(personality, product, marketData, lang) {
        const price = cleanPrice(product.price);
        const avg = marketData.average || price;

        switch (personality.type) {
            case 'hunter':
                if (price <= avg * 0.85) {
                    return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 85 };
                }
                return { action: 'wait', reason: 'انتظر انخفاضاً أفضل', confidence: 70 };
            case 'analyst':
                return { action: 'compare', reason: t(lang, 'tip_compare'), confidence: 75 };
            case 'impulse':
                if (price <= avg * 1.05) {
                    return { action: 'buy_now', reason: 'السعر مناسب للشراء السريع', confidence: 80 };
                }
                return { action: 'consider', reason: t(lang, 'tip_compare'), confidence: 60 };
            case 'premium':
                return { action: 'buy_now', reason: 'منتج مميز', confidence: 75 };
            case 'budget':
                if (price <= avg * 0.7) {
                    return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 90 };
                }
                return { action: 'search_alternative', reason: t(lang, 'alternative'), confidence: 70 };
            default:
                return { action: price <= avg ? 'buy_now' : 'wait', reason: price <= avg ? t(lang, 'good_deal') : t(lang, 'tip_wait_sale'), confidence: 60 };
        }
    }
}

// Price Intelligence Engine
class PriceIntelligence {
    static analyze(product, marketProducts = [], priceHistory = [], lang = 'ar') {
        const currentPrice = cleanPrice(product.price);
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price || p)).filter(p => p > 0);

        if (marketPrices.length < 3) {
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
                hasEnoughData: false
            };
        }

        const sorted = [...marketPrices].sort((a, b) => a - b);
        const cleanedPrices = removeOutliers(sorted);
        const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
        const median = cleanedPrices[Math.floor(cleanedPrices.length / 2)];
        const min = Math.min(...cleanedPrices);
        const max = Math.max(...cleanedPrices);

        let score = 50, decision = t(lang, 'fair_price'), color = '#3b82f6', label = '';

        if (currentPrice < median * 0.85) {
            score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981';
            label = `أقل من ${Math.round((1 - currentPrice / median) * 100)}% من السوق`;
        } else if (currentPrice < median * 0.95) {
            score = 70; decision = t(lang, 'good_deal'); color = '#22c55e';
            label = 'أقل من متوسط السوق';
        } else if (currentPrice > median * 1.15) {
            score = 25; decision = t(lang, 'overpriced'); color = '#ef4444';
            label = `أعلى من ${Math.round((currentPrice / median - 1) * 100)}% من السوق`;
        } else if (currentPrice > median * 1.05) {
            score = 40; decision = t(lang, 'wait'); color = '#f59e0b';
        }

        let trend = null;
        if (priceHistory && priceHistory.length >= 5) {
            const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
            if (prices.length >= 5) {
                const sma5 = calculateSMA(prices, Math.min(5, prices.length));
                const sma10 = calculateSMA(prices, Math.min(10, prices.length));
                if (sma5 && sma10) {
                    const lastSma5 = sma5[sma5.length - 1];
                    const lastSma10 = sma10[sma10.length - 1];
                    trend = {
                        trend: lastSma5 > lastSma10 * 1.02 ? 'rising' : lastSma5 < lastSma10 * 0.98 ? 'falling' : 'stable',
                        confidence: Math.min(95, 50 + prices.length),
                        predictedPrice: lastSma5
                    };
                }
            }
        }

        return {
            priceIntel: {
                current: currentPrice,
                average: Math.round(average * 100) / 100,
                median: Math.round(median * 100) / 100,
                min, max,
                score, decision, label, color,
                confidence: Math.min(100, 40 + marketPrices.length * 3)
            },
            trendIntel: trend,
            hasEnoughData: true,
            marketStats: {
                competitors: marketPrices.length,
                priceVariation: Math.round(((max - min) / median) * 100)
            }
        };
    }
}

// Merchant Trust Engine
class MerchantTrustEngine {
    static evaluate(storeData, productData = {}, lang = 'ar') {
        const store = storeData.source || storeData.store || 'Unknown';
        let trustScore = 50;
        const factors = [], warnings = [];

        const trustedStores = ['amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 'apple', 'samsung', 'nike'];

        if (trustedStores.some(s => store.toLowerCase().includes(s))) {
            trustScore += 25;
            factors.push({ factor: 'known_brand', impact: +25 });
        }

        if (productData.price && productData.marketAverage && cleanPrice(productData.price) < productData.marketAverage * 0.5) {
            trustScore -= 20;
            warnings.push(t(lang, 'fake_offer'));
        }

        const badge = trustScore >= 80 ? { level: 'gold', icon: '🥇' } :
                      trustScore >= 65 ? { level: 'silver', icon: '🥈' } :
                      trustScore >= 50 ? { level: 'bronze', icon: '🥉' } :
                      { level: 'warning', icon: '⚠️' };

        return { store, trustScore: Math.max(0, Math.min(100, trustScore)), badge, factors, warnings, verified: trustScore >= 70 };
    }
}

// Fake Deal Detector
class FakeDealDetector {
    static detect(product, marketProducts, lang = 'ar') {
        const warnings = [], riskFactors = [];
        let riskScore = 0;

        const currentPrice = cleanPrice(product.price);
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);

        if (marketPrices.length >= 3) {
            const avg = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
            const min = Math.min(...marketPrices);

            if (currentPrice < avg * 0.5) {
                warnings.push(t(lang, 'fake_offer'));
                riskFactors.push({ factor: 'price_too_low', severity: 'high' });
                riskScore += 40;
            }
            if (currentPrice > min * 1.5) {
                warnings.push('السعر أعلى بكثير من المنافسين');
                riskScore += 25;
            }
        }

        return {
            isSuspicious: riskScore >= 40,
            riskScore: Math.min(100, riskScore),
            riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            warnings, riskFactors
        };
    }
}

// Main Sage Core Function - FIXED TO RETURN ALL DATA
async function SageCore(product, marketProducts = [], priceHistory = [], userEvents = {}, userId = 'guest', userHistory = {}, lang = 'ar') {
    const currentPrice = cleanPrice(product.price);
    const ai = new SageAIEngine();

    // 1. Price Intelligence
    const priceAnalysis = PriceIntelligence.analyze(product, marketProducts, priceHistory, lang);
    if (!priceAnalysis.hasEnoughData) {
        return {
            ...priceAnalysis,
            finalVerdict: { 
                decision: 'INSUFFICIENT_DATA', 
                confidence: 30, 
                recommendation: t(lang, 'insufficient_data'),
                emoji: '⚠️',
                title: t(lang, 'insufficient_data'),
                reason: t(lang, 'insufficient_data')
            }
        };
    }

    const { priceIntel, trendIntel, marketStats } = priceAnalysis;

    // 2. Personality Analysis
    const personality = PersonalityEngine.analyze(userEvents, currentPrice, priceIntel.median, userHistory);

    // 3. Merchant Trust
    const merchantTrust = MerchantTrustEngine.evaluate(product, { price: currentPrice, marketAverage: priceIntel.median }, lang);

    // 4. Fake Deal Detection
    const fakeDealCheck = FakeDealDetector.detect(product, marketProducts, lang);

    // 5. AI Insights
    let aiInsights = null;
    try {
        aiInsights = await ai.generateAdvice(product, { priceIntel, trendIntel }, lang);
    } catch (e) {}

    // 6. Personalized Recommendation
    const personalizedRec = PersonalityEngine.personalize(personality, product, { average: priceIntel.median }, lang);

    // 7. Best Store
    let bestStore = null, bestPrice = currentPrice, bestLink = product.link || null;
    if (marketProducts.length > 0) {
        const cheapest = marketProducts.reduce((min, item) => {
            const p = cleanPrice(item.product_price || item.price);
            if (!p) return min;
            if (!min || p < min.price) return { price: p, store: item.source || item.store || 'Unknown', link: item.link || null };
            return min;
        }, null);
        if (cheapest && cheapest.price < currentPrice) {
            bestStore = cheapest.store;
            bestPrice = cheapest.price;
            bestLink = cheapest.link;
        }
    }

    // 8. Final Verdict
    const savingsPercent = priceIntel.median ? Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
    const confidenceScore = Math.round(
        (priceIntel.confidence * 0.35) +
        ((100 - fakeDealCheck.riskScore) * 0.25) +
        (merchantTrust.trustScore * 0.20) +
        (personality.confidence * 0.10) +
        ((trendIntel?.confidence || 50) * 0.10)
    );

    let strategicDecision = 'WAIT', strategicReason = '', strategicColor = '#f59e0b', emoji = '⏳', title = '';

    if (fakeDealCheck.riskScore >= 60) {
        strategicDecision = 'AVOID'; strategicReason = 'عرض مشبوه'; strategicColor = '#ef4444'; emoji = '🚫'; title = 'تجنب الشراء';
    } else if (merchantTrust.trustScore < 30) {
        strategicDecision = 'CAUTION'; strategicReason = 'تاجر غير موثوق'; strategicColor = '#f59e0b'; emoji = '⚠️'; title = 'كن حذراً';
    } else if (priceIntel.score >= 75 && fakeDealCheck.riskScore < 30) {
        strategicDecision = 'BUY_NOW'; strategicReason = `صفقة ممتازة - وفر ${savingsPercent}%`; strategicColor = '#10b981'; emoji = '🎯'; title = 'اشترِ الآن';
    } else if (priceIntel.score >= 60 && trendIntel?.trend !== 'falling') {
        strategicDecision = 'BUY'; strategicReason = t(lang, 'good_deal'); strategicColor = '#22c55e'; emoji = '✅'; title = 'صفقة جيدة';
    } else if (trendIntel?.trend === 'falling' && priceIntel.score < 70) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'price_drop_expected'); strategicColor = '#3b82f6'; emoji = '📉'; title = 'انتظر';
    } else if (priceIntel.score <= 40) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'overpriced'); strategicColor = '#ef4444'; emoji = '🔴'; title = 'السعر مرتفع';
    } else {
        strategicDecision = 'CONSIDER'; strategicReason = t(lang, 'fair_price'); strategicColor = '#3b82f6'; emoji = '🤔'; title = 'فكر فيه';
    }

    if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID') {
        strategicDecision = 'BUY_NOW';
        strategicReason = personalizedRec.reason;
        emoji = '🎯';
        title = 'اشترِ الآن';
    }

    // 9. Deal Quality
    const dealQuality = {
        score: Math.round((priceIntel.score * 0.5) + ((100 - fakeDealCheck.riskScore) * 0.3) + (merchantTrust.trustScore * 0.2)),
        label: priceIntel.score >= 70 ? 'ممتازة' : priceIntel.score >= 50 ? 'جيدة' : 'ضعيفة'
    };

    // 10. Recommendations (alternatives)
    const recommendations = [];
    if (marketProducts.length > 1) {
        marketProducts.slice(0, 3).forEach(p => {
            const pPrice = cleanPrice(p.product_price || p.price);
            if (pPrice < currentPrice && p.title !== product.title) {
                recommendations.push({
                    title: p.title,
                    price: pPrice,
                    image: p.thumbnail || p.product_image,
                    savings: currentPrice - pPrice,
                    reason: 'أرخص بـ $' + (currentPrice - pPrice).toFixed(2)
                });
            }
        });
    }

    // RETURN COMPLETE DATA
    return {
        // Price Intelligence
        priceIntel: {
            current: currentPrice,
            average: priceIntel.average,
            median: priceIntel.median,
            min: priceIntel.min,
            max: priceIntel.max,
            score: priceIntel.score,
            decision: priceIntel.decision,
            label: priceIntel.label,
            color: priceIntel.color,
            confidence: priceIntel.confidence
        },

        // Value Intelligence
        valueIntel: {
            score: priceIntel.score,
            competitors: marketStats.competitors,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            learningBoost: userEvents?.clickedAnalysis ? 10 : 0
        },

        // Trend Intelligence
        trendIntel: trendIntel || {
            trend: 'unknown',
            confidence: 0,
            predictedPrice: null
        },

        // Trust Intelligence
        trustIntel: {
            merchantTrust: merchantTrust,
            fakeDealCheck: fakeDealCheck,
            riskScore: fakeDealCheck.riskScore,
            riskLevel: fakeDealCheck.riskLevel,
            warnings: fakeDealCheck.warnings
        },

        // Personality Intelligence
        personalityIntel: {
            type: personality.type,
            confidence: personality.confidence,
            traits: personality.traits,
            icon: personality.icon,
            personalizedTip: personalizedRec.tip
        },

        // Recommendations
        recommendationIntel: {
            alternatives: recommendations.slice(0, 3),
            aiInsights: aiInsights
        },

        // Deal Quality
        dealQuality: dealQuality,

        // Merchant Trust
        merchantTrust: {
            name: merchantTrust.store,
            score: merchantTrust.trustScore,
            badge: merchantTrust.badge,
            verified: merchantTrust.verified,
            warnings: merchantTrust.warnings
        },

        // Fake Deal
        fakeDeal: {
            isSuspicious: fakeDealCheck.isSuspicious,
            riskScore: fakeDealCheck.riskScore,
            riskLevel: fakeDealCheck.riskLevel,
            reasons: fakeDealCheck.warnings
        },

        // Forecast
        forecastIntel: {
            trend: trendIntel?.trend || 'stable',
            confidence: trendIntel?.confidence || 0,
            expectedPrice: trendIntel?.predictedPrice || currentPrice
        },

        // Final Verdict
        finalVerdict: {
            decision: strategicDecision,
            confidence: confidenceScore,
            reason: strategicReason,
            color: strategicColor,
            emoji,
            title,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            bestStore,
            bestPrice,
            bestLink
        }
    };
}

/* ================================
   💬 SMART CHAT ENGINE - NO API REQUIRED
================================ */

const CHAT_RESPONSES = {
    ar: {
        greeting: ['مرحباً! 👋 أنا Sage، مساعدك الذكي للتسوق. كيف يمكنني مساعدتك؟', 'أهلاً! 🔮 أنا هنا لمساعدتك في العثور على أفضل الصفقات!'],
        search: ['سأبحث لك عن أفضل الأسعار. ما المنتج الذي تريده؟', 'دعني أساعدك في العثور على أفضل عرض!'],
        price: ['هذا سعر جيد! 💰', 'أنصحك بالمقارنة مع متاجر أخرى', 'يمكنك انتظار العروض للحصول على سعر أفضل'],
        deal: ['صفقة ممتازة! 🎉 أنصحك بالشراء الآن', 'هذا عرض رائع! لا تفوته'],
        help: ['يمكنني مساعدتك في:\n• البحث عن المنتجات\n• مقارنة الأسعار\n• العثور على أفضل الصفقات\n• تحليل جودة العروض\n\nما الذي تحتاجه؟'],
        thanks: ['العفو! 😊 سعيد بمساعدتك', 'لا شكر على واجب! 💜'],
        goodbye: ['مع السلامة! 👋 نتمنى لك تسوقاً سعيداً', 'إلى اللقاء! 🌟'],
        general: ['كيف يمكنني مساعدتك في التسوق اليوم؟', 'أنا هنا لمساعدتك في العثور على أفضل الصفقات 🛍️'],
        unknown: ['لم أفهم سؤالك جيداً. هل يمكنك توضيح أكثر؟', 'هل يمكنك إعادة صياغة سؤالك؟']
    },
    en: {
        greeting: ['Hello! 👋 I\'m Sage, your smart shopping assistant. How can I help?', 'Hi! 🔮 I\'m here to help you find the best deals!'],
        search: ['I\'ll search for the best prices. What product do you need?', 'Let me help you find the best offer!'],
        price: ['That\'s a good price! 💰', 'I recommend comparing with other stores'],
        deal: ['Excellent deal! 🎉 I recommend buying now', 'This is a great offer! Don\'t miss it'],
        help: ['I can help you with:\n• Product search\n• Price comparison\n• Finding best deals\n• Analyzing offers\n\nWhat do you need?'],
        thanks: ['You\'re welcome! 😊 Happy to help', 'No problem! 💜'],
        goodbye: ['Goodbye! 👋 Happy shopping!', 'See you later! 🌟'],
        general: ['How can I help you shop today?', 'I\'m here to help you find the best deals 🛍️'],
        unknown: ['I didn\'t understand your question. Can you clarify?', 'Could you rephrase your question?']
    },
    fr: {
        greeting: ['Bonjour! 👋 Je suis Sage, votre assistant shopping. Comment puis-je vous aider?'],
        search: ['Je vais chercher les meilleurs prix. Quel produit cherchez-vous?'],
        price: ['C\'est un bon prix! 💰'],
        deal: ['Excellente affaire! 🎉'],
        help: ['Je peux vous aider à:\n• Rechercher des produits\n• Comparer les prix\n• Trouver les meilleures offres'],
        thanks: ['De rien! 😊'],
        goodbye: ['Au revoir! 👋'],
        general: ['Comment puis-je vous aider?'],
        unknown: ['Je n\'ai pas compris. Pouvez-vous préciser?']
    }
};

// Smart Intent Detection
function detectIntent(message, lang = 'ar') {
    const lower = message.toLowerCase();
    
    // Greeting patterns
    const greetings = {
        ar: ['مرحبا', 'اهلا', 'السلام', 'هلا', 'صباح', 'مساء'],
        en: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
        fr: ['bonjour', 'salut', 'bonsoir']
    };
    
    // Search patterns
    const searches = {
        ar: ['ابحث', 'بحث', 'دور', 'اوجد', 'احتاج', 'اريد', 'أبحث'],
        en: ['search', 'find', 'look', 'need', 'want', 'looking for'],
        fr: ['chercher', 'trouver', 'besoin', 'veux']
    };
    
    // Price patterns
    const prices = {
        ar: ['سعر', 'كم', 'بكم', 'غالي', 'رخيص', 'خصم', 'عرض'],
        en: ['price', 'cost', 'much', 'cheap', 'expensive', 'discount', 'deal'],
        fr: ['prix', 'coût', 'cher', 'pas cher', 'réduction']
    };
    
    // Deal patterns
    const deals = {
        ar: ['صفقة', 'عرض', 'تخفيض', 'خصم', 'افضل', 'أفضل'],
        en: ['deal', 'offer', 'sale', 'discount', 'best', 'bargain'],
        fr: ['offre', 'soldes', 'réduction', 'meilleur']
    };
    
    // Thanks patterns
    const thanks = {
        ar: ['شكرا', 'شكراً', 'مشكور', 'ممتن'],
        en: ['thanks', 'thank', 'thx', 'appreciate'],
        fr: ['merci', 'remercie']
    };
    
    // Goodbye patterns
    const goodbyes = {
        ar: ['وداع', 'مع السلامة', 'باي', 'الى اللقاء'],
        en: ['bye', 'goodbye', 'see you', 'later'],
        fr: ['au revoir', 'adieu', 'bye']
    };
    
    // Help patterns
    const helps = {
        ar: ['مساعدة', 'ساعد', 'كيف', 'ماذا', 'ماهو'],
        en: ['help', 'how', 'what', 'can you'],
        fr: ['aide', 'comment', 'quoi']
    };
    
    const langPatterns = greetings[lang] || greetings.en;
    const searchPatterns = searches[lang] || searches.en;
    const pricePatterns = prices[lang] || prices.en;
    const dealPatterns = deals[lang] || deals.en;
    const thanksPatterns = thanks[lang] || thanks.en;
    const goodbyePatterns = goodbyes[lang] || goodbyes.en;
    const helpPatterns = helps[lang] || helps.en;
    
    // Check patterns
    if (langPatterns.some(p => lower.includes(p))) return 'greeting';
    if (thanksPatterns.some(p => lower.includes(p))) return 'thanks';
    if (goodbyePatterns.some(p => lower.includes(p))) return 'goodbye';
    if (helpPatterns.some(p => lower.includes(p))) return 'help';
    if (searchPatterns.some(p => lower.includes(p))) return 'search';
    if (pricePatterns.some(p => lower.includes(p))) return 'price';
    if (dealPatterns.some(p => lower.includes(p))) return 'deal';
    
    return 'general';
}

// Generate Smart Response
function generateSmartResponse(message, lang = 'ar', context = {}) {
    const intent = detectIntent(message, lang);
    const responses = CHAT_RESPONSES[lang] || CHAT_RESPONSES.ar;
    
    // Get random response for the intent
    const intentResponses = responses[intent] || responses.general;
    const baseResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)];
    
    // Add context-aware enhancements
    let enhancedResponse = baseResponse;
    
    // If user mentioned a product, add helpful suggestion
    const productKeywords = ['هاتف', 'phone', 'laptop', 'لابتوب', 'ساعة', 'watch', 'سماعات', 'headphones'];
    const mentionedProduct = productKeywords.find(kw => message.toLowerCase().includes(kw));
    
    if (mentionedProduct && intent === 'search') {
        const suggestion = lang === 'ar' 
            ? `\n\n💡 نصيحة: استخدم شريط البحث أعلاه للحصول على أفضل الأسعار والتقييمات!`
            : `\n\n💡 Tip: Use the search bar above to get the best prices and ratings!`;
        enhancedResponse += suggestion;
    }
    
    return {
        reply: enhancedResponse,
        response: enhancedResponse,
        intent,
        sentiment: 'neutral',
        language: lang,
        suggestions: generateSuggestions(intent, lang)
    };
}

// Generate Suggestions
function generateSuggestions(intent, lang) {
    const suggestionMap = {
        ar: {
            greeting: ['ابحث عن هاتف', 'أفضل العروض', 'ساعدني في الاختيار'],
            search: ['مقارنة الأسعار', 'أفضل المتاجر', 'عروض اليوم'],
            price: ['ابحث عن أرخص', 'مقارنة الأسعار', 'انتظار الخصومات'],
            deal: ['شراء الآن', 'مقارنة مع أخرى', 'تقييم المنتج'],
            help: ['البحث عن منتج', 'تحليل السعر', 'العثور على صفقات'],
            general: ['ابحث عن منتج', 'ما هي العروض؟', 'ساعدني']
        },
        en: {
            greeting: ['Search for phone', 'Best deals', 'Help me choose'],
            search: ['Compare prices', 'Best stores', 'Today\'s offers'],
            price: ['Find cheaper', 'Price comparison', 'Wait for sales'],
            deal: ['Buy now', 'Compare options', 'Product review'],
            help: ['Search product', 'Price analysis', 'Find deals'],
            general: ['Search product', 'What deals?', 'Help me']
        }
    };
    
    const langSuggestions = suggestionMap[lang] || suggestionMap.en;
    return langSuggestions[intent] || langSuggestions.general;
}

// Main Chat Processor - WORKS WITHOUT API
async function processChatMessage(message, userId, lang = 'ar') {
    const cleanMessage = message.trim();
    
    if (!cleanMessage) {
        return {
            reply: CHAT_RESPONSES[lang]?.greeting?.[0] || CHAT_RESPONSES.ar.greeting[0],
            response: CHAT_RESPONSES[lang]?.greeting?.[0] || CHAT_RESPONSES.ar.greeting[0],
            intent: 'greeting',
            sentiment: 'neutral',
            language: lang
        };
    }
    
    // Try Gemini if available (optional enhancement)
    if (GEMINI_API_KEY) {
        try {
            const ai = new SageAIEngine();
            const prompt = `You are Sage, a smart shopping assistant. User says: "${cleanMessage}". Language: ${lang}.
            Respond helpfully about shopping, deals, prices. Keep response brief (max 100 words).
            Return JSON: {"reply": "your response", "intent": "${detectIntent(cleanMessage, lang)}", "suggestions": ["suggestion1", "suggestion2"]}`;
            
            const aiResult = await ai.callGemini(prompt);
            if (aiResult && aiResult.reply) {
                return {
                    reply: aiResult.reply,
                    response: aiResult.reply,
                    intent: aiResult.intent || detectIntent(cleanMessage, lang),
                    sentiment: 'neutral',
                    language: lang,
                    suggestions: aiResult.suggestions
                };
            }
        } catch (e) {
            console.log('AI chat fallback to smart response:', e.message);
        }
    }
    
    // Use smart fallback (NO API NEEDED)
    return generateSmartResponse(cleanMessage, lang);
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
        version: '6.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        gemini: GEMINI_API_KEY ? 'configured' : 'not_configured (smart_fallback_active)',
        database: dbConnected ? 'connected' : 'disconnected',
        chat: 'active (works without API)',
        features: ['ai_chat', 'smart_fallback_chat', 'price_intelligence', 'personality_engine', 'merchant_trust', 'fake_deal_detection', 'price_alerts', 'behavior_tracking', 'reviews']
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
        chat: '✅ Works Without API',
        endpoints: {
            chat: 'POST /chat - AI Shopping Assistant (Works without API!)',
            search: 'GET /search?q=product - Smart Product Search',
            analyze: 'POST /analyze - Deep Product Analysis',
            alerts: 'POST /alerts - Price Alerts',
            history: 'GET /history/:productId - Price History',
            profile: 'GET /profile/:userId - User Profile',
            reviews: 'GET /reviews - Get All Reviews',
            addReview: 'POST /reviews - Add New Review',
            helpfulReview: 'POST /reviews/:id/helpful - Mark Review Helpful',
            health: 'GET /health - Server Status'
        }
    });
});

// Chat Endpoint - FIXED
app.post('/chat', async (req, res) => {
    try {
        const { message, userId, lang = 'ar', history } = req.body;
        
        console.log('📩 Chat:', { message: message?.substring(0, 50), userId, lang });
        
        if (!message || typeof message !== 'string' || message.trim() === '') {
            const greetingResponses = CHAT_RESPONSES[lang]?.greeting || CHAT_RESPONSES.ar.greeting;
            return res.json({
                reply: greetingResponses[0],
                response: greetingResponses[0],
                intent: 'greeting',
                sentiment: 'neutral',
                language: lang
            });
        }
        
        // Track chat
        await trackUserBehavior(userId, 'chat', { query: message });
        
        // Process message
        const result = await processChatMessage(message.trim(), userId, lang);
        
        res.json({
            reply: result.reply,
            response: result.response,
            intent: result.intent,
            sentiment: result.sentiment,
            language: result.language,
            suggestions: result.suggestions
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

    // Check energy
    let energy = { searchesUsed: 0, hasFreePass: true };
    
    if (dbConnected) {
        try {
            energy = await Energy.findOne({ uid }) || await Energy.create({ uid });
            if (!energy.hasFreePass && energy.searchesUsed >= 3) {
                return res.status(429).json({ 
                    error: 'ENERGY_EMPTY',
                    message: 'Free searches exhausted. Please upgrade.'
                });
            }
        } catch (e) {}
    }

    // Check cache
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

        // Track search
        await trackUserBehavior(uid, 'search', { query: q });

        // Get user history for personalization
        const userHistory = await getUserHistory(uid);

        // Build results with intelligence
        const results = await Promise.all(baseResults.map(async (item, index) => {
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

            // Save to price history
            await savePriceHistory(product);

            // Get price history for this product
            let priceHistory = [];
            if (dbConnected) {
                try {
                    priceHistory = await PriceHistory.find({ title: { $regex: item.title?.substring(0, 30), $options: 'i' } })
                        .sort({ timestamp: -1 })
                        .limit(30)
                        .lean();
                } catch (e) {}
            }

            // Run Sage Core analysis
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

        // Update energy
        if (dbConnected && !energy.hasFreePass && uid !== 'guest') {
            try {
                energy.searchesUsed += 1;
                await energy.save();
            } catch (e) {}
        }

        const responseData = {
            query: q,
            results: results,
            personality: results[0]?.intelligence?.personalityIntel || null,
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

        // Track analysis
        await trackUserBehavior(userId, 'analysis', { productId: product.id, price: cleanPrice(product.price) });

        // Get price history
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

        // Get user history
        const userHistory = await getUserHistory(userId);

        // Run full analysis
        const intelligence = await SageCore(
            product,
            marketProducts || [],
            priceHistory,
            userHistory.userEvents,
            userId,
            userHistory.profile,
            lang
        );

        res.json({
            product,
            intelligence
        });

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

        console.log('🔔 Price Alert Created:', { userId, productId, targetPrice });
        
        res.json({ 
            success: true, 
            message: 'Alert created successfully',
            alertId: alert._id
        });
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

        const alerts = await PriceAlert.find({ userId, active: true })
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
        
        const history = await PriceHistory.find({
            $or: [
                { productId },
                { title: { $regex: productId, $options: 'i' } }
            ],
            timestamp: { $gte: since }
        })
        .sort({ timestamp: 1 })
        .lean();

        res.json({ 
            productId,
            history,
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

// User Profile Endpoint
app.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!dbConnected) {
            return res.json({ profile: null, message: 'Database not connected' });
        }

        const profile = await UserProfile.findOne({ userId }).lean();
        const recentBehavior = await UserBehavior.find({ userId })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

        res.json({
            profile,
            recentActivity: recentBehavior
        });
    } catch (error) {
        res.status(500).json({ error: 'PROFILE_FAILED' });
    }
});

/* ================================
   ⭐ REVIEWS API ENDPOINTS
================================ */

// GET /reviews - Get all reviews with today count
app.get('/reviews', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.json({
                success: true,
                reviews: [],
                todayCount: 0,
                message: 'Database not connected - reviews will not persist'
            });
        }

        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = await Review.countDocuments({
            createdAt: { $gte: today }
        });

        res.json({
            success: true,
            reviews: reviews,
            todayCount: todayCount,
            total: await Review.countDocuments()
        });

    } catch (error) {
        console.error('❌ Get Reviews Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'FETCH_REVIEWS_FAILED',
            message: error.message
        });
    }
});

// POST /reviews - Create new review
app.post('/reviews', async (req, res) => {
    try {
        const { name, text, rating } = req.body;

        if (!name || !text || !rating) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_FIELDS',
                message: 'Name, text, and rating are required'
            });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_RATING',
                message: 'Rating must be between 1 and 5'
            });
        }

        if (!dbConnected) {
            return res.json({
                success: true,
                message: 'Review received (demo mode - not persisted)',
                review: {
                    id: Date.now().toString(),
                    name: name.trim(),
                    text: text.trim(),
                    rating: ratingNum,
                    helpful: 0,
                    createdAt: new Date()
                }
            });
        }

        const review = await Review.create({
            name: name.trim(),
            text: text.trim(),
            rating: ratingNum
        });

        console.log('⭐ New Review:', { name: name.trim(), rating: ratingNum });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: review
        });

    } catch (error) {
        console.error('❌ Create Review Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'CREATE_REVIEW_FAILED',
            message: error.message
        });
    }
});

// POST /reviews/:id/helpful - Mark review as helpful
app.post('/reviews/:id/helpful', async (req, res) => {
    try {
        const { id } = req.params;

        if (!dbConnected) {
            return res.json({
                success: true,
                message: 'Marked as helpful (demo mode)'
            });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { $inc: { helpful: 1 } },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'REVIEW_NOT_FOUND',
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            helpful: review.helpful
        });

    } catch (error) {
        console.error('❌ Helpful Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'HELPFUL_FAILED',
            message: error.message
        });
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
            {
                headers: { 'x-api-key': NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
                timeout: 10000
            }
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
            const expectedSignature = crypto
                .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
                .update(payload)
                .digest('hex');
            if (signature !== expectedSignature) return res.status(403).json({ error: 'INVALID_SIGNATURE' });
        }

        const data = JSON.parse(payload);
        
        if (data.payment_status === 'finished' && dbConnected) {
            const uid = data.order_id;
            await Energy.findOneAndUpdate({ uid }, { hasFreePass: true, searchesUsed: 0 }, { upsert: true });
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

/* ================= SCHEDULED JOBS ================= */

// Check price alerts every hour
setInterval(async () => {
    if (!dbConnected) return;
    
    try {
        const activeAlerts = await PriceAlert.find({ active: true, notified: false })
            .limit(100);

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
    console.log(`💬 AI Chat: ${GEMINI_API_KEY ? '✅ Gemini + Smart Fallback' : '✅ Smart Fallback Active (No API needed)'}`);
    console.log(`🔍 Search: ${SEARCHAPI_KEY ? '✅ SearchAPI Active' : '❌ Not Configured'}`);
    console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '⚠️ Not Connected'}`);
    console.log(`⭐ Reviews: ✅ Active`);
    console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received'); process.exit(0); });
