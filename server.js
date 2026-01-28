const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==============================
// 🧠 SMART AI CORE
// ==============================

function analyzeIntent(query) {
  query = query.toLowerCase();

  if (/gaming|game|fps|play/.test(query)) return { type: "gaming", focus: ["gpu","cpu","refresh","cooling"] };
  if (/camera|photo|تصوير|كاميرا/.test(query)) return { type: "camera", focus: ["camera","sensor","stabilization"] };
  if (/battery|بطارية/.test(query)) return { type: "battery", focus: ["battery","charging"] };
  if (/cheap|budget|رخيص|اقتصادي/.test(query)) return { type: "budget", focus: ["price","value"] };
  if (/luxury|best|افضل|اقوى/.test(query)) return { type: "premium", focus: ["performance","quality"] };

  return { type: "balanced", focus: ["price","rating","performance"] };
}

// ==============================
// 🎯 CATEGORY BRAIN
// ==============================

function detectCategory(query) {
  if (/phone|iphone|samsung|هاتف|جوال/.test(query)) return "phone";
  if (/laptop|macbook|pc|لابتوب/.test(query)) return "laptop";
  if (/watch|ساعة/.test(query)) return "watch";
  if (/tablet|ipad|تابلت/.test(query)) return "tablet";
  return "general";
}

// ==============================
// ⚖️ SMART SCORING
// ==============================

function smartScore(p, intent, category) {
  let score = 0;

  const price = parseFloat(p.price?.replace(/[^\d.]/g, "")) || 99999;
  const rating = p.rating || 4;

  if (intent.type === "budget") score += (100000 - price) * 0.6;
  if (intent.type === "premium") score += rating * 120;

  score += rating * 50;
  score += (100000 - price) * 0.2;

  return score;
}

// ==============================
// 🧠 AI REASON GENERATOR
// ==============================

function generateReason(p, intent, category, rank) {
  const price = p.price;
  const rating = p.rating;

  const categoryText = {
    phone: "هاتف",
    laptop: "لابتوب",
    watch: "ساعة ذكية",
    tablet: "تابلت",
    general: "منتج"
  };

  let reason = "";

  if (rank === 1) {
    if (intent.type === "budget") {
      reason = `أفضل خيار اقتصادي: يقدم هذا ${categoryText[category]} أفضل سعر مقابل الأداء مع تقييم ${rating}.`;
    } else if (intent.type === "gaming") {
      reason = `أفضل أداء للألعاب: يوفر تجربة لعب سلسة بفضل مواصفاته القوية وتقييم ${rating}.`;
    } else if (intent.type === "camera") {
      reason = `أفضل اختيار للتصوير: يتميز بكاميرات قوية ودقة ممتازة بتقييم ${rating}.`;
    } else {
      reason = `الخيار المتوازن: يجمع بين سعر مناسب وجودة عالية وتقييم ${rating}.`;
    }
  } else if (rank === 2) {
    reason = `بديل قوي: أداء ممتاز وسعر منافس يجعله خيارًا موثوقًا.`;
  } else {
    reason = `خيار جيد: مناسب لمن يبحث عن جودة مستقرة بسعر مناسب.`;
  }

  return reason;
}

// ==============================
// 🚀 SMART SEARCH API
// ==============================

app.post('/smart-search', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const intent = analyzeIntent(query);
    const category = detectCategory(query);

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: process.env.SERPAPI_KEY,
        hl: lang || "en"
      }
    });

    const results = response.data.shopping_results || [];

    let products = results.map(p => ({
      name: p.title,
      thumbnail: p.thumbnail,
      link: p.product_link || p.link,
      price: p.price || "Check price",
      rating: p.rating || 4.1,
      source: p.source
    }));

    products = products.map(p => ({
      ...p,
      score: smartScore(p, intent, category)
    }));

    products.sort((a,b) => b.score - a.score);

    const final = products.slice(0,3).map((p,i)=>({
      ...p,
      reason: generateReason(p, intent, category, i+1)
    }));

    res.json({
      intent,
      category,
      products: final
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ products: [] });
  }
});

app.listen(PORT, ()=> console.log(`🔥 Findly AI Engine running on ${PORT}`));
