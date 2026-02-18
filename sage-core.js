/**
 * ================================================
 * 🔮 SAGE CORE v4.0 - ULTIMATE SHOPPING INTELLIGENCE
 * ================================================
 * 
 * الميزات الجديدة:
 * - 🧠 AI Engine (Gemini Integration)
 * - 📊 Price History & Trend Analysis
 * - 🎯 Smart Recommendations
 * - 🔔 Intelligent Alert System
 * - 🏪 Merchant Trust Scoring
 * - 👤 Advanced User Personality
 * - 💬 Natural Language Understanding
 * - 📈 Price Prediction
 * - 🔍 Fake Deal Detection Pro
 * - 🌍 Multi-Language Support (6 Languages)
 * 
 * ================================================
 */

const axios = require('axios');

// ================================
// 🌍 TRANSLATIONS v4
// ================================
const SAGE_TRANSLATIONS = {
  ar: {
    // القرارات
    buy_now: "اشتري الآن",
    wait: "انتظر",
    overpriced: "السعر مرتفع",
    fair_price: "سعر عادل",
    excellent_deal: "صفقة ممتازة",
    good_deal: "صفقة جيدة",
    bad_deal: "صفقة ضعيفة",
    
    // المخاطر
    high_risk: "مخاطرة عالية",
    medium_risk: "مخاطرة متوسطة",
    low_risk: "مخاطرة منخفضة",
    
    // الإشارات
    strong_signal: "إشارة قوية",
    weak_signal: "إشارة ضعيفة",
    insufficient_data: "بيانات غير كافية للتحليل",
    
    // السوق
    market_stable: "السوق مستقر",
    market_rising: "السوق في ارتفاع",
    market_falling: "السوق في انخفاض",
    market_volatile: "السوق متقلب",
    
    // التحليل
    analysis_learning: "التحليل قيد التعلم",
    fake_offer: "قد يكون العرض غير منطقي مقارنة بالسوق",
    price_anomaly: "سعر غير طبيعي",
    
    // التوقعات
    price_drop_expected: "متوقع انخفاض السعر",
    price_rise_expected: "متوقع ارتفاع السعر",
    best_time_to_buy: "أفضل وقت للشراء",
    
    // التجار
    trusted_merchant: "تاجر موثوق",
    suspicious_merchant: "تاجر مشبوه",
    new_merchant: "تاجر جديد",
    
    // التوصيات
    recommended: "موصى به",
    alternative: "بديل أرخص",
    better_option: "خيار أفضل",
    
    // الشخصيات
    personality_hunter: "صيّاد الصفقات",
    personality_analyst: "المحلل",
    personality_impulse: "المتسرع",
    personality_premium: "محب الجودة",
    personality_neutral: "متوازن",
    
    // النصائح
    tip_wait_sale: "انتظر العروض القادمة",
    tip_buy_now: "السعر مناسب حالياً",
    tip_compare: "قارن مع خيارات أخرى",
    tip_negotiate: "حاول التفاوض"
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
    market_volatile: "Market Volatile",
    analysis_learning: "Analysis in progress",
    fake_offer: "Offer may be unrealistic",
    price_anomaly: "Price anomaly detected",
    price_drop_expected: "Price drop expected",
    price_rise_expected: "Price rise expected",
    best_time_to_buy: "Best time to buy",
    trusted_merchant: "Trusted Merchant",
    suspicious_merchant: "Suspicious Merchant",
    new_merchant: "New Merchant",
    recommended: "Recommended",
    alternative: "Cheaper Alternative",
    better_option: "Better Option",
    personality_hunter: "Deal Hunter",
    personality_analyst: "Analyst",
    personality_impulse: "Impulse Buyer",
    personality_premium: "Quality Lover",
    personality_neutral: "Balanced",
    tip_wait_sale: "Wait for upcoming sales",
    tip_buy_now: "Price is good right now",
    tip_compare: "Compare with other options",
    tip_negotiate: "Try to negotiate"
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
    strong_signal: "Signal fort",
    weak_signal: "Signal faible",
    insufficient_data: "Données insuffisantes",
    market_stable: "Marché stable",
    market_rising: "Marché en hausse",
    market_falling: "Marché en baisse",
    market_volatile: "Marché volatil",
    analysis_learning: "Analyse en cours",
    fake_offer: "Offre potentiellement irréaliste",
    price_anomaly: "Anomalie de prix détectée",
    price_drop_expected: "Baisse de prix attendue",
    price_rise_expected: "Hausse de prix attendue",
    best_time_to_buy: "Meilleur moment pour acheter",
    trusted_merchant: "Marchand fiable",
    suspicious_merchant: "Marchand suspect",
    new_merchant: "Nouveau marchand",
    recommended: "Recommandé",
    alternative: "Alternative moins chère",
    better_option: "Meilleure option",
    personality_hunter: "Chasseur de bonnes affaires",
    personality_analyst: "Analyste",
    personality_impulse: "Acheteur impulsif",
    personality_premium: "Amateur de qualité",
    personality_neutral: "Équilibré",
    tip_wait_sale: "Attendez les soldes",
    tip_buy_now: "Le prix est bon maintenant",
    tip_compare: "Comparez avec d'autres options",
    tip_negotiate: "Essayez de négocier"
  },

  de: {
    buy_now: "Jetzt kaufen",
    wait: "Warten",
    overpriced: "Überteuert",
    fair_price: "Fairer Preis",
    excellent_deal: "Ausgezeichnetes Angebot",
    good_deal: "Gutes Angebot",
    bad_deal: "Schlechtes Angebot",
    high_risk: "Hohes Risiko",
    medium_risk: "Mittleres Risiko",
    low_risk: "Niedriges Risiko",
    strong_signal: "Starkes Signal",
    weak_signal: "Schwaches Signal",
    insufficient_data: "Unzureichende Daten",
    market_stable: "Markt stabil",
    market_rising: "Markt steigt",
    market_falling: "Markt fällt",
    market_volatile: "Markt volatil",
    analysis_learning: "Analyse läuft",
    fake_offer: "Angebot möglicherweise unrealistisch",
    price_anomaly: "Preisanomalie erkannt",
    price_drop_expected: "Preisrückgang erwartet",
    price_rise_expected: "Preisanstieg erwartet",
    best_time_to_buy: "Bester Zeitpunkt zum Kaufen",
    trusted_merchant: "Vertrauenswürdiger Händler",
    suspicious_merchant: "Verdächtiger Händler",
    new_merchant: "Neuer Händler",
    recommended: "Empfohlen",
    alternative: "Günstigere Alternative",
    better_option: "Bessere Option",
    personality_hunter: "Schnäppchenjäger",
    personality_analyst: "Analytiker",
    personality_impulse: "Impulskäufer",
    personality_premium: "Qualitätsliebhaber",
    personality_neutral: "Ausgeglichen",
    tip_wait_sale: "Warten Sie auf Angebote",
    tip_buy_now: "Preis ist jetzt gut",
    tip_compare: "Vergleichen Sie Optionen",
    tip_negotiate: "Versuchen Sie zu verhandeln"
  },

  es: {
    buy_now: "Comprar ahora",
    wait: "Esperar",
    overpriced: "Precio alto",
    fair_price: "Precio justo",
    excellent_deal: "Oferta excelente",
    good_deal: "Buena oferta",
    bad_deal: "Mala oferta",
    high_risk: "Alto riesgo",
    medium_risk: "Riesgo medio",
    low_risk: "Bajo riesgo",
    strong_signal: "Señal fuerte",
    weak_signal: "Señal débil",
    insufficient_data: "Datos insuficientes",
    market_stable: "Mercado estable",
    market_rising: "Mercado en alza",
    market_falling: "Mercado en baja",
    market_volatile: "Mercado volátil",
    analysis_learning: "Análisis en curso",
    fake_offer: "Oferta posiblemente irreal",
    price_anomaly: "Anomalía de precio detectada",
    price_drop_expected: "Caída de precio esperada",
    price_rise_expected: "Subida de precio esperada",
    best_time_to_buy: "Mejor momento para comprar",
    trusted_merchant: "Comerciante confiable",
    suspicious_merchant: "Comerciante sospechoso",
    new_merchant: "Comerciante nuevo",
    recommended: "Recomendado",
    alternative: "Alternativa más barata",
    better_option: "Mejor opción",
    personality_hunter: "Cazador de ofertas",
    personality_analyst: "Analista",
    personality_impulse: "Comprador impulsivo",
    personality_premium: "Amante de la calidad",
    personality_neutral: "Equilibrado",
    tip_wait_sale: "Espere las ofertas",
    tip_buy_now: "El precio es bueno ahora",
    tip_compare: "Compare opciones",
    tip_negotiate: "Intente negociar"
  },

  tr: {
    buy_now: "Şimdi Satın Al",
    wait: "Bekle",
    overpriced: "Fiyat yüksek",
    fair_price: "Adil fiyat",
    excellent_deal: "Mükemmel fırsat",
    good_deal: "İyi fırsat",
    bad_deal: "Kötü fırsat",
    high_risk: "Yüksek risk",
    medium_risk: "Orta risk",
    low_risk: "Düşük risk",
    strong_signal: "Güçlü sinyal",
    weak_signal: "Zayıf sinyal",
    insufficient_data: "Yetersiz veri",
    market_stable: "Piyasa stabil",
    market_rising: "Piyasa yükseliyor",
    market_falling: "Piyasa düşüyor",
    market_volatile: "Piyasa değişken",
    analysis_learning: "Analiz sürüyor",
    fake_offer: "Teklif gerçekçi olmayabilir",
    price_anomaly: "Fiyat anomali tespit edildi",
    price_drop_expected: "Fiyat düşüşü bekleniyor",
    price_rise_expected: "Fiyat artışı bekleniyor",
    best_time_to_buy: "Satın almak için en iyi zaman",
    trusted_merchant: "Güvenilir satıcı",
    suspicious_merchant: "Şüpheli satıcı",
    new_merchant: "Yeni satıcı",
    recommended: "Önerilen",
    alternative: "Daha ucuz alternatif",
    better_option: "Daha iyi seçenek",
    personality_hunter: "Fırsat avcısı",
    personality_analyst: "Analist",
    personality_impulse: "Düşünümsüz alıcı",
    personality_premium: "Kalite sever",
    personality_neutral: "Dengeli",
    tip_wait_sale: "İndirimleri bekleyin",
    tip_buy_now: "Fiyat şu an iyi",
    tip_compare: "Seçenekleri karşılaştırın",
    tip_negotiate: "Pazarlık deneyin"
  }
};

// ================================
// 🔧 UTILITY FUNCTIONS
// ================================

/**
 * تنظيف السعر وتحويله لرقم
 */
function cleanPrice(p) {
  if (!p) return 0;
  const cleaned = parseFloat(p.toString().replace(/[^0-9.]/g, ''));
  return isNaN(cleaned) ? 0 : cleaned;
}

/**
 * ترجمة النصوص
 */
function t(lang, key) {
  const shortLang = (lang || "en").split("-")[0];
  return SAGE_TRANSLATIONS[shortLang]?.[key] 
    || SAGE_TRANSLATIONS["en"][key] 
    || key;
}

/**
 * حساب المتوسط المتحرك البسيط
 */
function calculateSMA(data, period) {
  if (data.length < period) return null;
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

/**
 * حساب الانحراف المعياري
 */
function calculateStdDev(data) {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * حساب الـ IQR (المدى الربيعي)
 */
function calculateIQR(sortedData) {
  const q1Index = Math.floor(sortedData.length * 0.25);
  const q3Index = Math.floor(sortedData.length * 0.75);
  return {
    q1: sortedData[q1Index],
    q3: sortedData[q3Index],
    iqr: sortedData[q3Index] - sortedData[q1Index]
  };
}

/**
 * إزالة القيم الشاذة
 */
function removeOutliers(data) {
  if (data.length < 4) return data;
  const sorted = [...data].sort((a, b) => a - b);
  const { q1, q3, iqr } = calculateIQR(sorted);
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return sorted.filter(p => p >= lowerBound && p <= upperBound);
}

// ================================
// 🧠 AI ENGINE CLASS
// ================================

class SageAIEngine {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  /**
   * إرسال طلب إلى Gemini AI
   */
  async callGemini(prompt) {
    if (!this.apiKey) {
      console.log('⚠️ No Gemini API Key, using fallback');
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // محاولة استخراج JSON
      if (text) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // ليس JSON، أرجع النص
        }
        return { text };
      }
      
      return null;
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      return null;
    }
  }

  /**
   * تحليل نية المستخدم
   */
  async detectUserIntent(query, context = {}) {
    const prompt = `
You are a shopping intent analyzer. Analyze this search query: "${query}"

Context:
- Language: ${context.language || 'ar'}
- Recent searches: ${JSON.stringify(context.recentSearches?.slice(-5) || [])}
- User budget: ${context.budget || 'unknown'}

Return ONLY valid JSON (no markdown):
{
  "intent": "buy|compare|research|browse|price_check",
  "category": "electronics|fashion|home|beauty|sports|automotive|books|food|other",
  "budget": { "min": number_or_null, "max": number_or_null },
  "urgency": "high|medium|low",
  "brandPreference": [],
  "features": [],
  "confidence": 0_to_100
}
`;

    const result = await this.callGemini(prompt);
    if (result && result.intent) {
      return result;
    }

    // Fallback - تحليل بسيط
    return {
      intent: 'buy',
      category: 'other',
      budget: { min: null, max: null },
      urgency: 'medium',
      brandPreference: [],
      features: [],
      confidence: 50
    };
  }

  /**
   * تحليل مراجعات المنتج
   */
  async analyzeReviews(reviews, lang = 'ar') {
    if (!reviews || reviews.length === 0) {
      return {
        overallSentiment: 'neutral',
        score: 50,
        pros: [],
        cons: [],
        fakeReviewProbability: 0,
        keyInsights: [t(lang, 'insufficient_data')]
      };
    }

    const prompt = `
Analyze these product reviews and provide insights. Language: ${lang}

Reviews:
 ${JSON.stringify(reviews.slice(0, 20))}

Return ONLY valid JSON:
{
  "overallSentiment": "positive|neutral|negative",
  "score": 0_to_100,
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "commonIssues": ["issue1"],
  "qualityVerdict": "excellent|good|fair|poor",
  "fakeReviewProbability": 0_to_100,
  "keyInsights": ["insight1", "insight2"]
}
`;

    const result = await this.callGemini(prompt);
    if (result && result.overallSentiment) {
      return result;
    }

    // Fallback
    return {
      overallSentiment: 'neutral',
      score: 50,
      pros: [],
      cons: [],
      fakeReviewProbability: 0,
      keyInsights: []
    };
  }

  /**
   * توليد نصيحة ذكية
   */
  async generateAdvice(product, analysis, lang = 'ar') {
    const prompt = `
You are a smart shopping advisor. Based on this product analysis, give a brief advice in ${lang}:

Product: ${product.title}
Price: ${product.price}
Analysis: ${JSON.stringify(analysis)}

Return ONLY valid JSON:
{
  "advice": "brief advice in 1-2 sentences",
  "tip": "specific tip for this product",
  "confidence": 0_to_100
}
`;

    const result = await this.callGemini(prompt);
    if (result && result.advice) {
      return result;
    }

    // Fallback
    if (analysis.priceIntel?.score >= 70) {
      return { advice: t(lang, 'tip_buy_now'), tip: t(lang, 'tip_buy_now'), confidence: 70 };
    } else if (analysis.priceIntel?.score <= 40) {
      return { advice: t(lang, 'tip_wait_sale'), tip: t(lang, 'tip_compare'), confidence: 70 };
    }
    return { advice: t(lang, 'tip_compare'), tip: t(lang, 'tip_compare'), confidence: 60 };
  }
}

// ================================
// 👤 ADVANCED PERSONALITY ENGINE
// ================================

class PersonalityEngine {
  
  /**
   * تحليل شخصية المستخدم المتقدم
   */
  static analyzePersonality(userEvents, price, marketAverage, userHistory = {}) {
    // حساب نقاط كل شخصية
    const scores = {
      hunter: 0,      // صيّاد الصفقات
      analyst: 0,     // المحلل
      impulse: 0,     // المتسرع
      premium: 0,     // محب الجودة
      budget: 0       // محدودة الميزانية
    };

    // تحليل السلوك
    if (userEvents) {
      // صياد الصفقات
      if (userEvents.wishlistAdditions > 3) scores.hunter += 20;
      if (userEvents.priceChecks > 5) scores.hunter += 15;
      if (userEvents.couponUsage > 2) scores.hunter += 25;
      if (price < marketAverage * 0.85 && userEvents.bought) scores.hunter += 30;

      // المحلل
      if (userEvents.clickedAnalysis) scores.analyst += 20;
      if (userEvents.comparisonViews > 3) scores.analyst += 25;
      if (userEvents.readReviews) scores.analyst += 15;
      if (userEvents.timeOnPage > 300) scores.analyst += 20; // أكثر من 5 دقائق

      // المتسرع
      if (userEvents.quickPurchases > 2) scores.impulse += 30;
      if (userEvents.timeOnPage < 30 && userEvents.bought) scores.impulse += 25;
      if (userEvents.cartAdditions > 3) scores.impulse += 15;

      // محب الجودة
      if (userEvents.brandSearches > 3) scores.premium += 20;
      if (price > marketAverage && userEvents.bought) scores.premium += 25;
      if (userEvents.premiumBrandPurchases > 0) scores.premium += 30;

      // محدودة الميزانية
      if (userEvents.budgetSet) scores.budget += 25;
      if (userEvents.lowPriceFilter) scores.budget += 20;
      if (price < marketAverage * 0.7 && userEvents.bought) scores.budget += 15;
    }

    // تحليل التاريخ
    if (userHistory) {
      if (userHistory.averageSpent) {
        const ratio = userHistory.averageSpent / marketAverage;
        if (ratio < 0.8) scores.budget += 20;
        if (ratio > 1.2) scores.premium += 20;
      }

      if (userHistory.purchaseFrequency) {
        if (userHistory.purchaseFrequency === 'high') scores.impulse += 15;
        if (userHistory.purchaseFrequency === 'low') scores.analyst += 15;
      }
    }

    // العثور على الشخصية الأقوى
    let dominantPersonality = 'neutral';
    let maxScore = 0;

    Object.entries(scores).forEach(([personality, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantPersonality = personality;
      }
    });

    // إذا كانت النقاط منخفضة، اعتبره متوازن
    if (maxScore < 20) {
      dominantPersonality = 'neutral';
    }

    return {
      type: dominantPersonality,
      scores,
      confidence: Math.min(100, maxScore),
      traits: this.getPersonalityTraits(dominantPersonality),
      shoppingStyle: this.getShoppingStyle(dominantPersonality)
    };
  }

  /**
   * خصائص الشخصية
   */
  static getPersonalityTraits(personality) {
    const traits = {
      hunter: {
        description: 'يبحث عن أقل سعر ممكن ويصبر للعروض',
        strengths: ['توفير المال', 'الصبر', 'البحث'],
        preferences: ['الخصومات', 'العروض', 'المقارنة'],
        priceRange: 'أقل من السوق بـ 15-30%'
      },
      analyst: {
        description: 'يفضل التحليل والبحث قبل الشراء',
        strengths: ['اتخاذ قرارات مدروسة', 'تجنب الندم'],
        preferences: ['التقييمات', 'المقارنات', 'المواصفات'],
        priceRange: 'ضمن نطاق السوق'
      },
      impulse: {
        description: 'يتخذ قرارات سريعة ومباشرة',
        strengths: ['السرعة', 'عدم التردد'],
        preferences: ['الشراء الفوري', 'العروض المحدودة'],
        priceRange: 'مرن'
      },
      premium: {
        description: 'يهتم بالجودة والعلامات التجارية',
        strengths: ['الحصول على منتجات مميزة'],
        preferences: ['العلامات التجارية', 'الجودة العالية'],
        priceRange: 'أعلى من السوق'
      },
      budget: {
        description: 'محدود الميزانية ويبحث عن الأفضل في نطاقه',
        strengths: ['التخطيط المالي'],
        preferences: ['المنتجات الاقتصادية', 'العروض'],
        priceRange: 'أقل من السوق بـ 30-50%'
      },
      neutral: {
        description: 'سلوك متوازن ومرن',
        strengths: ['المرونة في الشراء'],
        preferences: ['التوازن بين السعر والجودة'],
        priceRange: 'ضمن نطاق السوق'
      }
    };

    return traits[personality] || traits.neutral;
  }

  /**
   * نمط التسوق
   */
  static getShoppingStyle(personality) {
    const styles = {
      hunter: 'يتتبع الأسعار وينتظر الانخفاضات',
      analyst: 'يقرأ المراجعات ويقارن قبل الشراء',
      impulse: 'يشتري عند رؤية عرض جذاب',
      premium: 'يشتري منتجات مميزة بغض النظر عن السعر',
      budget: 'يبحث عن أفضل قيمة بأقل سعر',
      neutral: 'يشتري حسب الحاجة'
    };
    return styles[personality] || styles.neutral;
  }

  /**
   * تخصيص التوصية حسب الشخصية
   */
  static personalizeRecommendation(personality, product, marketData, lang = 'ar') {
    const price = cleanPrice(product.price);
    const avg = marketData.average || price;

    switch (personality.type) {
      case 'hunter':
        if (price <= avg * 0.85) {
          return {
            action: 'buy_now',
            reason: t(lang, 'excellent_deal') + ' - ' + t(lang, 'personality_hunter'),
            confidence: 85,
            tip: t(lang, 'tip_buy_now')
          };
        }
        return {
          action: 'wait',
          reason: 'انتظر انخفاضاً أفضل',
          confidence: 70,
          tip: t(lang, 'tip_wait_sale')
        };

      case 'analyst':
        return {
          action: 'compare',
          reason: 'قارن مع الخيارات الأخرى',
          confidence: 75,
          tip: t(lang, 'tip_compare')
        };

      case 'impulse':
        if (price <= avg * 1.05) {
          return {
            action: 'buy_now',
            reason: 'السعر مناسب للشراء السريع',
            confidence: 80,
            tip: t(lang, 'tip_buy_now')
          };
        }
        return {
          action: 'consider',
          reason: 'فكر قبل الشراء',
          confidence: 60,
          tip: t(lang, 'tip_compare')
        };

      case 'premium':
        return {
          action: 'buy_now',
          reason: 'منتج مميز يستحق السعر',
          confidence: 75,
          tip: 'ركز على الجودة والضمان'
        };

      case 'budget':
        if (price <= avg * 0.7) {
          return {
            action: 'buy_now',
            reason: t(lang, 'excellent_deal'),
            confidence: 90,
            tip: t(lang, 'tip_buy_now')
          };
        }
        return {
          action: 'search_alternative',
          reason: 'ابحث عن بديل أرخص',
          confidence: 70,
          tip: t(lang, 'alternative')
        };

      default:
        return {
          action: price <= avg ? 'buy_now' : 'wait',
          reason: price <= avg ? t(lang, 'good_deal') : t(lang, 'tip_wait_sale'),
          confidence: 60,
          tip: t(lang, 'tip_compare')
        };
    }
  }
}

// ================================
// 📊 PRICE INTELLIGENCE ENGINE
// ================================

class PriceIntelligence {
  
  /**
   * تحليل السعر الشامل
   */
  static analyzePrice(product, marketProducts = [], priceHistory = [], lang = 'ar') {
    const currentPrice = cleanPrice(product.price);

    // جمع وتنظيف الأسعار
    const marketPrices = marketProducts
      .map(p => cleanPrice(p.product_price || p.price || p))
      .filter(p => p > 0);

    // إذا لم يوجد بيانات كافية
    if (marketPrices.length < 3) {
      return {
        priceIntel: {
          current: currentPrice,
          average: null,
          median: null,
          score: 50,
          decision: t(lang, 'insufficient_data'),
          label: t(lang, 'analysis_learning'),
          color: '#6b7280',
          confidence: 30
        },
        hasEnoughData: false
      };
    }

    // حساب الإحصائيات
    const sorted = [...marketPrices].sort((a, b) => a - b);
    const cleanedPrices = removeOutliers(sorted);

    // المتوسط والوسيط
    const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
    const median = cleanedPrices[Math.floor(cleanedPrices.length / 2)];

    // النطاقات
    const min = Math.min(...cleanedPrices);
    const max = Math.max(...cleanedPrices);
    const range = max - min;

    // حساب موقع السعر الحالي
    const percentile = this.calculatePercentile(currentPrice, cleanedPrices);

    // حساب نقاط السعر
    let score = 50;
    let decision = t(lang, 'fair_price');
    let label = '';
    let color = '#3b82f6';

    if (currentPrice < median * 0.85) {
      score = 85;
      decision = t(lang, 'excellent_deal');
      label = `أقل من ${Math.round((1 - currentPrice / median) * 100)}% من السوق`;
      color = '#10b981';
    } else if (currentPrice < median * 0.95) {
      score = 70;
      decision = t(lang, 'good_deal');
      label = 'أقل من متوسط السوق';
      color = '#22c55e';
    } else if (currentPrice > median * 1.15) {
      score = 25;
      decision = t(lang, 'overpriced');
      label = `أعلى من ${Math.round((currentPrice / median - 1) * 100)}% من السوق`;
      color = '#ef4444';
    } else if (currentPrice > median * 1.05) {
      score = 40;
      decision = t(lang, 'wait');
      label = 'أعلى قليلاً من السوق';
      color = '#f59e0b';
    } else {
      score = 55;
      decision = t(lang, 'fair_price');
      label = 'ضمن نطاق السوق';
      color = '#3b82f6';
    }

    // تحليل التاريخ إذا وُجد
    let trend = null;
    if (priceHistory && priceHistory.length >= 5) {
      trend = this.analyzePriceTrend(priceHistory);
    }

    return {
      priceIntel: {
        current: currentPrice,
        average: Math.round(average * 100) / 100,
        median: Math.round(median * 100) / 100,
        min,
        max,
        percentile,
        score,
        decision,
        label,
        color,
        confidence: Math.min(100, 40 + marketPrices.length * 3),
        range: {
          low: min,
          high: max,
          spread: range
        }
      },
      trendIntel: trend,
      hasEnoughData: true,
      marketStats: {
        competitors: marketPrices.length,
        priceVariation: Math.round((range / median) * 100),
        marketHealth: this.assessMarketHealth(marketPrices)
      }
    };
  }

  /**
   * حساب النسبة المئوية
   */
  static calculatePercentile(value, sortedArray) {
    let count = 0;
    for (const v of sortedArray) {
      if (v <= value) count++;
    }
    return Math.round((count / sortedArray.length) * 100);
  }

  /**
   * تحليل اتجاه السعر
   */
  static analyzePriceTrend(priceHistory) {
    if (!priceHistory || priceHistory.length < 3) {
      return { trend: 'unknown', confidence: 0 };
    }

    const prices = priceHistory.map(h => cleanPrice(h.price || h)).filter(p => p > 0);
    if (prices.length < 3) {
      return { trend: 'unknown', confidence: 0 };
    }

    // حساب المتوسط المتحرك
    const sma5 = calculateSMA(prices, Math.min(5, prices.length));
    const sma10 = calculateSMA(prices, Math.min(10, prices.length));

    if (!sma5 || !sma10) {
      return { trend: 'unknown', confidence: 0 };
    }

    const currentPrice = prices[prices.length - 1];
    const lastSma5 = sma5[sma5.length - 1];
    const lastSma10 = sma10[sma10.length - 1];

    // تحديد الاتجاه
    let trend = 'stable';
    let confidence = 50;

    if (lastSma5 > lastSma10 * 1.02) {
      trend = 'rising';
      confidence = 60;
    } else if (lastSma5 < lastSma10 * 0.98) {
      trend = 'falling';
      confidence = 60;
    }

    // حساب التقلب
    const volatility = (calculateStdDev(prices) / (prices.reduce((a, b) => a + b, 0) / prices.length)) * 100;
    
    // توقع السعر
    const predictedPrice = this.predictNextPrice(prices, trend);

    return {
      trend,
      confidence: Math.min(95, confidence + prices.length),
      volatility: Math.round(volatility * 100) / 100,
      currentPrice,
      sma5: lastSma5,
      sma10: lastSma10,
      predictedPrice,
      prediction: {
        nextWeek: predictedPrice,
        nextMonth: predictedPrice * (trend === 'falling' ? 0.95 : trend === 'rising' ? 1.05 : 1)
      }
    };
  }

  /**
   * توقع السعر القادم
   */
  static predictNextPrice(prices, trend) {
    const recentPrices = prices.slice(-7);
    const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    
    if (trend === 'falling') {
      return avg * 0.97;
    } else if (trend === 'rising') {
      return avg * 1.03;
    }
    return avg;
  }

  /**
   * تقييم صحة السوق
   */
  static assessMarketHealth(prices) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = calculateStdDev(prices);
    const cv = (stdDev / avg) * 100; // معامل الاختلاف

    if (cv < 10) return 'stable';
    if (cv < 25) return 'normal';
    if (cv < 50) return 'volatile';
    return 'chaotic';
  }
}

// ================================
// 🏪 MERCHANT TRUST ENGINE
// ================================

class MerchantTrustEngine {
  
  /**
   * تقييم التاجر
   */
  static evaluateMerchant(storeData, productData = {}, lang = 'ar') {
    const store = storeData.source || storeData.store || storeData.merchant || 'Unknown';
    
    let trustScore = 50; // النقطة الأساسية
    const factors = [];
    const warnings = [];

    // التحقق من المتاجر المعروفة
    const trustedStores = [
      'amazon', 'ebay', 'walmart', 'aliexpress', 'noon', 'souq', 
      'jarir', 'extra', 'apple', 'samsung', 'nike', 'adidas',
      'bestbuy', 'target', 'costco', 'ikea'
    ];

    const suspiciousPatterns = [
      'too good', 'cheapest', 'free money', 'guaranteed',
      'act now', 'limited time only', 'secret sale'
    ];

    const storeLower = store.toLowerCase();

    // فحص المتاجر الموثوقة
    if (trustedStores.some(s => storeLower.includes(s))) {
      trustScore += 25;
      factors.push({ factor: 'known_brand', impact: +25 });
    }

    // فحص SSL والنطاق
    const domain = this.extractDomain(store);
    if (domain) {
      if (domain.endsWith('.com') || domain.endsWith('.net') || domain.endsWith('.org')) {
        trustScore += 10;
        factors.push({ factor: 'standard_tld', impact: +10 });
      }
      if (domain.includes('-')) {
        trustScore -= 5;
        factors.push({ factor: 'hyphenated_domain', impact: -5 });
      }
    }

    // فحص نمط السعر
    if (productData.price) {
      const price = cleanPrice(productData.price);
      if (productData.marketAverage && price < productData.marketAverage * 0.5) {
        trustScore -= 20;
        warnings.push(t(lang, 'fake_offer'));
        factors.push({ factor: 'suspicious_price', impact: -20 });
      }
    }

    // التحقق من الأنماط المشبوهة في العنوان
    if (productData.title) {
      const titleLower = productData.title.toLowerCase();
      suspiciousPatterns.forEach(pattern => {
        if (titleLower.includes(pattern)) {
          trustScore -= 15;
          warnings.push('نمط مشبوه في العنوان');
          factors.push({ factor: 'suspicious_pattern', impact: -15 });
        }
      });
    }

    // تحديد الشارة
    const badge = this.getTrustBadge(trustScore);

    return {
      store,
      domain,
      trustScore: Math.max(0, Math.min(100, trustScore)),
      badge,
      factors,
      warnings,
      recommendation: this.getRecommendation(trustScore, lang)
    };
  }

  /**
   * استخراج النطاق
   */
  static extractDomain(url) {
    if (!url) return null;
    try {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * شارة الثقة
   */
  static getTrustBadge(score) {
    if (score >= 80) return { level: 'gold', icon: '🥇', label: 'موثوق جداً', color: '#fbbf24' };
    if (score >= 65) return { level: 'silver', icon: '🥈', label: 'موثوق', color: '#94a3b8' };
    if (score >= 50) return { level: 'bronze', icon: '🥉', label: 'مقبول', color: '#d97706' };
    if (score >= 35) return { level: 'warning', icon: '⚠️', label: 'يحتاج حذر', color: '#f59e0b' };
    return { level: 'danger', icon: '🚫', label: 'مشبوه', color: '#ef4444' };
  }

  /**
   * التوصية
   */
  static getRecommendation(score, lang) {
    if (score >= 70) return t(lang, 'trusted_merchant');
    if (score >= 50) return 'تاجر عادي';
    if (score >= 30) return t(lang, 'suspicious_merchant');
    return 'تجنب هذا التاجر';
  }
}

// ================================
// 🎯 RECOMMENDATION ENGINE
// ================================

class RecommendationEngine {
  
  /**
   * البحث عن بدائل أفضل
   */
  static findBetterAlternatives(product, marketProducts, lang = 'ar') {
    if (!marketProducts || marketProducts.length === 0) {
      return [];
    }

    const currentPrice = cleanPrice(product.price);
    const alternatives = [];

    marketProducts.forEach(p => {
      const pPrice = cleanPrice(p.product_price || p.price);
      const similarity = this.calculateSimilarity(product.title, p.title);

      // البديل الأرخص
      if (pPrice < currentPrice * 0.95 && similarity > 30) {
        alternatives.push({
          product: p,
          type: 'cheaper',
          savings: currentPrice - pPrice,
          savingsPercent: Math.round((1 - pPrice / currentPrice) * 100),
          similarity: Math.round(similarity),
          reason: t(lang, 'alternative') + ` - وفر $${(currentPrice - pPrice).toFixed(2)}`
        });
      }

      // البديل الأفضل تقييماً
      if (p.rating && product.rating && p.rating > product.rating && similarity > 40) {
        alternatives.push({
          product: p,
          type: 'better_rated',
          ratingDiff: p.rating - product.rating,
          similarity: Math.round(similarity),
          reason: t(lang, 'better_option') + ` - تقييم أعلى`
        });
      }
    });

    // ترتيب حسب التوفير
    return alternatives
      .sort((a, b) => (b.savings || 0) - (a.savings || 0))
      .slice(0, 5);
  }

  /**
   * حساب التشابه بين النصوص
   */
  static calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = [...words1].filter(w => words2.has(w));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return (intersection.length / union.size) * 100;
  }

  /**
   * اقتراح أفضل وقت للشراء
   */
  static suggestBestTime(priceIntel, trendIntel, lang = 'ar') {
    // إذا كان السعر ممتاز
    if (priceIntel.score >= 80) {
      return {
        recommendation: 'buy_now',
        reason: t(lang, 'excellent_deal'),
        confidence: 85,
        expectedSavings: 0
      };
    }

    // إذا كان الاتجاه هابط
    if (trendIntel?.trend === 'falling') {
      return {
        recommendation: 'wait',
        reason: t(lang, 'price_drop_expected'),
        confidence: trendIntel.confidence,
        expectedDays: 7,
        expectedSavings: Math.round((priceIntel.current - (trendIntel.predictedPrice || priceIntel.current * 0.95)))
      };
    }

    // إذا كان الاتجاه صاعد
    if (trendIntel?.trend === 'rising') {
      return {
        recommendation: 'buy_soon',
        reason: t(lang, 'price_rise_expected'),
        confidence: trendIntel.confidence,
        expectedPriceIncrease: Math.round(((trendIntel.predictedPrice || priceIntel.current * 1.05) - priceIntel.current))
      };
    }

    // إذا كان السعر عادلاً
    if (priceIntel.score >= 50) {
      return {
        recommendation: 'consider',
        reason: t(lang, 'fair_price'),
        confidence: 60,
        expectedSavings: 0
      };
    }

    // السعر مرتفع
    return {
      recommendation: 'wait',
      reason: t(lang, 'overpriced'),
      confidence: 70,
      expectedDays: 14,
      expectedSavings: Math.round((priceIntel.current - priceIntel.median) * 0.8)
    };
  }
}

// ================================
// 🔍 FAKE DEAL DETECTOR
// ================================

class FakeDealDetector {
  
  /**
   * كشف العروض الوهمية
   */
  static detect(product, marketProducts, lang = 'ar') {
    const warnings = [];
    const riskFactors = [];
    let riskScore = 0;

    const currentPrice = cleanPrice(product.price);
    const marketPrices = marketProducts
      .map(p => cleanPrice(p.product_price || p.price))
      .filter(p => p > 0);

    if (marketPrices.length >= 3) {
      const avg = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;
      const min = Math.min(...marketPrices);

      // سعر منخفض جداً
      if (currentPrice < avg * 0.5) {
        warnings.push(t(lang, 'fake_offer'));
        riskFactors.push({ factor: 'price_too_low', severity: 'high' });
        riskScore += 40;
      }

      // فرق كبير عن أرخص منافس
      if (currentPrice > min * 1.5) {
        warnings.push('السعر أعلى بكثير من المنافسين');
        riskFactors.push({ factor: 'overpriced', severity: 'medium' });
        riskScore += 25;
      }

      // عرض محدود مع سعر منخفض
      if (product.title && product.title.toLowerCase().includes('limited') && currentPrice < avg * 0.7) {
        warnings.push('عرض محدود مع سعر مشبوه');
        riskFactors.push({ factor: 'limited_offer_scam', severity: 'high' });
        riskScore += 30;
      }
    }

    // فحص العنوان
    const suspiciousTerms = ['free', 'guaranteed', 'no risk', 'act now', 'limited time'];
    const titleLower = (product.title || '').toLowerCase();
    suspiciousTerms.forEach(term => {
      if (titleLower.includes(term)) {
        riskFactors.push({ factor: 'suspicious_term', term, severity: 'low' });
        riskScore += 10;
      }
    });

    return {
      isSuspicious: riskScore >= 40,
      riskScore: Math.min(100, riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      warnings,
      riskFactors,
      advice: this.getAdvice(riskScore, lang)
    };
  }

  /**
   * مستوى المخاطرة
   */
  static getRiskLevel(score) {
    if (score >= 70) return { level: 'high', icon: '🚨', color: '#ef4444' };
    if (score >= 40) return { level: 'medium', icon: '⚠️', color: '#f59e0b' };
    if (score >= 20) return { level: 'low', icon: 'ℹ️', color: '#3b82f6' };
    return { level: 'minimal', icon: '✅', color: '#10b981' };
  }

  /**
   * النصيحة
   */
  static getAdvice(score, lang) {
    if (score >= 70) return '⚠️ تجنب هذا العرض تماماً';
    if (score >= 40) return '⚠️ كن حذراً وتحقق من التاجر';
    if (score >= 20) return 'ℹ️ تحقق من التفاصيل قبل الشراء';
    return '✅ العرض يبدو طبيعياً';
  }
}

// ================================
// 🔮 MAIN SAGE CORE FUNCTION
// ================================

module.exports = async function SageCore(
  product,
  marketProducts = [],
  priceHistory = [],
  userEvents = {},
  userId = 'guest',
  userHistory = {},
  lang = 'ar',
  aiApiKey = null
) {
  const currentPrice = cleanPrice(product.price);
  const ai = new SageAIEngine(aiApiKey);

  // ================================
  // 1️⃣ PRICE INTELLIGENCE
  // ================================
  const priceAnalysis = PriceIntelligence.analyzePrice(product, marketProducts, priceHistory, lang);
  
  // إذا لم يوجد بيانات كافية
  if (!priceAnalysis.hasEnoughData) {
    return {
      ...priceAnalysis,
      finalVerdict: {
        decision: 'INSUFFICIENT_DATA',
        confidence: 30,
        recommendation: t(lang, 'insufficient_data'),
        bestStore: null,
        bestPrice: null,
        savings: 0
      }
    };
  }

  const { priceIntel, trendIntel, marketStats } = priceAnalysis;

  // ================================
  // 2️⃣ PERSONALITY ANALYSIS
  // ================================
  const personality = PersonalityEngine.analyzePersonality(
    userEvents,
    currentPrice,
    priceIntel.median,
    userHistory
  );

  // ================================
  // 3️⃣ MERCHANT TRUST
  // ================================
  const merchantTrust = MerchantTrustEngine.evaluateMerchant(
    product,
    { price: currentPrice, marketAverage: priceIntel.median },
    lang
  );

  // ================================
  // 4️⃣ FAKE DEAL DETECTION
  // ================================
  const fakeDealCheck = FakeDealDetector.detect(product, marketProducts, lang);

  // ================================
  // 5️⃣ RECOMMENDATIONS
  // ================================
  const alternatives = RecommendationEngine.findBetterAlternatives(product, marketProducts, lang);
  const bestTime = RecommendationEngine.suggestBestTime(priceIntel, trendIntel, lang);

  // ================================
  // 6️⃣ AI INSIGHTS (Optional)
  // ================================
  let aiInsights = null;
  if (aiApiKey) {
    try {
      aiInsights = await ai.generateAdvice(product, { priceIntel, trendIntel, merchantTrust }, lang);
    } catch (e) {
      console.log('AI insights failed:', e.message);
    }
  }

  // ================================
  // 7️⃣ PERSONALIZED DECISION
  // ================================
  const personalizedRec = PersonalityEngine.personalizeRecommendation(
    personality,
    product,
    { average: priceIntel.median, current: currentPrice },
    lang
  );

  // ================================
  // 8️⃣ BEST STORE CALCULATION
  // ================================
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
          store: item.source || item.store || item.merchant || 'Unknown',
          link: item.link || item.product_link || null
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

  // ================================
  // 9️⃣ FINAL VERDICT CALCULATION
  // ================================
  const savingsPercent = priceIntel.median ? 
    Math.round((1 - currentPrice / priceIntel.median) * 100) : 0;
  
  const confidenceScore = Math.round(
    (priceIntel.confidence * 0.35) +
    ((100 - fakeDealCheck.riskScore) * 0.25) +
    (merchantTrust.trustScore * 0.20) +
    (personality.confidence * 0.10) +
    ((trendIntel?.confidence || 50) * 0.10)
  );

  let strategicDecision = 'WAIT';
  let strategicReason = '';
  let strategicColor = '#f59e0b';

  // منطق القرار النهائي
  if (fakeDealCheck.riskScore >= 60) {
    strategicDecision = 'AVOID';
    strategicReason = 'عرض مشبوه - تجنب الشراء';
    strategicColor = '#ef4444';
  } else if (merchantTrust.trustScore < 30) {
    strategicDecision = 'CAUTION';
    strategicReason = 'تاجر غير موثوق';
    strategicColor = '#f59e0b';
  } else if (priceIntel.score >= 75 && fakeDealCheck.riskScore < 30) {
    strategicDecision = 'BUY_NOW';
    strategicReason = `صفقة ممتازة - وفر ${savingsPercent}%`;
    strategicColor = '#10b981';
  } else if (priceIntel.score >= 60 && trendIntel?.trend !== 'falling') {
    strategicDecision = 'BUY';
    strategicReason = t(lang, 'good_deal');
    strategicColor = '#22c55e';
  } else if (trendIntel?.trend === 'falling' && priceIntel.score < 70) {
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

  // تطبيق التخصيص الشخصي
  if (personalizedRec.action === 'buy_now' && strategicDecision !== 'AVOID') {
    strategicDecision = 'BUY_NOW';
    strategicReason = personalizedRec.reason;
  }

  // ================================
  // 📦 FINAL OUTPUT
  // ================================
  return {
    // تحليل السعر
    priceIntel: {
      current: currentPrice,
      average: priceIntel.average,
      median: priceIntel.median,
      min: priceIntel.min,
      max: priceIntel.max,
      percentile: priceIntel.percentile,
      score: priceIntel.score,
      decision: priceIntel.decision,
      label: priceIntel.label,
      color: priceIntel.color,
      confidence: priceIntel.confidence
    },

    // تحليل القيمة
    valueIntel: {
      score: priceIntel.score,
      competitors: marketStats.competitors,
      priceVariation: marketStats.priceVariation,
      marketHealth: marketStats.marketHealth,
      savingsPercent,
      savingsAmount: priceIntel.median ? priceIntel.median - currentPrice : 0
    },

    // تحليل الاتجاه
    trendIntel: trendIntel || {
      trend: 'unknown',
      confidence: 0
    },

    // تحليل الثقة
    trustIntel: {
      merchantTrust: merchantTrust,
      fakeDealCheck: fakeDealCheck,
      overallRisk: fakeDealCheck.riskScore,
      riskLevel: fakeDealCheck.riskLevel
    },

    // تحليل الشخصية
    personalityIntel: {
      type: personality.type,
      confidence: personality.confidence,
      traits: personality.traits,
      shoppingStyle: personality.shoppingStyle,
      personalizedTip: personalizedRec.tip
    },

    // التوصيات
    recommendationIntel: {
      alternatives: alternatives.slice(0, 3),
      bestTimeToBuy: bestTime,
      aiInsights: aiInsights
    },

    // القرار النهائي
    finalVerdict: {
      decision: strategicDecision,
      confidence: confidenceScore,
      reason: strategicReason,
      color: strategicColor,
      savingsPercent,
      savingsAmount: priceIntel.median ? Math.round((priceIntel.median - currentPrice) * 100) / 100 : 0,
      bestStore,
      bestPrice,
      bestLink,
      actionItems: this.generateActionItems(strategicDecision, {
        alternatives,
        merchantTrust,
        fakeDealCheck,
        bestTime
      }, lang)
    }
  };
};

// ================================
// 🎬 ACTION ITEMS GENERATOR
// ================================

function generateActionItems(decision, context, lang) {
  const actions = [];

  switch (decision) {
    case 'BUY_NOW':
      actions.push({ action: 'purchase', priority: 1, text: 'اشترِ الآن قبل نفاذ الكمية' });
      if (context.alternatives?.length > 0) {
        actions.push({ action: 'compare', priority: 2, text: 'قارن مع البدائل الأرخص' });
      }
      break;

    case 'BUY':
      actions.push({ action: 'purchase', priority: 1, text: 'السعر مناسب للشراء' });
      actions.push({ action: 'check_reviews', priority: 2, text: 'تحقق من تقييمات المستخدمين' });
      break;

    case 'WAIT':
      actions.push({ action: 'set_alert', priority: 1, text: 'اضبط تنبيه لانخفاض السعر' });
      actions.push({ action: 'watchlist', priority: 2, text: 'أضف للمفضلة للمتابعة' });
      break;

    case 'CONSIDER':
      actions.push({ action: 'compare', priority: 1, text: 'قارن مع خيارات أخرى' });
      actions.push({ action: 'negotiate', priority: 2, text: 'حاول التفاوض على السعر' });
      break;

    case 'AVOID':
    case 'CAUTION':
      actions.push({ action: 'avoid', priority: 1, text: 'تجنب هذا العرض' });
      actions.push({ action: 'report', priority: 2, text: 'أبلغ عن العرض المشبوه' });
      break;
  }

  return actions;
}

// ================================
// 📤 EXPORTS
// ================================

module.exports.SageAIEngine = SageAIEngine;
module.exports.PersonalityEngine = PersonalityEngine;
module.exports.PriceIntelligence = PriceIntelligence;
module.exports.MerchantTrustEngine = MerchantTrustEngine;
module.exports.RecommendationEngine = RecommendationEngine;
module.exports.FakeDealDetector = FakeDealDetector;
module.exports.SAGE_TRANSLATIONS = SAGE_TRANSLATIONS;
module.exports.generateActionItems = generateActionItems;
module.exports.t = t;
module.exports.cleanPrice = cleanPrice;
