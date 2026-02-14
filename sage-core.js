/**
 * Sage Core v3 – Adaptive Price & Personality Intelligence
 * يدمج:
 * - Market Intelligence
 * - User Learning
 * - Price Forecast
 * - Fake Deal Detection
 * - User Personality Engine (NEW)
 */
/* ================= TRANSLATIONS ================= */

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
    fake_offer: "قد يكون العرض غير منطقي مقارنة بالسوق"
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
    insufficient_data: "Not enough data for analysis",
    market_stable: "Market Stable",
    market_rising: "Market Rising",
    market_falling: "Market Falling",
    analysis_learning: "Analysis in progress",
    fake_offer: "Offer may be unrealistic compared to market"
  },

  fr: {
    buy_now: "Acheter maintenant",
    wait: "Attendre",
    overpriced: "Prix élevé",
    fair_price: "Prix correct",
    excellent_deal: "Excellente offre",
    good_deal: "Bonne offre",
    bad_deal: "Offre faible",
    high_risk: "Risque élevé",
    medium_risk: "Risque moyen",
    low_risk: "Risque faible",
    strong_signal: "Signal fort",
    weak_signal: "Signal faible",
    insufficient_data: "Données insuffisantes",
    market_stable: "Marché stable",
    market_rising: "Marché en hausse",
    market_falling: "Marché en baisse",
    analysis_learning: "Analyse en cours",
    fake_offer: "Offre potentiellement irréaliste"
  },

  de: {
    buy_now: "Jetzt kaufen",
    wait: "Warten",
    overpriced: "Überteuert",
    fair_price: "Fairer Preis",
    excellent_deal: "Ausgezeichnetes Angebot",
    good_deal: "Gutes Angebot",
    bad_deal: "Schwaches Angebot",
    high_risk: "Hohes Risiko",
    medium_risk: "Mittleres Risiko",
    low_risk: "Niedriges Risiko",
    strong_signal: "Starkes Signal",
    weak_signal: "Schwaches Signal",
    insufficient_data: "Nicht genügend Daten",
    market_stable: "Markt stabil",
    market_rising: "Markt steigt",
    market_falling: "Markt fällt",
    analysis_learning: "Analyse läuft",
    fake_offer: "Angebot könnte unrealistisch sein"
  },

  es: {
    buy_now: "Comprar ahora",
    wait: "Esperar",
    overpriced: "Precio alto",
    fair_price: "Precio justo",
    excellent_deal: "Oferta excelente",
    good_deal: "Buena oferta",
    bad_deal: "Oferta débil",
    high_risk: "Alto riesgo",
    medium_risk: "Riesgo medio",
    low_risk: "Bajo riesgo",
    strong_signal: "Señal fuerte",
    weak_signal: "Señal débil",
    insufficient_data: "Datos insuficientes",
    market_stable: "Mercado estable",
    market_rising: "Mercado en alza",
    market_falling: "Mercado en baja",
    analysis_learning: "Análisis en curso",
    fake_offer: "La oferta puede ser irreal"
  },

  tr: {
    buy_now: "Şimdi Satın Al",
    wait: "Bekle",
    overpriced: "Fiyat yüksek",
    fair_price: "Adil fiyat",
    excellent_deal: "Mükemmel fırsat",
    good_deal: "İyi fırsat",
    bad_deal: "Zayıf fırsat",
    high_risk: "Yüksek risk",
    medium_risk: "Orta risk",
    low_risk: "Düşük risk",
    strong_signal: "Güçlü sinyal",
    weak_signal: "Zayıf sinyal",
    insufficient_data: "Yetersiz veri",
    market_stable: "Piyasa stabil",
    market_rising: "Piyasa yükseliyor",
    market_falling: "Piyasa düşüyor",
    analysis_learning: "Analiz sürüyor",
    fake_offer: "Teklif gerçekçi olmayabilir"
  }

};
function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0;
}

/* ===============================
   🧠 Personality Detection
================================ */
function detectPersonality(userEvents, price, marketAverage) {
  if (!marketAverage) return 'neutral';

  if (userEvents?.bought && price > marketAverage) {
    return 'impulse';
  }

  if (userEvents?.clickedAnalysis && !userEvents?.bought) {
    return 'analyst';
  }

  if (userEvents?.bought && price < marketAverage * 0.9) {
    return 'hunter';
  }

  if (userEvents?.bought && price >= marketAverage) {
    return 'premium';
  }

  return 'neutral';
}
function t(lang, key) {
  const shortLang = (lang || "en").split("-")[0];
  return SAGE_TRANSLATIONS[shortLang]?.[key]
      || SAGE_TRANSLATIONS["en"][key]
      || key;
}
module.exports = function SageCore(
  product,
  marketProducts = [],
  serperContext = [],
  userEvents = {},
  userId = 'guest',
  userOutcome = null,
  lang = 'en'   // ✅ إضافة اللغة
) 

{
  
  const price = cleanPrice(product.price);

  /* ===============================
     1️⃣ Market Intelligence
  =============================== */

// تنظيف الأسعار
const rawPrices = marketProducts
  .map(p => cleanPrice(p.product_price || p.price))
  .filter(p => p > 0);

// لو لا يوجد سوق
if (rawPrices.length < 3) {
  return {
    priceIntel: {
      current: price,
      average: null,
      score: 50,
      decision: t.insufficientData,
      label: t.fewOffers,
      color: '#6b7280'
    },
    finalVerdict: {
      decision: 'INSUFFICIENT_DATA',
      confidence: 40,
      savingPercent: 0,
      bestStore: null,
      bestPrice: null,
      bestLink: null,
      reason: t.insufficientReason
    }
  };
}
// ترتيب الأسعار
const sorted = [...rawPrices].sort((a, b) => a - b);

// حساب Median (أقوى من Average)
const mid = Math.floor(sorted.length / 2);
const marketMedian =
  sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;

// إزالة القيم الشاذة (IQR Method)
const q1 = sorted[Math.floor(sorted.length * 0.25)];
const q3 = sorted[Math.floor(sorted.length * 0.75)];
const iqr = q3 - q1;

const filteredPrices = sorted.filter(
  p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr
);

const refinedMedian =
  filteredPrices.length > 0
    ? filteredPrices[Math.floor(filteredPrices.length / 2)]
    : marketMedian;

// نسبة الفرق
const diffPercent = ((refinedMedian - price) / refinedMedian) * 100;

let decision = 'سعر عادل';
let label = 'ضمن نطاق السوق';
let color = '#3b82f6';
let dealScore = 50;

if (price < refinedMedian * 0.9) {
  decision = 'اشتري الآن';
  label = 'أقل من 90% من السوق';
  color = '#10b981';
  dealScore = 80;
}
else if (price > refinedMedian * 1.1) {
  decision = 'انتظر';
  label = 'أعلى من 110% من السوق';
  color = '#ef4444';
  dealScore = 30;
}
else {
  dealScore = 60;
}
  
  const priceIntel = {
  current: price,
  average: Math.round(refinedMedian),
  score: dealScore,
  decision,
  label,
  color
};
  const marketAverage = refinedMedian;
  /* ===============================
     2️⃣ User Learning Intelligence
  =============================== */
  let learningBoost = 0;
  let learningReason = null;

  if (userEvents?.clickedAnalysis) {
    learningBoost += 5;
    learningReason = 'User shows high interest';
  }

  if (userEvents?.bought) {
    learningBoost += 15;
    learningReason = 'User tends to buy at this price range';
  }

  if (userEvents?.viewed && !userEvents?.clickedAnalysis) {
    learningBoost -= 5;
  }

  dealScore = Math.max(0, Math.min(100, dealScore + learningBoost));

  /* ===============================
     3️⃣ Personality Engine (NEW)
  =============================== */
  const personality = detectPersonality(userEvents, price, marketAverage);

  switch (personality) {
    case 'hunter':
      if (price <= marketAverage * 0.92) {
        decision = 'اشتري الآن';
        label = 'صفقة ممتازة لصيّاد الصفقات';
        color = '#16a34a';
      } else {
        decision = 'انتظر';
        label = 'لم يصل لأفضل سعر بعد';
      }
      break;

    case 'analyst':
      decision = 'انتظر';
      label = 'المستخدم يفضل التحليل والتأكد';
      color = '#6366f1';
      break;

    case 'impulse':
      if (dealScore >= 55) {
        decision = 'اشتري الآن';
        label = 'قرار مناسب للمستخدم السريع';
        color = '#f59e0b';
      }
      break;

    case 'premium':
      decision = 'اشتري الآن';
      label = 'السعر مقبول لمستخدم Premium';
      color = '#9333ea';
      break;
  }

  /* ===============================
     4️⃣ 7-Day Price Forecast
  =============================== */
  let forecast = {
    trend: 'stable',
    expectedPrice: price,
    confidence: 0.4,
    advice: 'السعر مستقر'
  };

  if (marketAverage) {
    if (price > marketAverage * 1.1) {
      forecast = {
        trend: 'down',
        expectedPrice: Math.round(marketAverage * 0.98),
        confidence: 0.7,
        advice: 'انخفاض محتمل خلال 7 أيام'
      };
    } else if (price < marketAverage * 0.9) {
      forecast = {
        trend: 'up',
        expectedPrice: Math.round(marketAverage),
        confidence: 0.6,
        advice: 'قد يرتفع قريبًا'
      };
    }
  }

  /* ===============================
     5️⃣ Fake Deal Detection
  =============================== */
  const warnings = [];
  let riskScore = 0;

  if (marketAverage && price > marketAverage * 1.25) {
    warnings.push('السعر أعلى بكثير من السوق');
    riskScore += 40;
  }

  if (rawPrices.length >= 5) {
  const min = Math.min(...rawPrices);
    if (price > min * 1.3) {
      warnings.push('عرض قد يكون وهميًا مقارنة بالمنافسين');
      riskScore += 30;
    }
  }

  /* ===============================
   6️⃣ Strategic Final Verdict (NEW)
================================ */

// حساب أفضل متجر (الأرخص)
let bestStore = null;
let bestPrice = price;
let bestLink = product.link || null;

if (marketProducts.length > 0) {
  const cheapest = marketProducts.reduce((min, item) => {
    const p = cleanPrice(item.product_price || item.price);
    if (!p) return min;

    if (!min || p < min.price) {
      return {
        price: p,
        store:
  item.source ||
  item.store ||
  item.merchant ||
  item.seller ||
  item.domain ||
  'Unknown',
        link: item.link || item.product_link || null
      };
    }
    return min;
  }, null);

  if (cheapest) {
    bestStore = cheapest.store;
    bestPrice = cheapest.price;
    bestLink = cheapest.link;
  }
}

// نسبة التوفير
let savingPercent = 0;
if (marketAverage && price > 0) {
  savingPercent = Math.round(
    ((marketAverage - price) / marketAverage) * 100
  );
}

// قرار استراتيجي أعلى مستوى
let strategicDecision = 'WAIT';
let strategicReason = 'السعر ضمن النطاق الطبيعي';

if (savingPercent >= 15 && riskScore < 30) {
  strategicDecision = 'BUY_NOW';
  strategicReason = `توفر ${savingPercent}% عن متوسط السوق`;
}
else if (savingPercent <= -10) {
  strategicDecision = 'OVERPRICED';
  strategicReason = 'السعر أعلى من السوق بشكل واضح';
}
else if (forecast.trend === 'down') {
  strategicDecision = 'WAIT_PRICE_DROP';
  strategicReason = 'متوقع انخفاض قريب';
}

const confidenceScore = Math.max(
  0,
  Math.min(
    100,
    Math.round(
      (dealScore * 0.5) +
      ((100 - riskScore) * 0.3) +
      (forecast.confidence * 100 * 0.2)
    )
  )
);

const finalVerdict = {
  decision: strategicDecision,
  confidence: confidenceScore,
  savingPercent,
  bestStore,
  bestPrice,
  bestLink,
  reason: strategicReason
};
 
  /* ===============================
     FINAL OUTPUT (متوافق 100%)
  =============================== */
  /* ===============================
     FINAL OUTPUT (متوافق 100%)
  =============================== */
  return {
    priceIntel: {
      current: price,
      average: marketAverage ? marketAverage.toFixed(2) : null,
      score: dealScore,
      decision,
      label,
      color
    },

    valueIntel: {
      score: dealScore,
      competitors: rawPrices.length,
      learningBoost,
      learningReason
    },

    forecastIntel: forecast,

    trustIntel: {
      warnings,
      riskScore
    },

    personalityIntel: {
      type: personality,
      description: {
        hunter: 'يبحث عن أقل سعر ممكن',
        analyst: 'يفضل التحليل قبل الشراء',
        impulse: 'يتخذ قرارات سريعة',
        premium: 'يهتم بالجودة أكثر من السعر',
        neutral: 'سلوك متوازن'
      }[personality]
    },

    finalVerdict
  };
};
