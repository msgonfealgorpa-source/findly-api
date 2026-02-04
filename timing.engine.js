module.exports = function timingEngine(priceIntel) {
  if (priceIntel.deltaPercent < -20) {
    return {
      recommendation: "BUY_NOW",
      urgency: "HIGH",
      reason: "السعر أقل بكثير من متوسط السوق"
    };
  }

  return {
    recommendation: "WAIT",
    urgency: "LOW",
    reason: "لا يوجد فرق سعري قوي"
  };
};
