/* =========================================
   FINDLY SAGE ULTIMATE — CLEAN FINAL SERVER
   ========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const SageCore = require('./sage-core');

const app = express();

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'] }));
app.use(express.json());
app.use(express.static('public'));

/* ================= ENV ================= */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

/* ================= DB ================= */
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Mongo Connected'))
    .catch(e => console.log('❌ Mongo Error', e));
}

/* ================= CACHE ================= */
const searchCache = new Map();

/* ================= MODELS ================= */
const energySchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  searchesUsed: { type: Number, default: 0 },
  hasFreePass: { type: Boolean, default: false },
  freePassExpiresAt: { type: Date, default: null }
});
const Energy = mongoose.model('Energy', energySchema);

/* ================= HELPERS ================= */
function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g, '')) || 0;
}

function finalizeUrl(url) {
  if (!url) return '#';
  if (url.startsWith('//')) return 'https:' + url;
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
}

/* ================= ROOT ================= */
app.get('/', (_, res) => {
  res.send('🚀 Findly Server Running');
});

/* ================= SUBSCRIPTION STATUS ================= */
app.get('/subscription/status', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.json({ active: false });

  const energy = await Energy.findOne({ uid });
  res.json({
    active: energy?.hasFreePass === true,
    expiresAt: energy?.freePassExpiresAt || null
  });
});

/* ================= SEARCH ================= */
app.get('/search', async (req, res) => {
  try {
    const { q, uid = 'guest', lang = 'ar' } = req.query;
    if (!q) return res.json({ results: [] });

    /* ===== Energy Init ===== */
    let energy = await Energy.findOne({ uid });
    if (!energy) {
      energy = await Energy.create({ uid });
    }

    /* ===== Free Pass Expiry ===== */
    if (
      energy.hasFreePass &&
      energy.freePassExpiresAt &&
      Date.now() > energy.freePassExpiresAt.getTime()
    ) {
      energy.hasFreePass = false;
      energy.searchesUsed = 0;
      energy.freePassExpiresAt = null;
      await energy.save();
    }

    /* ===== Energy Limit ===== */
    if (!energy.hasFreePass && energy.searchesUsed >= 3) {
      return res.status(429).json({
        error: 'ENERGY_EMPTY',
        message: 'انتهت المحاولات المجانية'
      });
    }

    /* ===== Cache ===== */
    const cacheKey = `${q}_${lang}`;
    if (searchCache.has(cacheKey)) {
      return res.json(searchCache.get(cacheKey));
    }

    /* ================= SEARCH ================= */
  let rawResults = [];
  let serperContext = [];

  // ===== 1️⃣ SEARCHAPI (PRIMARY – PRODUCTS) =====
  try {
    const response = await axios.get(
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

    rawResults = response.data?.shopping_results || [];
  } catch (e) {
    console.error('❌ SearchAPI failed:', e.message);
  }

  // ===== 2️⃣ SERPER (SECONDARY – CONTEXT) =====
  if (rawResults.length > 0) {
    try {
      const serperRes = await axios.post(
        'https://google.serper.dev/search',
        { q, gl: 'us', hl: lang },
        {
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      serperContext = serperRes.data?.organic || [];
    } catch (e) {
      console.log('⚠️ Serper failed');
    }
  }

    /* ===== Normalize ===== */
    const results = rawResults.map(item => {
      const price = cleanPrice(item.price || item.extracted_price);
      const normalized = {
        title: item.title,
        price: item.price,
        numericPrice: price,
        link: finalizeUrl(item.product_link || item.link),
        thumbnail: item.thumbnail,
        source: 'Google Shopping'
      };

      const intelligence = SageCore(
        normalized,
        rawResults,
        context,
        {},
        uid,
        null
      ) || {};

      return {
        ...normalized,
        intelligence
      };
    });

    /* ===== Consume Energy ===== */
    if (!energy.hasFreePass) {
      energy.searchesUsed += 1;
      await energy.save();
    }

    const payload = {
      query: q,
      results,
      energy: {
        left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed)
      }
    };

    searchCache.set(cacheKey, payload);
    res.json(payload);

  } catch (e) {
    console.error(e);
    res.json({ results: [] });
  }
});

/* ================= AFFILIATE REDIRECT ================= */
app.get('/go', (req, res) => {
  const q = req.query.q || '';
  const AFF = 'LY20260129XmLf';

  const target =
    'https://ar.aliexpress.com/wholesale?SearchText=' +
    encodeURIComponent(q);

  const link =
    'https://s.click.aliexpress.com/deep_link.htm' +
    '?aff_fcid=' + AFF +
    '&aff_platform=api-new' +
    '&redirectUrl=' + encodeURIComponent(target);

  res.redirect(link);
});

/* ================= NOWPAYMENTS WEBHOOK ================= */
app.post(
  '/nowpayments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['x-nowpayments-sig'];
    const body = req.body.toString();

    const hash = crypto
      .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      .update(body)
      .digest('hex');

    if (sig !== hash) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const payment = JSON.parse(body);
    if (payment.payment_status === 'finished') {
      const uid = payment.order_id;
      let energy = await Energy.findOne({ uid });
      if (!energy) energy = await Energy.create({ uid });

      energy.hasFreePass = true;
      energy.searchesUsed = 0;
      energy.freePassExpiresAt = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 30
      );
      await energy.save();
    }

    res.json({ success: true });
  }
);

/* ================= START ================= */
app.listen(PORT, () => {
  console.log('🚀 Server running on', PORT);
});
