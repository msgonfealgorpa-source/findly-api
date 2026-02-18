/* =========================================
FINDLY SERVER v6.1 - COMPLETE FIXED VERSION
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

app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.options("*", cors());
app.use(express.json({ limit: '10mb' }));

const MONGO_URI = process.env.MONGO_URI || '';
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

console.log('🚀 Findly Sage Server v6.1 Starting...');

const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 2;

const getCache = (key) => {
    const cached = searchCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.time > CACHE_TTL) { searchCache.delete(key); return null; }
    return cached.data;
};

const setCache = (key, data) => { searchCache.set(key, { time: Date.now(), data }); };

let dbConnected = false;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI).then(() => { console.log('✅ MongoDB Connected'); dbConnected = true; }).catch(e => console.log('❌ MongoDB Error:', e.message));
}

// Schemas
const EnergySchema = new mongoose.Schema({ uid: { type: String, unique: true, required: true }, searchesUsed: { type: Number, default: 0 }, hasFreePass: { type: Boolean, default: false } });
const PriceHistorySchema = new mongoose.Schema({ productId: { type: String, index: true }, title: String, price: Number, store: String, source: String, thumbnail: String, link: String, timestamp: { type: Date, default: Date.now, index: true } });
const UserBehaviorSchema = new mongoose.Schema({ userId: { type: String, index: true }, eventType: { type: String, enum: ['search', 'view', 'click', 'wishlist', 'purchase', 'chat'] }, productId: String, query: String, price: Number, metadata: mongoose.Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } });
const PriceAlertSchema = new mongoose.Schema({ userId: String, productId: String, productTitle: String, productImage: String, productLink: String, targetPrice: Number, currentPrice: Number, active: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now } });
const UserProfileSchema = new mongoose.Schema({ userId: { type: String, unique: true }, personality: String, preferences: { categories: [String], brands: [String], priceRange: { min: Number, max: Number } }, stats: { totalSearches: { type: Number, default: 0 }, totalSaved: { type: Number, default: 0 } }, lastActive: { type: Date, default: Date.now } });
const ReviewSchema = new mongoose.Schema({ name: { type: String, required: true }, text: { type: String, required: true }, rating: { type: Number, required: true, min: 1, max: 5 }, helpful: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } });

const Energy = mongoose.model('Energy', EnergySchema);
const PriceHistory = mongoose.model('PriceHistory', PriceHistorySchema);
const UserBehavior = mongoose.model('UserBehavior', UserBehaviorSchema);
const PriceAlert = mongoose.model('PriceAlert', PriceAlertSchema);
const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
const Review = mongoose.model('Review', ReviewSchema);

// ================= SAGE CORE ENGINE =================
const SAGE_TRANSLATIONS = {
    ar: { buy_now: "اشتري الآن", wait: "انتظر", overpriced: "السعر مرتفع", fair_price: "سعر عادل", excellent_deal: "صفقة ممتازة", good_deal: "صفقة جيدة", insufficient_data: "بيانات غير كافية", fake_offer: "عرض مشبوه", price_drop_expected: "متوقع انخفاض السعر", trusted_merchant: "تاجر موثوق" },
    en: { buy_now: "Buy Now", wait: "Wait", overpriced: "Overpriced", fair_price: "Fair Price", excellent_deal: "Excellent Deal", good_deal: "Good Deal", insufficient_data: "Insufficient data", fake_offer: "Suspicious offer", price_drop_expected: "Price drop expected", trusted_merchant: "Trusted Merchant" }
};

function t(lang, key) { return SAGE_TRANSLATIONS[lang?.split("-")[0] || "en"]?.[key] || SAGE_TRANSLATIONS["en"][key] || key; }
function cleanPrice(p) { if (!p) return 0; const c = parseFloat(p.toString().replace(/[^0-9.]/g, '')); return isNaN(c) ? 0 : c; }

function removeOutliers(data) {
    if (data.length < 4) return data;
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

// Sage Core Analysis
async function SageCore(product, marketProducts = [], priceHistory = [], userEvents = {}, userId = 'guest', userHistory = {}, lang = 'ar') {
    const currentPrice = cleanPrice(product.price);
    const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);

    // Price Analysis
    let priceIntel = { current: currentPrice, average: null, median: null, score: 50, decision: t(lang, 'insufficient_data'), color: '#6b7280', confidence: 30 };
    let hasEnoughData = false;
    let marketStats = { competitors: 0, priceVariation: 0 };

    if (marketPrices.length >= 3) {
        hasEnoughData = true;
        const sorted = [...marketPrices].sort((a, b) => a - b);
        const cleaned = removeOutliers(sorted);
        const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
        const median = cleaned[Math.floor(cleaned.length / 2)];
        const min = Math.min(...cleaned);
        const max = Math.max(...cleaned);

        let score = 50, decision = t(lang, 'fair_price'), color = '#3b82f6';
        if (currentPrice < median * 0.85) { score = 85; decision = t(lang, 'excellent_deal'); color = '#10b981'; }
        else if (currentPrice < median * 0.95) { score = 70; decision = t(lang, 'good_deal'); color = '#22c55e'; }
        else if (currentPrice > median * 1.15) { score = 25; decision = t(lang, 'overpriced'); color = '#ef4444'; }
        else if (currentPrice > median * 1.05) { score = 40; decision = t(lang, 'wait'); color = '#f59e0b'; }

        priceIntel = { current: currentPrice, average: Math.round(average * 100) / 100, median: Math.round(median * 100) / 100, min, max, score, decision, color, confidence: Math.min(100, 40 + marketPrices.length * 3) };
        marketStats = { competitors: marketPrices.length, priceVariation: Math.round(((max - min) / median) * 100) };
    }

    // Personality
    const personalities = { hunter: 0, analyst: 0, impulse: 0, premium: 0, budget: 0 };
    if (userEvents?.wishlistAdditions > 3) personalities.hunter += 20;
    if (userEvents?.clickedAnalysis) personalities.analyst += 20;
    if (userEvents?.quickPurchases > 2) personalities.impulse += 30;
    
    let dominantPersonality = 'neutral';
    let maxScore = 0;
    Object.entries(personalities).forEach(([p, s]) => { if (s > maxScore) { maxScore = s; dominantPersonality = p; } });
    
    const personalityTraits = {
        hunter: { name: 'صياد الصفقات', desc: 'تبحث عن أفضل العروض', icon: '🎯' },
        analyst: { name: 'المحلل', desc: 'تحلل قبل الشراء', icon: '🔬' },
        impulse: { name: 'المتسرع', desc: 'تتخذ قرارات سريعة', icon: '⚡' },
        premium: { name: 'محب الجودة', desc: 'تهتم بالجودة', icon: '💎' },
        budget: { name: 'الموفر', desc: 'توفر المال', icon: '💰' },
        neutral: { name: 'متوازن', desc: 'سلوك متوازن', icon: '🎯' }
    };

    const personality = { type: dominantPersonality, confidence: Math.min(100, maxScore), traits: personalityTraits[dominantPersonality], icon: personalityTraits[dominantPersonality].icon };

    // Merchant Trust
    const store = product.source || 'Unknown';
    const trustedStores = ['amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 'apple', 'samsung'];
    let trustScore = 50;
    if (trustedStores.some(s => store.toLowerCase().includes(s))) trustScore += 25;
    if (hasEnoughData && currentPrice < priceIntel.median * 0.5) trustScore -= 20;

    const merchantTrust = { name: store, score: trustScore, verified: trustScore >= 70, badge: trustScore >= 80 ? '🥇' : trustScore >= 60 ? '🥈' : '⚠️' };

    // Fake Deal Detection
    let fakeDeal = { isSuspicious: false, riskScore: 0, riskLevel: 'low', reasons: [] };
    if (hasEnoughData && currentPrice < priceIntel.average * 0.5) {
        fakeDeal = { isSuspicious: true, riskScore: 40, riskLevel: 'medium', reasons: [t(lang, 'fake_offer')] };
    }

    // Trend Analysis
    let trendIntel = { trend: 'stable', confidence: 50, predictedPrice: currentPrice };
    if (priceHistory && priceHistory.length >= 5) {
        const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
        if (prices.length >= 5) {
            const recent = prices.slice(-5);
            const older = prices.slice(-10, -5);
            if (older.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                if (recentAvg < olderAvg * 0.95) trendIntel = { trend: 'falling', confidence: 60, predictedPrice: recentAvg * 0.97 };
                else if (recentAvg > olderAvg * 1.05) trendIntel = { trend: 'rising', confidence: 60, predictedPrice: recentAvg * 1.03 };
            }
        }
    }

    // Best Store
    let bestStore = null, bestPrice = currentPrice, bestLink = product.link;
    if (marketProducts.length > 0) {
        const cheapest = marketProducts.reduce((min, item) => {
            const p = cleanPrice(item.product_price || item.price);
            if (!p) return min;
            if (!min || p < min.price) return { price: p, store: item.source || 'Unknown', link: item.link };
            return min;
        }, null);
        if (cheapest && cheapest.price < currentPrice) { bestStore = cheapest.store; bestPrice = cheapest.price; bestLink = cheapest.link; }
    }

    // Final Verdict
    const savingsPercent = priceIntel.median ? Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
    const confidenceScore = Math.round((priceIntel.confidence * 0.4) + ((100 - fakeDeal.riskScore) * 0.3) + (trustScore * 0.3));

    let decision = 'WAIT', reason = '', emoji = '⏳', title = '', color = '#f59e0b';
    if (fakeDeal.isSuspicious) { decision = 'AVOID'; reason = 'عرض مشبوه'; emoji = '🚫'; title = 'تجنب'; color = '#ef4444'; }
    else if (trustScore < 30) { decision = 'CAUTION'; reason = 'تاجر غير موثوق'; emoji = '⚠️'; title = 'حذر'; color = '#f59e0b'; }
    else if (priceIntel.score >= 75) { decision = 'BUY_NOW'; reason = `صفقة ممتازة - وفر ${savingsPercent}%`; emoji = '🎯'; title = 'اشترِ الآن'; color = '#10b981'; }
    else if (priceIntel.score >= 60) { decision = 'BUY'; reason = t(lang, 'good_deal'); emoji = '✅'; title = 'صفقة جيدة'; color = '#22c55e'; }
    else if (trendIntel.trend === 'falling') { decision = 'WAIT'; reason = t(lang, 'price_drop_expected'); emoji = '📉'; title = 'انتظر'; color = '#3b82f6'; }
    else if (priceIntel.score <= 40) { decision = 'WAIT'; reason = t(lang, 'overpriced'); emoji = '🔴'; title = 'السعر مرتفع'; color = '#ef4444'; }
    else { decision = 'CONSIDER'; reason = t(lang, 'fair_price'); emoji = '🤔'; title = 'فكر فيه'; color = '#3b82f6'; }

    // Deal Quality
    const dealQuality = { score: Math.round((priceIntel.score * 0.5) + ((100 - fakeDeal.riskScore) * 0.3) + (trustScore * 0.2)), label: priceIntel.score >= 70 ? 'ممتازة' : priceIntel.score >= 50 ? 'جيدة' : 'ضعيفة' };

    // Recommendations
    const recommendations = [];
    if (marketProducts.length > 1) {
        marketProducts.slice(0, 3).forEach(p => {
            const pPrice = cleanPrice(p.product_price || p.price);
            if (pPrice < currentPrice && p.title !== product.title) {
                recommendations.push({ title: p.title, price: pPrice, image: p.thumbnail, savings: currentPrice - pPrice });
            }
        });
    }

    return {
        priceIntel,
        valueIntel: { score: priceIntel.score, competitors: marketStats.competitors, savingsPercent, savingsAmount: priceIntel.median ? priceIntel.median - currentPrice : 0, learningBoost: userEvents?.clickedAnalysis ? 10 : 0 },
        trendIntel,
        trustIntel: { riskScore: fakeDeal.riskScore, riskLevel: fakeDeal.riskLevel, warnings: fakeDeal.reasons },
        personalityIntel: personality,
        merchantTrust,
        fakeDeal,
        forecastIntel: trendIntel,
        dealQuality,
        recommendationIntel: { alternatives: recommendations.slice(0, 3) },
        finalVerdict: { decision, confidence: confidenceScore, reason, color, emoji, title, savingsPercent, savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0, bestStore, bestPrice, bestLink }
    };
}

// ================= SMART CHAT ENGINE =================
const CHAT_RESPONSES = {
    ar: {
        greeting: ['مرحباً! 👋 أنا Sage، مساعدك الذكي للتسوق. كيف يمكنني مساعدتك؟', 'أهلاً! 🔮 أنا هنا لمساعدتك في العثور على أفضل الصفقات!'],
        search: ['سأبحث لك عن أفضل الأسعار. ما المنتج الذي تريده؟', 'دعني أساعدك! اكتب اسم المنتج في شريط البحث أعلاه 🔍'],
        price: ['هذا سعر جيد! 💰 أنقح بالبحث أكثر', 'يمكنك مقارنة الأسعار باستخدام شريط البحث'],
        deal: ['صفقة ممتازة! 🎉 أنصحك بالشراء الآن', 'هذا عرض رائع! لا تفوته'],
        help: ['يمكنني مساعدتك في:\n• البحث عن المنتجات\n• مقارنة الأسعار\n• العثور على أفضل الصفقات\n\nاستخدم شريط البحث أعلاه! 🔍'],
        thanks: ['العفو! 😊 سعيد بمساعدتك', 'لا شكر على واجب! 💜'],
        goodbye: ['مع السلامة! 👋', 'إلى اللقاء! 🌟'],
        general: ['كيف يمكنني مساعدتك؟ 🛍️', 'أنا هنا لمساعدتك! اسألني عن أي منتج 🛒']
    },
    en: {
        greeting: ['Hello! 👋 I\'m Sage, your shopping assistant. How can I help?', 'Hi! 🔮 I\'m here to help you find the best deals!'],
        search: ['I\'ll search for the best prices. Use the search bar above! 🔍', 'Let me help! Type the product name in the search bar'],
        price: ['That\'s a good price! 💰', 'You can compare prices using the search bar above'],
        deal: ['Excellent deal! 🎉', 'This is a great offer! Don\'t miss it'],
        help: ['I can help you:\n• Search for products\n• Compare prices\n• Find best deals\n\nUse the search bar above! 🔍'],
        thanks: ['You\'re welcome! 😊', 'Happy to help! 💜'],
        goodbye: ['Goodbye! 👋', 'See you! 🌟'],
        general: ['How can I help you? 🛍️', 'I\'m here to help! Ask me about any product 🛒']
    }
};

function detectIntent(message, lang = 'ar') {
    const lower = message.toLowerCase();
    const patterns = {
        greeting: lang === 'ar' ? ['مرحبا', 'اهلا', 'السلام', 'هلا'] : ['hello', 'hi', 'hey'],
        search: lang === 'ar' ? ['ابحث', 'بحث', 'دور', 'احتاج', 'اريد'] : ['search', 'find', 'need', 'want', 'looking'],
        price: lang === 'ar' ? ['سعر', 'كم', 'بكم', 'غالي', 'رخيص'] : ['price', 'cost', 'much', 'cheap', 'expensive'],
        deal: lang === 'ar' ? ['صفقة', 'عرض', 'تخفيض', 'خصم'] : ['deal', 'offer', 'sale', 'discount'],
        thanks: lang === 'ar' ? ['شكرا', 'مشكور', 'ممتن'] : ['thanks', 'thank', 'thx'],
        goodbye: lang === 'ar' ? ['وداع', 'مع السلامة', 'باي'] : ['bye', 'goodbye', 'later'],
        help: lang === 'ar' ? ['مساعدة', 'ساعد', 'كيف'] : ['help', 'how', 'can you']
    };
    
    for (const [intent, words] of Object.entries(patterns)) {
        if (words.some(w => lower.includes(w))) return intent;
    }
    return 'general';
}

function generateSmartResponse(message, lang = 'ar') {
    const intent = detectIntent(message, lang);
    const responses = CHAT_RESPONSES[lang] || CHAT_RESPONSES.ar;
    const intentResponses = responses[intent] || responses.general;
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
}

// ================= API ENDPOINTS =================

app.get('/health', (req, res) => res.json({ status: 'ok', version: '6.1.0', chat: 'active (no API needed)' }));

app.get('/', (req, res) => res.json({ name: 'Findly Sage API', version: '6.1.0', chat: '✅ Works Without API' }));

// Chat Endpoint - WORKS WITHOUT GEMINI API
app.post('/chat', async (req, res) => {
    try {
        const { message, userId, lang = 'ar' } = req.body;
        if (!message?.trim()) {
            return res.json({ reply: generateSmartResponse('', lang), response: generateSmartResponse('', lang), intent: 'greeting' });
        }
        
        // Smart response without API
        const reply = generateSmartResponse(message.trim(), lang);
        res.json({ reply, response: reply, intent: detectIntent(message, lang), language: lang });
    } catch (error) {
        res.status(500).json({ reply: '🤔 عذراً، حدث خطأ.', response: '🤔 عذراً، حدث خطأ.' });
    }
});

// Search Endpoint
app.get('/search', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    
    let uid;
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        uid = decoded.uid;
    } catch { return res.status(401).json({ error: "Invalid token" }); }

    const { q, lang = 'ar' } = req.query;
    if (!q) return res.json({ results: [], error: 'no_query' });

    let energy = { searchesUsed: 0, hasFreePass: true };
    if (dbConnected) {
        try {
            energy = await Energy.findOne({ uid }) || await Energy.create({ uid });
            if (!energy.hasFreePass && energy.searchesUsed >= 3) return res.status(429).json({ error: 'ENERGY_EMPTY' });
        } catch {}
    }

    const cacheKey = q.trim().toLowerCase() + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
        if (!SEARCHAPI_KEY) throw new Error('SEARCHAPI_KEY not configured');
        
        const apiRes = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: { api_key: SEARCHAPI_KEY, engine: 'google_shopping', q, hl: lang === 'ar' ? 'ar' : 'en' },
            timeout: 15000
        });

        const rawResults = apiRes.data?.shopping_results?.slice(0, 10) || [];
        
        const results = await Promise.all(rawResults.map(async (item) => {
            const product = {
                id: crypto.createHash('md5').update(item.title + item.source).digest('hex'),
                title: item.title || 'Unknown',
                price: item.price || '$0',
                link: item.product_link || item.link || '#',
                thumbnail: item.thumbnail || '',
                source: item.source || 'Unknown'
            };

            let intelligence = {};
            try {
                intelligence = await SageCore(product, rawResults, [], {}, uid, {}, lang);
            } catch {}

            return { ...product, intelligence };
        }));

        if (dbConnected && !energy.hasFreePass) {
            energy.searchesUsed += 1;
            await energy.save();
        }

        const responseData = { query: q, results, personality: results[0]?.intelligence?.personalityIntel, energy: { used: energy.searchesUsed, limit: energy.hasFreePass ? '∞' : 3, left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed) } };
        setCache(cacheKey, responseData);
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: 'SEARCH_FAILED', message: error.message, results: [] });
    }
});

// Alerts
app.post('/alerts', async (req, res) => {
    const { userId, productTitle, targetPrice, currentPrice, productLink } = req.body;
    if (!dbConnected) return res.json({ success: true, message: 'Alert created (demo)' });
    try {
        await PriceAlert.create({ userId, productTitle, targetPrice, currentPrice, productLink });
        res.json({ success: true, message: 'Alert created' });
    } catch { res.status(500).json({ error: 'ALERT_FAILED' }); }
});

// Reviews
app.get('/reviews', async (req, res) => {
    if (!dbConnected) return res.json({ reviews: [], todayCount: 0 });
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(100).lean();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await Review.countDocuments({ createdAt: { $gte: today } });
    res.json({ success: true, reviews, todayCount, total: await Review.countDocuments() });
});

app.post('/reviews', async (req, res) => {
    const { name, text, rating } = req.body;
    if (!name || !text || !rating) return res.status(400).json({ error: 'MISSING_FIELDS' });
    if (!dbConnected) return res.json({ success: true, message: 'Review received (demo)' });
    try {
        const review = await Review.create({ name: name.trim(), text: text.trim(), rating: parseInt(rating) });
        res.status(201).json({ success: true, review });
    } catch { res.status(500).json({ error: 'CREATE_REVIEW_FAILED' }); }
});

// Payment
app.post('/create-payment', async (req, res) => {
    const { uid } = req.body;
    if (!NOWPAYMENTS_API_KEY) return res.status(503).json({ error: 'PAYMENT_NOT_CONFIGURED' });
    try {
        const response = await axios.post('https://api.nowpayments.io/v1/invoice', { price_amount: 10, price_currency: 'usd', pay_currency: 'usdttrc20', order_id: uid, order_description: 'Findly Pro' }, { headers: { 'x-api-key': NOWPAYMENTS_API_KEY }, timeout: 10000 });
        res.json({ url: response.data.invoice_url });
    } catch { res.status(500).json({ error: 'PAYMENT_FAILED' }); }
});

// Redirect
app.get('/go', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");
    try { res.redirect(decodeURIComponent(url)); } catch { res.status(500).send("Error"); }
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Findly Server v6.1 running on port ${PORT}`);
    console.log(`💬 Chat: ✅ Active (No API needed)`);
    console.log(`🔍 Search: ${SEARCHAPI_KEY ? '✅' : '❌'}`);
});
