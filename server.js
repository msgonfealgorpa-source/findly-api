/* =========================================
   FINDLY SAGE ULTIMATE - MULTI-LANG SERVER
   ========================================= */

const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// إضافة ملفات Static (للخصوصية ومن نحن) - اختياري إذا كنت رفعت مجلد public
app.use(express.static('public'));

/* ================= ENV VARIABLES ================= */
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
    buy: "Bonne Affaire", wait: "Attendez", fair: "Prix Juste",
    reason_cheap: "Moins cher que la moyenne de",
    reason_expensive: "Prix supérieur au marché",
    reason_fair: "Prix stable actuellement",
    analysis: "Analyse Intel", loading: "Analyse..."
  },
  de: {
    buy: "Gutes Geschäft", wait: "Warten", fair: "Fairer Preis",
    reason_cheap: "Unter dem Marktdurchschnitt um",
    reason_expensive: "Preis über dem Markt",
    reason_fair: "Preis ist stabil",
    analysis: "Smarte Analyse", loading: "Analyse..."
  },
  es: {
    buy: "Buena Oferta", wait: "Espera", fair: "Precio Justo",
    reason_cheap: "Bajo el promedio por",
    reason_expensive: "Precio sobre el mercado",
    reason_fair: "Precio estable ahora",
    analysis: "Análisis Intel", loading: "Analizando..."
  },
  tr: {
    buy: "Harika Fırsat", wait: "Bekle", fair: "Adil Fiyat",
    reason_cheap: "Piyasa ortalamasının altında:",
    reason_expensive: "Fiyat piyasanın üzerinde",
    reason_fair: "Fiyat şu an istikrarlı",
    analysis: "Akıllı Analiz", loading: "Analiz ediliyor..."
  }
};

/* ================= SCRAPING EBAY ================= */
async function scrapeEbay(q) {
  await wait();
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(data);
  const items = [];

  $(".s-item").each((i, el) => {
    if (i >= 8) return;

    const title = $(el).find(".s-item__title").text();
    const price = $(el).find(".s-item__price").text();
    const link = $(el).find(".s-item__link").attr("href");
    const img = $(el).find("img").attr("src");

    const numericPrice = cleanPrice(price);

    if (title && numericPrice > 0) {
      items.push({
        title,
        name: title,
        price,
        numericPrice,
        link,
        thumbnail: img,
        source: "eBay"
      });
    }
  });

  return items;
}


/* ================= SCRAPING ALIBABA ================= */
async function scrapeAlibaba(q) {
  await wait();
  const url = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(data);
  const items = [];

  $(".list-no-v2-outter").each((i, el) => {
    if (i >= 8) return;

    const title = $(el).find("h2").text().trim();
    const price = $(el).find(".elements-offer-price-normal__price").text();
    const link = $(el).find("a").attr("href");
    const img = $(el).find("img").attr("src");

    const numericPrice = cleanPrice(price);

    if (title && numericPrice > 0) {
      items.push({
        title,
        name: title,
        price,
        numericPrice,
        link: finalizeUrl(link),
        thumbnail: img,
        source: "Alibaba"
      });
    }
  });

  return items;
}





/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('/url') || u.startsWith('/shopping')) return 'https://www.google.com' + u;
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
}

function cleanPrice(p) {
  return parseFloat(p?.toString().replace(/[^0-9.]/g,'')) || 0;
}

function generateCoupons(item, intelligence) {
  const coupons = [];
  if (!item || !intelligence) return coupons;

  const valueIntel = intelligence.valueIntel || {};
  const priceIntel = intelligence.priceIntel || {};
  const score = Number(valueIntel.score) || 0;
  const avg = Number(priceIntel.average) || 0;
  const price = typeof item.numericPrice === 'number' ? item.numericPrice : 0;

  if (price <= 0) return coupons;

  if (score >= 80) {
    coupons.push({ code: 'SMART10', type: 'percent', discount: 10, reason: 'High value deal' });
  }
  if (avg > 0 && price > (avg * 1.05)) {
    coupons.push({ code: 'SAVE25', type: 'fixed', discount: 25, reason: 'Above market price' });
  }
  return coupons;
}

/* ================= DB MODELS ================= */
const alertSchema = new mongoose.Schema({
  email: String, productName: String, targetPrice: Number, currentPrice: Number, productLink: String, uid: String, createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String, title: String, price: Number, link: String, thumbnail: String, addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(e => console.log("❌ DB Error:", e));
}


/* ================= SCRAPING SAFETY ================= */
const cache = new Map();
let lastCall = 0;

async function wait(ms = 3000) {
  const now = Date.now();
  if (now - lastCall < ms) {
    await new Promise(r => setTimeout(r, ms));
  }
  lastCall = Date.now();
}

/* ================= ROUTES ================= */

// 1. ✅ المسار الرئيسي (يحل مشكلة Cannot GET /)
app.get('/', (req, res) => {
  res.send('✅ Findly Server is Running Live! Use /search endpoint.');
});

// 2. محرك البحث
app.get('/search', async (req, res) => {
  const { q, lang = 'ar', uid = 'guest' } = req.query;
  const selectedLang = DICT[lang] ? lang : 'ar';
  const TEXTS = DICT[selectedLang];

  if (!q) return res.json({ results: [] });

  try {
    // التحقق من وجود المفتاح قبل الطلب


     // ===== SMART SOURCE SWITCH =====
let amazonItems = [];

try {
  if (!X_RAPIDAPI_KEY) throw new Error("No RapidAPI Key");

  const response = await axios.request({
    method: 'GET',
    url: `https://${X_RAPIDAPI_HOST}/search`,
    params: { query: q, country: 'US', category_id: 'aps' },
    headers: {
      'x-rapidapi-key': X_RAPIDAPI_KEY,
      'x-rapidapi-host': X_RAPIDAPI_HOST
    }
  });

  amazonItems = response.data?.data?.products || [];
} catch (apiErr) {
  console.warn("⚠️ RapidAPI failed, switching to Scraping...");

  const ebay = await scrapeEbay(q);
  const alibaba = await scrapeAlibaba(q);

  amazonItems = [...ebay, ...alibaba];
}
     
    const results = [];

    for (const item of amazonItems) {
      const currentPrice = cleanPrice(item.product_price);

      const standardizedItem = {
        name: item.product_title,
        title: item.product_title,
        price: item.product_price,
        numericPrice: currentPrice,
        link: finalizeUrl(item.product_url),
        thumbnail: item.product_photo,
        source: 'Amazon'
      };

      const intelligenceRaw = SageCore(
        standardizedItem,
        amazonItems,
        {}, 
        {},
        uid,
        null
      );

      let decisionTitle = TEXTS.fair;
      let decisionReason = TEXTS.reason_fair;
      let decisionEmoji = '⚖️';

      const avg = Number(intelligenceRaw?.priceIntel?.average || 0);
      const score = intelligenceRaw?.valueIntel?.score || 0;

      if (avg > 0) {
        if (currentPrice > avg * 1.1) {
          decisionTitle = TEXTS.wait;
          decisionReason = TEXTS.reason_expensive;
          decisionEmoji = '🤖';
        } else if (currentPrice < avg * 0.95) {
          decisionTitle = TEXTS.buy;
          decisionReason = `${TEXTS.reason_cheap} ${score}%`;
          decisionEmoji = '🟢';
        }
      }

      const intelligence = {
        finalVerdict: { emoji: decisionEmoji, title: decisionTitle, reason: decisionReason },
        priceIntel: intelligenceRaw.priceIntel,
        valueIntel: intelligenceRaw.valueIntel,
        forecastIntel: intelligenceRaw.forecastIntel,
        trustIntel: intelligenceRaw.trustIntel
      };

      const comparison = {
        market_average: intelligence.priceIntel.average ? `$${intelligence.priceIntel.average}` : '—',
        savings_percentage: intelligence.valueIntel.score || 0,
        competitors: intelligence.valueIntel.competitors || amazonItems.length
      };

      const coupons = generateCoupons(standardizedItem, intelligence);

      results.push({
        ...standardizedItem,
        intelligence,
        comparison,
        coupons
      });
    }

    res.json({ query: q, results });

  } catch (err) {
    // طباعة تفاصيل الخطأ في السجلات لنعرف السبب
    console.error('❌ Search Error Details:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Search Failed', details: err.message });
  }
});

// باقي المسارات كما هي
app.post('/alerts', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      await new Alert(req.body).save(); 
      res.json({ success: true }); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/watchlist', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      await new Watchlist(req.body).save(); 
      res.json({ success: true }); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/watchlist/:uid', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { 
      const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 }); 
      res.json(list); 
    } else { 
      res.status(503).json({ error: 'DB Offline' }); 
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ================= START SERVER ================= */
const PORT_FINAL = PORT || 3000;
app.listen(PORT_FINAL, () => {
  console.log(`🚀 Findly Server running on port ${PORT_FINAL}`);
});
