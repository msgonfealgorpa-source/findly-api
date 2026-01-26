export function analyzeSmartQuery(text) {
  const q = text.toLowerCase();

  const brands = {
    samsung: ["سامسونج", "samsung"],
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
    gaming: ["العاب", "gaming", "game", "pubg", "cod", "fifa", "battleground"],
    camera: ["كاميرا", "camera", "photo", "photography"],
    battery: ["بطارية", "battery", "long battery", "power"],
    performance: ["سريع", "قوي", "fast", "performance", "powerful"]
  };

  const budgetKeywords = {
    low: ["رخيص", "cheap", "budget", "low price", "affordable"],
    mid: ["متوسط", "medium", "mid", "average price"],
    high: ["غالي", "expensive", "premium", "high-end"]
  };

  let result = {
    category: null,
    brand: null,
    usage: [],
    budget: null
  };

  for (const [brand, keys] of Object.entries(brands)) {
    if (keys.some(k => q.includes(k))) result.brand = brand;
  }

  for (const [cat, keys] of Object.entries(categories)) {
    if (keys.some(k => q.includes(k))) result.category = cat;
  }

  for (const [use, keys] of Object.entries(usageKeywords)) {
    if (keys.some(k => q.includes(k))) result.usage.push(use);
  }

  for (const [bud, keys] of Object.entries(budgetKeywords)) {
    if (keys.some(k => q.includes(k))) result.budget = bud;
  }

  return result;
}
