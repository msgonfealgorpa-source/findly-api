const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// استيراد الأدوات الذكية من مجلد utils
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// التأكد من عمل السيرفر
app.get('/', (req, res) => {
  res.send('Findly AI Engine is Online & Intelligent! 🧠🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const currentLang = lang || "ar";

    // 1. تحليل الاستعلام بالعقل الذكي
    const brain = analyzeSmartQuery(query);
    console.log("🧠 Brain Analysis:", brain);

    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    // 2. جلب البيانات من جوجل باستخدام الكلمات المفتاحية المحسنة
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: brain.searchQuery,
        api_key: SERPAPI_KEY,
        hl: currentLang,
        gl: currentLang === "ar" ? "sa" : "us"
      }
    });

    let shoppingResults = response.data.shopping_results || [];

    // 3. فلترة ذكية أولية (حسب النوع أو الماركة)
    let filtered = shoppingResults;
    if (brain.brand) {
      const brandMatches = shoppingResults.filter(item => 
        item.title.toLowerCase().includes(brain.brand.toLowerCase())
      );
      if (brandMatches.length > 0) filtered = brandMatches;
    }

    // 4. تحويل النتائج لتنسيق التطبيق (Mapping)
    const products = filtered.slice(0, 10).map(item => ({
      name: item.title,
      thumbnail: item.thumbnail,
      link: item.product_link || item.link,
      features: item.price || "Contact for price",
      rating: item.rating || 0,
      source: item.source
    }));

    // 5. الترتيب الذكي (Ranking)
    const rankedProducts = smartRank(products, brain);

    // 6. صياغة التفسير النهائي (AI Explanation)
    const explanation = generateSmartExplanation(brain, rankedProducts, currentLang);

    // إرسال الرد الكامل للواجهة
    res.json({
      explanation: explanation, // النص الذي يظهر في المربع الأخضر
      products: rankedProducts.slice(0, 3) // أفضل 3 منتجات فقط
    });

  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ 
      explanation: "عذراً، حدث خطأ تقني في معالجة طلبك.", 
      products: [] 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Findly Server running on port ${PORT}`);
});
