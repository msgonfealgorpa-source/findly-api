/* =========================================
SAGE CORE v4.1 - ULTIMATE SHOPPING INTELLIGENCE
========================================= */

// ================= TRANSLATIONS =================
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
    insufficient_data: "بيانات غير كافية للتحليل",
    market_stable: "السوق مستقر",
    market_rising: "السوق في ارتفاع",
    market_falling: "السوق في انخفاض",
    fake_offer: "قد يكون العرض غير منطقي",
    price_drop_expected: "متوقع انخفاض السعر",
    price_rise_expected: "متوقع ارتفاع السعر",
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
    insufficient_data: "Insufficient data for analysis",
    market_stable: "Market Stable",
    market_rising: "Market Rising",
    market_falling: "Market Falling",
    fake_offer: "Offer may be unrealistic",
    price_drop_expected: "Price drop expected",
    price_rise_expected: "Price rise expected",
    tip_wait_sale: "Wait for upcoming sales",
    tip_buy_now: "Price is good right now",
    tip_compare: "Compare with other options"
  },
  fr: {
    buy_now: "Acheter maintenant", wait: "Attendre", overpriced: "Prix élevé", fair_price: "Prix juste",
    excellent_deal: "Excellente offre", good_deal: "Bonne offre", insufficient_data: "Données insuffisantes"
  },
  de: {
    buy_now: "Jetzt kaufen", wait: "Warten", overpriced: "Überteuert", fair_price: "Fairer Preis",
    excellent_deal: "Ausgezeichnetes Angebot", good_deal: "Gutes Angebot"
  },
  es: {
    buy_now: "Comprar ahora", wait: "Esperar", overpriced: "Precio alto", fair_price: "Precio justo",
    excellent_deal: "Oferta excelente", good_deal: "Buena oferta"
  },
  tr: {
    buy_now: "Şimdi Satın Al", wait: "Bekle", overpriced: "Fiyat yüksek", fair_price: "Adil fiyat",
    excellent_deal: "Mükemmel fırsat", good_deal: "İyi fırsat"
  }
};

function t(lang, key) {
    const shortLang = (lang || "en").split("-")[0];
    return SAGE_TRANSLATIONS[shortLang]?.[key] || SAGE_TRANSLATIONS["en"][key] || key;
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

// ================= PERSONALITY ENGINE =================
class PersonalityEngine {
    static analyze(userEvents, price, marketAverage) {
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
            hunter: { description: 'يبحث عن أقل سعر ممكن', style: 'صياد الصفقات', icon: '🎯', name: { ar: 'صياد الصفقات', en: 'Deal Hunter' } },
            analyst: { description: 'يفضل التحليل قبل الشراء', style: 'المحلل', icon: '🔬', name: { ar: 'المحلل', en: 'Analyst' } },
            impulse: { description: 'يتخذ قرارات سريعة', style: 'المتسرع', icon: '⚡', name: { ar: 'المتسرع', en: 'Impulse Buyer' } },
            premium: { description: 'يهتم بالجودة', style: 'محب الجودة', icon: '💎', name: { ar: 'محب الجودة', en: 'Quality Lover' } },
            budget: { description: 'محدود الميزانية', style: 'المخطط', icon: '💰', name: { ar: 'المخطط', en: 'Budget Planner' } },
            neutral: { description: 'سلوك متوازن', style: 'متوازن', icon: '⚖️', name: { ar: 'متوازن', en: 'Balanced' } }
        };

        return { type: dominant, scores, confidence: Math.min(100, maxScore), traits: traits[dominant] };
    }

    static personalize(personality, product, marketData, lang) {
        const price = cleanPrice(product.price);
        const avg = marketData.average || price;

        switch (personality.type) {
            case 'hunter':
                if (price <= avg * 0.85) return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 85 };
                return { action: 'wait', reason: 'انتظر انخفاضاً أفضل', confidence: 70 };
            case 'analyst':
                return { action: 'compare', reason: t(lang, 'tip_compare'), confidence: 75 };
            case 'impulse':
                if (price <= avg * 1.05) return { action: 'buy_now', reason: 'السعر مناسب للشراء السريع', confidence: 80 };
                return { action: 'consider', reason: t(lang, 'tip_compare'), confidence: 60 };
            case 'premium':
                return { action: 'buy_now', reason: 'منتج مميز', confidence: 75 };
            case 'budget':
                if (price <= avg * 0.7) return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 90 };
                return { action: 'search_alternative', reason: 'ابحث عن بديل أرخص', confidence: 70 };
            default:
                return { action: price <= avg ? 'buy_now' : 'wait', reason: price <= avg ? t(lang, 'good_deal') : t(lang, 'tip_wait_sale'), confidence: 60 };
        }
    }
}

// ================= PRICE INTELLIGENCE =================
class PriceIntelligence {
    static analyze(product, marketProducts = [], priceHistory = [], lang = 'ar') {
        const currentPrice = cleanPrice(product.price);
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price || p)).filter(p => p > 0);

        if (marketPrices.length < 3) {
            return {
                priceIntel: {
                    current: currentPrice, average: null, median: null,
                    score: 50, decision: t(lang, 'insufficient_data'),
                    color: '#6b7280', confidence: 30, label: t(lang, 'insufficient_data')
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
                current: currentPrice, average: Math.round(average * 100) / 100, median: Math.round(median * 100) / 100,
                min, max, score, decision, label, color,
                confidence: Math.min(100, 40 + marketPrices.length * 3)
            },
            trendIntel: trend,
            hasEnoughData: true,
            marketStats: { competitors: marketPrices.length, priceVariation: Math.round(((max - min) / median) * 100) }
        };
    }
}

// ================= MERCHANT TRUST =================
class MerchantTrustEngine {
    static evaluate(storeData, productData = {}, lang = 'ar') {
        const store = storeData.source || storeData.store || 'Unknown';
        let trustScore = 50;
        const warnings = [];

        const trustedStores = ['amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 'apple', 'samsung', 'nike'];
        if (trustedStores.some(s => store.toLowerCase().includes(s))) trustScore += 25;

        if (productData.price && productData.marketAverage && cleanPrice(productData.price) < productData.marketAverage * 0.5) {
            trustScore -= 20;
            warnings.push(t(lang, 'fake_offer'));
        }

        const badge = trustScore >= 80 ? { level: 'gold', icon: '🥇', color: '#fbbf24' } :
                      trustScore >= 65 ? { level: 'silver', icon: '🥈', color: '#94a3b8' } :
                      trustScore >= 50 ? { level: 'bronze', icon: '🥉', color: '#d97706' } :
                      { level: 'warning', icon: '⚠️', color: '#f59e0b' };

        return { store, trustScore: Math.max(0, Math.min(100, trustScore)), badge, warnings, verified: trustScore >= 65 };
    }
}

// ================= FAKE DEAL DETECTOR =================
class FakeDealDetector {
    static detect(product, marketProducts, lang = 'ar') {
        const warnings = [];
        let riskScore = 0;

        const currentPrice = cleanPrice(product.price);
        const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);

        if (marketPrices.length >= 3) {
            const avg = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
            if (currentPrice < avg * 0.5) {
                warnings.push(t(lang, 'fake_offer'));
                riskScore += 40;
            }
            if (currentPrice > Math.min(...marketPrices) * 1.5) {
                warnings.push('السعر أعلى بكثير من المنافسين');
                riskScore += 25;
            }
        }

        return {
            isSuspicious: riskScore >= 40,
            riskScore: Math.min(100, riskScore),
            riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            warnings
        };
    }
}

// ================= RECOMMENDATION ENGINE =================
class RecommendationEngine {
    static findAlternatives(product, marketProducts) {
        if (!marketProducts || !marketProducts.length) return [];
        const currentPrice = cleanPrice(product.price);
        
        return marketProducts
            .map(p => ({
                title: p.title,
                price: cleanPrice(p.product_price || p.price),
                image: p.thumbnail,
                link: p.link || p.product_link,
                store: p.source || p.store,
                savings: currentPrice - cleanPrice(p.product_price || p.price),
                savingsPercent: Math.round((1 - cleanPrice(p.product_price || p.price) / currentPrice) * 100)
            }))
            .filter(p => p.price > 0 && p.price < currentPrice * 0.95)
            .sort((a, b) => a.price - b.price)
            .slice(0, 5);
    }
}

// ================= MAIN SAGE CORE FUNCTION =================
async function SageCore(product, marketProducts = [], priceHistory = [], userEvents = {}, userId = 'guest', userHistory = {}, lang = 'ar') {
    const currentPrice = cleanPrice(product.price);

    // 1. Price Intelligence
    const priceAnalysis = PriceIntelligence.analyze(product, marketProducts, priceHistory, lang);
    
    if (!priceAnalysis.hasEnoughData) {
        return {
            priceIntel: priceAnalysis.priceIntel,
            valueIntel: { score: 50, competitors: 0, savingsPercent: 0, savingsAmount: 0, learningBoost: 0 },
            trendIntel: { trend: 'unknown', confidence: 0 },
            forecastIntel: { trend: 'unknown', confidence: 0, expectedPrice: currentPrice },
            trustIntel: { merchantTrust: { store: product.source || 'Unknown', trustScore: 50, warnings: [] }, fakeDealCheck: { isSuspicious: false, riskScore: 0, warnings: [] }, overallRisk: 0, riskScore: 0, warnings: [] },
            personalityIntel: { type: 'neutral', confidence: 0, traits: {} },
            recommendationIntel: { alternatives: [] },
            dealQuality: { score: 50, label: t(lang, 'insufficient_data') },
            merchantTrust: { name: product.source || 'Unknown', score: 50, verified: false },
            fakeDeal: { isSuspicious: false, riskScore: 0, reasons: [] },
            recommendations: [],
            finalVerdict: { decision: 'INSUFFICIENT_DATA', confidence: 30, reason: t(lang, 'insufficient_data') }
        };
    }

    const { priceIntel, trendIntel, marketStats } = priceAnalysis;

    // 2. Personality
    const personality = PersonalityEngine.analyze(userEvents, currentPrice, priceIntel.median);

    // 3. Merchant Trust
    const merchantTrust = MerchantTrustEngine.evaluate(product, { price: currentPrice, marketAverage: priceIntel.median }, lang);

    // 4. Fake Deal
    const fakeDealCheck = FakeDealDetector.detect(product, marketProducts, lang);

    // 5. Alternatives
    const alternatives = RecommendationEngine.findAlternatives(product, marketProducts);

    // 6. Personalized Rec
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

    let strategicDecision = 'WAIT', strategicReason = '', strategicColor = '#f59e0b';

    if (fakeDealCheck.riskScore >= 60) {
        strategicDecision = 'AVOID'; strategicReason = 'عرض مشبوه'; strategicColor = '#ef4444';
    } else if (merchantTrust.trustScore < 30) {
        strategicDecision = 'CAUTION'; strategicReason = 'تاجر غير موثوق'; strategicColor = '#f59e0b';
    } else if (priceIntel.score >= 75 && fakeDealCheck.riskScore < 30) {
        strategicDecision = 'BUY_NOW'; strategicReason = `صفقة ممتازة - وفر ${savingsPercent}%`; strategicColor = '#10b981';
    } else if (priceIntel.score >= 60 && trendIntel?.trend !== 'falling') {
        strategicDecision = 'BUY'; strategicReason = t(lang, 'good_deal'); strategicColor = '#22c55e';
    } else if (trendIntel?.trend === 'falling' && priceIntel.score < 70) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'price_drop_expected'); strategicColor = '#3b82f6';
    } else if (priceIntel.score <= 40) {
        strategicDecision = 'WAIT'; strategicReason = t(lang, 'overpriced'); strategicColor = '#ef4444';
    } else {
        strategicDecision = 'CONSIDER'; strategicReason = t(lang, 'fair_price'); strategicColor = '#3b82f6';
    }

    if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID') {
        strategicDecision = 'BUY_NOW';
        strategicReason = personalizedRec.reason;
    }

    const dealQuality = {
        score: Math.round((priceIntel.score * 0.5) + ((100 - fakeDealCheck.riskScore) * 0.3) + (merchantTrust.trustScore * 0.2)),
        label: priceIntel.score >= 70 ? t(lang, 'excellent_deal') : priceIntel.score >= 50 ? t(lang, 'good_deal') : t(lang, 'bad_deal')
    };

    return {
        priceIntel: {
            current: currentPrice, average: priceIntel.average, median: priceIntel.median,
            min: priceIntel.min, max: priceIntel.max, score: priceIntel.score,
            decision: priceIntel.decision, label: priceIntel.label, color: priceIntel.color, confidence: priceIntel.confidence
        },
        valueIntel: {
            score: priceIntel.score, competitors: marketStats.competitors,
            priceVariation: marketStats.priceVariation, savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            learningBoost: marketStats.competitors * 2
        },
        trendIntel: trendIntel || { trend: 'unknown', confidence: 0 },
        forecastIntel: {
            trend: trendIntel?.trend || 'unknown',
            confidence: trendIntel?.confidence || 0,
            expectedPrice: trendIntel?.predictedPrice || currentPrice
        },
        trustIntel: {
            merchantTrust: {
                name: merchantTrust.store, score: merchantTrust.trustScore, badge: merchantTrust.badge,
                verified: merchantTrust.verified, warnings: merchantTrust.warnings
            },
            fakeDealCheck: {
                isSuspicious: fakeDealCheck.isSuspicious, riskScore: fakeDealCheck.riskScore,
                riskLevel: fakeDealCheck.riskLevel, warnings: fakeDealCheck.warnings, reasons: fakeDealCheck.warnings
            },
            overallRisk: fakeDealCheck.riskScore, riskScore: fakeDealCheck.riskScore,
            warnings: [...merchantTrust.warnings, ...fakeDealCheck.warnings]
        },
        personalityIntel: {
            type: personality.type, confidence: personality.confidence,
            traits: personality.traits, shoppingStyle: personality.traits?.style || 'متوازن'
        },
        recommendationIntel: { alternatives: alternatives.slice(0, 3) },
        dealQuality,
        recommendations: alternatives.slice(0, 3),
        merchantTrust: {
            name: merchantTrust.store, score: merchantTrust.trustScore,
            badge: merchantTrust.badge, verified: merchantTrust.verified
        },
        fakeDeal: { isSuspicious: fakeDealCheck.isSuspicious, riskScore: fakeDealCheck.riskScore, reasons: fakeDealCheck.warnings },
        finalVerdict: {
            decision: strategicDecision, confidence: confidenceScore, reason: strategicReason, color: strategicColor,
            emoji: strategicDecision === 'BUY_NOW' ? '🟢' : strategicDecision === 'WAIT' ? '⏳' : strategicDecision === 'AVOID' ? '🚨' : '🟡',
            title: strategicDecision === 'BUY_NOW' ? t(lang, 'buy_now') : strategicDecision === 'WAIT' ? t(lang, 'wait') : strategicDecision === 'AVOID' ? 'تجنب' : t(lang, 'fair_price'),
            savingsPercent,
            savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
            bestStore, bestPrice, bestLink
        }
    };
}

module.exports = SageCore;
module.exports.PersonalityEngine = PersonalityEngine;
module.exports.PriceIntelligence = PriceIntelligence;
module.exports.MerchantTrustEngine = MerchantTrustEngine;
module.exports.FakeDealDetector = FakeDealDetector;
module.exports.RecommendationEngine = RecommendationEngine;
module.exports.SAGE_TRANSLATIONS = SAGE_TRANSLATIONS;
module.exports.t = t;
module.exports.cleanPrice = cleanPrice;
