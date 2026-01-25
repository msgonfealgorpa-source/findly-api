const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// السماح للاتصال من أي مكان (لحل مشاكل CORS نهائياً)
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Findly Server is READY and STRONG! 🚀");
});

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    // التأكد من وجود المفتاح
    if (!apiKey) {
        return res.status(500).json({ error: "المفتاح (API Key) غير موجود في السيرفر" });
    }

    try {
        console.log("Analyzing query:", query); // طباعة في سجلات السيرفر

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a shopping assistant. Return ONLY raw JSON without markdown formatting.
                    Structure:
                    {
                      "analysis": { "intent": "string", "priorities": "string", "budget_status": "string", "use_case": "string", "why": "string" },
                      "products": [ { "name": "string", "recommendation_reason": "string", "features": "string" } ]
                    }`
                },
                { role: "user", content: `User query: ${query}` }
            ]
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` },
            timeout: 60000 // انتظار دقيقة كاملة قبل الاستسلام
        });

        let rawContent = response.data.choices[0].message.content;

        // --- منطقة الإصلاح السحري ---
        // تنظيف الرد من علامات الكود التي تسبب المشاكل
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        // ---------------------------

        const aiData = JSON.parse(rawContent);
        res.json(aiData);

    } catch (error) {
        console.error("Server Error:", error.message);
        // إرسال تفاصيل الخطأ للمتصفح لكي تراه في هاتفك
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        res.status(500).json({ error: errorMessage });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
