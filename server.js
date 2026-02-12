/* =========================================
   FINDLY SERVER - CLEAN (KEYS ONLY)
   ========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const SageCore = require('./sage-core');

const app = express();

/* ================= BASIC ================= */
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());
// ================= CREATE PAYMENT =================

/* ================= ENV ================= */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
/* ================= CACHE (48H) ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 2;

const getCache = key => {
  const c = searchCache.get(key);
  if (!c) return null;
  if (Date.now() - c.time > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return c.data;
};

const setCache = (key, data) =>
  searchCache.set(key, { time: Date.now(), data });

/* ================= DB ================= */
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ DB Connected'))
  .catch(e => console.log('❌ DB Error', e.message));

const Energy = mongoose.model(
  'Energy',
  new mongoose.Schema({
    uid: { type: String, unique: true },
    searchesUsed: { type: Number, default: 0 },
    hasFreePass: { type: Boolean, default: false }
  })
);

/* ================= HELPERS ================= */
const cleanPrice = p =>
  parseFloat(String(p || '').replace(/[^0-9.]/g, '')) || 0;

const finalizeUrl = u => {
  if (!u) return '#';
  if (u.startsWith('//')) return 'https:' + u;
  if (!u.startsWith('http')) return 'https://' + u;
  return u;
};

/* ================= SEARCH ================= */
app.get('/search', async (req, res) => {
  const { q, lang = 'ar', uid = 'guest' } = req.query;
  if (!q) return res.json({ results: [] });

  /* ===== ENERGY ===== */
  let energy = await Energy.findOne({ uid });
  if (!energy) energy = await Energy.create({ uid });

  if (!energy.hasFreePass && energy.searchesUsed >= 3) {
    return res.status(429).json({ error: 'ENERGY_EMPTY' });
  }

  /* ===== CACHE ===== */
  const cacheKey = `${q}`;
  const cached = getCache(cacheKey);
  if (cached) {
    cached.energy.left = energy.hasFreePass
      ? '∞'
      : Math.max(0, 3 - energy.searchesUsed);
    return res.json(cached);
  }

  try {
    /* ===== SEARCH API ===== */
    const apiRes = await axios.get(
      'https://www.searchapi.io/api/v1/search',
      {
        params: {
          api_key: SEARCHAPI_KEY,
          engine: 'google_shopping',
          q,
          hl: lang === 'ar' ? 'ar' : 'en',
          gl: 'us'
        }
      }
    );

    const rawResults = apiRes.data?.shopping_results || [];

    let serperContext = [];
    if (rawResults.length < 3) {
      const serperRes = await axios.post(
        'https://google.serper.dev/search',
        { q, gl: 'us', hl: lang },
        { headers: { 'X-API-KEY': SERPER_API_KEY } }
      );
      serperContext = serperRes.data?.organic || [];
    }

    /* ===== ANALYSIS ===== */
    const results = rawResults.map(item => {
      const price = cleanPrice(item.price || item.extracted_price);

      const product = {
        title: item.title,
        price: item.price,
        numericPrice: price,
        link: finalizeUrl(item.product_link || item.link),
        thumbnail: item.thumbnail || item.product_image,
        source: 'Google Shopping'
      };

      // 🧠 SageCore (KEYS ONLY)
      const intelligence = SageCore(
         product,
        rawResults,
        serperContext,
        {},
        uid,
        null
      ) || {};

       console.log("FINAL VERDICT:", intelligence.finalVerdict);
      return {
        ...product,
        intelligence
      };
    });

    if (!energy.hasFreePass) {
      energy.searchesUsed += 1;
      await energy.save();
    }

    const responseData = {
      query: q,
      results,
      energy: {
        used: energy.searchesUsed,
        limit: energy.hasFreePass ? '∞' : 3,
        left: energy.hasFreePass
          ? '∞'
          : Math.max(0, 3 - energy.searchesUsed)
      }
    };

    setCache(cacheKey, responseData);
    res.json(responseData);

  } catch (e) {
    console.error('❌ SEARCH ERROR', e.message);
    res.json({ error: 'SEARCH_FAILED', results: [] });
  }
});


app.post('/create-payment', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'UID_REQUIRED' });
    }

    const baseAmount = 5; // سعر الاشتراك الحقيقي

    // 🔥 1️⃣ نجلب الحد الأدنى من NOWPayments
    const minRes = await axios.get(
      'https://api.nowpayments.io/v1/min-amount',
      {
        params: {
          currency_from: 'usd',
          currency_to: 'usdttrc20',
          amount: baseAmount
        },
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY
        }
      }
    );

    const minAmount = minRes.data.min_amount;

    // 🔥 2️⃣ نختار الأكبر بين السعر والحد الأدنى
    const finalAmount = Math.max(baseAmount, minAmount);

    // 🔥 3️⃣ إنشاء الفاتورة بالمبلغ الصحيح
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: finalAmount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: uid,
        order_description: 'Findly Pro Subscription',
        success_url: 'https://findly.source.github.io/?upgrade=success',
        cancel_url: 'https://findly.source.github.io/?upgrade=cancel'
      },
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({
      url: response.data.invoice_url
    });

  } catch (err) {
    console.error(
      '❌ NOWPayments create-payment error:',
      err.response?.data || err.message
    );
    return res.status(500).json({ error: 'PAYMENT_FAILED' });
  }
});

/* ================= PAYMENTS ================= */
app.post(
  '/nowpayments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['x-nowpayments-sig'];
    const payload = req.body.toString();

    const expected = crypto
      .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      .update(payload)
      .digest('hex');

    if (sig !== expected) {
      return res.status(403).json({ error: 'INVALID_SIGNATURE' });
    }

    const data = JSON.parse(payload);
    if (data.payment_status === 'finished') {
      const uid = data.order_id;
      let energy = await Energy.findOne({ uid });
      if (!energy) energy = await Energy.create({ uid });
      energy.hasFreePass = true;
      energy.searchesUsed = 0;
      await energy.save();
    }

    res.json({ success: true });
  }
);


app.get('/go', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("No URL provided");
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    if (!/^https?:\/\//i.test(decodedUrl)) {
      return res.status(400).send("Invalid URL");
    }

    return res.redirect(decodedUrl);

  } catch (err) {
    return res.status(500).send("Redirect error");
  }
});

/* ================= START ================= */
app.listen(PORT, () =>
  console.log(`🚀 Findly Server running on ${PORT}`)
);
