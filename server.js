const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ================== 🧠 Smart Brain ==================

function analyzeSmartQuery(query) {
  const q = query.toLowerCase();

  const intent = {
    wantsCheap: /cheap|رخيص|اقتصادي|budget|low price/.test(q),
    wantsBest: /best|أفضل|top|ممتاز/.test(q),
    wantsGaming: /gaming|ألعاب|game/.test(q),
    wantsCamera: /camera|كاميرا|تصوير/.test(q),
    wantsBattery: /battery|بطارية|عمر/.test(q),
    wantsPerformance: /performance|أداء|سريع/.test(q),
    wantsPremium: /premium|احترافي|فخم|pro/.test(q)
  };

  const budgetMatch = q.match(/(\d+)\s*(\$|usd|دولار)/i);
  const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;

  let category = "general";
  if (/phone|هاتف|mobile/.test(q)) category = "phone";
  else if (/laptop|لابتوب/.test(q)) category = "laptop";
  else if (/watch|ساعة/.test(q)) category = "watch";
  else if (/tv|شاشة|television/.test(q)) category = "tv";
  else if (/headphone|سماعة/.test(q)) category = "audio";

  return { rawQuery: query, searchQuery: query, intent, budget, category };
}

// ================== ⚙️ Smart Ranking ==================

function smartRank(products, brain) {
  return products.map(p => {
    let score = 0;
    const priceValue = parseFloat(p.price.replace(/[^\d.]/g, '')) || 999999;

    if (brain.intent.wantsCheap) score += 1000 / priceValue;
    if (brain.intent.wantsBest) score += p.rating * 3;
    if (brain.intent.wantsPremium) score += p.rating * 4;

    if (brain.intent.wantsGaming && /gaming|rtx|ryzen|i7|i9|m1|m2/i.test(p.name)) score += 6;
    if (brain.intent.wantsCamera && /camera|108mp|sony|canon/i.test(p.name)) score += 6;
    if (brain.intent.wantsBattery && /battery|5000|6000mah/i.test(p.name)) score += 5;

    if (brain.budget && priceValue <= brain.budget) score += 8;

    return { ...p, score };
  }).sort((a, b) => b.score - a.score);
}

// ================== 🧾 AI Reasoning ==================

function generateSmartExplanation(brain, product, lang = "ar") {
  let reasons = [];

  if (brain.intent.wantsCheap) reasons.push(lang === "ar" ? "سعر اقتصادي ممتاز" : "Great budget value");
  if (brain.intent.wantsBest) reasons.push(lang === "ar" ? "أعلى تقييم في فئته" : "Top rated in its class");
  if (brain.intent.wantsGaming) reasons.push(lang === "ar" ? "أداء قوي للألعاب" : "Strong gaming performance");
  if (brain.intent.wantsCamera) reasons.push(lang === "ar" ? "كاميرا احترافية" : "Professional-grade camera");
  if (brain.intent.wantsBattery) reasons.push(lang === "ar" ? "بطارية طويلة العمر" : "Long battery life");

  if (brain.budget) {
    const priceValue = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
    if (priceValue <= brain.budget) {
      reasons.push(lang === "ar" ? "ضمن ميزانيتك" : "Within your budget");
    }
  }

  return reasons.join(" + ");
}

// ================== 🚀 API ==================

app.get('/', (req, res) => {
  res.send('Findly AI Engine v4 — Global Intelligence Active 🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const currentLang = lang || "ar";

    const brain = analyzeSmartQuery(query);
    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: brain.searchQuery,
        api_key: SERPAPI_KEY,
        hl: currentLang,
        gl: currentLang === "ar" ? "sa" : "us"
      }
    });

    const shoppingResults = response.data.shopping_results || [];

    const rawProducts = shoppingResults.map(item => ({
      name: item.title,
      thumbnail: item.thumbnail,
      link: item.product_link || item.link,
      price: item.price || (currentLang === "ar" ? "اتصل للسعر" : "Check Price"),
      rating: item.rating || 4.2,
      source: item.source
    }));

    let rankedData = smartRank(rawProducts, brain);

    const finalProducts = rankedData.slice(0, 3).map(p => ({
      ...p,
      reason: generateSmartExplanation(brain, p, currentLang)
    }));

    const explanation = currentLang === "ar"
      ? `حللت ${rankedData.length} منتجاً واخترت أفضل 3 نتائج بدقة عالية.`
      : `I analyzed ${rankedData.length} products and selected the top 3 for you.`;

    res.json({ explanation, products: finalProducts });

  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ explanation: "Server error", products: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Findly Server v4 running on port ${PORT}`);
});
