const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function analyzeIntent(query) {
  query = query.toLowerCase();

  if (/gaming|game|fps|play/.test(query)) return { type: "gaming", focus: ["gpu","cpu","refresh","cooling"] };
  if (/camera|photo|تصوير|كاميرا/.test(query)) return { type: "camera", focus: ["camera","sensor","stabilization"] };
  if (/battery|بطارية/.test(query)) return { type: "battery", focus: ["battery","charging"] };
  if (/cheap|budget|رخيص|اقتصادي/.test(query)) return { type: "budget", focus: ["price","value"] };
  if (/luxury|best|افضل|اقوى/.test(query)) return { type: "premium", focus: ["performance","quality"] };

  return { type: "balanced", focus: ["price","rating","performance"] };
}

function detectCategory(query) {
  if (/phone|iphone|samsung|هاتف|جوال/.test(query)) return "phone";
  if (/laptop|macbook|pc|لابتوب/.test(query)) return "laptop";
  if (/watch|ساعة/.test(query)) return "watch";
  if (/tablet|ipad|تابلت/.test(query)) return "tablet";
  return "general";
}

function smartScore(p, intent, category) {
  let score = 0;

  const price = parseFloat((p.price || '').replace(/[^\d.]/g, "")) || 99999;
  const rating = p.rating || 4;

  if (intent.type === "budget") score += (100000 - price) * 0.6;
  if (intent.type === "premium") score += rating * 120;

  score += rating * 50;
  score += (100000 - price) * 0.2;

  return score;
}

function generateReason(p, intent, category, rank) {
  const rating = p.rating || 4;

  const categoryText = {
    phone: "هاتف",
    laptop: "لابتوب",
    watch: "ساعة ذكية",
    tablet: "تابلت",
    general: "منتج"
  };

  if (rank === 1) return `الخيار الأفضل: أداء قوي وسعر مناسب وتقييم ${rating}.`;
  if (rank === 2) return `بديل ممتاز: توازن جيد بين السعر والأداء.`;
  return `خيار جيد: مناسب للاستخدام اليومي.`;
}

app.get('/', (req, res) => {
  res.send('Findly API is running...');
});

app.post('/smart-search', async (req, res) => {
  try {
    const { query, lang } = req.body;

    if (!query) return res.json({ products: [] });

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
      price: p.price || "N/A",
      rating: p.rating || 4,
      source: p.source
    }));

    products = products.map(p => ({
      ...p,
      score: smartScore(p, intent, category)
    })).sort((a,b) => b.score - a.score);

    const final = products.slice(0,3).map((p,i)=> ({
      ...p,
      reason: generateReason(p, intent, category, i+1)
    }));

    res.json({ intent, category, products: final });

  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    res.status(500).json({ error: "AI Engine Error" });
  }
});

app.listen(PORT, () => console.log(`🔥 Findly running on ${PORT}`));
