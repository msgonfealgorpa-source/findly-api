module.exports = function trustEngine(item, priceIntel) {
  let score = 60;
  const reasons = [];
  const warnings = [];

  if (item.source === "Amazon") {
    score += 25;
    reasons.push("مصدر موثوق");
  }

  if (priceIntel.deltaPercent < -40) {
    score -= 20;
    warnings.push("سعر منخفض بشكل غير طبيعي");
  }

  return {
    score,
    level: score >= 80 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW",
    reasons,
    warnings
  };
};
