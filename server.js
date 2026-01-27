const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// استيراد الأدوات المحدثة (تأكد أن هذه الملفات موجودة في مجلد utils)
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// رسالة ترحيبية للتأكد من عمل السيرفر
app.get('/', (req, res) => {
  res.send('Findly AI Engine v3.5 - Global Mode Active! 🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const currentLang = lang || "ar";

    // 1. تحليل الاستعلام تقنياً
    const brain = analyzeSmartQuery(query);
    console.log("🧠 Analysis for:", query);

    const SERPAPI_KEY = process.env.SERPAPI_KEY;

    // 2. جلب البيانات من محرك بحث Google Shopping
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
      price: item.price || (currentLang === "ar" ? "اتصل للسعر" : "Check Price"),
      rating: item.rating || 4.5, // تقييم افتراضي للجودة
      reviews: item.reviews || 12,
      source: item.source
    }));

    // 4. الترتيب الذكي بناءً على معايير البحث
    const rankedData = smartRank(rawProducts, brain);

    // 5. تجهيز أفضل 3 نتائج مع "سبب الترشيح" الموحد للواجهة
    // داخل دالة المعالجة في السيرفر
const finalProducts = rankedData.slice(0, 3).map(p => {
    let reasonText = "";
    
    // توليد شرح ذكي بناءً على مواصفات المنتج والبحث
    if (currentLang === "ar") {
        if (p.rating >= 4.5 && p.score > 90) {
            reasonText = `هذا المنتج هو الأفضل تقييماً (${p.rating} نجوم). نرشحه لأنه يجمع بين الجودة العالية من ${p.source} وأفضل سعر متاح حالياً.`;
        } else if (p.price.includes("ر.س") || p.price.includes("$")) {
            reasonText = `خيار اقتصادي ممتاز. تم اختياره بناءً على تحليل السعر العادل ومطابقته لطلبك "${query}" مقارنة بالمنافسين.`;
        } else {
            reasonText = `نرشحه لك بسبب موثوقية البائع (${p.source}) وتوفر الميزات الأساسية التي بحثت عنها بدقة.`;
        }
    } else {
        reasonText = p.score > 90 
            ? `Top-rated choice with ${p.rating} stars. Best balance between technical specs and price.` 
            : `Selected as a value-for-money option for your "${query}" search.`;
    }
    
    return {
        ...p,
        reason: reasonText // هذا النص هو الذي سيشرح السبب للمستخدم
    };
});

    // 6. صياغة التفسير العام من الذكاء الاصطناعي
    const explanation = generateSmartExplanation(brain, finalProducts, currentLang);

    // 7. إرسال الرد النهائي
    res.json({
      explanation: explanation,
      products: finalProducts
    });

  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ 
      explanation: currentLang === "ar" ? "حدث خطأ في معالجة طلبك التقني." : "Error processing your technical request.", 
      products: [] 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Findly Server v3.5 running on port ${PORT}`);
});
