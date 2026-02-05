/**
 * Sage Core v2 – Competitive Price Intelligence Engine
 * يعمل فورًا + يتطور مع الاستخدام
 */

function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0;
}

module.exports = function SageCore(
  product,
  marketProducts = [],
  userEvents = {},     // { viewed, clickedAnalysis, bought }
  userHistory = {},    // مستقبلًا
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
     (يتفعل تدريجيًا)
  =============================== */
  let learningBoost = 0;
  let learningReason = null;

  if (userEvents.clickedAnalysis) {
    learningBoost += 5;
    learningReason = 'User shows high interest';
  }
  if (userEvents.bought) {
    learningBoost += 15;
    learningReason = 'User tends to buy at this range';
  }
  if (userEvents.viewed && !userEvents.clickedAnalysis) {
    learningBoost -= 5;
  }

  dealScore = Math.max(0, Math.min(100, dealScore + learningBoost));

  /* ===============================
     3️⃣ 7-Day Price Forecast (Approx)
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
     4️⃣ Fake Deal Detection
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
     FINAL OUTPUT (متوافق مع الواجهة)
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
    }
  };
};
