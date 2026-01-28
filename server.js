const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==============================
// 🧠 INTENT ANALYSIS
// ==============================
function analyzeIntent(query) {
  const q = query.toLowerCase();

  if (/gaming|game|fps|play|ألعاب/.test(q)) return { type: "gaming" };
  if (/camera|photo|تصوير|كاميرا/.test(q)) return { type: "camera" };
  if (/battery|بطارية/.test(q)) return { type: "battery" };
  if (/cheap|budget|رخيص|اقتصادي/.test(q)) return { type: "budget" };
  if (/best|luxury|افضل|اقوى/.test(q)) return { type: "premium" };

  return { type: "balanced" };
}

// ==============================
// 🎯 CATEGORY DETECTION
// ==============================
function detectCategory(query) {
  const q = query.toLowerCase();

  if (/phone|iphone|samsung|هاتف|جوال/.test(q)) return "phone";
  if (/laptop|macbook|pc|لابتوب/.test(q)) return "laptop";
  if (/watch|ساعة/.test(q)) return "watch";
  if (/tablet|ipad|تابلت/.test(q)) return "tablet";

  return "general";
}

// ==============================
// ⚖️ SMART SCORING
// ==============================
function smartScore(p, intent) {
  const price = parseFloat((p.price || "").replace(/[^\d.]/g, "")) || 99999;
  const rating = p.rating || 4;

  let score = rating * 100;

  if (intent.type === "budget") score += (100000 - price);
  if (intent.type === "premium") score += rating * 150;
  if (intent.type === "gaming") score += rating * 120;
  if (intent.type === "camera") score += rating * 130;

  return score;
}

// ==============================
// 🧠 AI REASON ENGINE
// ==============================
function generateReason(p, intent, category, rank, lang) {
  const rating = p.rating || 4;
  const cat = {
    phone: lang === "ar" ? "هاتف" : "phone",
    laptop: lang === "ar" ? "لابتوب" : "laptop",
    watch: lang === "ar" ? "ساعة ذكية" : "smart watch",
    tablet: lang === "ar" ? "تابلت" : "tablet",
    general: lang === "ar" ? "منتج" : "product"
  };

  if (lang === "ar") {
    if (rank === 1) {
      if (intent.type === "budget") return `أفضل خيار اقتصادي: هذا ${cat[category]} يوفر أفضل قيمة مقابل السعر مع تقييم ${rating}.`;
      if (intent.type === "gaming") return `الأقوى للألعاب: أداء عالي وتجربة لعب ممتازة بتقييم ${rating}.`;
      if (intent.type === "camera") return `الأفضل للتصوير: جودة كاميرا ممتازة ونتائج احترافية بتقييم ${rating}.`;
      if (intent.type === "premium") return `الخيار الفاخر: جودة تصنيع عالية وأداء قوي بتقييم ${rating}.`;
      return `الخيار المتوازن: يجمع بين السعر المناسب والأداء الجيد وتقييم ${rating}.`;
    }
    if (rank === 2) return `بديل قوي: مواصفات ممتازة وسعر منافس.`;
    return `خيار جيد: مناسب لمن يبحث عن جودة مستقرة.`;
  } else {
    if (rank === 1) return `Top pick: Best balance of performance and value with ${rating} rating.`;
    if (rank === 2) return `Strong alternative: Great specs and competitive price.`;
    return `Good choice: Reliable performance and solid value.`;
  }
}

// ==============================
// 🚀 API
// ==============================
app.get('/', (req, res) => {
  res.send('Findly AI Engine is running 🚀');
});

app.post('/smart-search', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const currentLang = lang || "ar";

    const intent = analyzeIntent(query);
    const category = detectCategory(query);

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: process.env.SERPAPI_KEY,
        hl: currentLang,
        gl: currentLang === "ar" ? "sa" : "us"
      }
    });

    const results = response.data.shopping_results || [];

    let products = results.map(p => ({
      name: p.title,
      thumbnail: p.thumbnail,
      link: p.product_link || p.link,
      price: p.price || (currentLang === "ar" ? "اتصل للسعر" : "Check price"),
      rating: p.rating || 4.2,
      source: p.source
    }));

    products = products.map(p => ({
      ...p,
      score: smartScore(p, intent)
    }));

    products.sort((a, b) => b.score - a.score);

    const final = products.slice(0, 3).map((p, i) => ({
      ...p,
      reason: generateReason(p, intent, category, i + 1, currentLang)
    }));

    res.json({ products: final });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ products: [] });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Findly AI running on port ${PORT}`);
});
