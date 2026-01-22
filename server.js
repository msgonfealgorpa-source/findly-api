import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// رسالة تأكيد عمل السيرفر عند فتح الرابط الرئيسي
app.get("/", (req, res) => res.send("Findly API is Live and Running 🚀"));

app.get("/search", async (req, res) => {
  const query = req.query.q;
  const API_TOKEN = process.env.APIFY_API_TOKEN;
  const ACTOR_ID = process.env.APIFY_ACTOR_ID;

  if (!query) return res.status(400).json({ error: "اكتب كلمة بحث أولاً" });
  
  // التحقق من وجود المفاتيح في إعدادات Render
  if (!API_TOKEN || !ACTOR_ID) {
    console.error("❌ خطأ: المتغيرات APIFY_API_TOKEN أو APIFY_ACTOR_ID غير موجودة في إعدادات Render");
    return res.status(500).json({ error: "الإعدادات ناقصة في سيرفر Render" });
  }

  try {
    console.log(`🔎 جاري البحث عن: ${query}...`);

    // 1. طلب تشغيل البوت (Actor)
    const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        search: query, 
        maxItems: 15,
        // تأكد أن هذه الحقول هي ما يتوقعه البوت الخاص بك
        queries: [query] 
      })
    });

    const runData = await runRes.json();

    // إذا فشل تشغيل البوت، سنطبع السبب الحقيقي في الـ Logs
    if (!runRes.ok) {
      console.error("❌ فشل Apify في التشغيل:", runData);
      throw new Error(`Apify Error: ${runData.error?.message || "Unknown error"}`);
    }

    const runId = runData.data.id;
    console.log(`✅ بدأ البوت بالعمل. رقم العملية: ${runId}`);

    // 2. الانتظار لمدة 15 ثانية ليعطي البوت وقتاً كافياً للبحث
    console.log("⏳ انتظار النتائج من Apify...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 3. جلب النتائج النهائية
    const datasetUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`;
    const dataRes = await fetch(datasetUrl);
    const data = await dataRes.json();

    if (!Array.isArray(data)) {
        console.error("❌ النتائج المستلمة ليست مصفوفة:", data);
        return res.json({ success: true, top: [] });
    }

    // 4. ترتيب البيانات بشكل منظم
    const results = data.map(item => ({
      name: item.title || item.name || "منتج بدون اسم",
      price: item.price?.value || item.price || "غير متوفر",
      currency: item.price?.currency || "USD",
      image: item.imageUrl || item.thumbnail || "https://via.placeholder.com/150",
      link: item.productUrl || item.url || "#",
      rating: item.rating || "4.5",
      source: "AliExpress"
    }));

    console.log(`✨ تم العثور على ${results.length} نتيجة.`);
    res.json({ success: true, top: results });

  } catch (error) {
    console.error("🚨 خطأ برمجـي:", error.message);
    res.status(500).json({ 
        error: "حدث خطأ أثناء البحث", 
        details: error.message 
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
