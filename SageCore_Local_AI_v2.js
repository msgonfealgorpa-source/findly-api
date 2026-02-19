/**
 * =========================================
 * SAGE CORE v5.0 - Local AI Engine
 * =========================================
 * محرك الذكاء الاصطناعي المحلي للتحليل
 * =========================================
 */

// ================================
// 🔧 UTILITY FUNCTIONS
// ================================

/**
 * تنظيف السعر من النص وتحويله لرقم
 */
function cleanPrice(price) {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    const cleaned = String(price).replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * ترجمات متعددة اللغات
 */
const SAGE_TRANSLATIONS = {
    ar: {
        oversold: 'تشبع بيعي - فرصة شراء',
        overbought: 'تشبع شرائي - تجنب الشراء',
        bullish_trend: 'اتجاه صاعد',
        bearish_trend: 'اتجاه هابط',
        sideways: 'اتجاه عرضي',
        price_rise_expected: 'متوقع ارتفاع السعر',
        price_drop_expected: 'متوقع انخفاض السعر',
        market_stable: 'السوق مستقر',
        excellent_deal: 'صفقة ممتازة',
        good_deal: 'صفقة جيدة',
        fair_deal: 'صفقة عادلة',
        poor_deal: 'صفقة ضعيفة',
        buy_now: 'اشترِ الآن',
        wait: 'انتظر',
        avoid: 'تجنب',
        consider: 'فكر في الأمر'
    },
    en: {
        oversold: 'Oversold - Buying opportunity',
        overbought: 'Overbought - Avoid buying',
        bullish_trend: 'Bullish trend',
        bearish_trend: 'Bearish trend',
        sideways: 'Sideways trend',
        price_rise_expected: 'Price rise expected',
        price_drop_expected: 'Price drop expected',
        market_stable: 'Market stable',
        excellent_deal: 'Excellent deal',
        good_deal: 'Good deal',
        fair_deal: 'Fair deal',
        poor_deal: 'Poor deal',
        buy_now: 'Buy now',
        wait: 'Wait',
        avoid: 'Avoid',
        consider: 'Consider'
    }
};

/**
 * دالة الترجمة
 */
function t(lang, key) {
    const translations = SAGE_TRANSLATIONS[lang] || SAGE_TRANSLATIONS.ar;
    return translations[key] || key;
}

// ================================
// 📊 TECHNICAL ANALYSIS ENGINE
// ================================

const TechnicalAnalysis = {
    /**
     * حساب RSI (Relative Strength Index)
     */
    calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) return null;
        
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 0; i < period; i++) {
            if (changes[i] > 0) gains += changes[i];
            else losses -= changes[i];
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        const rsiValues = [];
        
        for (let i = period; i < changes.length; i++) {
            if (changes[i] > 0) {
                avgGain = (avgGain * (period - 1) + changes[i]) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) - changes[i]) / period;
            }
            
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsiValues.push(rsi);
        }
        
        return rsiValues;
    },
    
    /**
     * حساب MACD (Moving Average Convergence Divergence)
     */
    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (!prices || prices.length < slowPeriod + signalPeriod) return null;
        
        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);
        
        if (!emaFast || !emaSlow) return null;
        
        const macdLine = [];
        const startIdx = slowPeriod - fastPeriod;
        
        for (let i = 0; i < emaSlow.length; i++) {
            macdLine.push(emaFast[i + startIdx] - emaSlow[i]);
        }
        
        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        
        if (!signalLine) return null;
        
        const histogram = [];
        for (let i = 0; i < signalLine.length; i++) {
            histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
        }
        
        const lastMacd = macdLine[macdLine.length - 1];
        const lastSignal = signalLine[signalLine.length - 1];
        
        return {
            macd: lastMacd,
            signal: lastSignal,
            histogram: histogram,
            trend: lastMacd > lastSignal ? 'bullish' : 'bearish',
            crossover: histogram.length > 1 && 
                       histogram[histogram.length - 1] * histogram[histogram.length - 2] < 0
        };
    },
    
    /**
     * حساب EMA (Exponential Moving Average)
     */
    calculateEMA(prices, period) {
        if (!prices || prices.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        const ema = [this.calculateSMA(prices.slice(0, period))];
        
        for (let i = period; i < prices.length; i++) {
            ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
        }
        
        return ema;
    },
    
    /**
     * حساب SMA (Simple Moving Average)
     */
    calculateSMA(prices, period) {
        if (!prices || prices.length < period) return null;
        
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += prices[j];
            }
            sma.push(sum / period);
        }
        
        return sma;
    },
    
    /**
     * حساب Bollinger Bands
     */
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (!prices || prices.length < period) return null;
        
        const sma = this.calculateSMA(prices, period);
        if (!sma) return null;
        
        const lastSma = sma[sma.length - 1];
        const lastPrices = prices.slice(-period);
        
        let sumSquares = 0;
        for (const price of lastPrices) {
            sumSquares += Math.pow(price - lastSma, 2);
        }
        const std = Math.sqrt(sumSquares / period);
        
        const currentPrice = prices[prices.length - 1];
        let position = 'middle';
        if (currentPrice >= lastSma + std * stdDev) position = 'upper';
        else if (currentPrice <= lastSma - std * stdDev) position = 'lower';
        
        const bandwidth = ((lastSma + std * stdDev) - (lastSma - std * stdDev)) / lastSma * 100;
        
        return {
            upper: lastSma + std * stdDev,
            middle: lastSma,
            lower: lastSma - std * stdDev,
            position: position,
            squeeze: bandwidth < 10,
            bandwidth: bandwidth
        };
    },
    
    /**
     * حساب الانحراف المعياري
     */
    calculateStdDev(prices) {
        if (!prices || prices.length < 2) return 0;
        
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const squareDiffs = prices.map(price => Math.pow(price - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / prices.length;
        
        return Math.sqrt(avgSquareDiff);
    }
};

// ================================
// 🔮 PRICE PREDICTION ENGINE
// ================================

const PricePredictionEngine = {
    /**
     * التنبؤ بالسعر باستخدام EWMA
     */
    predictPrice(prices, daysAhead = 7) {
        if (!prices || prices.length < 3) return null;
        
        const alpha = 0.3;
        let ewma = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ewma = alpha * prices[i] + (1 - alpha) * ewma;
        }
        
        // حساب الاتجاه
        const recentPrices = prices.slice(-7);
        let trendSum = 0;
        for (let i = 1; i < recentPrices.length; i++) {
            trendSum += recentPrices[i] - recentPrices[i - 1];
        }
        const avgTrend = trendSum / (recentPrices.length - 1);
        
        // التنبؤات
        const predictions = [];
        let currentForecast = ewma;
        for (let i = 0; i < daysAhead; i++) {
            currentForecast += avgTrend;
            predictions.push(Math.max(0, currentForecast));
        }
        
        // تحديد الاتجاه
        let trend = 'stable';
        const trendThreshold = prices[prices.length - 1] * 0.02;
        if (avgTrend > trendThreshold) trend = 'rising';
        else if (avgTrend < -trendThreshold) trend = 'falling';
        
        // حساب الثقة
        const volatility = TechnicalAnalysis.calculateStdDev(prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const volatilityPercent = (volatility / avgPrice) * 100;
        const confidence = Math.max(30, Math.min(90, 90 - volatilityPercent));
        
        return {
            currentForecast: ewma,
            predictions: predictions,
            trend: trend,
            trendStrength: Math.abs(avgTrend),
            confidence: confidence
        };
    },
    
    /**
     * التنبؤ بأفضل وقت للشراء
     */
    predictBestTimeToBuy(currentPrice, priceHistory, prediction) {
        if (!prediction) {
            return {
                shouldWait: false,
                reason: 'لا توجد بيانات كافية للتنبؤ',
                expectedDrop: 0,
                confidence: 0
            };
        }
        
        if (prediction.trend === 'falling') {
            return {
                shouldWait: true,
                reason: 'السعر في هبوط، انتظر للوصول لمنطقة الدعم',
                expectedDrop: prediction.trendStrength * 7,
                confidence: prediction.confidence
            };
        }
        
        if (prediction.trend === 'rising') {
            return {
                shouldWait: false,
                reason: 'السعر في ارتفاع، اشترِ الآن قبل الزيادة',
                expectedDrop: 0,
                confidence: prediction.confidence
            };
        }
        
        return {
            shouldWait: false,
            reason: 'السعر مستقر، يمكنك الشراء الآن',
            expectedDrop: 0,
            confidence: prediction.confidence
        };
    }
};

// ================================
// 🔍 PATTERN RECOGNITION
// ================================

const PatternRecognition = {
    /**
     * كشف أنماط السعر
     */
    detectPricePatterns(prices) {
        if (!prices || prices.length < 10) return [];
        
        const patterns = [];
        const len = prices.length;
        
        // نمط القاع المزدوج
        if (len >= 20) {
            const recentPrices = prices.slice(-20);
            const minPrice = Math.min(...recentPrices);
            const minCount = recentPrices.filter(p => Math.abs(p - minPrice) < minPrice * 0.02).length;
            if (minCount >= 2) {
                patterns.push({
                    name: 'قاع مزدوج',
                    description: 'نمط انعكاسي صعودي - فرصة شراء',
                    strength: 'high'
                });
            }
        }
        
        // نمط الاتجاه الصعودي
        const firstHalf = prices.slice(0, Math.floor(len / 2));
        const secondHalf = prices.slice(Math.floor(len / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.05) {
            patterns.push({
                name: 'اتجاه صعودي',
                description: 'السعر يرتفع تدريجياً',
                strength: 'medium'
            });
        } else if (secondAvg < firstAvg * 0.95) {
            patterns.push({
                name: 'اتجاه هبوطي',
                description: 'السعر ينخفض تدريجياً',
                strength: 'medium'
            });
        }
        
        // نمط التذبذب
        const volatility = TechnicalAnalysis.calculateStdDev(prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const volatilityPercent = (volatility / avgPrice) * 100;
        
        if (volatilityPercent > 15) {
            patterns.push({
                name: 'تذبذب عالي',
                description: 'السعر متقلب - كن حذراً',
                strength: 'low'
            });
        } else if (volatilityPercent < 5) {
            patterns.push({
                name: 'استقرار نسبي',
                description: 'السعر مستقر - توقعات أدق',
                strength: 'medium'
            });
        }
        
        return patterns;
    },
    
    /**
     * حساب مستويات الدعم والمقاومة
     */
    calculateSupportResistance(prices) {
        if (!prices || prices.length < 5) return null;
        
        const sortedPrices = [...prices].sort((a, b) => a - b);
        const len = sortedPrices.length;
        
        const pivot = sortedPrices[Math.floor(len / 2)];
        const currentPrice = prices[prices.length - 1];
        
        // إيجاد مستويات الدعم
        const supports = sortedPrices.filter(p => p < pivot);
        const resistances = sortedPrices.filter(p => p > pivot);
        
        const strongSupport = supports.length > 0 ? 
            supports[Math.floor(supports.length * 0.1)] : 
            sortedPrices[0];
        const weakSupport = supports.length > 0 ? 
            supports[Math.floor(supports.length * 0.5)] : 
            pivot;
        
        const weakResistance = resistances.length > 0 ? 
            resistances[Math.floor(resistances.length * 0.5)] : 
            pivot;
        const strongResistance = resistances.length > 0 ? 
            resistances[Math.floor(resistances.length * 0.9)] : 
            sortedPrices[len - 1];
        
        // حساب المسافات
        const distanceToSupport = ((currentPrice - strongSupport) / currentPrice * 100).toFixed(2);
        const distanceToResistance = ((strongResistance - currentPrice) / currentPrice * 100).toFixed(2);
        
        // تحديد الموقع الحالي
        let position = 'neutral';
        if (currentPrice <= strongSupport * 1.05) position = 'near_support';
        else if (currentPrice >= strongResistance * 0.95) position = 'near_resistance';
        
        return {
            levels: {
                strongSupport: strongSupport,
                weakSupport: weakSupport,
                pivot: pivot,
                weakResistance: weakResistance,
                strongResistance: strongResistance
            },
            currentPosition: position,
            distanceToSupport: distanceToSupport,
            distanceToResistance: distanceToResistance
        };
    }
};

// ================================
// ⚠️ ANOMALY DETECTOR
// ================================

const AnomalyDetector = {
    /**
     * كشف الشذوذ في الأسعار
     */
    detectPriceAnomalies(prices, threshold = 2) {
        if (!prices || prices.length < 5) return [];
        
        const anomalies = [];
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = TechnicalAnalysis.calculateStdDev(prices);
        
        if (stdDev === 0) return [];
        
        for (let i = 0; i < prices.length; i++) {
            const zScore = (prices[i] - mean) / stdDev;
            
            if (Math.abs(zScore) > threshold) {
                anomalies.push({
                    index: i,
                    price: prices[i],
                    type: zScore > 0 ? 'spike' : 'drop',
                    severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
                    zScore: zScore
                });
            }
        }
        
        return anomalies;
    },
    
    /**
     * كشف الصفقات المزيفة
     */
    detectFakeDeal(product, marketPrices, priceHistory) {
        if (!product) return { isSuspicious: false, riskScore: 0, riskLevel: 'low', warnings: [] };
        
        const warnings = [];
        let riskScore = 0;
        
        const productPrice = cleanPrice(product.price);
        
        // فحص السعر مقابل السوق
        if (marketPrices && marketPrices.length > 0) {
            const validPrices = marketPrices
                .map(p => cleanPrice(p.price))
                .filter(p => p > 0);
            
            if (validPrices.length > 0) {
                const avgMarketPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
                
                // سعر منخفض جداً
                if (productPrice < avgMarketPrice * 0.5) {
                    warnings.push('السعر أقل بنسبة 50% من متوسط السوق');
                    riskScore += 40;
                } else if (productPrice < avgMarketPrice * 0.7) {
                    warnings.push('السعر أقل بشكل ملحوظ من متوسط السوق');
                    riskScore += 20;
                }
            }
        }
        
        // فحص التاريخ السعري
        if (priceHistory && priceHistory.length > 0) {
            const historicalPrices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
            if (historicalPrices.length > 0) {
                const minHistorical = Math.min(...historicalPrices);
                
                if (productPrice < minHistorical * 0.6) {
                    warnings.push('السعر أقل بشكل غير طبيعي من التاريخ السعري');
                    riskScore += 30;
                }
            }
        }
        
        // فحص التقييمات
        if (product.rating !== undefined) {
            if (product.rating < 2) {
                warnings.push('التقييم منخفض جداً');
                riskScore += 25;
            } else if (product.rating < 3) {
                warnings.push('التقييم منخفض');
                riskScore += 10;
            }
        }
        
        // تحديد مستوى الخطورة
        let riskLevel = 'low';
        if (riskScore >= 60) riskLevel = 'high';
        else if (riskScore >= 30) riskLevel = 'medium';
        
        return {
            isSuspicious: riskScore >= 40,
            riskScore: Math.min(100, riskScore),
            riskLevel: riskLevel,
            warnings: warnings
        };
    }
};

// ================================
// 👤 PERSONALITY ENGINE
// ================================

const PersonalityEngine = {
    /**
     * تحليل شخصية المستخدم
     */
    analyze(behavior, totalSearches, totalPurchases, preferences) {
        if (!behavior) {
            return {
                type: 'explorer',
                confidence: 50,
                traits: ['فضولي', 'باحث']
            };
        }
        
        const traits = [];
        let type = 'explorer';
        let confidence = 70;
        
        // تحليل السلوك
        const wishlistAdditions = behavior.wishlistAdditions || 0;
        const priceChecks = behavior.priceChecks || 0;
        const comparisonViews = behavior.comparisonViews || 0;
        const quickPurchases = behavior.quickPurchases || 0;
        const brandSearches = behavior.brandSearches || 0;
        const dealsViewed = behavior.dealsViewed || 0;
        
        // تحديد النوع
        if (priceChecks > 5 && comparisonViews > 3) {
            type = 'researcher';
            traits.push('دقيق', 'محلل');
            confidence = 85;
        } else if (dealsViewed > 5 && wishlistAdditions > 3) {
            type = 'smartHunter';
            traits.push('صياد صفقات', 'مخطط');
            confidence = 80;
        } else if (quickPurchases > 3) {
            type = 'impulsive';
            traits.push('سريع', 'حاسم');
            confidence = 75;
        } else if (brandSearches > 5) {
            type = 'brandLover';
            traits.push('وفي للعلامات', 'متميز');
            confidence = 80;
        } else if (wishlistAdditions > 5 && quickPurchases < 2) {
            type = 'budgetSaver';
            traits.push('موفر', 'حذر');
            confidence = 75;
        }
        
        return {
            type: type,
            confidence: confidence,
            traits: traits.length > 0 ? traits : ['متوازن']
        };
    }
};

// ================================
// 💰 PRICE INTELLIGENCE
// ================================

const PriceIntelligence = {
    /**
     * تحليل السعر الذكي
     */
    analyze(product, marketPrices, priceHistory) {
        const price = cleanPrice(product?.price);
        
        // حساب متوسط السوق
        let avgMarket = price;
        let medianPrice = price;
        let minPrice = price;
        let maxPrice = price;
        
        if (marketPrices && marketPrices.length > 0) {
            const validPrices = marketPrices
                .map(p => cleanPrice(p.price))
                .filter(p => p > 0);
            
            if (validPrices.length > 0) {
                avgMarket = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
                const sorted = [...validPrices].sort((a, b) => a - b);
                medianPrice = sorted[Math.floor(sorted.length / 2)];
                minPrice = Math.min(...validPrices);
                maxPrice = Math.max(...validPrices);
            }
        }
        
        // حساب التوفير
        const savingsPercent = avgMarket > 0 ? 
            Math.max(0, ((avgMarket - price) / avgMarket * 100)).toFixed(1) : 0;
        
        // حساب درجة الصفقة
        let score = 50;
        if (price <= minPrice) score = 95;
        else if (price <= avgMarket * 0.9) score = 85;
        else if (price <= avgMarket) score = 70;
        else if (price <= avgMarket * 1.1) score = 50;
        else score = 30;
        
        // تحديد جودة الصفقة
        let dealQuality = 'fair';
        if (score >= 80) dealQuality = 'excellent';
        else if (score >= 65) dealQuality = 'good';
        else if (score < 40) dealQuality = 'poor';
        
        return {
            price: price,
            average: avgMarket.toFixed(2),
            median: medianPrice.toFixed(2),
            min: minPrice.toFixed(2),
            max: maxPrice.toFixed(2),
            savingsPercent: savingsPercent,
            score: score,
            dealQuality: dealQuality,
            recommendation: score >= 65 ? 'buy' : score >= 45 ? 'consider' : 'wait'
        };
    }
};

// ================================
// 🏪 MERCHANT TRUST ENGINE
// ================================

const MerchantTrustEngine = {
    /**
     * تقييم ثقة التاجر
     */
    evaluateTrust(store, product) {
        if (!store) {
            return {
                trustScore: 50,
                badge: { icon: '🛡️', name: 'غير معروف' },
                warnings: [],
                store: 'متجر'
            };
        }
        
        let trustScore = 50;
        const warnings = [];
        
        // المتاجر الموثوقة
        const trustedStores = [
            'amazon', 'ebay', 'walmart', 'bestbuy', 'target', 'apple',
            'noon', 'jarir', 'extra', 'amazon.sa'
        ];
        
        const storeLower = store.toLowerCase();
        const isTrusted = trustedStores.some(s => storeLower.includes(s));
        
        if (isTrusted) {
            trustScore = 85;
        }
        
        // فحص التقييم
        if (product?.rating) {
            if (product.rating >= 4.5) trustScore += 10;
            else if (product.rating >= 4) trustScore += 5;
            else if (product.rating < 3) {
                trustScore -= 15;
                warnings.push('تقييم منخفض');
            }
        }
        
        // فحص عدد التقييمات
        if (product?.reviewsCount) {
            if (product.reviewsCount > 1000) trustScore += 5;
            else if (product.reviewsCount < 10) {
                trustScore -= 10;
                warnings.push('عدد تقييمات قليل');
            }
        }
        
        // تحديد الشارة
        let badge = { icon: '🛡️', name: 'عادي' };
        if (trustScore >= 80) badge = { icon: '✅', name: 'موثوق' };
        else if (trustScore >= 60) badge = { icon: '👍', name: 'جيد' };
        else if (trustScore < 40) badge = { icon: '⚠️', name: 'حذر' };
        
        return {
            trustScore: Math.min(100, Math.max(0, trustScore)),
            badge: badge,
            warnings: warnings,
            store: store
        };
    }
};

// ================================
// 📊 SCORING ENGINE
// ================================

const ScoringEngine = {
    /**
     * حساب الدرجة الإجمالية
     */
    calculateOverallScore(priceIntel, technicalIntel, predictionIntel, trustIntel) {
        let score = 50;
        let factors = 0;
        
        // عامل السعر (40%)
        if (priceIntel?.score) {
            score += (priceIntel.score - 50) * 0.4;
            factors++;
        }
        
        // عامل التقني (25%)
        if (technicalIntel?.rsi) {
            const rsi = parseFloat(technicalIntel.rsi.value);
            if (rsi < 30) score += 15;
            else if (rsi > 70) score -= 10;
            factors++;
        }
        
        // عامل التنبؤ (20%)
        if (predictionIntel?.trend) {
            if (predictionIntel.trend === 'falling') score += 10;
            else if (predictionIntel.trend === 'rising') score -= 5;
            factors++;
        }
        
        // عامل الثقة (15%)
        if (trustIntel?.merchantTrust?.trustScore) {
            score += (trustIntel.merchantTrust.trustScore - 50) * 0.15;
            factors++;
        }
        
        return Math.min(100, Math.max(0, Math.round(score)));
    }
};

// ================================
// 🧠 SAGE CORE MAIN FUNCTION
// ================================

async function SageCore(product, marketPrices, priceHistory, userBehavior, userId, preferences, lang = 'ar') {
    const price = cleanPrice(product?.price);
    
    // تحليل السعر
    const priceIntel = PriceIntelligence.analyze(product, marketPrices, priceHistory);
    
    // التحليل التقني
    let technicalIntel = {};
    if (priceHistory && priceHistory.length >= 14) {
        const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
        
        if (prices.length >= 14) {
            const rsi = TechnicalAnalysis.calculateRSI(prices);
            const macd = TechnicalAnalysis.calculateMACD(prices);
            const bollinger = TechnicalAnalysis.calculateBollingerBands(prices);
            
            if (rsi) {
                technicalIntel.rsi = {
                    value: rsi[rsi.length - 1].toFixed(2),
                    signal: rsi[rsi.length - 1] < 30 ? 'oversold' : 
                            rsi[rsi.length - 1] > 70 ? 'overbought' : 'neutral'
                };
            }
            
            if (macd) {
                technicalIntel.macd = {
                    trend: macd.trend,
                    crossover: macd.crossover
                };
            }
            
            if (bollinger) {
                technicalIntel.bollinger = {
                    position: bollinger.position,
                    squeeze: bollinger.squeeze
                };
            }
        }
    }
    
    // التنبؤ
    let predictionIntel = {};
    if (priceHistory && priceHistory.length >= 7) {
        const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
        
        if (prices.length >= 7) {
            const prediction = PricePredictionEngine.predictPrice(prices);
            const bestTime = PricePredictionEngine.predictBestTimeToBuy(price, priceHistory, prediction);
            
            if (prediction) {
                predictionIntel = {
                    trend: prediction.trend,
                    confidence: prediction.confidence,
                    shouldWait: bestTime.shouldWait,
                    reason: bestTime.reason
                };
            }
        }
    }
    
    // كشف الأنماط
    let patternIntel = {};
    if (priceHistory && priceHistory.length >= 10) {
        const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
        
        if (prices.length >= 10) {
            const patterns = PatternRecognition.detectPricePatterns(prices);
            const supportResistance = PatternRecognition.calculateSupportResistance(prices);
            
            patternIntel = {
                detected: patterns.map(p => p.name),
                supportResistance: supportResistance
            };
        }
    }
    
    // ثقة التاجر
    const merchantTrust = MerchantTrustEngine.evaluateTrust(product?.source, product);
    
    // كشف الشذوذ
    const anomalyCheck = AnomalyDetector.detectFakeDeal(product, marketPrices, priceHistory);
    
    // حساب الدرجة الإجمالية
    const overallScore = ScoringEngine.calculateOverallScore(
        priceIntel, technicalIntel, predictionIntel, { merchantTrust }
    );
    
    // تحديد القرار النهائي
    let decision = 'CONSIDER';
    let reason = 'فكر في الأمر';
    
    if (overallScore >= 75 && priceIntel.recommendation === 'buy') {
        decision = 'BUY_NOW';
        reason = 'صفقة ممتازة - اشترِ الآن';
    } else if (overallScore >= 60) {
        decision = 'BUY';
        reason = 'صفقة جيدة';
    } else if (overallScore >= 40) {
        decision = 'CONSIDER';
        reason = 'قارن مع خيارات أخرى';
    } else if (predictionIntel.shouldWait) {
        decision = 'WAIT';
        reason = predictionIntel.reason;
    } else if (overallScore < 30 || anomalyCheck.isSuspicious) {
        decision = 'AVOID';
        reason = 'تجنب هذه الصفقة';
    }
    
    return {
        // القرار النهائي
        finalVerdict: {
            decision: decision,
            reason: reason,
            overallScore: overallScore,
            confidence: priceIntel.score,
            bestLink: product?.link
        },
        
        // تحليل السعر
        priceIntel: priceIntel,
        
        // التحليل التقني
        technicalIntel: technicalIntel,
        
        // التنبؤات
        predictionIntel: predictionIntel,
        
        // الأنماط
        patternIntel: patternIntel,
        
        // الثقة والمخاطر
        trustIntel: {
            merchantTrust: merchantTrust,
            overallRisk: anomalyCheck.riskScore,
            warnings: anomalyCheck.warnings
        }
    };
}

// ================================
// 📤 EXPORTS
// ================================

module.exports = SageCore;
module.exports.SageCore = SageCore;
module.exports.TechnicalAnalysis = TechnicalAnalysis;
module.exports.PricePredictionEngine = PricePredictionEngine;
module.exports.PatternRecognition = PatternRecognition;
module.exports.AnomalyDetector = AnomalyDetector;
module.exports.PersonalityEngine = PersonalityEngine;
module.exports.PriceIntelligence = PriceIntelligence;
module.exports.MerchantTrustEngine = MerchantTrustEngine;
module.exports.ScoringEngine = ScoringEngine;
module.exports.SAGE_TRANSLATIONS = SAGE_TRANSLATIONS;
module.exports.t = t;
module.exports.cleanPrice = cleanPrice;
