function smartRank(products, brain) {
  return products
    .map(p => {
      let score = 0;

      // السعر
      if (p.price) {
        if (brain.intent === 'cheap') score += 50 / p.price;
        if (brain.intent === 'best') score += 30;
      }

      // التقييم
      if (p.rating) score += p.rating * 10;

      // المطابقة مع نية المستخدم
      if (brain.brand && p.title?.toLowerCase().includes(brain.brand.toLowerCase())) {
        score += 40;
      }

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = { smartRank };
