/* =========================================
   FINDLY SAGE ULTIMATE - FULL FIXED SERVER
   ========================================= */

const SageCore = require('./sage-core');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();

/* ================= ENV ================= */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

/* ================= CACHE ================= */
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 30;

/* ================= WEBHOOK (MUST BE BEFORE JSON) ================= */
app.post(
  '/nowpayments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      if (!NOWPAYMENTS_IPN_SECRET) {
        return res.status(500).json({ error: 'IPN_SECRET_NOT_SET' });
      }

      const signature = req.headers['x-nowpayments-sig'];
      const payload = req.body.toString();

      const expected = crypto
        .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== expected) {
        return res.status(403).json({ error: 'INVALID_SIGNATURE' });
      }

      const payment = JSON.parse(payload);

      if (payment.payment_status === 'finished') {
        const uid = payment.order_id;
        let energy = await Energy.findOne({ uid });
        if (!energy) energy = await Energy.create({ uid });

        energy.hasFreePass = true;
        energy.searchesUsed = 0;
        await energy.save();
      }

      res.json({ success: true });
    } catch (e) {
      console.error('Webhook error', e.message);
      res.status(500).json({ error: 'WEBHOOK_FAILED' });
    }
  }
);

/* ================= BASIC SETUP ================= */
app.use(cors({ origin: '*', methods: ['GET','POST'] }));
app.use(express.json());
app.use(express.static('public'));

/* ================= DB ================= */
const alertSchema = new mongoose.Schema({
  email: String,
  productName: String,
  targetPrice: Number,
  currentPrice: Number,
  productLink: String,
  uid: String,
  createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const watchlistSchema = new mongoose.Schema({
  uid: String,
  title: String,
  price: Number,
  link: String,
  thumbnail: String,
  addedAt: { type: Date, default: Date.now }
});
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

const energySchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  searchesUsed: { type: Number, default: 0 },
  hasFreePass: { type: Boolean, default: false },
  lastReset: { type: Date, default: Date.now }
});
const Energy = mongoose.model('Energy', energySchema);

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ DB Connected'))
    .catch(e => console.error('❌ DB Error', e));
}

/* ================= HELPERS ================= */
function finalizeUrl(url) {
  if (!url) return '#';
  if (url.startsWith('//')) return 'https:' + url;
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
}

function cleanPrice(p) {
  if (!p) return 0;
  return parseFloat(p.toString().replace(/[^0-9.]/g,'')) || 0;
}

/* ================= SEARCH ================= */
app.get('/search', async (req, res) => {
  try {
    const { q, lang = 'ar', uid = 'guest' } = req.query;
    if (!q) return res.json({ results: [] });

    let energy = await Energy.findOne({ uid });
    if (!energy) {
      energy = await Energy.create({ uid });
    }

    if (!energy.hasFreePass && energy.searchesUsed >= 3) {
      return res.status(429).json({
        error: 'ENERGY_EMPTY',
        message: 'تم استهلاك طاقة العقل المجانية 🧠'
      });
    }

    const cacheKey = `${q}_${lang}`;
    if (searchCache.has(cacheKey)) {
      return res.json(searchCache.get(cacheKey).data);
    }

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

    const rawResults = response.data?.shopping_results || [];

    const results = rawResults.map(item => {
      const price = cleanPrice(item.price || item.extracted_price);

      const standardized = {
        title: item.title,
        price: item.price,
        numericPrice: price,
        link: finalizeUrl(item.product_link || item.link),
        thumbnail: item.thumbnail || item.product_image
      };

      const intelligenceRaw = SageCore(
        standardized,
        rawResults,
        [],
        {},
        uid,
        null
      ) || {};

      return {
        ...standardized,
        intelligence: intelligenceRaw
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
        left: energy.hasFreePass ? '∞' : Math.max(0, 3 - energy.searchesUsed)
      }
    };

    searchCache.set(cacheKey, {
      time: Date.now(),
      data: responseData
    });

    res.json(responseData);

  } catch (err) {
    console.error('SEARCH ERROR', err.message);
    res.status(500).json({ error: 'SEARCH_FAILED' });
  }
});

/* ================= ALERTS ================= */
app.post('/alerts', async (req, res) => {
  try {
    await new Alert(req.body).save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= WATCHLIST ================= */
app.post('/watchlist', async (req, res) => {
  try {
    await new Watchlist(req.body).save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/watchlist/:uid', async (req, res) => {
  try {
    const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Findly Server running on port ${PORT}`);
});
