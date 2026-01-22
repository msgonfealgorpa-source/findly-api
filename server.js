import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Findly API is Live 🚀"));

app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    // 1️⃣ تشغيل Actor مع كلمة البحث
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${process.env.APIFY_ACTOR_ID}/runs?token=${process.env.APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: query,
          maxItems: 20
        })
      }
    );

    const runData = await runRes.json();

    if (!runData?.data?.id) {
      return res.status(500).json({ error: "Failed to start search actor" });
    }

    const runId = runData.data.id;

    // 2️⃣ انتظار اكتمال التشغيل
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 3️⃣ جلب النتائج
    const datasetUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${process.env.APIFY_API_TOKEN}`;

    const dataRes = await fetch(datasetUrl);
    const data = await dataRes.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Invalid search result" });
    }

    const results = data.map(item => ({
      name: item.title,
      price: item.price?.value || item.price || "—",
      currency: item.price?.currency || "USD",
      image: item.imageUrl || item.thumbnail || "",
      link: item.productUrl || item.url || "#",
      rating: item.rating || "4.5",
      source: "AliExpress"
    }));

    res.json({
      success: true,
      top: results
    });

  } catch (error) {
    console.error("Live search error:", error);
    res.status(500).json({ error: "Live search failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Findly API running on port ${PORT}`);
});
