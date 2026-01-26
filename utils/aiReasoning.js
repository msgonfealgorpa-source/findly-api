function generateSmartExplanation(brain, products, lang = "en") {
  const templates = {
    ar: {
      intro: `حللت طلبك لـ "${brain.raw}" بدقة. بناءً على تفضيلك لـ ${brain.brand || 'أفضل الماركات'}، اخترت لك هذه القائمة:`,
      reasons: ["أفضل تقييم مستخدمين", "سعر منافس جداً", "أداء قوي واعتمادية عالية"],
      ending: "إذا أردت تغيير المواصفات أو الميزانية، أنا هنا للمساعدة! 👌"
    },
    en: {
      intro: `I analyzed your request for "${brain.raw}". Based on your interest in ${brain.brand || 'top brands'}, here are the best picks:`,
      reasons: ["Top-tier user ratings", "Competitive pricing", "High performance & reliability"],
      ending: "Want to compare other specs? Just let me know! 👌"
    },
    // ... يمكنك إضافة بقية اللغات بنفس النمط
  };

  const t = templates[lang] || templates["en"];
  const selectedReasons = t.reasons.map(r => `• ${r}`).join("\n");

  // نعيد نصاً كاملاً ليظهر مباشرة في مربع Findly الأخضر
  return `${t.intro}\n\n${selectedReasons}\n\n${t.ending}`;
}

module.exports = { generateSmartExplanation };
