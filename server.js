const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. مسار اختبار للتأكد من أن السيرفر يعمل
app.get('/', (req, res) => {
    res.send("Findly API is running perfectly! 🚀");
});

// 2. مسار التحليل الذكي
app.post('/get-ai-advice', async (req, res) => {
    const { query, lang } = req.body; // نستقبل الطلب فقط
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت خبير تسوق. حلل طلب المستخدم وقدم نصيحة شرائية ذكية. 
                    يجب أن يكون الرد بتنسيق JSON:
                    {
                      "analysis": { "intent": "شرح النية", "why": "نصيحة تقنية" },
                      "recommendations": [] 
                    }`
                },
                { role: "user", content: `أريد شراء: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "خطأ في التحليل" });
    }
});
