function analyzeSmartQuery(text = "") {
  const q = text.toLowerCase();

  const brands = {
    samsung: ["سامسونج", "samsung", "galaxy"],
    apple: ["ايفون", "iphone", "apple"],
    xiaomi: ["شاومي", "xiaomi", "redmi", "poco"],
    huawei: ["هواوي", "huawei"],
    oppo: ["اوبو", "oppo"],
    realme: ["ريلمي", "realme"],
    nokia: ["نوكيا", "nokia"],
    vivo: ["فيفو", "vivo"]
  };

  const categories = {
    smartphone: ["هاتف", "جوال", "موبايل", "phone", "mobile"],
    laptop: ["لابتوب", "كمبيوتر", "حاسوب", "laptop", "notebook", "pc"],
    headphones: ["سماعة", "سماعات", "headphones", "earbuds", "earphone"],
    accessories: ["شاحن", "كفر", "جراب", "cable", "charger", "case", "accessory"]
  };

  const usageKeywords = {
    gaming: ["العاب", "gaming", "game", "pubg", "cod", "fifa"],
    camera: ["كاميرا", "camera", "photo", "تصوير"],
    battery: ["بطارية", "battery", "power", "شحن"],
    performance: ["سريع", "قوي", "fast", "performance", "powerful"]
  };

  const budgetKeywords = {
    low: ["رخيص", "اقتصادي", "cheap", "budget", "low price"],
    mid: ["متوسط", "medium", "mid", "average"],
    high: ["غالي", "فخم", "expensive", "premium", "high-end"]
  };

  let result = {
    raw: text,
    category: null,
    brand: null,
    usage: [],
    budget: null,
    priority: [],
    confidence: 0
  };

  for (const [brand, keys] of Object.entries(brands)) {
    if (keys.some(k => q.includes(k))) {
      result.brand = brand;
      result.priority.push("brand");
      result.confidence += 0.25;
    }
  }

  for (const [cat, keys] of Object.entries(categories)) {
    if (keys.some(k => q.includes(k))) {
      result.category = cat;
      result.priority.push("category");
      result.confidence += 0.25;
    }
  }

  for (const [use, keys] of Object.entries(usageKeywords)) {
    if (keys.some(k => q.includes(k))) {
      result.usage.push(use);
      result.priority.push(use);
      result.confidence += 0.2;
    }
  }

  for (const [bud, keys] of Object.entries(budgetKeywords)) {
    if (keys.some(k => q.includes(k))) {
      result.budget = bud;
      result.priority.push("budget");
      result.confidence += 0.15;
    }
  }

  if (result.confidence > 1) result.confidence = 1;

  return result;
}

module.exports = { analyzeSmartQuery };
