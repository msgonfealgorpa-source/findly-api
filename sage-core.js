/**
 * Sage Core – Practical Price Intelligence Engine
 * يعمل فورًا بدون بيانات تاريخية
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

  // استخراج أسعار المنافسين
  const prices = allProducts
    .map(p => cleanPrice(p.product_price || p.price))
    .filter(p => p > 0);

  const marketAverage =
    prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;

  // حساب نسبة الصفقة
  let dealScore = 0;
  let decision = 'يحتاج تفكير';
  let label = 'لا توجد بيانات كافية';
  let color = '#f59e0b'; // أصفر

  if (marketAverage && price > 0) {
    const diff = ((marketAverage - price) / marketAverage) * 100;
    dealScore = Math.round(Math.max(0, Math.min(100, diff + 50)));

    if (price < marketAverage * 0.85) {
      decision = 'اشتري الآن';
      label = 'سعر ممتاز أقل من السوق';
      color = '#10b981'; // أخضر
    } else if (price <= marketAverage * 1.05) {
      decision = 'سعر مناسب';
      label = 'قريب من متوسط السوق';
      color = '#3b82f6'; // أزرق
    } else {
      decision = 'انتظر';
      label = 'السعر أعلى من السوق';
      color = '#ef4444'; // أحمر
    }
  }

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
      competitors: prices.length
    },

    trustIntel: {
      warnings: []
    }
  };
};
