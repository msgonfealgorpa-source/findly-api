import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// الرابط الرئيسي للتأكد من عمل السيرفر
app.get("/", (req, res) => {
    res.send(`
        <div style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h1 style="color: #00b894;">🚀 Findly API is Live!</h1>
            <p>السيرفر يعمل بنجاح. يمكنك الآن استخدام ميزة البحث من موقعك.</p>
        </div>
    `);
});

app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    const ACTOR_ID = process.env.APIFY_ACTOR_ID;

    // 1. التحقق من المدخلات
    if (!searchQuery) {
        return res.status(400).json({ error: "الرجاء كتابة كلمة بحث في الرابط مثل ?q=iphone" });
    }

    if (!API_TOKEN || !ACTOR_ID) {
        return res.status(500).json({ 
            error: "إعدادات Apify ناقصة في Render",
            help: "تأكد من إضافة APIFY_API_TOKEN و APIFY_ACTOR_ID في قسم Environment في Render"
        });
    }

    try {
        console.log(`🔎 جاري تشغيل البوت للبحث عن: ${searchQuery}`);

        // 2. تشغيل البوت (التصحيح: استخدام رابط الـ acts الصحيح)
        const runUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${API_TOKEN}`;
        
        const runRes = await fetch(runUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                "query": searchQuery,
                "maxItems": 10,
                "page": 1
            })
        });

        const runData = await runRes.json();

        if (!runRes.ok) {
            console.error("❌ فشل Apify:", runData);
            return res.status(runRes.status).json({ 
                error: "فشل البوت في البدء", 
                details: runData.error?.message || "رابط الـ Actor أو التوكن غير صحيح" 
            });
        }

        const runId = runData.data.id;
        console.log(`✅ بدأ البوت! معرف العملية: ${runId}`);

        // 3. الانتظار (15 ثانية كافية لمعظم عمليات البحث البسيطة)
        console.log("⏳ انتظار استخراج البيانات...");
        await new Promise(resolve => setTimeout(resolve, 15000)); 

        // 4. جلب النتائج النهائية من الـ Dataset
        const datasetUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`;
        const dataRes = await fetch(datasetUrl);
        const resultsData = await dataRes.json();

        // 5. تنسيق النتائج النهائية لتناسب موقعك
        const finalResults = Array.isArray(resultsData) ? resultsData.map(item => ({
            name: item.title || item.name || "منتج بدون اسم",
            price: item.price || "غير متوفر",
            image: item.imageUrl || item.image || item.thumbnail || "https://via.placeholder.com/150",
            link: item.url || item.link || "#",
            source: "AliExpress"
        })) : [];

        console.log(`✨ تم جلب ${finalResults.length} نتيجة بنجاح.`);
        res.json({ success: true, top: finalResults });

    } catch (error) {
        console.error("🚨 خطأ فني مفاجئ:", error);
        res.status(500).json({ error: "حدث خطأ فني أثناء المعالجة", details: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
