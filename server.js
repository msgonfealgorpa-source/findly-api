/* =========================================
   FINDLY SAGE ULTIMATE - MULTI-LANG SERVER
   ========================================= */

const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

/* ================= ENV VARIABLES ================= */
// الإعدادات الأصلية التي وضعتها أنت في ريندر
const { MONGO_URI, X_RAPIDAPI_KEY, PORT } = process.env;
const X_RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";

/* ================= TRANSLATION DICTIONARY ================= */
const DICT = {
  ar: {
    buy: "صفقة ممتازة", wait: "انتظر", fair: "سعر عادل",
    reason_cheap: "أقل من متوسط السوق بـ",
    reason_expensive: "السعر أعلى من السوق",
    reason_fair: "السعر مستقر حالياً",
    analysis: "تحليل ذكي", loading: "جاري التحليل..."
  },
  en: {
    buy: "Great Deal", wait: "Wait", fair: "Fair Price",
    reason_cheap: "Below market average by",
    reason_expensive: "Price is above market",
    reason_fair: "Price is stable now",
    analysis: "Smart Analysis", loading: "Analyzing..."
  },
  fr: {
    buy: "Bonne Affaire", wait: "Attendre", fair: "Prix Juste",
    reason_cheap: "Moins que la moyenne de",
    reason_expensive: "Prix au-dessus du marché",
    reason_fair: "Le prix est stable",
    analysis: "Analyse Intelligente", loading: "Analyse..."
  }
};

/* ================= SEARCH ENDPOINT ================= */
app.get('/search', async (req, res) => {
  const { q, lang, uid } = req.query;
  const T = DICT[lang] || DICT.en;

  try {
    // استخدام منطق الاتصال الأصلي الخاص بك بـ RapidAPI
    const response = await axios.get(`https://${X_RAPIDAPI_HOST}/search`, {
      params: { 
        query: q, 
        country: lang === 'ar' ? 'SA' : 'US',
        category_id: 'aps'
      },
      headers: {
        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': X_RAPIDAPI_HOST
      }
    });

    const products = response.data.data.products || [];
    
    // استخدام "عقل" المشروع SageCore الخاص بك للتحليل
    const results = products.map(p => {
      // استدعاء دالة التحليل من ملفك sage-core.js
      const analysis = SageCore.analyze(p, lang); 

      return {
        title: p.product_title,
        price: p.product_price || "N/A",
        thumbnail: p.product_photo,
        link: p.product_url,
        source: "Amazon",
        intelligence: {
          finalVerdict: analysis.verdict,
          priceIntel: analysis.priceStats,
          valueIntel: analysis.valueScore,
          forecastIntel: analysis.prediction,
          trustIntel: analysis.trustScore
        },
        comparison: [], 
        coupons: []     
      };
    });

    res.json({ query: q, results });

  } catch (err) {
    console.error('❌ Search Error:', err.message);
    res.status(500).json({ error: 'Search Failed', results: [] });
  }
});

/* ================= DATABASE & START ================= */
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ DB Connected"))
        .catch(e => console.error("❌ DB Error:", e));
}

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server running on port ${PORT || 3000}`);
});
