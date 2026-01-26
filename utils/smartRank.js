function smartRank(products, brain) {
  return products.map(p => {
    let score = 0;
    const title = p.name.toLowerCase();

    // 1. مكافأة مطابقة المواصفات التقنية (رام وبطارية)
    if (brain.targetSpecs.ram) {
      const foundRam = title.match(/(\d+)\s*(gb|ram)/);
      if (foundRam && parseInt(foundRam[1]) >= brain.targetSpecs.ram) score += 60;
    }

    if (brain.targetSpecs.battery) {
      const foundBat = title.match(/(\d+)\s*mah/);
      if (foundBat && parseInt(foundBat[1]) >= brain.targetSpecs.battery) score += 60;
    }

    // 2. مكافأة الماركة
    if (brain.brand && title.includes(brain.brand)) score += 40;

    // 3. ترتيب السعر والجودة
    const numericPrice = p.features ? parseFloat(p.features.replace(/[^0-9.]/g, '')) : 0;
    score += (p.rating || 0) * 15;
    
    if (brain.intent === 'cheap') {
      score += (10000 / (numericPrice || 1));
    }

    return { ...p, score };
  }).sort((a, b) => b.score - a.score);
}

module.exports = { smartRank };
