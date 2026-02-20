/* =========================================
FINDLY SERVER v7.0 - WITH SAGE ULTIMATE AI
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

console.log('🚀 Findly Server v7.0 Starting with SAGE ULTIMATE AI...');

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
   🔮 SAGE CORE v5.0 - ULTIMATE SHOPPING INTELLIGENCE (EMBEDDED)
   ============================================================ */

// ================= UTILITY FUNCTIONS =================
function cleanPrice(p) { 
    if (!p) return 0; 
    if (typeof p === 'number') return p; 
    const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, '')); 
    return isNaN(cleaned) ? 0 : cleaned; 
}

function calculateMean(data) {
    if (!data || data.length === 0) return 0;
    return data.reduce((a, b) => a + b, 0) / data.length;
}

function calculateMedian(data) {
    if (!data || data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(data) {
    if (!data || data.length < 2) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

function removeOutliers(data) {
    if (!data || data.length < 4) return data;
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

function calculateSMA(data, period) {
    if (!data || data.length < period) return null;
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

function calculateEMA(data, period) {
    if (!data || data.length < period) return null;
    const multiplier = 2 / (period + 1);
    const result = [];
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
    }
    return result;
}

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
    return rsiValues;
}

function linearRegression(data) {
    if (!data || data.length < 2) return null;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    data.forEach((y, x) => {
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const meanY = sumY / n;
    let ssRes = 0, ssTot = 0;
    data.forEach((y, x) => {
        const predicted = slope * x + intercept;
        ssRes += Math.pow(y - predicted, 2);
        ssTot += Math.pow(y - meanY, 2);
    });
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    return { slope, intercept, rSquared };
}

// ================= TRANSLATIONS =================
const SAGE_TRANSLATIONS = {
    ar: {
        buy_now: "اشتري الآن", strong_buy: "شراء قوي", wait: "انتظر", overpriced: "السعر مرتفع جداً",
        fair_price: "سعر عادل", excellent_deal: "صفقة ممتازة", good_deal: "صفقة جيدة", bad_deal: "صفقة ضعيفة",
        insufficient_data: "بيانات غير كافية للتحليل", price_drop_expected: "متوقع انخفاض السعر",
        tip_wait_sale: "انتظر العروض القادمة", tip_buy_now: "السعر مناسب حالياً", tip_compare: "قارن مع خيارات أخرى",
        oversold: "السعر منخفض جداً - فرصة شراء", overbought: "السعر مرتفع جداً - انتظر",
        high_risk: "مخاطرة عالية", low_risk: "مخاطرة منخفضة", trusted_merchant: "تاجر موثوق"
    },
    en: {
        buy_now: "Buy Now", strong_buy: "Strong Buy", wait: "Wait", overpriced: "Overpriced",
        fair_price: "Fair Price", excellent_deal: "Excellent Deal", good_deal: "Good Deal", bad_deal: "Weak Deal",
        insufficient_data: "Insufficient data for analysis", price_drop_expected: "Price drop expected",
        tip_wait_sale: "Wait for upcoming sales", tip_buy_now: "Price is good right now", tip_compare: "Compare with other options",
        oversold: "Oversold - Buying Opportunity", overbought: "Overbought - Wait",
        high_risk: "High Risk", low_risk: "Low Risk", trusted_merchant: "Trusted Merchant"
    }
};

function t(lang, key) {
    const shortLang = (lang || "en").split("-")[0];
    return SAGE_TRANSLATIONS[shortLang]?.[key] || SAGE_TRANSLATIONS["en"][key] || key;
}

// ================= TRUSTED STORES =================
const TRUSTED_STORES = [
    'amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra',
    'apple', 'samsung', 'nike', 'adidas', 'zara', 'hm', 'ikea', 'costco',
    'target', 'bestbuy', 'newegg', 'bhphotovideo', 'argos', 'asos', 'farfetch',
    'carrefour', 'lulu', 'sharafdg', 'vodafone', 'stc', 'netflix'
];

// ================= PRICE INTELLIGENCE =================
class PriceIntelligence {
    static analyze(product, marketProducts = [], priceHistory = [], lang = 'ar') {
        const currentPrice = cleanPrice(product.price);
        const originalPrice = cleanPrice(product.originalPrice) || currentPrice;
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price || p)).filter(p => p > 0);

        if (marketPrices.length < 3) {
            return {
                priceIntel: {
                    current: currentPrice, original: originalPrice,
                    discount: originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0,
                    average: null, median: null, score: 50,
                    decision: t(lang, 'insufficient_data'), color: '#6b7280', confidence: 30
                },
                hasEnoughData: false
            };
        }

        const cleanedPrices = removeOutliers(marketPrices);
        const average = calculateMean(marketPrices);
        const median = calculateMedian(cleanedPrices);
        const min = Math.min(...cleanedPrices);
        const max = Math.max(...cleanedPrices);
        const stdDev = calculateStdDev(cleanedPrices);

        let score = 50, decision = t(lang, 'fair_price'), color = '#3b82f6', label = '';
        const priceRatio = currentPrice / median;

        // Enhanced scoring
        if (priceRatio < 0.70) {
            score = 95; decision = t(lang, 'excellent_deal'); color = '#059669';
            label = `🔥 أقل من ${Math.round((1 - priceRatio) * 100)}% من السوق`;
        } else if (priceRatio < 0.80) {
            score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981';
            label = `✨ صفقة ممتازة`;
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
        const discount = originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
        if (discount > 30 && score < 80) {
            score = Math.min(90, score + 15);
        }

        // Technical analysis
        let technicalIndicators = null;
        let trend = null;

        if (priceHistory && priceHistory.length >= 5) {
            const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
            if (prices.length >= 5) {
                const rsi = calculateRSI(prices);
                const lastRSI = rsi ? rsi[rsi.length - 1] : null;

                technicalIndicators = {
                    rsi: lastRSI,
                    rsiSignal: lastRSI ? (lastRSI < 30 ? 'oversold' : lastRSI > 70 ? 'overbought' : 'neutral') : null,
                    volatility: stdDev / average > 0.1 ? 'high' : stdDev / average > 0.05 ? 'medium' : 'low'
                };

                // Adjust score based on RSI
                if (technicalIndicators.rsiSignal === 'oversold' && score < 80) {
                    score = Math.min(95, score + 10);
                    label += ' | RSI: تشبع بيعي';
                }

                // Trend prediction
                const regression = linearRegression(prices);
                if (regression && regression.rSquared > 0.5) {
                    trend = {
                        direction: regression.slope < 0 ? 'falling' : 'rising',
                        confidence: Math.round(regression.rSquared * 100)
                    };
                }
            }
        }

        // Percentile
        const sortedPrices = [...cleanedPrices].sort((a, b) => a - b);
        const position = sortedPrices.filter(p => p < currentPrice).length;
        const percentile = Math.round((position / sortedPrices.length) * 100);

        return {
            priceIntel: {
                current: currentPrice, original: originalPrice, discount,
                average: Math.round(average * 100) / 100,
                median: Math.round(median * 100) / 100,
                min, max, stdDev: Math.round(stdDev * 100) / 100,
                score, decision, label, color,
                percentile,
                confidence: Math.min(100, 40 + marketPrices.length * 3 + (priceHistory?.length || 0) * 2)
            },
            trendIntel: trend,
            technicalIndicators,
            hasEnoughData: true,
            marketStats: { competitors: marketPrices.length, priceVariation: Math.round(((max - min) / median) * 100) }
        };
    }
}

// ================= MERCHANT TRUST =================
class MerchantTrustEngine {
    static evaluate(storeData, productData = {}, lang = 'ar') {
        const store = (storeData.source || storeData.store || 'Unknown').toLowerCase();
        let trustScore = 50;
        const factors = [], warnings = [];

        if (TRUSTED_STORES.some(s => store.includes(s))) {
            trustScore += 30;
            factors.push({ factor: 'known_brand', impact: +30 });
        }

        if (productData.price && productData.marketAverage && cleanPrice(productData.price) < productData.marketAverage * 0.5) {
            trustScore -= 25;
            warnings.push('السعر منخفض بشكل مشبوه');
        }

        const badge = trustScore >= 85 ? { level: 'platinum', icon: '🏆' } :
                      trustScore >= 75 ? { level: 'gold', icon: '🥇' } :
                      trustScore >= 65 ? { level: 'silver', icon: '🥈' } :
                      trustScore >= 50 ? { level: 'bronze', icon: '🥉' } :
                      trustScore >= 35 ? { level: 'warning', icon: '⚠️' } :
                      { level: 'danger', icon: '🚨' };

        return {
            store: storeData.source || storeData.store || 'Unknown',
            trustScore: Math.max(0, Math.min(100, trustScore)),
            badge, factors, warnings
        };
    }
}

// ================= FAKE DEAL DETECTOR =================
class FakeDealDetector {
    static detect(product, marketProducts, lang = 'ar') {
        const warnings = [];
        const riskFactors = [];
        let riskScore = 0;

        const currentPrice = cleanPrice(product.price);
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);

        if (marketPrices.length >= 3) {
            const avg = calculateMean(marketPrices);
            const min = Math.min(...marketPrices);

            if (currentPrice < avg * 0.5) {
                warnings.push('السعر منخفض بشكل غير طبيعي');
                riskFactors.push({ factor: 'extremely_low_price', severity: 'critical' });
                riskScore += 50;
            } else if (currentPrice < avg * 0.6) {
                warnings.push('السعر مشبوه');
                riskScore += 35;
            }

            if (currentPrice > min * 1.5) {
                warnings.push('السعر أعلى بكثير من المنافسين');
                riskScore += 20;
            }
        }

        // Discount check
        const originalPrice = cleanPrice(product.originalPrice);
        if (originalPrice > currentPrice) {
            const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
            if (discountPercent > 80) {
                riskScore += 45;
                warnings.push('خصم غير واقعي');
            } else if (discountPercent > 60) {
                riskScore += 25;
            }
        }

        // Trusted store bonus
        const store = (product.source || '').toLowerCase();
        if (TRUSTED_STORES.some(s => store.includes(s))) {
            riskScore = Math.max(0, riskScore - 15);
        }

        return {
            isSuspicious: riskScore >= 40,
            riskScore: Math.min(100, riskScore),
            riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low',
            warnings, riskFactors
        };
    }
}

// ================= PERSONALITY ENGINE =================
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
            hunter: { description: 'يبحث عن أقل سعر', style: 'صياد الصفقات', icon: '🎯' },
            analyst: { description: 'يفضل التحليل', style: 'المحلل', icon: '📊' },
            impulse: { description: 'قرارات سريعة', style: 'المتسرع', icon: '⚡' },
            premium: { description: 'يهتم بالجودة', style: 'محب الجودة', icon: '💎' },
            budget: { description: 'محدود الميزانية', style: 'المخطط', icon: '💰' },
            neutral: { description: 'سلوك متوازن', style: 'متوازن', icon: '⚖️' }
        };

        return { type: dominant, scores, confidence: Math.min(100, maxScore), traits: traits[dominant] };
    }

    static personalize(personality, product, marketData, lang) {
        const price = cleanPrice(product.price);
        const avg = marketData.average || price;
        const priceRatio = price / avg;

        switch (personality.type) {
            case 'hunter':
                if (priceRatio <= 0.80) return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 90 };
                return { action: 'wait', reason: t(lang, 'tip_wait_sale'), confidence: 70 };
            case 'analyst':
                return { action: 'compare', reason: t(lang, 'tip_compare'), confidence: 75 };
            case 'impulse':
                if (priceRatio <= 1.05) return { action: 'buy_now', reason: 'السعر مناسب', confidence: 80 };
                return { action: 'consider', reason: t(lang, 'tip_compare'), confidence: 60 };
            case 'premium':
                return { action: 'buy_now', reason: 'منتج مميز', confidence: 75 };
            case 'budget':
                if (priceRatio <= 0.70) return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 90 };
                return { action: 'search_alternative', reason: 'ابحث عن بديل أرخص', confidence: 70 };
            default:
                return { action: priceRatio <= 0.95 ? 'buy_now' : 'wait', reason: priceRatio <= 0.95 ? t(lang, 'good_deal') : t(lang, 'tip_wait_sale'), confidence: 60 };
        }
    }
}

// ================= PRICE PREDICTOR =================
class PricePredictor {
    static predict(priceHistory, days = 7) {
        if (!priceHistory || priceHistory.length < 5) return { confidence: 0, prediction: null };

        const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
        if (prices.length < 5) return { confidence: 0, prediction: null };

        const regression = linearRegression(prices);
        if (!regression || regression.rSquared < 0.3) return { confidence: 0, prediction: null };

        const predictedPrice = regression.slope * (prices.length + days) + regression.intercept;
        const direction = regression.slope < 0 ? 'down' : 'up';

        return {
            confidence: Math.round(regression.rSquared * 100),
            prediction: {
                price: Math.max(0, predictedPrice),
                direction,
                change: Math.round(regression.slope * 100)
            }
        };
    }
}

// ================= RECOMMENDATION ENGINE =================
class RecommendationEngine {
    static generate(analysis, product, lang) {
        const recommendations = [];
        const priceScore = analysis.priceIntel?.score || 50;
        const riskScore = analysis.trustIntel?.overallRisk || 0;

        // Primary recommendation
        if (riskScore >= 60) {
            recommendations.push({ type: 'primary', action: 'avoid', reason: 'تجنب هذا العرض', confidence: 90 });
        } else if (priceScore >= 85) {
            recommendations.push({ type: 'primary', action: 'strong_buy', reason: t(lang, 'excellent_deal'), confidence: 90 });
        } else if (priceScore >= 70) {
            recommendations.push({ type: 'primary', action: 'buy', reason: t(lang, 'good_deal'), confidence: 80 });
        } else if (priceScore <= 40) {
            recommendations.push({ type: 'primary', action: 'wait', reason: t(lang, 'overpriced'), confidence: 70 });
        } else {
            recommendations.push({ type: 'primary', action: 'consider', reason: t(lang, 'fair_price'), confidence: 60 });
        }

        // Trend-based recommendation
        if (analysis.trendIntel?.direction === 'falling' && priceScore < 75) {
            recommendations.push({ type: 'timing', action: 'wait', reason: t(lang, 'price_drop_expected'), confidence: 75 });
        }

        return recommendations;
    }
}

// ================= SAGE AI ENGINE (GEMINI) =================
class SageAIEngine {
    constructor(apiKey = null) {
        this.apiKey = apiKey || GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateAdvice(product, analysis, lang = 'ar') {
        if (!this.apiKey) return this.getFallbackAdvice(analysis, lang);

        try {
            const prompt = `You are a shopping advisor. Product: "${product.title}", Price: ${product.price}.
Price Score: ${analysis.priceIntel?.score || 50}/100. Language: ${lang}.
Return JSON: {"advice": "brief advice", "tip": "tip", "confidence": 0-100}`;

            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 256 } },
                { timeout: 8000 }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Silent fallback
        }

        return this.getFallbackAdvice(analysis, lang);
    }

    getFallbackAdvice(analysis, lang) {
        const score = analysis.priceIntel?.score || 50;
        if (score >= 80) return { advice: t(lang, 'excellent_deal'), tip: t(lang, 'tip_buy_now'), confidence: 85 };
        if (score >= 60) return { advice: t(lang, 'good_deal'), tip: t(lang, 'tip_compare'), confidence: 70 };
        return { advice: t(lang, 'tip_wait_sale'), tip: t(lang, 'tip_wait_sale'), confidence: 60 };
    }
}

// ================= MAIN SAGE CORE FUNCTION =================
async function SageCore(product, marketProducts = [], priceHistory = [], userEvents = {}, userId = 'guest', userHistory = {}, lang = 'ar') {
    const currentPrice = cleanPrice(product.price);

    // 1. Price Intelligence
    const priceAnalysis = PriceIntelligence.analyze(product, marketProducts, priceHistory, lang);
    
    if (!priceAnalysis.hasEnoughData) {
        return {
            ...priceAnalysis,
            finalVerdict: { decision: 'INSUFFICIENT_DATA', confidence: 30, recommendation: t(lang, 'insufficient_data') }
        };
    }

    const { priceIntel, trendIntel, technicalIndicators, marketStats } = priceAnalysis;

    // 2. Personality Analysis
    const personality = PersonalityEngine.analyze(userEvents, currentPrice, priceIntel.median, userHistory);

    // 3. Merchant Trust
    const merchantTrust = MerchantTrustEngine.evaluate(product, { price: currentPrice, marketAverage: priceIntel.median }, lang);

    // 4. Fake Deal Detection
    const fakeDealCheck = FakeDealDetector.detect(product, marketProducts, lang);

    // 5. Price Prediction
    const pricePrediction = PricePredictor.predict(priceHistory);

    // 6. AI Insights (with fallback)
    const ai = new SageAIEngine();
    let aiInsights = null;
    try {
        aiInsights = await ai.generateAdvice(product, { priceIntel, trendIntel, technicalIndicators }, lang);
    } catch (e) {
        aiInsights = ai.getFallbackAdvice({ priceIntel }, lang);
    }

    // 7. Personalized Recommendation
    const personalizedRec = PersonalityEngine.personalize(personality, product, { average: priceIntel.median }, lang);

    // 8. Recommendations
    const allAnalysis = {
        priceIntel, trendIntel, technicalIndicators,
        trustIntel: { merchantTrust, fakeDealCheck, overallRisk: fakeDealCheck.riskScore }
    };
    const recommendations = RecommendationEngine.generate(allAnalysis, product, lang);

    // 9. Best Store
    let bestStore = null, bestPrice = currentPrice, bestLink = product.link || null;
    let alternatives = [];
    
    if (marketProducts && marketProducts.length > 0) {
        const sortedByPrice = [...marketProducts]
            .filter(p => cleanPrice(p.product_price || p.price) > 0)
            .sort((a, b) => cleanPrice(a.product_price || a.price) - cleanPrice(b.product_price || b.price));
        
        if (sortedByPrice.length > 0) {
            const cheapest = sortedByPrice[0];
            const cheapestPrice = cleanPrice(cheapest.product_price || cheapest.price);
            
            if (cheapestPrice < currentPrice) {
                bestStore = cheapest.source || cheapest.store || 'Unknown';
                bestPrice = cheapestPrice;
                bestLink = cheapest.link || null;
            }
            
            alternatives = sortedByPrice.slice(0, 3).map(p => ({
                store: p.source || p.store || 'Unknown',
                price: cleanPrice(p.product_price || p.price),
                link: p.link || null,
                savings: Math.round((1 - cleanPrice(p.product_price || p.price) / currentPrice) * 100)
            }));
        }
    }

    // 10. Final Verdict
    const savingsPercent = priceIntel.median ? Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
    
    const confidenceScore = Math.round(
        (priceIntel.confidence * 0.35) +
        ((100 - fakeDealCheck.riskScore) * 0.25) +
        (merchantTrust.trustScore * 0.20) +
        (personality.confidence * 0.10) +
        ((trendIntel?.confidence || 50) * 0.10)
    );

    let strategicDecision = 'WAIT', strategicReason = '', strategicColor = '#f59e0b', urgency = 'medium';

    if (fakeDealCheck.riskScore >= 60) {
        strategicDecision = 'AVOID'; strategicReason = 'عرض مشبوه'; strategicColor = '#dc2626'; urgency = 'none';
    } else if (merchantTrust.trustScore < 30) {
        strategicDecision = 'CAUTION'; strategicReason = 'تاجر غير موثوق'; strategicColor = '#f59e0b'; urgency = 'low';
    } else if (priceIntel.score >= 85 && fakeDealCheck.riskScore < 25) {
        strategicDecision = 'STRONG_BUY'; strategicReason = `صفقة ممتازة! وفر ${savingsPercent}%`; strategicColor = '#059669'; urgency = 'high';
    } else if (priceIntel.score >= 75 && trendIntel?.direction !== 'falling') {
        strategicDecision = 'BUY_NOW'; strategicReason = t(lang, 'excellent_deal'); strategicColor = '#10b981'; urgency = 'high';
    } else if (priceIntel.score >= 65 && fakeDealCheck.riskScore < 35) {
        strategicDecision = 'BUY'; strategicReason = t(lang, 'good_deal'); strategicColor = '#22c55e'; urgency = 'medium';
    } else if (trendIntel?.direction === 'falling' && priceIntel.score < 75) {
        strategicDecision = 'SMART_WAIT'; strategicReason = t(lang, 'price_drop_expected'); strategicColor = '#3b82f6'; urgency = 'low';
    } else if (priceIntel.score <= 40) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'overpriced'); strategicColor = '#ef4444'; urgency = 'none';
    } else {
        strategicDecision = 'CONSIDER'; strategicReason = t(lang, 'fair_price'); strategicColor = '#6366f1'; urgency = 'low';
    }

    // Apply personality override
    if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID' && strategicDecision !== 'CAUTION') {
        if (personality.type === 'impulse' && priceIntel.score >= 50) {
            strategicDecision = 'BUY_NOW'; strategicReason = personalizedRec.reason; urgency = 'high';
        }
    }

    // RSI signal bonus
    if (technicalIndicators?.rsiSignal === 'oversold' && strategicDecision !== 'AVOID') {
        strategicReason += ' | RSI: فرصة شراء';
    }

    return {
        priceIntel: {
            ...priceIntel,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0
        },
        valueIntel: {
            score: priceIntel.score,
            competitors: marketStats.competitors,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0
        },
        trendIntel: {
            ...trendIntel,
            technicalIndicators,
            prediction: pricePrediction.prediction
        },
        trustIntel: {
            merchantTrust,
            fakeDealCheck,
            overallRisk: fakeDealCheck.riskScore,
            riskLevel: fakeDealCheck.riskLevel
        },
        personalityIntel: {
            type: personality.type,
            confidence: personality.confidence,
            traits: personality.traits
        },
        recommendationIntel: {
            primary: recommendations[0],
            all: recommendations,
            aiInsights
        },
        marketIntel: {
            alternatives,
            bestStore, bestPrice, bestLink,
            competitorCount: marketStats.competitors,
            marketPosition: priceIntel.percentile
        },
        finalVerdict: {
            decision: strategicDecision,
            confidence: confidenceScore,
            reason: strategicReason,
            color: strategicColor,
            urgency,
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            bestStore, bestPrice, bestLink
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

// Search with SAGE Ultimate
app.get('/search', async (req, res) => {
    const { q, lang = 'ar' } = req.query;
    if (!q || !q.trim()) return res.json({ success: false, results: [], error: 'no_query' });

    const auth = await authenticateUser(req);
    let energy = { searchesUsed: 0, hasFreePass: false };

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

        // Process with SAGE Ultimate (async)
        const results = [];
        for (const item of rawResults) {
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown',
                price: item.price || '$0',
                originalPrice: item.original_price || null,
                link: item.product_link || item.link || '',
                thumbnail: item.thumbnail || item.product_image || '',
                source: item.source || 'Google Shopping'
            };

            // Call SAGE Ultimate
            const intelligence = await SageCore(product, rawResults, [], {}, 'guest', {}, lang);
            results.push({ ...product, intelligence });
        }

        if (dbConnected && !energy.hasFreePass) {
            await Energy.updateOne({ uid: auth.uid }, { $inc: { searchesUsed: 1 } });
            energy.searchesUsed++;
        }

        const response = {
            success: true, query: q, results,
            energy: { left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed), limit: energy.hasFreePass ? '∞' : 3 },
            user: { isGuest: auth.isGuest, uid: auth.isGuest ? 'guest' : auth.uid },
            sage: { version: '5.0 Ultimate', features: ['RSI', 'Trend Prediction', 'Fake Deal Detection', 'Personality Analysis'] }
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
            const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            await Energy.findOneAndUpdate(
                { uid: data.order_id },
                { hasFreePass: true, wasPro: true, searchesUsed: 0, proExpiresAt: expires },
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
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Findly Server v7.0 with SAGE ULTIMATE AI running on port ${PORT}`));
