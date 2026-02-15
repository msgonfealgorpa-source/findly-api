/* =========================================
FINDLY SERVER - COMPLETE WITH CHAT ENGINE
========================================= */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const SageCore = require('./sage-core');
const chatEngine = require('./chat.engine');
const { processChatMessage, supportedLanguages } = require('./chat.engine');

const app = express();

/* ================= BASIC ================= */
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.json());

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

const normalizeQuery = (q) =>
    q.trim().toLowerCase().replace(/\s+/g, ' ');

const pendingSearches = new Map();

/* ================= CHAT ENDPOINT ================= */
app.post('/chat', (req, res) => {
    try {
        const { message, userId } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.json({
                reply: '👋',
                error: 'empty_message'
            });
        }
        
        // معالجة الرسالة
        const result = processChatMessage(message, userId || 'guest');
        
        console.log(`💬 Chat: "${message.substring(0, 30)}..." -> Intent: ${result.intent}`);
        
        res.json({
            reply: result.reply,
            lang: result.lang,
            intent: result.intent,
            sentiment: result.sentiment
        });
        
    } catch (error) {
        console.error('Chat Error:', error);
        res.json({
            reply: '🔄 عذراً، حدث خطأ. حاول مرة أخرى.',
            error: 'internal_error'
        });
    }
});

/* ================= CHAT LANGUAGES ================= */
app.get('/chat/languages', (req, res) => {
    res.json({
        supported: supportedLanguages,
        total: Object.keys(supportedLanguages).length
    });
});

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
    const cacheKey = normalizeQuery(q) + "_" + lang;
    const cached = getCache(cacheKey);
    if (cached) {
        cached.energy.left = energy.hasFreePass
            ? '∞'
            : Math.max(0, 3 - energy.searchesUsed);
        return res.json(cached);
    }

    try {
        if (pendingSearches.has(cacheKey)) {
            const data = await pendingSearches.get(cacheKey);
            return res.json(data);
        }

        /* ===== SEARCH API ===== */
        const searchPromise = (async () => {
            const apiRes = await axios.get(
                'https://www.searchapi.io/api/v1/search',
                {
                    params: {
                        api_key: SEARCHAPI_KEY,
                        engine: 'google_shopping',
                        q,
                        hl: lang === 'ar' ? 'ar' : 'en',
                    }
                }
            );
            return apiRes;
        })();

        pendingSearches.set(cacheKey, searchPromise);

        let apiRes;
        try {
            apiRes = await searchPromise;
        } finally {
            pendingSearches.delete(cacheKey);
        }

        const rawResults = apiRes.data?.shopping_results?.slice(0, 5) || [];
        const filteredResults = rawResults.filter(item =>
            item.title?.toLowerCase().includes(q.toLowerCase())
        );

        const baseResults = filteredResults.length ? filteredResults : rawResults;

        const results = baseResults.map((item, index) => {
            const price = cleanPrice(item.price || item.extracted_price);
            const product = {
                title: item.title,
                price: item.price,
                numericPrice: price,
                link: finalizeUrl(item.product_link || item.link),
                thumbnail: item.thumbnail || item.product_image,
                source: 'Google Shopping'
            };

            let intelligence = {};

            if (index === 0) {
                intelligence = SageCore(
                    product,
                    rawResults,
                    [],
                    {},
                    uid,
                    null,
                    lang
                );
                console.log("FINAL VERDICT:", intelligence.finalVerdict);
            }

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
        console.error('❌ SEARCH ERROR FULL:', e.response?.data || e.message);
        res.json({ error: 'SEARCH_FAILED', results: [] });
    }
});

/* ================= CREATE PAYMENT ================= */
app.post('/create-payment', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'UID_REQUIRED' });
        }

        const response = await axios.post(
            'https://api.nowpayments.io/v1/invoice',
            {
                price_amount: 10,
                price_currency: 'usd',
                pay_currency: 'usdttrc20',
                order_id: uid,
                order_description: 'Findly Pro Subscription',
                success_url: 'https://findly.source.github.io/?upgrade=success',
                cancel_url: 'https://findly.source.github.io/?upgrade=cancel'
            },
            {
                headers: {
                    'x-api-key': process.env.NOWPAYMENTS_API_KEY,
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

/* ================= PAYMENTS WEBHOOK ================= */
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

/* ================= REDIRECT ================= */
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

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";
    const userId = req.body.userId || "guest";

    if (!message.trim()) {
      return res.json({ reply: "", error: "empty_message" });
    }

    const lang = chatEngine.detectLanguage(message);

    const { tokens, bigrams, trigrams } =
      chatEngine.tokenizeAdvanced(message);

    const sentiment =
      chatEngine.analyzeSentiment(tokens, message, lang);

    const entities =
      chatEngine.extractEntities(message);

    const context =
      chatEngine.memory.getContext(userId);

    const intent =
      chatEngine.detectIntentAdvanced(
        tokens,
        bigrams,
        trigrams,
        entities,
        context,
        lang
      );

    chatEngine.memory.addInteraction(
      userId,
      intent,
      entities,
      sentiment.mood,
      message,
      lang
    );

    const reply =
      chatEngine.buildSmartResponse(
        intent,
        sentiment,
        entities,
        context,
        message,
        lang
      );

    res.json({ reply });

  } catch (error) {
    console.error("Chat Error:", error);
    res.json({ reply: "", error: "internal_error" });
  }
});

/* ================= HEALTH CHECK ================= */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        chatLanguages: Object.keys(supportedLanguages).length
    });
});

/* ================= START ================= */
app.listen(PORT, () =>
    console.log(`🚀 Findly Server running on ${PORT}`)
);
