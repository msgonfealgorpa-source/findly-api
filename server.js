const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// استيراد الأدوات المحدثة (المستوى 3.5)
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Findly AI Engine v3.5 - Technical Mode Active! 🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const currentLang = lang || "ar";

    // 1. تحليل العقل التقني (استخراج الرام، البطارية، الماركة)
    const brain = analyzeSmartQuery(query);
    console.log("🧠 Technical Analysis:", brain);

    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    // 2. جلب البيانات من جوجل
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

    // 3. تحويل النتائج لتنسيق التطبيق (Mapping)
    const rawProducts = shoppingResults.map(item => ({
      name: item.title,
      thumbnail: item.thumbnail,
      link: item.product_link || item.link,
      features: item.price || "Contact for price",
      rating: item.rating || 0,
      source: item.source
    }));

    // 4. الترتيب التقني الذكي (المقارنة بالأرقام والرام والبطارية)
    const rankedData = smartRank(rawProducts, brain);

    // 5. تجهيز أفضل 3 نتائج مع "السبب التقني" لكل منها
    const finalProducts = rankedData.slice(0, 3).map(p => {
      let reason = "";
      if (currentLang === "ar") {
        reason = p.score > 100 ? "مطابق لمواصفاتك التقنية بدقة" : "أفضل خيار متاح حسب الجودة والسعر";
      } else {
        reason = p.score > 100 ? "Matches your technical specs perfectly" : "Best available value and rating";
      }
      
      return {
        ...p,
        recommendation_reason: reason
      };
    });

    // 6. صياغة التفسير العام
    const explanation = generateSmartExplanation(brain, finalProducts, currentLang);

    // إرسال الرد النهائي
    res.json({
      explanation: explanation,
      products: finalProducts
    });

  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ 
      explanation: "Error processing your technical request.", 
      products: [] 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Findly Server v3.5 running on port ${PORT}`);
});
