const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');

function smartTextMatch(text, keywords) {
  if (!text || !Array.isArray(keywords)) return false;
  const t = text.toLowerCase();
  return keywords.every(word => t.includes(word));
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Findly AI Server is Running Successfully! 🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const brain = analyzeSmartQuery(query);
    console.log("🧠 Smart Brain:", brain);

    const SERPAPI_KEY = process.env.SERPAPI_KEY;
    const currentLang = lang || "ar";

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: brain.searchQuery || query,
        api_key: SERPAPI_KEY,
        hl: currentLang,
        gl: currentLang === "ar" ? "sa" : "us"
      }
    });

    const shoppingResults = response.data.shopping_results || [];
    let filteredResults = shoppingResults;

    // فلترة حسب البراند
    if (brain.brand) {
      const brandKeywords = {
        apple: ["apple", "iphone", "ios"],
        samsung: ["samsung", "galaxy"],
        xiaomi: ["xiaomi", "redmi", "poco"],
        huawei: ["huawei", "honor"],
        oppo: ["oppo"],
        realme: ["realme"]
      };

      const keywords = brandKeywords[brain.brand] || [brain.brand];

      filteredResults = filteredResults.filter(item =>
        smartTextMatch(item.title, keywords)
      );
    }

    // فلترة حسب نوع المنتج
    if (brain.productType) {
      const typeKeywords = {
        phone: ["phone", "iphone", "smartphone", "mobile"],
        laptop: ["laptop", "notebook", "macbook"],
        headphones: ["headphone", "earbuds", "airpods", "headset"],
        watch: ["watch", "smartwatch", "apple watch"],
        tablet: ["tablet", "ipad"]
      };

      const keywords = typeKeywords[brain.productType];

      if (keywords) {
        filteredResults = filteredResults.filter(item =>
          smartTextMatch(item.title, keywords)
        );
      }
    }

    if (!filteredResults || filteredResults.length === 0) {
      return res.json({
        intent: brain.intent,
        keywords: brain.keywords,
        explanation: currentLang === "ar"
          ? "لم يتم العثور على نتائج مطابقة بدقة لبحثك."
          : "No matching products found.",
        products: []
      });
    }

    const topProducts = filteredResults.slice(0, 3).map(item => {
      let cleanLink = item.product_link || item.link;
      if (cleanLink && !cleanLink.startsWith('http')) {
        cleanLink = 'https://www.google.com' + cleanLink;
      }

      const reasons = {
        ar: item.rating >= 4 ? "تقييم مرتفع من المستخدمين" : "سعر ممتاز مقارنة بالمواصفات",
        en: item.rating >= 4 ? "Highly rated by users" : "Great value for the price",
        fr: item.rating >= 4 ? "Très bien noté" : "Excellent rapport qualité-prix",
        tr: item.rating >= 4 ? "Yüksek puanlı" : "Fiyatına göre mükemmel",
        es: item.rating >= 4 ? "Muy valorado" : "Gran valor por el precio"
      };

      return {
        name: item.title,
        thumbnail: item.thumbnail,
        link: cleanLink,
        recommendation_reason: reasons[currentLang] || reasons.en,
        features: item.price,
        rating: item.rating || 0
      };
    });

    const rankedProducts = smartRank(topProducts, brain);
    const explanation = generateSmartExplanation(brain, rankedProducts, currentLang);

    res.json({
      intent: brain.intent,
      keywords: brain.keywords,
      explanation,
      products: rankedProducts
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
