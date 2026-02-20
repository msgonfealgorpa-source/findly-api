/**
 * ================================================
 * 🔮 SAGE CORE v5.0 - ULTIMATE SHOPPING INTELLIGENCE
 * ================================================
 * 🧠 Advanced AI-Powered Shopping Decision Engine
 * 📊 Multi-Algorithm Price Analysis & Prediction
 * 🎯 Personalized Recommendations with ML
 * 🔍 Deep Fraud Detection & Trust Analysis
 * ================================================
 */

const axios = require('axios');

// ================================
// 🌍 TRANSLATIONS v5 - EXPANDED
// ================================
const SAGE_TRANSLATIONS = {
  ar: {
    buy_now: "اشتري الآن",
    strong_buy: "شراء قوي",
    wait: "انتظر",
    overpriced: "السعر مرتفع جداً",
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
    tip_compare: "قارن مع خيارات أخرى",
    oversold: "السعر منخفض جداً - فرصة شراء",
    overbought: "السعر مرتفع جداً - انتظر",
    volatility_high: "تقلب عالي في الأسعار",
    volatility_low: "استقرار في الأسعار",
    momentum_bullish: "زخم إيجابي للشراء",
    momentum_bearish: "زخم سلبي - انتظر",
    trend_up: "اتجاه صاعد",
    trend_down: "اتجاه هابط",
    trend_sideways: "اتجاه عرضي",
    historical_low: "أقل سعر تاريخي",
    historical_high: "أعلى سعر تاريخي",
    price_alert_set: "تم تعيين تنبيه للسعر",
    smart_wait: "انتظار ذكي موصى به",
    flash_sale_detected: "تم رصد عرض سريع",
    seasonal_pattern: "نمط موسمي detected",
    ai_confidence_high: "ثقة عالية في التوصية",
    ai_confidence_medium: "ثقة متوسطة",
    ai_confidence_low: "ثقة منخفضة - تحقق يدوي",
    market_anomaly: "شذوذ في السوق",
    price_manipulation: "احتمال تلاعب بالسعر",
    bulk_discount: "خصم الكمية متاح",
    bundle_deal: "عرض حزمة مفيد",
    cashback_available: "استرداد نقدي متاح",
    loyalty_points: "نقاط ولاء متاحة",
    price_guarantee: "ضمان أفضل سعر",
    return_policy_good: "سياسة إرجاع جيدة",
    shipping_free: "شحن مجاني",
    limited_stock: "مخزون محدود",
    price_history_good: "سجل أسعار جيد",
    seasonal_low: "أدنى سعر موسمي",
    black_friday_deal: "عرض مماثل لبلاك فرايداي",
    clearance_sale: "تخفيضات تصفية",
    new_product: "منتج جديد",
    refurbished: "مجدّد",
    price_negotiable: "السعر قابل للتفاوض",
    best_overall: "أفضل خيار شامل",
    value_for_money: "قيمة ممتازة مقابل السعر",
    premium_quality: "جودة عالية",
    budget_friendly: "صديق للميزانية"
  },
  en: {
    buy_now: "Buy Now",
    strong_buy: "Strong Buy",
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
    best_time_to_buy: "Best time to buy",
    trusted_merchant: "Trusted Merchant",
    suspicious_merchant: "Suspicious Merchant",
    recommended: "Recommended",
    alternative: "Cheaper Alternative",
    tip_wait_sale: "Wait for upcoming sales",
    tip_buy_now: "Price is good right now",
    tip_compare: "Compare with other options",
    oversold: "Oversold - Buying Opportunity",
    overbought: "Overbought - Wait",
    volatility_high: "High price volatility",
    volatility_low: "Low volatility - Stable",
    momentum_bullish: "Bullish momentum",
    momentum_bearish: "Bearish momentum - Wait",
    trend_up: "Uptrend",
    trend_down: "Downtrend",
    trend_sideways: "Sideways trend",
    historical_low: "Historical low price",
    historical_high: "Historical high price",
    smart_wait: "Smart waiting recommended",
    flash_sale_detected: "Flash sale detected",
    seasonal_pattern: "Seasonal pattern detected",
    ai_confidence_high: "High confidence recommendation",
    ai_confidence_medium: "Medium confidence",
    ai_confidence_low: "Low confidence - Manual check advised",
    market_anomaly: "Market anomaly detected",
    price_manipulation: "Possible price manipulation"
  },
  fr: {
    buy_now: "Acheter maintenant",
    strong_buy: "Achat fort",
    wait: "Attendre",
    overpriced: "Prix élevé",
    fair_price: "Prix juste",
    excellent_deal: "Excellente offre",
    good_deal: "Bonne offre",
    bad_deal: "Mauvaise offre",
    insufficient_data: "Données insuffisantes",
    fake_offer: "Offre potentiellement irréaliste"
  },
  de: {
    buy_now: "Jetzt kaufen",
    wait: "Warten",
    overpriced: "Überteuert",
    fair_price: "Fairer Preis",
    excellent_deal: "Ausgezeichnetes Angebot",
    insufficient_data: "Unzureichende Daten"
  },
  es: {
    buy_now: "Comprar ahora",
    wait: "Esperar",
    overpriced: "Precio alto",
    fair_price: "Precio justo",
    excellent_deal: "Oferta excelente",
    insufficient_data: "Datos insuficientes"
  },
  tr: {
    buy_now: "Şimdi Satın Al",
    wait: "Bekle",
    overpriced: "Fiyat yüksek",
    fair_price: "Adil fiyat",
    excellent_deal: "Mükemmel fırsat",
    insufficient_data: "Yetersiz veri"
  }
};

// ================================
// 🔧 ADVANCED UTILITY FUNCTIONS
// ================================

function cleanPrice(p) {
  if (!p) return 0;
  if (typeof p === 'number') return p;
  const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, ''));
  return isNaN(cleaned) ? 0 : cleaned;
}

function t(lang, key) {
  const shortLang = (lang || "en").split("-")[0];
  return SAGE_TRANSLATIONS[shortLang]?.[key] 
    || SAGE_TRANSLATIONS["en"][key] 
    || key;
}

// Statistical Functions
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

function calculateMode(data) {
  if (!data || data.length === 0) return null;
  const frequency = {};
  let maxFreq = 0;
  let mode = data[0];
  
  data.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  });
  
  return mode;
}

function calculateStdDev(data) {
  if (!data || data.length < 2) return 0;
  const mean = calculateMean(data);
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

function calculateVariance(data) {
  if (!data || data.length < 2) return 0;
  const mean = calculateMean(data);
  return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
}

function calculateSkewness(data) {
  if (!data || data.length < 3) return 0;
  const mean = calculateMean(data);
  const stdDev = calculateStdDev(data);
  if (stdDev === 0) return 0;
  
  const n = data.length;
  const skew = (n / ((n - 1) * (n - 2))) * 
    data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
  return skew;
}

function calculateKurtosis(data) {
  if (!data || data.length < 4) return 0;
  const mean = calculateMean(data);
  const stdDev = calculateStdDev(data);
  if (stdDev === 0) return 0;
  
  const n = data.length;
  const kurt = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * 
    data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) - 
    (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  return kurt;
}

// Moving Averages
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
  
  // First EMA is SMA
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

function calculateWMA(data, period) {
  if (!data || data.length < period) return null;
  const result = [];
  const weights = Array.from({length: period}, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - period + 1 + j] * weights[j];
    }
    result.push(sum / weightSum);
  }
  
  return result;
}

// Technical Indicators
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
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }
  
  return rsiValues;
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!prices || prices.length < slowPeriod + signalPeriod) return null;
  
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  if (!fastEMA || !slowEMA) return null;
  
  // Calculate MACD line
  const macdLine = [];
  const offset = slowPeriod - fastPeriod;
  
  for (let i = 0; i < slowEMA.length && (i + offset) < fastEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }
  
  // Calculate Signal line
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate Histogram
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
    histogram: histogram.slice(-10),
    trend: macdLine[macdLine.length - 1] > (signalLine?.[signalLine.length - 1] || 0) ? 'bullish' : 'bearish'
  };
}

function calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
  if (!prices || prices.length < period) return null;
  
  const sma = calculateSMA(prices, period);
  if (!sma) return null;
  
  const result = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const stdDev = calculateStdDev(slice);
    const middle = sma[i - period + 1];
    
    result.push({
      upper: middle + (stdDevMultiplier * stdDev),
      middle: middle,
      lower: middle - (stdDevMultiplier * stdDev),
      bandwidth: stdDev > 0 ? ((middle + stdDevMultiplier * stdDev) - (middle - stdDevMultiplier * stdDev)) / middle * 100 : 0
    });
  }
  
  return result;
}

function calculateATR(highPrices, lowPrices, closePrices, period = 14) {
  if (!highPrices || !lowPrices || !closePrices) return null;
  if (highPrices.length < period + 1) return null;
  
  const trueRanges = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const tr = Math.max(
      highPrices[i] - lowPrices[i],
      Math.abs(highPrices[i] - closePrices[i - 1]),
      Math.abs(lowPrices[i] - closePrices[i - 1])
    );
    trueRanges.push(tr);
  }
  
  const atr = calculateSMA(trueRanges, period);
  return atr ? atr[atr.length - 1] : null;
}

// Remove Outliers using IQR method
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

// Advanced Outlier Detection using Z-Score
function removeOutliersZScore(data, threshold = 3) {
  if (!data || data.length < 4) return data;
  const mean = calculateMean(data);
  const stdDev = calculateStdDev(data);
  if (stdDev === 0) return data;
  
  return data.filter(val => Math.abs((val - mean) / stdDev) < threshold);
}

// Time Series Analysis
function calculateAutocorrelation(data, lag = 1) {
  if (!data || data.length < lag + 2) return 0;
  const mean = calculateMean(data);
  const variance = calculateVariance(data);
  if (variance === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < data.length - lag; i++) {
    sum += (data[i] - mean) * (data[i + lag] - mean);
  }
  
  return sum / ((data.length - lag) * variance);
}

// Simple Linear Regression for Trend Prediction
function linearRegression(data) {
  if (!data || data.length < 2) return null;
  
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  data.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
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

// Exponential Smoothing for Price Prediction
function exponentialSmoothing(data, alpha = 0.3) {
  if (!data || data.length === 0) return null;
  
  const result = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  
  return result;
}

// Double Exponential Smoothing (Holt's Method)
function holtExponentialSmoothing(data, alpha = 0.3, beta = 0.1) {
  if (!data || data.length < 2) return null;
  
  const level = [data[0]];
  const trend = [data[1] - data[0]];
  const forecast = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
    
    level.push(newLevel);
    trend.push(newTrend);
    forecast.push(newLevel + newTrend);
  }
  
  // Predict next value
  const nextForecast = level[level.length - 1] + trend[trend.length - 1];
  
  return { level, trend, forecast, nextForecast };
}

// Triple Exponential Smoothing (Holt-Winters)
function holtWintersSmoothing(data, alpha = 0.3, beta = 0.1, gamma = 0.1, seasonLength = 7) {
  if (!data || data.length < seasonLength * 2) return null;
  
  // Initialize seasonal indices
  const seasonals = [];
  for (let i = 0; i < seasonLength; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < data.length; j += seasonLength) {
      sum += data[j];
      count++;
    }
    seasonals.push(sum / count);
  }
  
  // Normalize seasonals
  const seasonalAvg = calculateMean(seasonals);
  for (let i = 0; i < seasonals.length; i++) {
    seasonals[i] /= seasonalAvg;
  }
  
  const level = [data[0] / seasonals[0]];
  const trend = [(data[seasonLength] / data[0]) - 1];
  const forecast = [];
  
  for (let i = 1; i < data.length; i++) {
    const seasonalIndex = i % seasonLength;
    
    const newLevel = alpha * (data[i] / seasonals[seasonalIndex]) + 
                     (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
    const newSeasonal = gamma * (data[i] / newLevel) + (1 - gamma) * seasonals[seasonalIndex];
    
    level.push(newLevel);
    trend.push(newTrend);
    seasonals[seasonalIndex] = newSeasonal;
    
    forecast.push((newLevel + newTrend) * seasonals[(i + 1) % seasonLength]);
  }
  
  return { level, trend, seasonals, forecast };
}

// ================================
// 🧠 AI ENGINE CLASS - ENHANCED
// ================================

class SageAIEngine {
  constructor(apiKey = null, options = {}) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitMs = 1000; // 1 second between requests
  }

  async callGemini(prompt, options = {}) {
    if (!this.apiKey) return null;

    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequestTime < this.rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs));
    }
    this.lastRequestTime = now;

    // Cache check
    const cacheKey = JSON.stringify({ prompt });
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      this.requestCount++;
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: options.temperature || 0.3, 
            maxOutputTokens: options.maxTokens || 2048,
            topP: options.topP || 0.8,
            topK: options.topK || 40
          }
        },
        { timeout: options.timeout || 15000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            this.cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
            return parsed;
          }
        } catch (e) {
          // Not JSON, return as text
        }
        return { text };
      }
      return null;
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      return null;
    }
  }

  async generateAdvice(product, analysis, lang = 'ar') {
    const prompt = `You are an expert shopping advisor with deep market knowledge. 
    
Product: "${product.title}"
Current Price: ${product.price}
Original Price: ${product.originalPrice || 'N/A'}
Category: ${product.category || 'General'}

Market Analysis:
- Market Average: ${analysis.priceIntel?.average || 'N/A'}
- Price Score: ${analysis.priceIntel?.score || 50}/100
- Market Position: ${analysis.priceIntel?.label || 'N/A'}
- Trend: ${analysis.trendIntel?.trend || 'unknown'}
- RSI: ${analysis.technicalIndicators?.rsi || 'N/A'}
- Risk Level: ${analysis.trustIntel?.overallRisk || 0}%

User Context:
- Language: ${lang}
- User Type: ${analysis.personalityIntel?.type || 'neutral'}

Provide a JSON response with:
{
  "advice": "Main recommendation (1-2 sentences)",
  "tip": "Specific actionable tip",
  "confidence": 0-100,
  "reasoning": "Brief explanation of why",
  "timing": "Best timing advice (now/wait/specific time)",
  "alternatives": "Alternative suggestions if any",
  "riskWarning": "Any risk warnings",
  "expectedSavings": "Expected savings percentage if applicable"
}`;

    const result = await this.callGemini(prompt);
    
    if (result && result.advice) {
      return result;
    }
    
    // Fallback logic with enhanced defaults
    if (analysis.priceIntel?.score >= 80) {
      return { 
        advice: t(lang, 'excellent_deal'), 
        tip: t(lang, 'tip_buy_now'), 
        confidence: 85,
        timing: 'now',
        reasoning: 'Price significantly below market average'
      };
    } else if (analysis.priceIntel?.score >= 60) {
      return { 
        advice: t(lang, 'good_deal'), 
        tip: t(lang, 'tip_compare'), 
        confidence: 70,
        timing: 'good'
      };
    }
    
    return { 
      advice: t(lang, 'tip_wait_sale'), 
      tip: t(lang, 'tip_wait_sale'), 
      confidence: 60,
      timing: 'wait'
    };
  }

  async generateDeepAnalysis(product, marketData, priceHistory, lang = 'ar') {
    const prompt = `You are a senior market analyst specializing in e-commerce pricing strategies.

Product Analysis Request:
Title: "${product.title}"
Price: ${product.price}
Category: ${product.category || 'General'}

Market Data:
- Competitors: ${marketData.competitors || 0}
- Price Range: ${marketData.minPrice || 'N/A'} - ${marketData.maxPrice || 'N/A'}
- Average Price: ${marketData.average || 'N/A'}
- Price Volatility: ${marketData.volatility || 'unknown'}

Historical Data Points: ${priceHistory?.length || 0}

Provide comprehensive analysis in JSON format:
{
  "marketPosition": "premium|average|budget|unknown",
  "priceCompetitiveness": 0-100,
  "demandPrediction": "high|medium|low",
  "seasonalFactor": "peak|normal|low|unknown",
  "recommendedAction": "buy|wait|compare|avoid",
  "priceForecast": {
    "shortTerm": "up|down|stable",
    "longTerm": "up|down|stable",
    "confidence": 0-100
  },
  "marketInsights": ["insight1", "insight2"],
  "risks": ["risk1"],
  "opportunities": ["opportunity1"],
  "bestPriceTarget": number,
  "timeFrameOptimal": "now|1week|1month|seasonal"
}`;

    return await this.callGemini(prompt, { temperature: 0.4 });
  }

  async analyzeSentiment(reviews, lang = 'ar') {
    if (!reviews || reviews.length === 0) return { score: 50, label: 'neutral' };

    const reviewsText = reviews.slice(0, 10).map(r => r.text || r).join(' | ');
    
    const prompt = `Analyze the sentiment of these product reviews:
    
"${reviewsText}"

Return JSON:
{
  "score": 0-100 (0=very negative, 100=very positive),
  "label": "very_positive|positive|neutral|negative|very_negative",
  "keyPoints": ["point1", "point2"],
  "warnings": ["warning1"],
  "highlights": ["highlight1"]
}`;

    const result = await this.callGemini(prompt);
    return result || { score: 50, label: 'neutral' };
  }
}

// ================================
// 👤 PERSONALITY ENGINE - ENHANCED
// ================================

class PersonalityEngine {
  constructor() {
    this.userProfiles = new Map();
    this.learningRate = 0.1;
  }

  static analyze(userEvents, price, marketAverage, userHistory = {}) {
    const scores = { 
      hunter: 0, 
      analyst: 0, 
      impulse: 0, 
      premium: 0, 
      budget: 0,
      researcher: 0,
      brand_loyal: 0,
      deal_seeker: 0
    };

    if (userEvents) {
      // Deal Hunter patterns
      if (userEvents.wishlistAdditions > 3) scores.hunter += 15;
      if (userEvents.priceChecks > 5) scores.hunter += 20;
      if (userEvents.couponSearches > 2) scores.hunter += 15;
      if (userEvents.dealAlertSubscriptions) scores.deal_seeker += 25;
      
      // Analyst patterns
      if (userEvents.clickedAnalysis) scores.analyst += 20;
      if (userEvents.comparisonViews > 3) scores.analyst += 25;
      if (userEvents.specComparisons > 2) scores.researcher += 20;
      if (userEvents.reviewReads > 5) scores.analyst += 15;
      
      // Impulse buyer patterns
      if (userEvents.quickPurchases > 2) scores.impulse += 30;
      if (userEvents.sessionTime < 5) scores.impulse += 15;
      if (userEvents.cartAbandonments < 1) scores.impulse += 10;
      
      // Premium buyer patterns
      if (userEvents.brandSearches > 3) scores.premium += 20;
      if (userEvents.premiumBrandPurchases > 2) scores.brand_loyal += 25;
      if (userEvents.qualityFiltersUsed) scores.premium += 15;
      
      // Budget conscious patterns
      if (userEvents.budgetSet) scores.budget += 25;
      if (userEvents.priceRangeFiltered) scores.budget += 15;
      if (userEvents.discountOnlyPurchases) scores.budget += 20;
    }

    // Analyze purchase history
    if (userHistory && userHistory.purchases) {
      const avgPurchasePrice = userHistory.purchases.reduce((a, b) => a + b.price, 0) / userHistory.purchases.length;
      const avgMarketPrice = userHistory.avgMarketPrice || avgPurchasePrice;
      
      if (avgPurchasePrice < avgMarketPrice * 0.8) {
        scores.hunter += 20;
        scores.deal_seeker += 15;
      } else if (avgPurchasePrice > avgMarketPrice * 1.2) {
        scores.premium += 20;
      }
      
      // Brand loyalty analysis
      const brandCounts = {};
      userHistory.purchases.forEach(p => {
        if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      });
      const maxBrandCount = Math.max(...Object.values(brandCounts), 0);
      if (maxBrandCount >= 3) scores.brand_loyal += 25;
    }

    // Find dominant personality
    let dominant = 'neutral';
    let maxScore = 0;
    Object.entries(scores).forEach(([p, s]) => {
      if (s > maxScore) { maxScore = s; dominant = p; }
    });

    if (maxScore < 20) dominant = 'neutral';

    const traits = {
      hunter: { 
        description: 'يبحث عن أقل سعر ممكن', 
        style: 'صياد الصفقات',
        icon: '🎯',
        tips: ['watch_price_drops', 'use_alerts', 'compare_extensively']
      },
      analyst: { 
        description: 'يفضل التحليل قبل الشراء', 
        style: 'المحلل',
        icon: '📊',
        tips: ['read_reviews', 'check_specs', 'compare_features']
      },
      impulse: { 
        description: 'يتخذ قرارات سريعة', 
        style: 'المتسرع',
        icon: '⚡',
        tips: ['quick_decisions', 'flash_sales', 'limited_offers']
      },
      premium: { 
        description: 'يهتم بالجودة والماركات', 
        style: 'محب الجودة',
        icon: '💎',
        tips: ['quality_first', 'brand_trust', 'premium_features']
      },
      budget: { 
        description: 'محدود الميزانية', 
        style: 'المخطط',
        icon: '💰',
        tips: ['budget_tracking', 'alternatives', 'value_for_money']
      },
      researcher: {
        description: 'يبحث ويقارن بكثافة',
        style: 'الباحث',
        icon: '🔍',
        tips: ['deep_research', 'spec_comparison', 'expert_reviews']
      },
      brand_loyal: {
        description: 'وفية للماركات المفضلة',
        style: 'الوفي',
        icon: '🏷️',
        tips: ['trusted_brands', 'loyalty_programs', 'brand_deals']
      },
      deal_seeker: {
        description: 'يلاحق العروض والخصومات',
        style: 'صائد العروض',
        icon: '🎉',
        tips: ['deal_alerts', 'seasonal_sales', 'coupon_stacking']
      },
      neutral: { 
        description: 'سلوك متوازن', 
        style: 'متوازن',
        icon: '⚖️',
        tips: ['balanced_approach', 'flexible_preferences']
      }
    };

    // Calculate secondary personality
    const sortedPersonalities = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const secondaryTraits = sortedPersonalities
      .filter(([p, s]) => s > 10 && p !== dominant)
      .map(([p, s]) => ({ type: p, score: s }));

    return {
      type: dominant,
      scores,
      confidence: Math.min(100, maxScore),
      traits: traits[dominant],
      secondaryTraits,
      personalityVector: this.normalizeVector(scores)
    };
  }

  static normalizeVector(scores) {
    const values = Object.values(scores);
    const max = Math.max(...values, 1);
    const normalized = {};
    Object.entries(scores).forEach(([k, v]) => {
      normalized[k] = v / max;
    });
    return normalized;
  }

  static personalize(personality, product, marketData, lang) {
    const price = cleanPrice(product.price);
    const avg = marketData.average || price;
    const priceRatio = price / avg;

    const recommendations = {
      hunter: () => {
        if (priceRatio <= 0.80) {
          return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 90, urgency: 'high' };
        } else if (priceRatio <= 0.90) {
          return { action: 'buy', reason: t(lang, 'good_deal'), confidence: 80, urgency: 'medium' };
        }
        return { action: 'wait', reason: t(lang, 'tip_wait_sale'), confidence: 75, urgency: 'low' };
      },
      analyst: () => {
        return { 
          action: 'compare', 
          reason: t(lang, 'tip_compare'), 
          confidence: 75, 
          urgency: 'low',
          suggestion: 'review_detailed_analysis'
        };
      },
      impulse: () => {
        if (priceRatio <= 1.05) {
          return { action: 'buy_now', reason: 'السعر مناسب للشراء السريع', confidence: 85, urgency: 'high' };
        }
        return { action: 'consider', reason: t(lang, 'tip_compare'), confidence: 60, urgency: 'medium' };
      },
      premium: () => {
        if (product.brand && product.brand.toLowerCase() !== 'unknown') {
          return { action: 'buy_now', reason: 'منتج مميز من ماركة موثوقة', confidence: 80, urgency: 'medium' };
        }
        return { action: 'consider', reason: 'تحقق من الجودة والماركة', confidence: 70, urgency: 'low' };
      },
      budget: () => {
        if (priceRatio <= 0.70) {
          return { action: 'buy_now', reason: t(lang, 'excellent_deal'), confidence: 95, urgency: 'high' };
        } else if (priceRatio <= 0.85) {
          return { action: 'buy', reason: t(lang, 'good_deal'), confidence: 85, urgency: 'medium' };
        }
        return { action: 'search_alternative', reason: t(lang, 'alternative'), confidence: 80, urgency: 'low' };
      },
      researcher: () => {
        return { 
          action: 'research', 
          reason: 'قارن المواصفات والمميزات', 
          confidence: 70, 
          urgency: 'low',
          suggestion: 'show_spec_comparison'
        };
      },
      brand_loyal: () => {
        return { 
          action: 'consider', 
          reason: 'تحقق من الماركات المفضلة', 
          confidence: 75, 
          urgency: 'medium' 
        };
      },
      deal_seeker: () => {
        if (product.discount && product.discount > 20) {
          return { action: 'buy_now', reason: 'خصم كبير متاح', confidence: 88, urgency: 'high' };
        }
        return { action: 'wait', reason: 'انتظر عرضاً أفضل', confidence: 70, urgency: 'low' };
      },
      neutral: () => {
        if (priceRatio <= 0.95) {
          return { action: 'buy_now', reason: priceRatio <= 0.85 ? t(lang, 'excellent_deal') : t(lang, 'good_deal'), confidence: 75, urgency: 'medium' };
        }
        return { action: 'wait', reason: t(lang, 'tip_wait_sale'), confidence: 65, urgency: 'low' };
      }
    };

    return (recommendations[personality.type] || recommendations.neutral)();
  }

  static getPersonalizedTips(personality, product, marketData, lang) {
    const tips = [];
    const price = cleanPrice(product.price);
    const avg = marketData.average || price;

    switch (personality.type) {
      case 'hunter':
        tips.push({ type: 'alert', text: 'فعّل تنبيهات انخفاض السعر', priority: 1 });
        tips.push({ type: 'compare', text: 'قارن مع 3 متاجر على الأقل', priority: 2 });
        if (price > avg * 0.9) {
          tips.push({ type: 'wait', text: 'انتظر العروض الموسمية', priority: 3 });
        }
        break;
      case 'analyst':
        tips.push({ type: 'research', text: 'اقرأ تقييمات المستخدمين', priority: 1 });
        tips.push({ type: 'specs', text: 'قارن المواصفات التقنية', priority: 2 });
        tips.push({ type: 'history', text: 'راجع سجل أسعار المنتج', priority: 3 });
        break;
      case 'budget':
        tips.push({ type: 'alternative', text: 'ابحث عن بدائل أرخص', priority: 1 });
        tips.push({ type: 'timing', text: 'أفضل وقت للشراء: نهاية الموسم', priority: 2 });
        break;
      case 'premium':
        tips.push({ type: 'quality', text: 'تحقق من ضمان الجودة', priority: 1 });
        tips.push({ type: 'authentic', text: 'تأكد من أصالة المنتج', priority: 2 });
        break;
      default:
        tips.push({ type: 'general', text: 'قارن الأسعار قبل الشراء', priority: 1 });
    }

    return tips;
  }
}

// ================================
// 📊 PRICE INTELLIGENCE - ENHANCED
// ================================

class PriceIntelligence {
  static analyze(product, marketProducts = [], priceHistory = [], lang = 'ar') {
    const currentPrice = cleanPrice(product.price);
    const originalPrice = cleanPrice(product.originalPrice) || currentPrice;
    const marketPrices = marketProducts
      .map(p => cleanPrice(p.product_price || p.price || p))
      .filter(p => p > 0);

    // Minimum data check
    if (marketPrices.length < 3 && (!priceHistory || priceHistory.length < 5)) {
      return {
        priceIntel: {
          current: currentPrice,
          original: originalPrice,
          discount: originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0,
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

    // Statistical Analysis
    const cleanedPrices = removeOutliers(marketPrices);
    const average = calculateMean(marketPrices);
    const median = calculateMedian(cleanedPrices);
    const mode = calculateMode(cleanedPrices);
    const min = Math.min(...cleanedPrices);
    const max = Math.max(...cleanedPrices);
    const stdDev = calculateStdDev(cleanedPrices);
    const variance = calculateVariance(cleanedPrices);
    const skewness = calculateSkewness(cleanedPrices);
    const kurtosis = calculateKurtosis(cleanedPrices);

    // Price scoring with multiple factors
    let score = 50;
    let decision = t(lang, 'fair_price');
    let color = '#3b82f6';
    let label = '';
    let percentile = 50;

    // Calculate percentile position
    const sortedPrices = [...cleanedPrices].sort((a, b) => a - b);
    const position = sortedPrices.filter(p => p < currentPrice).length;
    percentile = Math.round((position / sortedPrices.length) * 100);

    // Enhanced scoring algorithm
    const priceRatio = currentPrice / median;
    
    if (priceRatio < 0.70) {
      score = 95;
      decision = t(lang, 'excellent_deal');
      color = '#059669';
      label = `🔥 أقل من ${Math.round((1 - priceRatio) * 100)}% من السوق`;
    } else if (priceRatio < 0.80) {
      score = 85;
      decision = t(lang, 'excellent_deal');
      color = '#10b981';
      label = `✨ صفقة ممتازة - ${Math.round((1 - priceRatio) * 100)}% تحت المتوسط`;
    } else if (priceRatio < 0.90) {
      score = 75;
      decision = t(lang, 'good_deal');
      color = '#22c55e';
      label = '👍 سعر جيد تحت المتوسط';
    } else if (priceRatio < 0.95) {
      score = 65;
      decision = t(lang, 'fair_price');
      color = '#84cc16';
      label = '💰 سعر عادل قريب من المتوسط';
    } else if (priceRatio < 1.05) {
      score = 55;
      decision = t(lang, 'fair_price');
      color = '#eab308';
      label = '📊 متوسط السوق';
    } else if (priceRatio < 1.15) {
      score = 40;
      decision = t(lang, 'wait');
      color = '#f59e0b';
      label = '⚠️ أعلى من المتوسط';
    } else if (priceRatio < 1.30) {
      score = 25;
      decision = t(lang, 'overpriced');
      color = '#ef4444';
      label = `❌ أعلى بـ ${Math.round((priceRatio - 1) * 100)}% من المتوسط`;
    } else {
      score = 10;
      decision = t(lang, 'overpriced');
      color = '#dc2626';
      label = `🚨 سعر مرتفع جداً - ${Math.round((priceRatio - 1) * 100)}% فوق المتوسط`;
    }

    // Adjust for original price discount
    const discount = originalPrice > currentPrice ? 
      Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    
    if (discount > 30 && score < 80) {
      score = Math.min(90, score + 15);
      label += ` | خصم ${discount}%`;
    }

    // Technical Analysis
    let technicalIndicators = null;
    let trend = null;
    
    if (priceHistory && priceHistory.length >= 5) {
      const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
      
      if (prices.length >= 5) {
        // Moving Averages
        const sma5 = calculateSMA(prices, Math.min(5, prices.length));
        const sma10 = calculateSMA(prices, Math.min(10, prices.length));
        const ema5 = calculateEMA(prices, Math.min(5, prices.length));
        const ema10 = calculateEMA(prices, Math.min(10, prices.length));
        
        // Technical Indicators
        const rsi = calculateRSI(prices);
        const macd = calculateMACD(prices);
        const bollingerBands = calculateBollingerBands(prices);
        
        // Trend Analysis
        const lastSma5 = sma5?.[sma5.length - 1];
        const lastSma10 = sma10?.[sma10.length - 1];
        
        let trendDirection = 'stable';
        let trendStrength = 0;
        
        if (lastSma5 && lastSma10) {
          const trendRatio = lastSma5 / lastSma10;
          if (trendRatio > 1.02) {
            trendDirection = 'rising';
            trendStrength = Math.min(100, Math.round((trendRatio - 1) * 1000));
          } else if (trendRatio < 0.98) {
            trendDirection = 'falling';
            trendStrength = Math.min(100, Math.round((1 - trendRatio) * 1000));
          }
        }
        
        // Linear Regression for prediction
        const regression = linearRegression(prices);
        let prediction = null;
        
        if (regression && regression.rSquared > 0.5) {
          const nextPrice = regression.slope * prices.length + regression.intercept;
          prediction = {
            nextPrice: Math.max(0, nextPrice),
            direction: regression.slope > 0 ? 'up' : 'down',
            confidence: Math.round(regression.rSquared * 100)
          };
        }
        
        // Holt-Winters for seasonal prediction (if enough data)
        let seasonalForecast = null;
        if (prices.length >= 14) {
          const holtResult = holtExponentialSmoothing(prices);
          if (holtResult) {
            seasonalForecast = {
              nextPrice: holtResult.nextForecast,
              trend: holtResult.trend[holtResult.trend.length - 1] > 0 ? 'up' : 'down'
            };
          }
        }
        
        trend = {
          trend: trendDirection,
          strength: trendStrength,
          confidence: Math.min(95, 50 + prices.length * 2),
          predictedPrice: prediction?.nextPrice || lastSma5
        };
        
        technicalIndicators = {
          rsi: rsi ? rsi[rsi.length - 1] : null,
          rsiSignal: rsi ? (rsi[rsi.length - 1] < 30 ? 'oversold' : rsi[rsi.length - 1] > 70 ? 'overbought' : 'neutral') : null,
          macd: macd?.trend || null,
          bollingerPosition: bollingerBands ? 
            (currentPrice > bollingerBands[bollingerBands.length - 1].upper ? 'above' :
             currentPrice < bollingerBands[bollingerBands.length - 1].lower ? 'below' : 'within') : null,
          volatility: stdDev / average > 0.1 ? 'high' : stdDev / average > 0.05 ? 'medium' : 'low',
          prediction,
          seasonalForecast
        };
        
        // Adjust score based on technical indicators
        if (technicalIndicators.rsiSignal === 'oversold' && score < 80) {
          score = Math.min(95, score + 10);
          label += ' | RSI: تشبع بيعي';
        } else if (technicalIndicators.rsiSignal === 'overbought' && score > 30) {
          score = Math.max(10, score - 10);
          label += ' | RSI: تشبع شرائي';
        }
      }
    }

    // Historical Price Analysis
    let historicalAnalysis = null;
    if (priceHistory && priceHistory.length > 0) {
      const historicalPrices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
      if (historicalPrices.length > 0) {
        const historicalMin = Math.min(...historicalPrices);
        const historicalMax = Math.max(...historicalPrices);
        const historicalAvg = calculateMean(historicalPrices);
        
        historicalAnalysis = {
          lowest: historicalMin,
          highest: historicalMax,
          average: historicalAvg,
          currentVsLowest: Math.round((currentPrice / historicalMin - 1) * 100),
          currentVsHighest: Math.round((1 - currentPrice / historicalMax) * 100),
          isHistoricalLow: currentPrice <= historicalMin * 1.05,
          isHistoricalHigh: currentPrice >= historicalMax * 0.95
        };
        
        if (historicalAnalysis.isHistoricalLow) {
          score = Math.min(100, score + 15);
          label = '🏆 أقل أو قريب من أقل سعر تاريخي';
        }
      }
    }

    // Price stability analysis
    const priceStability = {
      coefficient: stdDev > 0 ? (stdDev / average) * 100 : 0,
      level: stdDev / average < 0.05 ? 'very_stable' : 
             stdDev / average < 0.1 ? 'stable' : 
             stdDev / average < 0.2 ? 'moderate' : 'volatile'
    };

    return {
      priceIntel: {
        current: currentPrice,
        original: originalPrice,
        discount,
        average: Math.round(average * 100) / 100,
        median: Math.round(median * 100) / 100,
        mode: mode ? Math.round(mode * 100) / 100 : null,
        min, max,
        stdDev: Math.round(stdDev * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        skewness: Math.round(skewness * 100) / 100,
        kurtosis: Math.round(kurtosis * 100) / 100,
        score,
        percentile,
        decision,
        label,
        color,
        confidence: Math.min(100, 40 + marketPrices.length * 3 + (priceHistory?.length || 0) * 2),
        priceRatio: Math.round(priceRatio * 100) / 100
      },
      trendIntel: trend,
      technicalIndicators,
      historicalAnalysis,
      priceStability,
      hasEnoughData: true,
      marketStats: {
        competitors: marketPrices.length,
        priceVariation: Math.round(((max - min) / median) * 100),
        dataPoints: priceHistory?.length || 0
      }
    };
  }

  static calculateValueScore(product, priceIntel, marketProducts) {
    const price = cleanPrice(product.price);
    
    // Value factors
    const factors = {
      priceScore: priceIntel.score * 0.35,
      marketPosition: (100 - priceIntel.percentile) * 0.25,
      discount: (priceIntel.discount || 0) * 0.2,
      stability: priceIntel.priceStability?.level === 'stable' ? 10 : 5,
      historical: priceIntel.historicalAnalysis?.isHistoricalLow ? 15 : 0
    };
    
    const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
    
    return {
      score: Math.min(100, Math.round(totalScore)),
      factors,
      grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D'
    };
  }
}

// ================================
// 🏪 MERCHANT TRUST ENGINE - ENHANCED
// ================================

class MerchantTrustEngine {
  static trustedStores = [
    'amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'jarir', 'extra', 
    'apple', 'samsung', 'nike', 'adidas', 'zara', 'hm', 'ikea', 'costco',
    'target', 'bestbuy', 'newegg', 'b&h', 'argos', 'asos', 'farfetch',
    'carrefour', 'lulu', 'sharafdg', 'vodafone', 'stc', 'mcdonalds',
    'kfc', 'pizza hut', 'dominos', 'starbucks', 'Netflix'
  ];

  static suspiciousPatterns = [
    'free money', 'guaranteed', 'act now', 'limited time offer',
    'winner', 'congratulations', 'click here', 'urgent',
    'act immediately', 'exclusive deal', 'once in a lifetime',
    'مجاني', 'فوز', 'عاجل', 'محدود'
  ];

  static evaluate(storeData, productData = {}, lang = 'ar') {
    const store = (storeData.source || storeData.store || 'Unknown').toLowerCase();
    let trustScore = 50;
    const factors = [];
    const warnings = [];
    const strengths = [];

    // Check if trusted store
    const isTrustedStore = this.trustedStores.some(s => store.includes(s.toLowerCase()));
    if (isTrustedStore) {
      trustScore += 30;
      factors.push({ factor: 'known_brand', impact: +30, description: 'متجر معروف وموثوق' });
      strengths.push('علامة تجارية معروفة');
    }

    // Check store rating if available
    if (storeData.rating) {
      const rating = parseFloat(storeData.rating);
      if (rating >= 4.5) {
        trustScore += 20;
        factors.push({ factor: 'high_rating', impact: +20, description: `تقييم عالي: ${rating}` });
        strengths.push(`تقييم ${rating}/5`);
      } else if (rating >= 4.0) {
        trustScore += 10;
        factors.push({ factor: 'good_rating', impact: +10, description: `تقييم جيد: ${rating}` });
      } else if (rating < 3.0) {
        trustScore -= 15;
        factors.push({ factor: 'low_rating', impact: -15, description: `تقييم منخفض: ${rating}` });
        warnings.push('تقييم المتجر منخفض');
      }
    }

    // Check number of reviews
    if (storeData.reviewCount) {
      const reviewCount = parseInt(storeData.reviewCount);
      if (reviewCount >= 1000) {
        trustScore += 15;
        factors.push({ factor: 'many_reviews', impact: +15, description: `${reviewCount} تقييم` });
      } else if (reviewCount >= 100) {
        trustScore += 8;
        factors.push({ factor: 'moderate_reviews', impact: +8, description: `${reviewCount} تقييم` });
      } else if (reviewCount < 10) {
        trustScore -= 10;
        warnings.push('عدد تقييمات قليل');
      }
    }

    // Check store age/domain if available
    if (storeData.domainAge) {
      if (storeData.domainAge > 365 * 3) {
        trustScore += 10;
        strengths.push('متجر قديم وموثوق');
      } else if (storeData.domainAge < 30) {
        trustScore -= 20;
        warnings.push('متجر جديد');
      }
    }

    // Price vs market analysis
    if (productData.price && productData.marketAverage) {
      const priceRatio = cleanPrice(productData.price) / productData.marketAverage;
      if (priceRatio < 0.5) {
        trustScore -= 25;
        factors.push({ factor: 'price_too_low', impact: -25, description: 'سعر غير واقعي' });
        warnings.push(t(lang, 'fake_offer'));
      } else if (priceRatio < 0.7) {
        trustScore -= 10;
        factors.push({ factor: 'price_suspicious', impact: -10, description: 'سعر مشبوه' });
        warnings.push('السعر أقل بكثير من المتوسط');
      }
    }

    // SSL/Security check simulation
    if (storeData.hasSSL !== false) {
      trustScore += 5;
    } else {
      trustScore -= 15;
      warnings.push('الموقع غير آمن');
    }

    // Return policy check
    if (storeData.hasReturnPolicy) {
      trustScore += 10;
      strengths.push('سياسة إرجاع متاحة');
    }

    // Contact info check
    if (storeData.hasContactInfo) {
      trustScore += 5;
    }

    // Badge calculation
    const badge = trustScore >= 85 ? { level: 'platinum', icon: '🏆', label: 'موثوقية بلاتينية' } :
                  trustScore >= 75 ? { level: 'gold', icon: '🥇', label: 'موثوقية ذهبية' } :
                  trustScore >= 65 ? { level: 'silver', icon: '🥈', label: 'موثوقية فضية' } :
                  trustScore >= 50 ? { level: 'bronze', icon: '🥉', label: 'موثوقية برونزية' } :
                  trustScore >= 35 ? { level: 'warning', icon: '⚠️', label: 'تحقق قبل الشراء' } :
                  { level: 'danger', icon: '🚨', label: 'غير موثوق' };

    // Trust signals
    const trustSignals = {
      hasSecurePayment: trustScore >= 50,
      hasReturnPolicy: trustScore >= 60,
      hasCustomerSupport: trustScore >= 55,
      hasVerifiedReviews: trustScore >= 65
    };

    return {
      store: storeData.source || storeData.store || 'Unknown',
      trustScore: Math.max(0, Math.min(100, trustScore)),
      badge,
      factors,
      warnings,
      strengths,
      trustSignals,
      recommendation: this.getTrustRecommendation(trustScore, lang)
    };
  }

  static getTrustRecommendation(score, lang) {
    if (score >= 75) return { action: 'safe', text: 'آمن للشراء' };
    if (score >= 50) return { action: 'caution', text: 'تحقق قبل الشراء' };
    if (score >= 30) return { action: 'warning', text: 'احذر من الشراء' };
    return { action: 'avoid', text: 'تجنب الشراء' };
  }

  static quickTrustCheck(storeName) {
    const store = (storeName || '').toLowerCase();
    return this.trustedStores.some(s => store.includes(s.toLowerCase()));
  }
}

// ================================
// 🔍 FAKE DEAL DETECTOR - ENHANCED
// ================================

class FakeDealDetector {
  static detect(product, marketProducts, priceHistory = [], lang = 'ar') {
    const warnings = [];
    const riskFactors = [];
    const redFlags = [];
    const greenFlags = [];
    let riskScore = 0;

    const currentPrice = cleanPrice(product.price);
    const originalPrice = cleanPrice(product.originalPrice) || currentPrice;
    const marketPrices = marketProducts
      .map(p => cleanPrice(p.product_price || p.price))
      .filter(p => p > 0);

    // 1. Price comparison analysis
    if (marketPrices.length >= 3) {
      const avg = calculateMean(marketPrices);
      const min = Math.min(...marketPrices);
      const max = Math.max(...marketPrices);
      const stdDev = calculateStdDev(marketPrices);
      const median = calculateMedian(marketPrices);

      // Unrealistic low price
      if (currentPrice < avg * 0.4) {
        warnings.push('السعر منخفض بشكل غير طبيعي');
        riskFactors.push({ factor: 'extremely_low_price', severity: 'critical', score: 50 });
        redFlags.push('السعر أقل من 40% من المتوسط');
        riskScore += 50;
      } else if (currentPrice < avg * 0.6) {
        warnings.push('السعر مشبوه - أقل بكثير من المتوسط');
        riskFactors.push({ factor: 'suspiciously_low_price', severity: 'high', score: 35 });
        redFlags.push('السعر أقل من 60% من المتوسط');
        riskScore += 35;
      } else if (currentPrice < avg * 0.75) {
        riskFactors.push({ factor: 'below_average_price', severity: 'medium', score: 15 });
        riskScore += 15;
      }

      // Price far from median
      if (currentPrice > max * 1.5) {
        warnings.push('السعر أعلى بكثير من السوق');
        riskFactors.push({ factor: 'overpriced', severity: 'high', score: 30 });
        redFlags.push('السعر أعلى من أي منافس');
        riskScore += 30;
      }

      // Check if price is an outlier using Z-score
      if (stdDev > 0) {
        const zScore = Math.abs((currentPrice - avg) / stdDev);
        if (zScore > 3) {
          redFlags.push(`السعر خارج النطاق الطبيعي (Z-score: ${zScore.toFixed(2)})`);
          riskScore += 25;
        }
      }
    }

    // 2. Discount analysis
    if (originalPrice > currentPrice) {
      const discountPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
      
      if (discountPercent > 80) {
        warnings.push('خصم غير واقعي');
        riskFactors.push({ factor: 'unrealistic_discount', severity: 'critical', score: 45 });
        redFlags.push(`خصم ${Math.round(discountPercent)}% - مشبوه`);
        riskScore += 45;
      } else if (discountPercent > 60) {
        riskFactors.push({ factor: 'high_discount', severity: 'high', score: 25 });
        redFlags.push(`خصم عالي جداً: ${Math.round(discountPercent)}%`);
        riskScore += 25;
      } else if (discountPercent > 40) {
        riskFactors.push({ factor: 'significant_discount', severity: 'medium', score: 10 });
        riskScore += 10;
      } else if (discountPercent > 20 && discountPercent <= 40) {
        greenFlags.push(`خصم معقول: ${Math.round(discountPercent)}%`);
        riskScore -= 5;
      }
    }

    // 3. Price history consistency
    if (priceHistory && priceHistory.length >= 5) {
      const historicalPrices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
      const historicalMin = Math.min(...historicalPrices);
      const historicalMax = Math.max(...historicalPrices);
      
      // Price suddenly dropped dramatically
      const recentAvg = historicalPrices.slice(-5).reduce((a, b) => a + b, 0) / 5;
      if (currentPrice < recentAvg * 0.5) {
        warnings.push('انخفاض مفاجئ وغير مبرر');
        riskFactors.push({ factor: 'sudden_price_drop', severity: 'high', score: 30 });
        redFlags.push('انخفاض كبير ومفاجئ عن الأسعار السابقة');
        riskScore += 30;
      }
      
      // Check if current price matches historical low (good sign)
      if (currentPrice <= historicalMin * 1.05) {
        greenFlags.push('السعر قريب من أقل سعر تاريخي');
        riskScore -= 10;
      }
    }

    // 4. Product title analysis for suspicious keywords
    const title = (product.title || '').toLowerCase();
    const suspiciousKeywords = [
      'free', '100% off', 'zero cost', 'gratis', 'complimentary',
      'مجاني', 'بدون سعر', 'هدية مجانية'
    ];
    
    suspiciousKeywords.forEach(keyword => {
      if (title.includes(keyword)) {
        redFlags.push(`كلمة مشبوهة في العنوان: "${keyword}"`);
        riskScore += 20;
      }
    });

    // 5. Source reliability check
    if (product.source) {
      const isTrusted = MerchantTrustEngine.quickTrustCheck(product.source);
      if (isTrusted) {
        greenFlags.push('المصدر موثوق');
        riskScore -= 15;
      }
    }

    // 6. Market competition analysis
    if (marketPrices.length >= 5) {
      greenFlags.push(`يوجد ${marketPrices.length} بديل للمنتج`);
      riskScore -= 5;
    } else if (marketPrices.length < 3) {
      riskFactors.push({ factor: 'limited_market_data', severity: 'low', score: 10 });
      riskScore += 10;
    }

    // Calculate final risk level
    const finalRiskScore = Math.max(0, Math.min(100, riskScore));
    const riskLevel = finalRiskScore >= 70 ? 'critical' :
                      finalRiskScore >= 50 ? 'high' :
                      finalRiskScore >= 30 ? 'medium' :
                      finalRiskScore >= 15 ? 'low' : 'minimal';

    // Generate recommendation
    let recommendation = 'safe';
    let recommendationText = 'عرض آمن';
    
    if (finalRiskScore >= 70) {
      recommendation = 'avoid';
      recommendationText = 'تجنب هذا العرض';
    } else if (finalRiskScore >= 50) {
      recommendation = 'high_caution';
      recommendationText = 'تحقق جيداً قبل الشراء';
    } else if (finalRiskScore >= 30) {
      recommendation = 'caution';
      recommendationText = 'احذر وتحقق';
    } else if (finalRiskScore >= 15) {
      recommendation = 'verify';
      recommendationText = 'تحقق من التفاصيل';
    }

    return {
      isSuspicious: finalRiskScore >= 40,
      riskScore: finalRiskScore,
      riskLevel,
      warnings,
      riskFactors,
      redFlags,
      greenFlags,
      recommendation,
      recommendationText,
      confidence: Math.min(100, 50 + (marketPrices.length * 5) + (priceHistory?.length || 0) * 3)
    };
  }

  static analyzePattern(product, marketProducts) {
    // Pattern recognition for common scam tactics
    const patterns = [];
    const currentPrice = cleanPrice(product.price);
    const marketPrices = marketProducts.map(p => cleanPrice(p.product_price || p.price)).filter(p => p > 0);
    
    if (marketPrices.length >= 3) {
      const avg = calculateMean(marketPrices);
      
      // Bait and switch pattern
      if (currentPrice < avg * 0.5 && product.stock === 'limited') {
        patterns.push({
          type: 'bait_and_switch',
          description: 'نمط الطعم والتبديل - سعر منخفض جداً مع مخزون محدود',
          probability: 70
        });
      }
      
      // Price anchoring pattern
      if (product.originalPrice && cleanPrice(product.originalPrice) > avg * 2) {
        patterns.push({
          type: 'price_anchoring',
          description: 'نمط ربط السعر - سعر أصلي مبالغ فيه',
          probability: 60
        });
      }
    }
    
    return patterns;
  }
}

// ================================
// 📈 PRICE PREDICTOR - NEW
// ================================

class PricePredictor {
  static predict(priceHistory, days = 7) {
    if (!priceHistory || priceHistory.length < 10) {
      return { confidence: 0, prediction: null };
    }

    const prices = priceHistory.map(h => cleanPrice(h.price)).filter(p => p > 0);
    if (prices.length < 10) return { confidence: 0, prediction: null };

    // Multiple prediction methods
    const predictions = [];

    // 1. Linear Regression
    const regression = linearRegression(prices);
    if (regression && regression.rSquared > 0.3) {
      predictions.push({
        method: 'linear_regression',
        price: regression.slope * (prices.length + days) + regression.intercept,
        confidence: regression.rSquared * 100
      });
    }

    // 2. Holt Exponential Smoothing
    const holt = holtExponentialSmoothing(prices);
    if (holt) {
      predictions.push({
        method: 'holt_smoothing',
        price: holt.nextForecast,
        confidence: 60
      });
    }

    // 3. Moving Average Trend
    const sma5 = calculateSMA(prices, 5);
    const sma10 = calculateSMA(prices, 10);
    if (sma5 && sma10 && sma5.length > 0 && sma10.length > 0) {
      const trend = sma5[sma5.length - 1] - sma10[sma10.length - 1];
      const predictedPrice = prices[prices.length - 1] + (trend * days / 5);
      predictions.push({
        method: 'ma_trend',
        price: predictedPrice,
        confidence: 50
      });
    }

    // Weighted average of predictions
    const totalConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const weightedPrice = predictions.reduce((sum, p) => sum + p.price * p.confidence, 0) / totalConfidence;

    // Calculate trend
    const recentPrices = prices.slice(-5);
    const olderPrices = prices.slice(-10, -5);
    const recentAvg = calculateMean(recentPrices);
    const olderAvg = calculateMean(olderPrices);
    const trendDirection = recentAvg > olderAvg * 1.02 ? 'rising' : 
                           recentAvg < olderAvg * 0.98 ? 'falling' : 'stable';

    return {
      predictions,
      finalPrediction: {
        price: Math.round(weightedPrice * 100) / 100,
        direction: trendDirection,
        confidence: Math.round(totalConfidence / predictions.length),
        change: Math.round((weightedPrice - prices[prices.length - 1]) / prices[prices.length - 1] * 100)
      }
    };
  }

  static analyzeSeasonality(priceHistory) {
    if (!priceHistory || priceHistory.length < 30) {
      return { hasSeasonality: false, pattern: null };
    }

    const prices = priceHistory.map(h => cleanPrice(h.price));
    const autocorr7 = calculateAutocorrelation(prices, 7);
    const autocorr30 = calculateAutocorrelation(prices, 30);

    let pattern = null;
    if (autocorr7 > 0.5) {
      pattern = { period: 'weekly', strength: autocorr7 };
    } else if (autocorr30 > 0.5) {
      pattern = { period: 'monthly', strength: autocorr30 };
    }

    return {
      hasSeasonality: pattern !== null,
      pattern,
      autocorrelations: { weekly: autocorr7, monthly: autocorr30 }
    };
  }

  static getOptimalBuyTime(priceHistory) {
    if (!priceHistory || priceHistory.length < 14) {
      return { optimal: 'unknown', confidence: 0 };
    }

    const dayOfWeekPrices = {};
    priceHistory.forEach(h => {
      if (h.date) {
        const date = new Date(h.date);
        const day = date.getDay();
        if (!dayOfWeekPrices[day]) dayOfWeekPrices[day] = [];
        dayOfWeekPrices[day].push(cleanPrice(h.price));
      }
    });

    // Find day with lowest average price
    let bestDay = null;
    let lowestAvg = Infinity;
    
    Object.entries(dayOfWeekPrices).forEach(([day, prices]) => {
      const avg = calculateMean(prices);
      if (avg < lowestAvg) {
        lowestAvg = avg;
        bestDay = parseInt(day);
      }
    });

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return {
      optimal: bestDay !== null ? dayNames[bestDay] : 'unknown',
      bestDay,
      confidence: Object.keys(dayOfWeekPrices).length >= 5 ? 70 : 40,
      averageSavings: lowestAvg !== Infinity ? 
        Math.round((1 - lowestAvg / calculateMean(priceHistory.map(h => cleanPrice(h.price)))) * 100) : 0
    };
  }
}

// ================================
// 🎯 RECOMMENDATION ENGINE - NEW
// ================================

class RecommendationEngine {
  static generate(analysis, product, marketProducts, lang = 'ar') {
    const recommendations = [];
    const currentPrice = cleanPrice(product.price);

    // Primary recommendation based on analysis
    const primary = this.getPrimaryRecommendation(analysis, product, lang);
    recommendations.push(primary);

    // Secondary recommendations
    if (analysis.priceIntel?.score >= 70) {
      recommendations.push({
        type: 'opportunity',
        priority: 'high',
        action: 'buy_now',
        reason: 'فرصة شراء ممتازة',
        confidence: 85
      });
    }

    // Alternative recommendations
    if (marketProducts && marketProducts.length > 0) {
      const cheaper = marketProducts
        .filter(p => cleanPrice(p.product_price || p.price) < currentPrice * 0.95)
        .sort((a, b) => cleanPrice(a.product_price || a.price) - cleanPrice(b.product_price || b.price))
        .slice(0, 3);

      if (cheaper.length > 0) {
        recommendations.push({
          type: 'alternative',
          priority: 'medium',
          action: 'compare',
          reason: `يوجد ${cheaper.length} بديل أرخص`,
          alternatives: cheaper.map(p => ({
            store: p.source || p.store,
            price: cleanPrice(p.product_price || p.price),
            savings: Math.round((1 - cleanPrice(p.product_price || p.price) / currentPrice) * 100)
          })),
          confidence: 75
        });
      }
    }

    // Timing recommendation
    if (analysis.trendIntel) {
      if (analysis.trendIntel.trend === 'falling') {
        recommendations.push({
          type: 'timing',
          priority: 'medium',
          action: 'wait',
          reason: 'السعر في انخفاض - انتظر للمزيد',
          expectedSavings: 5,
          confidence: analysis.trendIntel.confidence
        });
      } else if (analysis.trendIntel.trend === 'rising' && analysis.priceIntel?.score >= 60) {
        recommendations.push({
          type: 'timing',
          priority: 'high',
          action: 'buy_now',
          reason: 'السعر في ارتفاع - اشتري الآن',
          confidence: analysis.trendIntel.confidence
        });
      }
    }

    // Risk-based recommendation
    if (analysis.trustIntel?.overallRisk >= 40) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        action: 'verify',
        reason: 'تحقق من البائع والمنتج',
        confidence: 80
      });
    }

    return this.prioritizeRecommendations(recommendations);
  }

  static getPrimaryRecommendation(analysis, product, lang) {
    const priceScore = analysis.priceIntel?.score || 50;
    const riskScore = analysis.trustIntel?.overallRisk || 0;
    const trend = analysis.trendIntel?.trend || 'stable';

    if (riskScore >= 60) {
      return {
        type: 'primary',
        priority: 'critical',
        action: 'avoid',
        reason: 'تجنب هذا العرض - مخاطر عالية',
        confidence: 90
      };
    }

    if (priceScore >= 85 && riskScore < 30) {
      return {
        type: 'primary',
        priority: 'high',
        action: 'strong_buy',
        reason: t(lang, 'excellent_deal'),
        confidence: 90
      };
    }

    if (priceScore >= 70 && trend !== 'falling') {
      return {
        type: 'primary',
        priority: 'high',
        action: 'buy',
        reason: t(lang, 'good_deal'),
        confidence: 80
      };
    }

    if (trend === 'falling' && priceScore < 70) {
      return {
        type: 'primary',
        priority: 'medium',
        action: 'wait',
        reason: t(lang, 'price_drop_expected'),
        confidence: 75
      };
    }

    if (priceScore <= 40) {
      return {
        type: 'primary',
        priority: 'medium',
        action: 'wait',
        reason: t(lang, 'overpriced'),
        confidence: 70
      };
    }

    return {
      type: 'primary',
      priority: 'medium',
      action: 'consider',
      reason: t(lang, 'fair_price'),
      confidence: 60
    };
  }

  static prioritizeRecommendations(recommendations) {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => 
      (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
    );
  }
}

// ================================
// 🧠 LEARNING ENGINE - NEW
// ================================

class LearningEngine {
  constructor() {
    this.memory = new Map();
    this.patterns = new Map();
    this.userFeedback = new Map();
  }

  // Store analysis for learning
  storeAnalysis(userId, product, analysis, outcome) {
    const key = `${userId}_${product.id || product.title}`;
    const entry = {
      product,
      analysis,
      outcome,
      timestamp: Date.now()
    };
    
    if (!this.memory.has(key)) {
      this.memory.set(key, []);
    }
    this.memory.get(key).push(entry);

    // Learn patterns
    this.learnFromOutcome(analysis, outcome);
  }

  // Learn from outcomes
  learnFromOutcome(analysis, outcome) {
    // Track which factors led to successful purchases
    if (outcome === 'successful_purchase') {
      const priceScore = analysis.priceIntel?.score || 50;
      const key = `price_score_${Math.round(priceScore / 10) * 10}`;
      
      this.patterns.set(key, (this.patterns.get(key) || 0) + 1);
    }
  }

  // Get learned recommendations
  getLearnedInsights(priceScore, riskScore) {
    const insights = [];
    
    // Check if similar price scores led to successful purchases
    const scoreKey = `price_score_${Math.round(priceScore / 10) * 10}`;
    const successCount = this.patterns.get(scoreKey) || 0;
    
    if (successCount > 3) {
      insights.push({
        type: 'learned',
        text: 'نمط ناجح: هذا المستوى من الأسعار أدى لشراء ناجح',
        confidence: 70
      });
    }
    
    return insights;
  }

  // Record user feedback
  recordFeedback(userId, productId, feedback) {
    const key = `${userId}_${productId}`;
    this.userFeedback.set(key, {
      feedback,
      timestamp: Date.now()
    });
  }

  // Get user preferences based on history
  getUserPreferences(userId) {
    const entries = Array.from(this.memory.entries())
      .filter(([key]) => key.startsWith(userId));
    
    if (entries.length === 0) return null;

    // Analyze patterns
    const categories = {};
    const priceRanges = [];
    
    entries.forEach(([_, data]) => {
      data.forEach(entry => {
        if (entry.outcome === 'successful_purchase') {
          if (entry.product.category) {
            categories[entry.product.category] = (categories[entry.product.category] || 0) + 1;
          }
          priceRanges.push(cleanPrice(entry.product.price));
        }
      });
    });

    return {
      preferredCategories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat),
      averagePurchasePrice: priceRanges.length > 0 ? calculateMean(priceRanges) : null
    };
  }
}

// ================================
// 🔮 MAIN SAGE CORE FUNCTION - ULTIMATE
// ================================

async function SageCore(product, marketProducts = [], priceHistory = [], userEvents = {}, userId = 'guest', userHistory = {}, lang = 'ar', options = {}) {
  const startTime = Date.now();
  const currentPrice = cleanPrice(product.price);
  const originalPrice = cleanPrice(product.originalPrice) || currentPrice;

  // Initialize engines
  const ai = new SageAIEngine(null, options);
  const learner = new LearningEngine();

  // ================================
  // 1. PRICE INTELLIGENCE ANALYSIS
  // ================================
  const priceAnalysis = PriceIntelligence.analyze(product, marketProducts, priceHistory, lang);
  
  if (!priceAnalysis.hasEnoughData) {
    return {
      ...priceAnalysis,
      finalVerdict: { 
        decision: 'INSUFFICIENT_DATA', 
        confidence: 30, 
        recommendation: t(lang, 'insufficient_data'),
        action: 'gather_more_data'
      }
    };
  }

  const { priceIntel, trendIntel, technicalIndicators, historicalAnalysis, priceStability, marketStats } = priceAnalysis;

  // ================================
  // 2. PERSONALITY ANALYSIS
  // ================================
  const personality = PersonalityEngine.analyze(userEvents, currentPrice, priceIntel.median, userHistory);
  const personalizedTips = PersonalityEngine.getPersonalizedTips(personality, product, { average: priceIntel.median }, lang);

  // ================================
  // 3. MERCHANT TRUST ANALYSIS
  // ================================
  const merchantTrust = MerchantTrustEngine.evaluate(
    product, 
    { price: currentPrice, marketAverage: priceIntel.median }, 
    lang
  );

  // ================================
  // 4. FAKE DEAL DETECTION
  // ================================
  const fakeDealCheck = FakeDealDetector.detect(product, marketProducts, priceHistory, lang);
  const patternAnalysis = FakeDealDetector.analyzePattern(product, marketProducts);

  // ================================
  // 5. PRICE PREDICTION
  // ================================
  const pricePrediction = PricePredictor.predict(priceHistory, 7);
  const seasonality = PricePredictor.analyzeSeasonality(priceHistory);
  const optimalTime = PricePredictor.getOptimalBuyTime(priceHistory);

  // ================================
  // 6. AI INSIGHTS
  // ================================
  let aiInsights = null;
  try {
    aiInsights = await ai.generateAdvice(product, { 
      priceIntel, 
      trendIntel, 
      technicalIndicators 
    }, lang);
  } catch (e) {
    console.error('AI insights error:', e.message);
  }

  // ================================
  // 7. PERSONALIZED RECOMMENDATION
  // ================================
  const personalizedRec = PersonalityEngine.personalize(personality, product, { average: priceIntel.median }, lang);

  // ================================
  // 8. VALUE SCORE CALCULATION
  // ================================
  const valueScore = PriceIntelligence.calculateValueScore(product, priceIntel, marketProducts);

  // ================================
  // 9. BEST STORE/PRICE ANALYSIS
  // ================================
  let bestStore = null, bestPrice = currentPrice, bestLink = product.link || null;
  let alternatives = [];
  
  if (marketProducts && marketProducts.length > 0) {
    const sortedByPrice = [...marketProducts]
      .filter(p => cleanPrice(p.product_price || p.price) > 0)
      .sort((a, b) => 
        cleanPrice(a.product_price || a.price) - cleanPrice(b.product_price || b.price)
      );
    
    if (sortedByPrice.length > 0) {
      const cheapest = sortedByPrice[0];
      const cheapestPrice = cleanPrice(cheapest.product_price || cheapest.price);
      
      if (cheapestPrice < currentPrice) {
        bestStore = cheapest.source || cheapest.store || 'Unknown';
        bestPrice = cheapestPrice;
        bestLink = cheapest.link || null;
      }
      
      // Get top 3 alternatives
      alternatives = sortedByPrice.slice(0, 3).map(p => ({
        store: p.source || p.store || 'Unknown',
        price: cleanPrice(p.product_price || p.price),
        link: p.link || null,
        savings: Math.round((1 - cleanPrice(p.product_price || p.price) / currentPrice) * 100)
      }));
    }
  }

  // ================================
  // 10. RECOMMENDATIONS GENERATION
  // ================================
  const allAnalysis = {
    priceIntel,
    trendIntel,
    technicalIndicators,
    trustIntel: { merchantTrust, fakeDealCheck, overallRisk: fakeDealCheck.riskScore },
    personalityIntel: { type: personality.type, confidence: personality.confidence, traits: personality.traits }
  };
  
  const recommendations = RecommendationEngine.generate(allAnalysis, product, marketProducts, lang);

  // ================================
  // 11. LEARNED INSIGHTS
  // ================================
  const learnedInsights = learner.getLearnedInsights(priceIntel.score, fakeDealCheck.riskScore);

  // ================================
  // 12. FINAL VERDICT CALCULATION
  // ================================
  const savingsPercent = priceIntel.median ? 
    Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
  
  // Comprehensive confidence calculation
  const confidenceComponents = {
    price: priceIntel.confidence * 0.25,
    trust: (100 - fakeDealCheck.riskScore) * 0.20,
    merchant: merchantTrust.trustScore * 0.15,
    personality: personality.confidence * 0.10,
    trend: (trendIntel?.confidence || 50) * 0.10,
    technical: technicalIndicators ? 15 : 0,
    data: Math.min(10, marketStats.competitors),
    prediction: pricePrediction.finalPrediction?.confidence ? pricePrediction.finalPrediction.confidence * 0.05 : 0
  };
  
  const confidenceScore = Math.round(
    Object.values(confidenceComponents).reduce((a, b) => a + b, 0)
  );

  // Strategic decision logic
  let strategicDecision = 'WAIT';
  let strategicReason = '';
  let strategicColor = '#f59e0b';
  let urgency = 'medium';

  // Critical risk check
  if (fakeDealCheck.riskScore >= 60) {
    strategicDecision = 'AVOID';
    strategicReason = 'عرض مشبوه - مخاطر عالية';
    strategicColor = '#dc2626';
    urgency = 'none';
  } 
  // Low trust merchant
  else if (merchantTrust.trustScore < 30) {
    strategicDecision = 'CAUTION';
    strategicReason = 'تاجر غير موثوق - تحقق قبل الشراء';
    strategicColor = '#f59e0b';
    urgency = 'low';
  }
  // Excellent deal
  else if (priceIntel.score >= 85 && fakeDealCheck.riskScore < 25) {
    strategicDecision = 'STRONG_BUY';
    strategicReason = `صفقة ممتازة! وفر حتى ${savingsPercent}%`;
    strategicColor = '#059669';
    urgency = 'high';
  }
  // Good deal with rising trend
  else if (priceIntel.score >= 75 && trendIntel?.trend !== 'falling') {
    strategicDecision = 'BUY_NOW';
    strategicReason = t(lang, 'excellent_deal');
    strategicColor = '#10b981';
    urgency = 'high';
  }
  // Good deal
  else if (priceIntel.score >= 65 && fakeDealCheck.riskScore < 35) {
    strategicDecision = 'BUY';
    strategicReason = t(lang, 'good_deal');
    strategicColor = '#22c55e';
    urgency = 'medium';
  }
  // Falling price trend
  else if (trendIntel?.trend === 'falling' && priceIntel.score < 75) {
    strategicDecision = 'SMART_WAIT';
    strategicReason = t(lang, 'price_drop_expected');
    strategicColor = '#3b82f6';
    urgency = 'low';
  }
  // Overpriced
  else if (priceIntel.score <= 35) {
    strategicDecision = 'WAIT';
    strategicReason = t(lang, 'overpriced');
    strategicColor = '#ef4444';
    urgency = 'none';
  }
  // Fair price
  else {
    strategicDecision = 'CONSIDER';
    strategicReason = t(lang, 'fair_price');
    strategicColor = '#6366f1';
    urgency = 'low';
  }

  // Apply personality override
  if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID' && strategicDecision !== 'CAUTION') {
    if (personality.type === 'impulse' && priceIntel.score >= 50) {
      strategicDecision = 'BUY_NOW';
      strategicReason = personalizedRec.reason;
      urgency = 'high';
    }
  }

  // ================================
  // 13. BUILD FINAL RESPONSE
  // ================================
  const processingTime = Date.now() - startTime;

  return {
    // Price Intelligence
    priceIntel: {
      ...priceIntel,
      savingsPercent,
      savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
      priceRange: {
        min: priceIntel.min,
        max: priceIntel.max,
        spread: priceIntel.max - priceIntel.min
      }
    },

    // Value Intelligence
    valueIntel: {
      score: valueScore.score,
      grade: valueScore.grade,
      factors: valueScore.factors,
      competitors: marketStats.competitors,
      savingsPercent,
      savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0
    },

    // Trend Intelligence
    trendIntel: {
      ...trendIntel,
      technicalIndicators,
      prediction: pricePrediction.finalPrediction,
      seasonality,
      optimalBuyTime: optimalTime
    },

    // Trust Intelligence
    trustIntel: {
      merchantTrust,
      fakeDealCheck,
      patternAnalysis,
      overallRisk: fakeDealCheck.riskScore,
      riskLevel: fakeDealCheck.riskLevel
    },

    // Personality Intelligence
    personalityIntel: {
      type: personality.type,
      confidence: personality.confidence,
      traits: personality.traits,
      secondaryTraits: personality.secondaryTraits,
      personalizedTips
    },

    // Recommendation Intelligence
    recommendationIntel: {
      primary: recommendations[0],
      all: recommendations,
      aiInsights,
      personalized: personalizedRec
    },

    // Learning Intelligence
    learningIntel: {
      insights: learnedInsights,
      confidence: learnedInsights.length > 0 ? 70 : 0
    },

    // Market Intelligence
    marketIntel: {
      alternatives,
      bestStore,
      bestPrice,
      bestLink,
      competitorCount: marketStats.competitors,
      marketPosition: priceIntel.percentile,
      marketHealth: priceStability.level
    },

    // Historical Intelligence
    historicalIntel: historicalAnalysis ? {
      ...historicalAnalysis,
      isGoodPrice: historicalAnalysis.currentVsLowest < 10
    } : null,

    // Final Verdict
    finalVerdict: {
      decision: strategicDecision,
      confidence: confidenceScore,
      reason: strategicReason,
      color: strategicColor,
      urgency,
      savingsPercent,
      savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
      bestStore,
      bestPrice,
      bestLink,
      actionItems: this.generateActionItems(strategicDecision, personalizedTips, lang)
    },

    // Metadata
    metadata: {
      version: '5.0.0',
      processingTime: `${processingTime}ms`,
      dataPoints: {
        market: marketStats.competitors,
        historical: priceHistory?.length || 0
      },
      confidence: confidenceScore,
      engines: ['price', 'trust', 'personality', 'prediction', 'learning', 'recommendation']
    }
  };
}

// Helper function for action items
function generateActionItems(decision, tips, lang) {
  const actions = [];
  
  if (decision === 'STRONG_BUY' || decision === 'BUY_NOW') {
    actions.push({ action: 'checkout', text: 'أكمل الشراء الآن', priority: 1 });
    actions.push({ action: 'verify', text: 'تحقق من سياسة الإرجاع', priority: 2 });
  } else if (decision === 'WAIT' || decision === 'SMART_WAIT') {
    actions.push({ action: 'alert', text: 'فعّل تنبيه انخفاض السعر', priority: 1 });
    actions.push({ action: 'wishlist', text: 'أضف للمفضلة', priority: 2 });
  } else if (decision === 'CAUTION') {
    actions.push({ action: 'verify_seller', text: 'تحقق من البائع', priority: 1 });
    actions.push({ action: 'check_reviews', text: 'اقرأ التقييمات', priority: 2 });
  }
  
  return actions;
}

// ================================
// 📤 EXPORTS
// ================================

module.exports = SageCore;
module.exports.SageAIEngine = SageAIEngine;
module.exports.PersonalityEngine = PersonalityEngine;
module.exports.PriceIntelligence = PriceIntelligence;
module.exports.MerchantTrustEngine = MerchantTrustEngine;
module.exports.FakeDealDetector = FakeDealDetector;
module.exports.PricePredictor = PricePredictor;
module.exports.RecommendationEngine = RecommendationEngine;
module.exports.LearningEngine = LearningEngine;
module.exports.SAGE_TRANSLATIONS = SAGE_TRANSLATIONS;
module.exports.t = t;
module.exports.cleanPrice = cleanPrice;
module.exports.calculateMean = calculateMean;
module.exports.calculateMedian = calculateMedian;
module.exports.calculateStdDev = calculateStdDev;
module.exports.calculateSMA = calculateSMA;
module.exports.calculateEMA = calculateEMA;
module.exports.calculateRSI = calculateRSI;
module.exports.calculateMACD = calculateMACD;
module.exports.calculateBollingerBands = calculateBollingerBands;
module.exports.linearRegression = linearRegression;
module.exports.removeOutliers = removeOutliers;
