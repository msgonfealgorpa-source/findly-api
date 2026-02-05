/**
 * SageCore v2 – Global Price Intelligence Engine
 * Competitive-grade, instant analysis (no history required)
 */

function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0;
}

module.exports = function SageCore(
  product,
  allProducts = [],
  userEvents = {},
  userHistory = {},
  userId = 'guest',
  userOutcome = null
) {
  const price = cleanPrice(product.price);

  /* ================= COLLECT MARKET ================= */
  const prices = allProducts
    .map(p => cleanPrice(p.product_price || p.price))
    .filter(p => p > 0);

  const competitorsCount = prices.length;

  if (!price || competitorsCount === 0) {
    return {
      priceIntel: {
        current: price,
        average: null,
        decision: 'تحليل غير مكتمل',
        label: 'بيانات السوق غير كافية',
        color: '#6b7280'
      },
      valueIntel: { score: 0 },
      trustIntel: { warnings: ['عدد المنافسين غير كاف'] },
      marketIntel: {},
      explain: ['لا توجد بيانات سوق كافية لإجراء تحليل دقيق']
    };
  }

  /* ================= MARKET STATS ================= */
  const marketAverage = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const volatility =
    marketAverage > 0
      ? ((maxPrice - minPrice) / marketAverage) * 100
      : 0;

  const diffPercent = ((marketAverage - price) / marketAverage) * 100;

  /* ================= DECISION ENGINE ================= */
  let decision = 'انتظر';
  let label = 'السعر أعلى من القيمة الحالية';
  let color = '#ef4444';

  if (diffPercent >= 15) {
    decision = 'اشتري الآن';
    label = 'سعر ممتاز أقل من السوق';
    color = '#10b981';
  } else if (diffPercent >= -5) {
    decision = 'سعر مناسب';
    label = 'قريب من متوسط السوق';
    color = '#3b82f6';
  }

  /* ================= VALUE SCORE ================= */
  let valueScore = Math.round(
    Math.max(0, Math.min(100, diffPercent + 50))
  );

  /* ================= TRUST & RISK ================= */
  const warnings = [];

  if (competitorsCount < 3)
    warnings.push('عدد المقارنات قليل');

  if (volatility > 40)
    warnings.push('السوق متقلب والأسعار غير مستقرة');

  if (price === minPrice)
    warnings.push('أرخص سعر متاح في السوق');

  /* ================= EXPLAINABILITY ================= */
  const explain = [
    `متوسط سعر السوق ${marketAverage.toFixed(2)}$`,
    `سعر المنتج ${price.toFixed(2)}$`,
    `فرق السعر ${diffPercent.toFixed(1)}%`,
    `عدد المنافسين ${competitorsCount}`,
    `تذبذب السوق ${Math.round(volatility)}%`
  ];

  /* ================= FINAL OUTPUT ================= */
  return {
    priceIntel: {
      current: price,
      average: marketAverage.toFixed(2),
      min: minPrice,
      max: maxPrice,
      decision,
      label,
      color
    },

    valueIntel: {
      score: valueScore,
      verdict:
        valueScore > 80
          ? 'قيمة ممتازة'
          : valueScore > 60
          ? 'قيمة جيدة'
          : 'قيمة ضعيفة'
    },

    trustIntel: {
      warnings
    },

    marketIntel: {
      competitors: competitorsCount,
      volatility: Math.round(volatility),
      marketType:
        volatility > 40
          ? 'سوق متقلب'
          : volatility > 20
          ? 'سوق متوسط'
          : 'سوق مستقر'
    },

    explain
  };
};
