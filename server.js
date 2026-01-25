const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Findly API is running perfectly! 🚀");
});

app.post('/get-ai-advice', async (req, res) => {
    const { query, lang } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت خبير تسوق محترف. يجب أن يكون الرد JSON تماماً. املأ البيانات التالية بدقة:
                    {
                      "analysis": {
                        "intent": "نية المستخدم",
                        "priorities": "الأولويات",
                        "budget_status": "الميزانية",
                        "use_case": "الاستخدام",
                        "why": "نصيحة الخبير"
                      },
                      "products": [
                        { "name": "منتج 1", "recommendation_reason": "سبب الترشيح", "features": "المميزات" },
                        { "name": "منتج 2", "recommendation_reason": "سبب الترشيح", "features": "المميزات" },
                        { "name": "منتج 3", "recommendation_reason": "سبب الترشيح", "features": "المميزات" }
                      ]
                    }`
                },
                { role: "user", content: `المستخدم يبحث عن: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        // هذا هو التعديل الجوهري والكامل (لا تقصه):
        const aiContent = JSON.parse(response.data.choices[0].message.content);
        res.json(aiContent);

    } catch (error) {
        console.error("AI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "فشل في تحليل البيانات الذكية" });
    }
});
