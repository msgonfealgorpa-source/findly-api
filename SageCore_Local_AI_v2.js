/**
 * ================================================
 * 🧠 SAGE CORE v5.0 - LOCAL AI ENGINE
 * ================================================
 * ذكاء اصطناعي محلي 100% بدون API خارجي
 * يتضمن:
 * - Technical Analysis متقدم (RSI, MACD, Bollinger)
 * - Price Prediction بخوارزمية EWMA
 * - Pattern Recognition للأسعار
 * - Anomaly Detection للعروض المزيفة
 * - Smart Confidence Scoring
 * ================================================
 */

// ================================
// 🌍 TRANSLATIONS
// ================================
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
    fake_offer: "قد يكون العرض غير منطقي",
    price_drop_expected: "متوقع انخفاض السعر",
    price_rise_expected: "متوقع ارتفاع السعر",
    best_time_to_buy: "أفضل وقت للشراء",
    trusted_merchant: "تاجر موثوق",
    suspicious_merchant: "تاجر مشبوه",
    recommended: "موصى به",
    alternative: "بديل أرخص",
    tip_wait_sale: "انتظر العروض القادمة",
    tip_buy_now: "السعر مناسب حالياً",
    tip_compare: "قارن مع خيارات أخرى",
    oversold: "حالة تشبع بيعي",
    overbought: "حالة تشبع شرائي",
    bullish_trend: "اتجاه صاعد",
    bearish_trend: "اتجاه هابط",
    sideways: "اتجاه عرضي",
    high_volatility: "تقلب عالي",
    low_volatility: "تقلب منخفض"
  },
  en: {
    buy_now: "Buy Now",
    wait: "Wait",
    overpriced: "Overpriced",
    fair_price: "Fair Price",
    excellent_deal: "Excellent Deal",
    good_deal: "Good Deal",
    bad_deal: "Weak Deal",
    insufficient_data: "Insufficient data for analysis",
    oversold: "Oversold Condition",
    overbought: "Overbought Condition",
    bullish_trend: "Bullish Trend",
    bearish_trend: "Bearish Trend",
    high_volatility: "High Volatility"
  }
};

// ================================
// 🔧 UTILITY FUNCTIONS
// ================================

function cleanPrice(p) {
  if (!p) return 0;
  const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, ''));
  return isNaN(cleaned) ? 0 : cleaned;
}

function t(lang, key) {
  const shortLang = (lang || "en").split("-")[0];
  return SAGE_TRANSLATIONS[shortLang]?.[key] 
    || SAGE_TRANSLATIONS["en"][key] 
    || key;
}

// ================================
// 📊 TECHNICAL ANALYSIS ENGINE
// ================================

class TechnicalAnalysis {
  
  /**
   * حساب المتوسط المتحرك الأسي (EMA)
   * EMA يعطي وزناً أكبر للأسعار الحديثة
   */
  static calculateEMA(prices, period) {
    if (!prices || prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    
    // البدء بـ SMA للفترة الأولى
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const emaValues = [ema];
    
    // حساب EMA للقيم المتبقية
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
      emaValues.push(ema);
    }
    
    return emaValues;
  }

  /**
   * حساب المتوسط المتحرك البسيط (SMA)
   */
  static calculateSMA(prices, period) {
    if (!prices || prices.length < period) return null;
    
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  /**
   * حساب RSI (Relative Strength Index)
   * يقيس قوة الاتجاه ويحدد حالات التشبع
   * RSI < 30 = تشبع بيعي (فرصة شراء)
   * RSI > 70 = تشبع شرائي (انتظر)
   */
  static calculateRSI(prices, period = 14) {
    if (!prices || prices.length < period + 1) return null;
    
    let gains = [];
    let losses = [];
    
    // حساب التغيرات
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // حساب المتوسط الأولي
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsiValues = [];
    
    // أول قيمة RSI
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
    
    // حساب RSI للقيم المتبقية (Wilders Smoothing)
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsiValues;
  }

  /**
   * حساب MACD (Moving Average Convergence Divergence)
   * يحدد الاتجاه والزخم
   * MACD Line = EMA(12) - EMA(26)
   * Signal Line = EMA(9) of MACD Line
   */
  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!prices || prices.length < slowPeriod + signalPeriod) return null;
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    if (!fastEMA || !slowEMA) return null;
    
    // حساب MACD Line
    const macdLine = [];
    const offset = slowPeriod - fastPeriod;
    for (let i = 0; i < slowEMA.length; i++) {
      macdLine.push(fastEMA[i + offset] - slowEMA[i]);
    }
    
    // حساب Signal Line
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    // حساب Histogram
    const histogram = [];
    const signalOffset = macdLine.length - (signalLine?.length || 0);
    
    if (signalLine) {
      for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + signalOffset] - signalLine[i]);
      }
    }
    
    return {
      macdLine: macdLine.slice(-10),
      signalLine: signalLine?.slice(-10) || [],
      histogram: histogram?.slice(-10) || [],
      trend: macdLine[macdLine.length - 1] > 0 ? 'bullish' : 'bearish',
      crossover: histogram?.length > 1 && 
                 histogram[histogram.length - 1] * histogram[histogram.length - 2] < 0
    };
  }

  /**
   * حساب Bollinger Bands
   * يقيس التقلب ويحدد الأسعار غير الطبيعية
   */
  static calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
    if (!prices || prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const upperBand = [];
    const lowerBand = [];
    const bandwidth = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      const smaIdx = i - period + 1;
      upperBand.push(sma[smaIdx] + stdDevMultiplier * std);
      lowerBand.push(sma[smaIdx] - stdDevMultiplier * std);
      bandwidth.push((upperBand[upperBand.length - 1] - lowerBand[lowerBand.length - 1]) / sma[smaIdx] * 100);
    }
    
    const currentPrice = prices[prices.length - 1];
    const lastUpper = upperBand[upperBand.length - 1];
    const lastLower = lowerBand[lowerBand.length - 1];
    const lastSMA = sma[sma.length - 1];
    
    // حساب موقع السعر بالنسبة للنطاق
    let percentB = (currentPrice - lastLower) / (lastUpper - lastLower);
    percentB = Math.max(0, Math.min(1, percentB));
    
    return {
      upper: lastUpper,
      middle: lastSMA,
      lower: lastLower,
      bandwidth: bandwidth[bandwidth.length - 1],
      percentB,
      position: percentB > 0.8 ? 'upper' : percentB < 0.2 ? 'lower' : 'middle',
      squeeze: bandwidth[bandwidth.length - 1] < 10 // نطاق ضيق = انفجار قادم
    };
  }

  /**
   * حساب ATR (Average True Range)
   * يقيس التقلب الحقيقي
   */
  static calculateATR(highs, lows, closes, period = 14) {
    if (!highs || !lows || !closes || highs.length < period + 1) return null;
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
    
    // حساب ATR
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
    }
    
    return atr;
  }

  /**
   * حساب الانحراف المعياري
   */
  static calculateStdDev(data) {
    if (!data || data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * إزالة القيم المتطرفة (Outliers)
   */
  static removeOutliers(data) {
    if (!data || data.length < 4) return data;
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return data.filter(p => p >= lowerBound && p <= upperBound);
  }
}

// ================================
// 🔮 PRICE PREDICTION ENGINE
// ================================

class PricePredictionEngine {
  
  /**
   * تنبؤ بالسعر المستقبلي باستخدام EWMA
   * (Exponentially Weighted Moving Average)
   */
  static predictPrice(prices, periods = 7) {
    if (!prices || prices.length < 5) return null;
    
    const alpha = 0.3; // معامل التنعيم
    let forecast = prices[0];
    
    // حساب EWMA
    const ewma = [forecast];
    for (let i = 1; i < prices.length; i++) {
      forecast = alpha * prices[i] + (1 - alpha) * forecast;
      ewma.push(forecast);
    }
    
    // حساب الاتجاه
    const recentEwma = ewma.slice(-5);
    const trend = (recentEwma[recentEwma.length - 1] - recentEwma[0]) / recentEwma.length;
    
    // التنبؤ للفترات القادمة
    const predictions = [];
    let nextPrice = ewma[ewma.length - 1];
    
    for (let i = 0; i < periods; i++) {
      nextPrice = nextPrice + trend;
      predictions.push(nextPrice);
    }
    
    return {
      currentForecast: ewma[ewma.length - 1],
      predictions,
      trend: trend > 0 ? 'rising' : trend < 0 ? 'falling' : 'stable',
      trendStrength: Math.abs(trend),
      confidence: this.calculateConfidence(prices, ewma)
    };
  }

  /**
   * حساب الثقة في التنبؤ
   */
  static calculateConfidence(prices, predictions) {
    if (!prices || !predictions || prices.length < 3) return 50;
    
    // حساب MSE
    let mse = 0;
    const minLen = Math.min(prices.length, predictions.length);
    for (let i = 0; i < minLen; i++) {
      mse += Math.pow(prices[i] - predictions[i], 2);
    }
    mse /= minLen;
    
    // تحويل MSE لنسبة ثقة
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const normalizedError = Math.sqrt(mse) / avgPrice;
    
    // كلما زاد الخطأ قلت الثقة
    return Math.max(20, Math.min(95, 100 - normalizedError * 200));
  }

  /**
   * تحليل الموسمية
   */
  static analyzeSeasonality(prices, dates) {
    if (!prices || prices.length < 30) return null;
    
    // تقسيم الأسعار حسب اليوم/الأسبوع
    const dayOfWeek = [[], [], [], [], [], [], []]; // الأحد للسبت
    
    prices.forEach((price, idx) => {
      if (dates && dates[idx]) {
        const day = new Date(dates[idx]).getDay();
        dayOfWeek[day].push(price);
      }
    });
    
    // حساب متوسط كل يوم
    const dayAverages = dayOfWeek.map((day, idx) => {
      if (day.length === 0) return null;
      return day.reduce((a, b) => a + b, 0) / day.length;
    });
    
    // إيجاد أفضل وأ worst يوم للشراء
    const validDays = dayAverages.filter(d => d !== null);
    if (validDays.length === 0) return null;
    
    const overallAvg = validDays.reduce((a, b) => a + b, 0) / validDays.length;
    
    const bestDay = dayAverages.indexOf(Math.min(...validDays));
    const worstDay = dayAverages.indexOf(Math.max(...validDays));
    
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    return {
      bestDayToBuy: dayNames[bestDay],
      worstDayToBuy: dayNames[worstDay],
      dayAverages,
      seasonalityStrength: Math.max(...validDays) / Math.min(...validDays) - 1
    };
  }

  /**
   * توقع أفضل وقت للشراء
   */
  static predictBestTimeToBuy(currentPrice, priceHistory, predictions) {
    if (!predictions || !predictions.predictions || predictions.predictions.length === 0) {
      return { shouldWait: false, reason: 'لا توجد بيانات كافية للتنبؤ' };
    }
    
    const minPredicted = Math.min(...predictions.predictions);
    const maxPredicted = Math.max(...predictions.predictions);
    
    // إذا كان السعر الحالي أقل من المتوقع
    if (currentPrice <= minPredicted * 1.02) {
      return {
        shouldWait: false,
        reason: 'السعر الحالي قريب من الحد الأدنى المتوقع',
        confidence: 85
      };
    }
    
    // إذا كان السعر أعلى من المتوقع والاتجاه هابط
    if (predictions.trend === 'falling' && currentPrice > predictions.currentForecast) {
      const daysToWait = predictions.predictions.findIndex(p => p < currentPrice * 0.95);
      return {
        shouldWait: true,
        reason: `الأسعار في هبوط، انتظر ${daysToWait > 0 ? daysToWait + ' أيام' : 'قليلاً'}`,
        expectedDrop: ((currentPrice - minPredicted) / currentPrice * 100).toFixed(1),
        confidence: predictions.confidence
      };
    }
    
    // إذا كان الاتجاه صاعد
    if (predictions.trend === 'rising') {
      return {
        shouldWait: false,
        reason: 'الأسعار في ارتفاع، اشترِ الآن',
        confidence: predictions.confidence
      };
    }
    
    return {
      shouldWait: false,
      reason: 'السوق مستقر',
      confidence: 60
    };
  }
}

// ================================
// 🔍 PATTERN RECOGNITION
// ================================

class PatternRecognition {
  
  /**
   * كشف أنماط الشموع اليابانية
   */
  static detectCandlePatterns(priceHistory) {
    if (!priceHistory || priceHistory.length < 5) return [];
    
    const patterns = [];
    
    for (let i = 1; i < priceHistory.length; i++) {
      const prev = priceHistory[i - 1];
      const curr = priceHistory[i];
      
      // Doji - عدم يقين
      if (Math.abs(curr.open - curr.close) < (curr.high - curr.low) * 0.1) {
        patterns.push({ type: 'doji', index: i, signal: 'neutral' });
      }
      
      // Hammer - انعكاس صاعد
      const body = Math.abs(curr.open - curr.close);
      const lowerShadow = Math.min(curr.open, curr.close) - curr.low;
      const upperShadow = curr.high - Math.max(curr.open, curr.close);
      
      if (lowerShadow > body * 2 && upperShadow < body * 0.5) {
        patterns.push({ type: 'hammer', index: i, signal: 'bullish' });
      }
      
      // Shooting Star - انعكاس هابط
      if (upperShadow > body * 2 && lowerShadow < body * 0.5) {
        patterns.push({ type: 'shooting_star', index: i, signal: 'bearish' });
      }
    }
    
    return patterns;
  }

  /**
   * كشف أنماط السعر العامة
   */
  static detectPricePatterns(prices) {
    if (!prices || prices.length < 10) return null;
    
    const patterns = [];
    const recent = prices.slice(-10);
    
    // كشف الاتجاه
    const firstHalf = recent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const secondHalf = recent.slice(5).reduce((a, b) => a + b, 0) / 5;
    
    if (secondHalf > firstHalf * 1.05) {
      patterns.push({ name: 'uptrend', strength: 'moderate', description: 'اتجاه صاعد' });
    } else if (secondHalf < firstHalf * 0.95) {
      patterns.push({ name: 'downtrend', strength: 'moderate', description: 'اتجاه هابط' });
    } else {
      patterns.push({ name: 'sideways', strength: 'strong', description: 'اتجاه عرضي' });
    }
    
    // كشف القمم والقيعان
    const peaks = [];
    const troughs = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        peaks.push({ index: i, price: prices[i] });
      }
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        troughs.push({ index: i, price: prices[i] });
      }
    }
    
    // Double Bottom - انعكاس صاعد
    if (troughs.length >= 2) {
      const lastTwo = troughs.slice(-2);
      if (Math.abs(lastTwo[0].price - lastTwo[1].price) / lastTwo[0].price < 0.03) {
        patterns.push({ name: 'double_bottom', strength: 'strong', description: 'قاع مزدوج - إشارة شراء' });
      }
    }
    
    // Double Top - انعكاس هابط
    if (peaks.length >= 2) {
      const lastTwo = peaks.slice(-2);
      if (Math.abs(lastTwo[0].price - lastTwo[1].price) / lastTwo[0].price < 0.03) {
        patterns.push({ name: 'double_top', strength: 'strong', description: 'قمة مزدوجة - إشارة انتظار' });
      }
    }
    
    return patterns;
  }

  /**
   * حساب دعم ومقاومة
   */
  static calculateSupportResistance(prices, periods = 20) {
    if (!prices || prices.length < periods) return null;
    
    const recent = prices.slice(-periods);
    const sorted = [...recent].sort((a, b) => a - b);
    
    // حساب المستويات
    const levels = {
      strongSupport: sorted[Math.floor(sorted.length * 0.1)],
      weakSupport: sorted[Math.floor(sorted.length * 0.25)],
      pivot: sorted[Math.floor(sorted.length * 0.5)],
      weakResistance: sorted[Math.floor(sorted.length * 0.75)],
      strongResistance: sorted[Math.floor(sorted.length * 0.9)]
    };
    
    // تحديد موقع السعر الحالي
    const current = prices[prices.length - 1];
    let position = 'neutral';
    
    if (current <= levels.strongSupport * 1.02) {
      position = 'near_support';
    } else if (current >= levels.strongResistance * 0.98) {
      position = 'near_resistance';
    }
    
    return {
      levels,
      currentPosition: position,
      distanceToSupport: ((current - levels.strongSupport) / current * 100).toFixed(2),
      distanceToResistance: ((levels.strongResistance - current) / current * 100).toFixed(2)
    };
  }
}

// ================================
// 🚨 ANOMALY DETECTION
// ================================

class AnomalyDetector {
  
  /**
   * كشف الأسعار غير الطبيعية (Z-Score)
   */
  static detectPriceAnomalies(prices, threshold = 2.5) {
    if (!prices || prices.length < 5) return [];
    
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = TechnicalAnalysis.calculateStdDev(prices);
    
    if (stdDev === 0) return [];
    
    const anomalies = [];
    
    prices.forEach((price, index) => {
      const zScore = Math.abs((price - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          index,
          price,
          zScore,
          type: price > mean ? 'high' : 'low',
          severity: zScore > 3 ? 'high' : 'medium'
        });
      }
    });
    
    return anomalies;
  }

  /**
   * كشف العروض المزيفة
   */
  static detectFakeDeal(product, marketPrices, priceHistory) {
    const currentPrice = cleanPrice(product.price);
    const warnings = [];
    let riskScore = 0;
    
    if (!marketPrices || marketPrices.length < 3) {
      return { isSuspicious: false, riskScore: 0, warnings: [] };
    }
    
    const cleanedPrices = TechnicalAnalysis.removeOutliers(marketPrices);
    const avg = cleanedPrices.reduce((a, b) => a + b, 0) / cleanedPrices.length;
    const stdDev = TechnicalAnalysis.calculateStdDev(cleanedPrices);
    
    // فحص 1: السعر أقل بكثير من المتوسط
    if (currentPrice < avg - 2 * stdDev) {
      warnings.push({
        type: 'price_too_low',
        message: 'السعر أقل بكثير من المتوسط السوقي',
        severity: 'high'
      });
      riskScore += 35;
    }
    
    // فحص 2: السعر أعلى بكثير من المتوسط
    if (currentPrice > avg + 2 * stdDev) {
      warnings.push({
        type: 'price_too_high',
        message: 'السعر أعلى بكثير من المتوسط السوقي',
        severity: 'medium'
      });
      riskScore += 20;
    }
    
    // فحص 3: انخفاض مفاجئ
    if (priceHistory && priceHistory.length >= 5) {
      const last5 = priceHistory.slice(-5).map(h => cleanPrice(h.price));
      const histAvg = last5.reduce((a, b) => a + b, 0) / last5.length;
      
      if (currentPrice < histAvg * 0.6) {
        warnings.push({
          type: 'sudden_drop',
          message: 'انخفاض مفاجئ وغير طبيعي في السعر',
          severity: 'high'
        });
        riskScore += 40;
      }
    }
    
    // فحص 4: مقارنة مع أقل سعر في السوق
    const minPrice = Math.min(...cleanedPrices);
    if (currentPrice > minPrice * 1.5) {
      warnings.push({
        type: 'not_competitive',
        message: 'يوجد خيارات أرخص بكثير',
        severity: 'low'
      });
      riskScore += 10;
    }
    
    // فحص 5: التحقق من معقولية الخصم
    if (product.originalPrice || product.oldPrice) {
      const originalPrice = cleanPrice(product.originalPrice || product.oldPrice);
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
      
      if (discount > 70) {
        warnings.push({
          type: 'unrealistic_discount',
          message: `خصم ${discount.toFixed(0)}% قد يكون غير واقعي`,
          severity: 'high'
        });
        riskScore += 30;
      }
    }
    
    return {
      isSuspicious: riskScore >= 50,
      riskScore: Math.min(100, riskScore),
      riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      warnings
    };
  }
}

// ================================
// 👤 PERSONALITY ENGINE (محسن)
// ================================

class PersonalityEngine {
  
  /**
   * تحليل سلوك المستخدم (بدون ML)
   */
  static analyze(userEvents, price, marketAverage, userHistory = {}) {
    const scores = {
      hunter: 0,      // صياد الصفقات
      analyst: 0,     // المحلل
      impulse: 0,     // المتسرع
      premium: 0,     // محب الجودة
      budget: 0       // المخطط المحدود
    };
    
    // تحليل الأحداث
    if (userEvents) {
      // صياد الصفقات
      if (userEvents.wishlistAdditions > 3) scores.hunter += 15;
      if (userEvents.priceChecks > 5) scores.hunter += 20;
      if (userEvents.alertsSet > 2) scores.hunter += 15;
      if (userEvents.dealsViewed > 10) scores.hunter += 10;
      
      // المحلل
      if (userEvents.clickedAnalysis) scores.analyst += 20;
      if (userEvents.comparisonViews > 3) scores.analyst += 25;
      if (userEvents.reviewsRead > 5) scores.analyst += 15;
      if (userEvents.historyChecked) scores.analyst += 10;
      
      // المتسرع
      if (userEvents.quickPurchases > 2) scores.impulse += 30;
      if (userEvents.avgDecisionTime < 60) scores.impulse += 20; // أقل من دقيقة
      if (userEvents.cartAbandonRate < 0.2) scores.impulse += 15;
      
      // محب الجودة
      if (userEvents.brandSearches > 3) scores.premium += 20;
      if (userEvents.premiumPurchases > 0) scores.premium += 25;
      if (userEvents.filteredByRating) scores.premium += 10;
      
      // المخطط المحدود
      if (userEvents.budgetSet) scores.budget += 25;
      if (userEvents.usedCoupons > 2) scores.budget += 15;
      if (userEvents.waitedForSale) scores.budget += 20;
    }
    
    // إضافة عوامل من التاريخ
    if (userHistory) {
      if (userHistory.avgSavings > 20) scores.hunter += 10;
      if (userHistory.totalSpent > 1000) scores.premium += 10;
      if (userHistory.purchaseFrequency === 'monthly') scores.budget += 10;
    }
    
    // تحديد الشخصية السائدة
    let dominant = 'balanced';
    let maxScore = 0;
    
    Object.entries(scores).forEach(([p, s]) => {
      if (s > maxScore) {
        maxScore = s;
        dominant = p;
      }
    });
    
    if (maxScore < 20) dominant = 'balanced';
    
    const traits = {
      hunter: {
        description: 'يبحث عن أقل سعر ممكن',
        style: 'صياد الصفقات',
        icon: '🎯',
        tip: 'سأبحث لك عن أفضل صفقة'
      },
      analyst: {
        description: 'يفضل التحليل قبل الشراء',
        style: 'المحلل',
        icon: '📊',
        tip: 'سأوفر لك تحليلاً مفصلاً'
      },
      impulse: {
        description: 'يتخذ قرارات سريعة',
        style: 'المتسرع',
        icon: '⚡',
        tip: 'سأخبرك بالقرار السريع'
      },
      premium: {
        description: 'يهتم بالجودة والماركات',
        style: 'محب الجودة',
        icon: '💎',
        tip: 'سأركز على الجودة لك'
      },
      budget: {
        description: 'محدود الميزانية',
        style: 'المخطط',
        icon: '💰',
        tip: 'سأبحث عن بدائل اقتصادية'
      },
      balanced: {
        description: 'سلوك متوازن',
        style: 'متوازن',
        icon: '⚖️',
        tip: 'سأقدم لك توصيات متوازنة'
      }
    };
    
    return {
      type: dominant,
      scores,
      confidence: Math.min(100, maxScore + 20),
      traits: traits[dominant]
    };
  }

  /**
   * تخصيص التوصية حسب الشخصية
   */
  static personalize(personality, product, marketData, analysis, lang) {
    const price = cleanPrice(product.price);
    const avg = marketData.average || price;
    const savings = avg - price;
    const savingsPercent = ((avg - price) / avg) * 100;
    
    const recommendations = {
      hunter: {
        buyIf: savingsPercent >= 15 || analysis?.priceScore >= 75,
        message: savingsPercent >= 15 ? 
          `صفقة ممتازة! وفر ${savingsPercent.toFixed(0)}%` : 
          'انتظر صفقة أفضل',
        priority: 'price'
      },
      analyst: {
        buyIf: analysis?.overallConfidence >= 70,
        message: 'بناءً على التحليل الفني:',
        priority: 'analysis'
      },
      impulse: {
        buyIf: price <= avg * 1.1,
        message: price <= avg ? 'اشترِ الآن!' : 'فكر قليلاً قبل الشراء',
        priority: 'speed'
      },
      premium: {
        buyIf: product.rating >= 4 || product.brand?.premium,
        message: product.rating >= 4 ? 'منتج مميز عالي الجودة' : 'تحقق من الجودة',
        priority: 'quality'
      },
      budget: {
        buyIf: price <= avg * 0.8,
        message: price <= avg * 0.8 ? 
          'مناسب لميزانيتك!' : 
          'ابحث عن بديل أرخص',
        priority: 'budget'
      },
      balanced: {
        buyIf: analysis?.priceScore >= 60,
        message: 'توصية متوازنة:',
        priority: 'balanced'
      }
    };
    
    const rec = recommendations[personality.type] || recommendations.balanced;
    
    return {
      action: rec.buyIf ? 'buy_now' : 'wait',
      reason: rec.message,
      priority: rec.priority,
      confidence: personality.confidence
    };
  }
}

// ================================
// 📊 PRICE INTELLIGENCE (محسن)
// ================================

class PriceIntelligence {
  
  static analyze(product, marketProducts = [], priceHistory = [], lang = 'ar') {
    const currentPrice = cleanPrice(product.price);
    const marketPrices = marketProducts
      .map(p => cleanPrice(p.product_price || p.price || p))
      .filter(p => p > 0);
    
    // النتيجة الأساسية
    const result = {
      current: currentPrice,
      hasEnoughData: marketPrices.length >= 3,
      priceIntel: null,
      technicalIndicators: null,
      predictions: null,
      patterns: null,
      supportResistance: null
    };
    
    // إذا لم تكن هناك بيانات كافية
    if (marketPrices.length < 3) {
      return {
        ...result,
        priceIntel: {
          current: currentPrice,
          score: 50,
          decision: t(lang, 'insufficient_data'),
          color: '#6b7280',
          confidence: 30
        }
      };
    }
    
    // تحليل السوق
    const cleanedPrices = TechnicalAnalysis.removeOutliers(marketPrices);
    const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
    const sorted = [...cleanedPrices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...sorted);
    const max = Math.max(...sorted);
    const stdDev = TechnicalAnalysis.calculateStdDev(cleanedPrices);
    
    // حساب النتيجة السعرية
    let score = 50;
    let decision = t(lang, 'fair_price');
    let color = '#3b82f6';
    let label = '';
    
    const priceToMedianRatio = currentPrice / median;
    
    if (priceToMedianRatio < 0.85) {
      score = 85;
      decision = t(lang, 'excellent_deal');
      color = '#10b981';
      label = `أقل من ${Math.round((1 - priceToMedianRatio) * 100)}% من السوق`;
    } else if (priceToMedianRatio < 0.95) {
      score = 70;
      decision = t(lang, 'good_deal');
      color = '#22c55e';
      label = 'أقل من متوسط السوق';
    } else if (priceToMedianRatio > 1.15) {
      score = 25;
      decision = t(lang, 'overpriced');
      color = '#ef4444';
      label = `أعلى من ${Math.round((priceToMedianRatio - 1) * 100)}% من السوق`;
    } else if (priceToMedianRatio > 1.05) {
      score = 40;
      decision = t(lang, 'wait');
      color = '#f59e0b';
    }
    
    // تحليل تقني إذا كان هناك تاريخ أسعار
    let technicalIndicators = null;
    if (priceHistory && priceHistory.length >= 14) {
      const historyPrices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
      
      if (historyPrices.length >= 14) {
        // RSI
        const rsi = TechnicalAnalysis.calculateRSI(historyPrices);
        
        // MACD
        const macd = TechnicalAnalysis.calculateMACD(historyPrices);
        
        // Bollinger Bands
        const bollinger = TechnicalAnalysis.calculateBollingerBands(historyPrices);
        
        // EMA
        const ema20 = TechnicalAnalysis.calculateEMA(historyPrices, 20);
        const ema50 = TechnicalAnalysis.calculateEMA(historyPrices, 50);
        
        technicalIndicators = {
          rsi: rsi ? rsi[rsi.length - 1] : null,
          rsiSignal: rsi ? 
            (rsi[rsi.length - 1] < 30 ? 'oversold' : 
             rsi[rsi.length - 1] > 70 ? 'overbought' : 'neutral') : null,
          macd: macd ? {
            trend: macd.trend,
            crossover: macd.crossover
          } : null,
          bollinger: bollinger ? {
            position: bollinger.position,
            squeeze: bollinger.squeeze,
            percentB: bollinger.percentB
          } : null,
          ema: {
            ema20: ema20 ? ema20[ema20.length - 1] : null,
            ema50: ema50 ? ema50[ema50.length - 1] : null,
            trend: ema20 && ema50 ? 
              (ema20[ema20.length - 1] > ema50[ema50.length - 1] ? 'bullish' : 'bearish') : null
          }
        };
        
        // تحديث النتيجة بناءً على التحليل التقني
        if (technicalIndicators.rsiSignal === 'oversold') {
          score = Math.min(95, score + 15);
        } else if (technicalIndicators.rsiSignal === 'overbought') {
          score = Math.max(10, score - 15);
        }
        
        // التنبؤات
        result.predictions = PricePredictionEngine.predictPrice(historyPrices);
        
        // الأنماط
        result.patterns = PatternRecognition.detectPricePatterns(historyPrices);
        
        // الدعم والمقاومة
        result.supportResistance = PatternRecognition.calculateSupportResistance(historyPrices);
      }
    }
    
    // حساب الثقة الإجمالية
    const confidence = Math.min(100, 
      40 + 
      marketPrices.length * 3 + 
      (priceHistory?.length >= 14 ? 20 : 0) +
      (technicalIndicators ? 15 : 0)
    );
    
    result.priceIntel = {
      current: currentPrice,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      min,
      max,
      stdDev: Math.round(stdDev * 100) / 100,
      score,
      decision,
      label,
      color,
      confidence
    };
    
    result.technicalIndicators = technicalIndicators;
    result.marketStats = {
      competitors: marketPrices.length,
      priceVariation: Math.round(((max - min) / median) * 100)
    };
    
    return result;
  }
}

// ================================
// 🏪 MERCHANT TRUST ENGINE
// ================================

class MerchantTrustEngine {
  
  static evaluate(storeData, productData = {}, marketData = {}, lang = 'ar') {
    const store = storeData.source || storeData.store || 'Unknown';
    let trustScore = 50;
    const factors = [];
    const warnings = [];
    
    // قاعدة بيانات المتاجر الموثوقة
    const trustedStores = [
      { name: 'amazon', score: 95 },
      { name: 'ebay', score: 85 },
      { name: 'walmart', score: 90 },
      { name: 'aliexpress', score: 70 },
      { name: 'noon', score: 85 },
      { name: 'jarir', score: 85 },
      { name: 'extra', score: 80 },
      { name: 'apple', score: 98 },
      { name: 'samsung', score: 95 },
      { name: 'nike', score: 90 },
      { name: 'namshi', score: 80 },
      { name: 'shein', score: 65 }
    ];
    
    // البحث في المتاجر الموثوقة
    const trustedMatch = trustedStores.find(s => 
      store.toLowerCase().includes(s.name)
    );
    
    if (trustedMatch) {
      trustScore = trustedMatch.score;
      factors.push({ factor: 'known_brand', impact: trustedMatch.score - 50 });
    }
    
    // فحص السعر مقابل السوق
    if (productData.price && marketData.average) {
      const price = cleanPrice(productData.price);
      const avg = marketData.average;
      
      if (price < avg * 0.5) {
        trustScore -= 25;
        warnings.push({
          type: 'suspicious_price',
          message: t(lang, 'fake_offer')
        });
      }
    }
    
    // فحص التقييمات
    if (productData.rating) {
      if (productData.rating >= 4.5) {
        trustScore += 10;
        factors.push({ factor: 'high_rating', impact: 10 });
      } else if (productData.rating < 3) {
        trustScore -= 15;
        warnings.push({ type: 'low_rating', message: 'تقييم منخفض' });
      }
    }
    
    // فحص عدد التقييمات
    if (productData.reviewsCount) {
      if (productData.reviewsCount >= 100) {
        trustScore += 5;
      } else if (productData.reviewsCount < 10) {
        trustScore -= 10;
        warnings.push({ type: 'few_reviews', message: 'عدد تقييمات قليل' });
      }
    }
    
    // تحديد الشارة
    const badge = trustScore >= 85 ? 
      { level: 'gold', icon: '🥇', label: 'موثوق جداً' } :
      trustScore >= 70 ? 
      { level: 'silver', icon: '🥈', label: 'موثوق' } :
      trustScore >= 50 ? 
      { level: 'bronze', icon: '🥉', label: 'مقبول' } :
      { level: 'warning', icon: '⚠️', label: 'احذر' };
    
    return {
      store,
      trustScore: Math.max(0, Math.min(100, trustScore)),
      badge,
      factors,
      warnings
    };
  }
}

// ================================
// 🎯 SCORING ENGINE
// ================================

class ScoringEngine {
  
  /**
   * حساب النتيجة الشاملة
   */
  static calculateOverallScore(analysis) {
    const weights = {
      priceScore: 0.35,
      trustScore: 0.20,
      riskScore: 0.15,
      technicalScore: 0.15,
      predictionScore: 0.15
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    // درجة السعر
    if (analysis.priceIntel?.score) {
      totalScore += analysis.priceIntel.score * weights.priceScore;
      totalWeight += weights.priceScore;
    }
    
    // درجة الثقة
    if (analysis.trustIntel?.merchantTrust?.trustScore) {
      totalScore += analysis.trustIntel.merchantTrust.trustScore * weights.trustScore;
      totalWeight += weights.trustScore;
    }
    
    // درجة المخاطر (معكوسة)
    if (analysis.trustIntel?.overallRisk !== undefined) {
      const riskScore = 100 - analysis.trustIntel.overallRisk;
      totalScore += riskScore * weights.riskScore;
      totalWeight += weights.riskScore;
    }
    
    // درجة التحليل التقني
    if (analysis.technicalIndicators) {
      let techScore = 50;
      
      // RSI
      if (analysis.technicalIndicators.rsiSignal === 'oversold') {
        techScore += 25;
      } else if (analysis.technicalIndicators.rsiSignal === 'overbought') {
        techScore -= 25;
      }
      
      // MACD
      if (analysis.technicalIndicators.macd?.trend === 'bullish') {
        techScore += 15;
      }
      
      // Bollinger
      if (analysis.technicalIndicators.bollinger?.position === 'lower') {
        techScore += 20;
      }
      
      totalScore += techScore * weights.technicalScore;
      totalWeight += weights.technicalScore;
    }
    
    // درجة التنبؤ
    if (analysis.predictions) {
      let predScore = 50;
      
      if (analysis.predictions.trend === 'falling') {
        predScore -= 15;
      } else if (analysis.predictions.trend === 'rising') {
        predScore += 10;
      }
      
      predScore = predScore * (analysis.predictions.confidence / 100);
      
      totalScore += predScore * weights.predictionScore;
      totalWeight += weights.predictionScore;
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }
}

// ================================
// 🔮 MAIN SAGE CORE FUNCTION
// ================================

async function SageCore(
  product, 
  marketProducts = [], 
  priceHistory = [], 
  userEvents = {}, 
  userId = 'guest', 
  userHistory = {}, 
  lang = 'ar'
) {
  const currentPrice = cleanPrice(product.price);
  
  // 1. تحليل الأسعار (المحسن)
  const priceAnalysis = PriceIntelligence.analyze(product, marketProducts, priceHistory, lang);
  
  if (!priceAnalysis.hasEnoughData) {
    return {
      ...priceAnalysis,
      finalVerdict: {
        decision: 'INSUFFICIENT_DATA',
        confidence: 30,
        recommendation: t(lang, 'insufficient_data')
      }
    };
  }
  
  const { priceIntel, technicalIndicators, predictions, patterns, supportResistance, marketStats } = priceAnalysis;
  
  // 2. تحليل الشخصية
  const personality = PersonalityEngine.analyze(userEvents, currentPrice, priceIntel.median, userHistory);
  
  // 3. تقييم التاجر
  const merchantTrust = MerchantTrustEngine.evaluate(
    product, 
    { price: currentPrice, rating: product.rating, reviewsCount: product.reviewsCount },
    { average: priceIntel.median },
    lang
  );
  
  // 4. كشف العروض المزيفة
  const fakeDealCheck = AnomalyDetector.detectFakeDeal(product, marketProducts, priceHistory);
  
  // 5. التوصية المخصصة
  const personalizedRec = PersonalityEngine.personalize(
    personality, 
    product, 
    { average: priceIntel.median },
    { priceScore: priceIntel.score, overallConfidence: priceIntel.confidence },
    lang
  );
  
  // 6. إيجاد أفضل متجر
  let bestStore = null;
  let bestPrice = currentPrice;
  let bestLink = product.link || null;
  
  if (marketProducts.length > 0) {
    const cheapest = marketProducts.reduce((min, item) => {
      const p = cleanPrice(item.product_price || item.price);
      if (!p) return min;
      if (!min || p < min.price) {
        return { 
          price: p, 
          store: item.source || item.store || 'Unknown', 
          link: item.link || null 
        };
      }
      return min;
    }, null);
    
    if (cheapest && cheapest.price < currentPrice) {
      bestStore = cheapest.store;
      bestPrice = cheapest.price;
      bestLink = cheapest.link;
    }
  }
  
  // 7. حساب المدخرات
  const savingsPercent = priceIntel.median ? 
    Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
  const savingsAmount = priceIntel.median ? 
    Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0;
  
  // 8. حساب الثقة الإجمالية
  const confidenceScore = Math.round(
    (priceIntel.confidence * 0.35) +
    ((100 - fakeDealCheck.riskScore) * 0.25) +
    (merchantTrust.trustScore * 0.20) +
    (personality.confidence * 0.10) +
    ((predictions?.confidence || 50) * 0.10)
  );
  
  // 9. القرار الاستراتيجي
  let strategicDecision = 'WAIT';
  let strategicReason = '';
  let strategicColor = '#f59e0b';
  
  // قواعد القرار (المحسنة)
  if (fakeDealCheck.riskScore >= 60) {
    strategicDecision = 'AVOID';
    strategicReason = 'عرض مشبوه - تخطى';
    strategicColor = '#ef4444';
  } else if (merchantTrust.trustScore < 30) {
    strategicDecision = 'CAUTION';
    strategicReason = 'تاجر غير موثوق - احذر';
    strategicColor = '#f59e0b';
  } else if (technicalIndicators?.rsiSignal === 'oversold' && priceIntel.score >= 60) {
    strategicDecision = 'BUY_NOW';
    strategicReason = 'حالة تشبع بيعي + سعر جيد = فرصة ذهبية';
    strategicColor = '#10b981';
  } else if (priceIntel.score >= 75 && fakeDealCheck.riskScore < 30) {
    strategicDecision = 'BUY_NOW';
    strategicReason = `صفقة ممتازة - وفر ${savingsPercent}%`;
    strategicColor = '#10b981';
  } else if (priceIntel.score >= 60 && predictions?.trend !== 'falling') {
    strategicDecision = 'BUY';
    strategicReason = t(lang, 'good_deal');
    strategicColor = '#22c55e';
  } else if (predictions?.trend === 'falling' && priceIntel.score < 70) {
    strategicDecision = 'WAIT';
    strategicReason = t(lang, 'price_drop_expected');
    strategicColor = '#3b82f6';
  } else if (priceIntel.score <= 40) {
    strategicDecision = 'WAIT';
    strategicReason = t(lang, 'overpriced');
    strategicColor = '#ef4444';
  } else {
    strategicDecision = 'CONSIDER';
    strategicReason = t(lang, 'fair_price');
    strategicColor = '#3b82f6';
  }
  
  // تطبيق التخصيص
  if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID') {
    strategicDecision = 'BUY_NOW';
    strategicReason = personalizedRec.reason;
  }
  
  // 10. تحديد أفضل وقت للشراء
  let bestTimeToBuy = null;
  if (predictions) {
    bestTimeToBuy = PricePredictionEngine.predictBestTimeToBuy(currentPrice, priceHistory, predictions);
  }
  
  // 11. النتيجة النهائية
  return {
    // تحليل السعر
    priceIntel: {
      ...priceIntel,
      savingsPercent,
      savingsAmount
    },
    
    // قيمة الصفقة
    valueIntel: {
      score: priceIntel.score,
      competitors: marketStats.competitors,
      savingsPercent,
      savingsAmount,
      priceRange: {
        min: priceIntel.min,
        max: priceIntel.max,
        spread: ((priceIntel.max - priceIntel.min) / priceIntel.median * 100).toFixed(1) + '%'
      }
    },
    
    // التحليل التقني
    technicalIntel: technicalIndicators ? {
      rsi: {
        value: technicalIndicators.rsi?.toFixed(1),
        signal: technicalIndicators.rsiSignal
      },
      macd: technicalIndicators.macd,
      bollinger: technicalIndicators.bollinger,
      ema: technicalIndicators.ema,
      indicators: [
        technicalIndicators.rsiSignal === 'oversold' ? 'إشارة شراء (RSI)' : null,
        technicalIndicators.macd?.crossover ? 'تقاطع MACD' : null,
        technicalIndicators.bollinger?.squeeze ? 'انفجار قادم (Bollinger)' : null
      ].filter(Boolean)
    } : null,
    
    // التنبؤات
    predictionIntel: predictions ? {
      trend: predictions.trend,
      confidence: predictions.confidence,
      forecast: predictions.currentForecast,
      shouldWait: bestTimeToBuy?.shouldWait,
      reason: bestTimeToBuy?.reason
    } : null,
    
    // الأنماط
    patternIntel: patterns ? {
      detected: patterns.map(p => p.description),
      supportResistance: supportResistance ? {
        nearestSupport: supportResistance.levels.strongSupport,
        nearestResistance: supportResistance.levels.strongResistance,
        position: supportResistance.currentPosition
      } : null
    } : null,
    
    // الثقة
    trustIntel: {
      merchantTrust,
      fakeDealCheck,
      overallRisk: fakeDealCheck.riskScore
    },
    
    // الشخصية
    personalityIntel: {
      type: personality.type,
      confidence: personality.confidence,
      traits: personality.traits
    },
    
    // التوصية المخصصة
    personalizedIntel: personalizedRec,
    
    // القرار النهائي
    finalVerdict: {
      decision: strategicDecision,
      confidence: confidenceScore,
      reason: strategicReason,
      color: strategicColor,
      savingsPercent,
      savingsAmount,
      bestStore,
      bestPrice,
      bestLink,
      overallScore: ScoringEngine.calculateOverallScore({
        priceIntel,
        trustIntel: { merchantTrust, overallRisk: fakeDealCheck.riskScore },
        technicalIndicators,
        predictions
      })
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
