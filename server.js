const express = require('express');
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // مهم جداً للسماح للواجهة بالاتصال بالسيرفر
app.use(express.json()); // مهم لقراءة البيانات المرسلة من الواجهة

const PORT = process.env.PORT || 3000;

// إضافة هذا المسار لكي لا يظهر لك خطأ "Cannot GET /" في المتصفح
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

        // 1. طلب البيانات من SerpApi (Google Shopping)
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

  filteredResults = shoppingResults.filter(item =>
    keywords.some(key =>
      item.title && item.title.toLowerCase().includes(key)
    )
  );
}

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
      keywords.some(key =>
        item.title && item.title.toLowerCase().includes(key)
      )
    );
  }
}
      // 2. معالجة وتجهيز أفضل 3 منتجات

        const topProducts = filteredResults.slice(0, 3).map((item) => {
            let cleanLink = item.product_link || item.link;
            if (cleanLink && !cleanLink.startsWith('http')) {
                cleanLink = 'https://www.google.com' + cleanLink;
            }

            // تحديد سبب الترشيح حسب اللغة
            let reason = "";
            const reasons = {
                ar: item.rating >= 4 ? "تقييم مرتفع من المستخدمين" : "سعر ممتاز مقارنة بالمواصفات",
                en: item.rating >= 4 ? "Highly rated by users" : "Great value for the price",
                fr: item.rating >= 4 ? "Très bien noté" : "Excellent rapport qualité-prix",
                tr: item.rating >= 4 ? "Yüksek puanlı" : "Fiyatına göre mükemmel",
                es: item.rating >= 4 ? "Muy valorado" : "Gran valor por el precio"
            };
            reason = reasons[currentLang] || reasons['en'];

            return {
                name: item.title,
                thumbnail: item.thumbnail,
                link: cleanLink,
                recommendation_reason: reason,
                features: item.price,
                rating: item.rating || 0
            };
        });

        const rankedProducts = smartRank(topProducts, brain);
      const explanation = generateSmartExplanation(
  brain,
  rankedProducts,
  currentLang
);
        // 3. رسالة تحليل الخبير
        const messages = {
            ar: `بناءً على بحثك عن "${query}"، وجدت أن هذه المنتجات هي الأفضل حالياً.`,
            en: `Based on your search for "${query}", these products are currently the best.`,
            fr: `Basé sur votre recherche "${query}", ces produits sont les meilleurs.`,
            tr: `"${query}" aramanıza göre en iyi seçenekler bunlardır.`,
            es: `Para "${query}", estos son los mejores productos.`
        };

        const analysisMsg = messages[currentLang] || messages['en'];

        // إرسال النتيجة النهائية
        res.json({
  intent: brain.intent,
  keywords: brain.keywords,
  explanation,
  products: rankedProducts
});
        
    } catch (error) {
        console.error("Server Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
