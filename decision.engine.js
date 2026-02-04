module.exports = function decisionEngine({ priceIntel, timingIntel, trustIntel, valueIntel }) {
  if (timingIntel.recommendation === "BUY_NOW" && trustIntel.level === "HIGH") {
    return {
      emoji: "🔥",
      title: "فرصة قوية",
      summary: "سعر ممتاز + توقيت مناسب + مخاطرة منخفضة",
      confidence: "HIGH"
    };
  }

  return {
    emoji: "🤔",
    title: "قرار يحتاج تفكير",
    summary: "التوقيت أو الثقة غير مثاليين حالياً",
    confidence: "MEDIUM"
  };
};
