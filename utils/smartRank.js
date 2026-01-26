function smartRank(products, brain) {
  return products
    .map(p => {
      let score = 0;

      // تحويل نص السعر (مثل "1500 SAR") إلى رقم حقيقي
      const numericPrice = p.features ? parseFloat(p.features.replace(/[^0-9.]/g, '')) : 0;

      // منطق الترتيب الذكي
      if (brain.intent === 'cheap') {
        score += (10000 / (numericPrice || 1)); // كلما قل السعر زاد السكور
      } else {
        score += (p.rating || 0) * 20; // التركيز على الجودة
      }

      // مكافأة مطابقة الماركة
      if (brain.brand && p.name?.toLowerCase().includes(brain.brand.toLowerCase())) {
        score += 100;
      }

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = { smartRank };
