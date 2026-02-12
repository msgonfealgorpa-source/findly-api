/**
 * Sage Core v3 – Adaptive Price & Personality Intelligence
 * يدمج:
 * - Market Intelligence
 * - User Learning
 * - Price Forecast
 * - Fake Deal Detection
 * - User Personality Engine (NEW)
 */

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

module.exports = function SageCore(
  product,
  marketProducts = [],
  serperContext = [],
  userEvents = {},     // { viewed, clickedAnalysis, bought }
  userId = 'guest',
  userOutcome = null
) {
  const price = cleanPrice(product.price);

  /* ===============================
     1️⃣ Market Intelligence
  =============================== */
  const prices = marketProducts
    .map(p => cleanPrice(p.product_price || p.price))
    .filter(p => p > 0);

  const marketAverage =
    prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

  let dealScore = 50;
  let decision = 'سعر عادل';
  let label = 'قريب من متوسط السوق';
  let color = '#3b82f6';

  if (marketAverage && price > 0) {
    const diffPercent = ((marketAverage - price) / marketAverage) * 100;
    dealScore = Math.round(Math.max(0, Math.min(100, diffPercent + 50)));

    if (price < marketAverage * 0.85) {
      decision = 'اشتري الآن';
      label = 'أقل بكثير من السوق';
      color = '#10b981';
    } else if (price > marketAverage * 1.15) {
      decision = 'انتظر';
      label = 'أعلى من السوق';
      color = '#ef4444';
    }
  }

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

  if (prices.length >= 5) {
    const min = Math.min(...prices);
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
      competitors: prices.length,
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
