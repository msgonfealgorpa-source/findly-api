function analyzeSmartQuery(text = "") {
  const q = text.toLowerCase();
  
  // استخراج الأرقام التقنية (رام، بطارية، ذاكرة)
  const ramMatch = q.match(/(\d+)\s*(جيجا|gb|ram)/);
  const batteryMatch = q.match(/(\d+)\s*(ملي|mah)/);
  const storageMatch = q.match(/(\d+)\s*(ترا|tb|gb|storage|ذاكرة)/);

  const brands = {
    samsung: ["سامسونج", "samsung", "galaxy"],
    apple: ["ايفون", "iphone", "apple"],
    xiaomi: ["شاومي", "xiaomi", "redmi", "poco"],
    huawei: ["هواوي", "huawei"]
  };

  let result = {
    raw: text,
    brand: null,
    targetSpecs: {
      ram: ramMatch ? parseInt(ramMatch[1]) : null,
      battery: batteryMatch ? parseInt(batteryMatch[1]) : null,
      storage: storageMatch ? parseInt(storageMatch[1]) : null
    },
    intent: (q.includes("رخيص") || q.includes("cheap")) ? "cheap" : "best",
    searchQuery: text
  };

  for (const [brand, keys] of Object.entries(brands)) {
    if (keys.some(k => q.includes(k))) { result.brand = brand; break; }
  }

  return result;
}

module.exports = { analyzeSmartQuery };
