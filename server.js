import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// رسالة تأكيد عمل السيرفر
app.get("/", (req, res) => res.send("Findly API is Live and Running 🚀"));

app.get("/search", async (req, res) => {
  const query = req.query.q;
  const API_TOKEN = process.env.APIFY_API_TOKEN;
  const ACTOR_ID = process.env.APIFY_ACTOR_ID;

  if (!query) return res.status(400).json({ error: "اكتب كلمة بحث أولاً" });
  if (!API_TOKEN) return res.status(500).json({ error: "Token مفقود في إعدادات Render" });

  try {
    // 1. طلب تشغيل البوت للبحث عن الكلمة المطلوبة
    const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: query, maxItems: 15 })
    });

    const runData = await runRes.json();
    if (!runData?.data?.id) throw new Error("فشل تشغيل البوت");

    const runId = runData.data.id;

    // 2. الانتظار قليلاً حتى يجمع البوت النتائج (10 ثواني)
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 3. جلب النتائج النهائية من الـ Dataset
    const datasetUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`;
    const dataRes = await fetch(datasetUrl);
    const data = await dataRes.json();

    // 4. ترتيب البيانات لتعرض في موقعك بشكل جميل
    const results = Array.isArray(data) ? data.map(item => ({
      name: item.title || item.name || "منتج بدون اسم",
      price: item.price?.value || item.price || "غير متوفر",
      currency: item.price?.currency || "USD",
      image: item.imageUrl || item.thumbnail || "رابط_صورة_افتراضي",
      link: item.productUrl || item.url || "#",
      rating: item.rating || "4.5",
      source: "AliExpress"
    })) : [];

    res.json({ success: true, top: results });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء البحث" });
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
