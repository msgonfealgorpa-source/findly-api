function analyzeSmartQuery(text = "") {
  const q = text.toLowerCase();
  
  // (نفس القواميس السابقة الخاصة بك: brands, categories, usage, budget)
  const brands = { /* ... قواميسك ... */ };
  const categories = { /* ... قواميسك ... */ };

  let result = {
    raw: text,
    productType: null, // قمنا بتغيير اسمها من category لتوافق السيرفر
    brand: null,
    intent: "best", // القيمة الافتراضية
    searchQuery: text,
    confidence: 0.5
  };

  // تحديد الماركة
  for (const [brand, keys] of Object.entries(brands)) {
    if (keys.some(k => q.includes(k))) { result.brand = brand; break; }
  }

  // تحديد النوع (productType)
  for (const [cat, keys] of Object.entries(categories)) {
    if (keys.some(k => q.includes(k))) { result.productType = cat; break; }
  }

  // تحديد النية (Intent) بناءً على الكلمات المفتاحية
  if (q.includes("رخيص") || q.includes("cheap") || q.includes("budget")) {
    result.intent = "cheap";
  } else if (q.includes("افضل") || q.includes("best") || q.includes("قوي")) {
    result.intent = "best";
  }

  return result;
}

module.exports = { analyzeSmartQuery };
