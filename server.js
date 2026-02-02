/************************************************
 * FINDLY SERVER – FINAL STABLE VERSION
 * Compatible 100% with Findly Frontend
 ************************************************/

const express = require('express');
const cors = require('cors');
const { getJson } = require('serpapi');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const SERP_API_KEY = process.env.SERPAPI_KEY;

// ================= SMART REASON ENGINE =================
function buildSmartReason(item, avgPrice, minPrice) {
  let reasons = [];

  if (item.priceNum && item.priceNum <= minPrice * 1.05)
    reasons.push('أحد أرخص الأسعار في السوق');

  if (item.rating >= 4.5)
    reasons.push('تقييم ممتاز من المستخدمين');

  if (item.reviews >= 100)
    reasons.push('عدد مراجعات كبير يزيد الثقة');

  if (reasons.length === 0)
    reasons.push('خيار متوازن مقارنة ببقية العروض');

  return reasons.join(' • ');
}

// ================= SEARCH ROUTE =================
app.get('/search', async (req, res) => {
  const { q, uid, lang = 'ar', market = 'us' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    getJson(
      {
        engine: 'google_shopping',
        q,
        api_key: SERP_API_KEY,
        gl: market,
        num: 10
      },
      (data) => {
        const items = data.shopping_results || [];

        // استخراج الأسعار
        const prices = items
          .map(i =>
            parseFloat(i.price?.toString().replace(/[^0-9.]/g, '')) || 0
          )
          .filter(p => p > 0);

        const avgPrice =
          prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
        const minPrice = prices.length ? Math.min(...prices) : 0;

        const results = items.map(item => {
          const priceNum =
            parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0;

          const rating = Number(item.rating || 0);
          const reviews = Number(item.reviews || 0);

          // 🔑 رابط شراء مضمون
          const buyLink =
            item.link ||
            item.product_link ||
            item.redirect_link ||
            '#';

          return {
            name: item.title || 'Unknown Product',
            price: item.price || 'N/A',
            thumbnail: item.thumbnail || '',
            link: buyLink,                 // ✅ هذا ما تفتحه الواجهة
            source: item.source || 'Unknown',
            rating,
            reviews,
            smartReason: buildSmartReason(
              { priceNum, rating, reviews },
              avgPrice,
              minPrice
            )
          };
        });

        res.json({
          query: q,
          avgPrice,
          minPrice,
          results
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ================= ROOT =================
app.get('/', (req, res) => {
  res.send('✅ Findly API is running successfully 🚀');
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Findly Server running on port ${PORT}`);
});
