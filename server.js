import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Render يفرض استخدام Port 10000 غالباً، لذا نتركها ديناميكية
const PORT = process.env.PORT || 10000; 

app.use(cors());
app.use(express.json());

// مسار تجريبي للتأكد أن السيرفر يعمل عند فتحه في المتصفح
app.get("/", (req, res) => res.send("Findly API is Live!"));

// Endpoint للبحث - تم تعديله ليتوافق مع نداء المتصفح
app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    // التأكد من جلب البيانات من Apify بشكل صحيح
    
const url = `https://api.apify.com/v2/actor-runs/${process.env.APIFY_RUN_ID}/dataset/items?token=${process.env.APIFY_API_TOKEN}&clean=true`;
    const json = await response.json();
const data = json.items || [];

if (!Array.isArray(data)) {
  return res.status(500).json({ error: "No products found" });
}

    // فلترة المنتجات بناءً على كلمة البحث
    const results = data
      .filter(item =>
        item.title?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map(item => ({
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
      top: results // نرسل النتائج تحت اسم top لتتوافق مع الفرونت-إند
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Findly API running on port ${PORT}`);
});
