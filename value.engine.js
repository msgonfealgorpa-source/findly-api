module.exports = function valueEngine(priceIntel, trustIntel) {
  let score = 50;

  if (priceIntel.position === "BELOW_MARKET") score += 25;
  if (trustIntel.level === "HIGH") score += 20;

  return {
    score,
    verdict: score >= 80 ? "EXCELLENT_VALUE" :
             score >= 60 ? "GOOD_VALUE" : "POOR_VALUE",
    explanation: score >= 80
      ? "قيمة ممتازة مقابل السعر"
      : score >= 60
        ? "قيمة جيدة"
        : "القيمة لا تبرر السعر"
  };
};
