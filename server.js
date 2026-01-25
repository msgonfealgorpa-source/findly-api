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
                    content: `أنت خبير تسوق محترف. حلل طلب المستخدم بعمق وقدم رداً بصيغة JSON.
                    يجب عليك ملء كافة الحقول التالية بتفاصيل دقيقة ومقنعة:
                    1. "analysis": اشرح نية المستخدم (intent)، الأولويات التي تهمة (priorities)، تقدير ميزانيته (budget_status)، وحالته (use_case). وفي حقل (why) اكتب نصيحة خبير شاملة.
                    2. "products": قدم قائمة بـ 3 منتجات حقيقية وموجودة في السوق حالياً.
                    لكل منتج، املأ (name) بالاسم الكامل، و(recommendation_reason) بشرح مفصل لماذا اخترته له، و(features) بذكر أهم المواصفات التقنية.
                    
                    الهيكل الإلزامي للرد:
                    {
                      "analysis": { "intent": "...", "priorities": "...", "budget_status": "...", "use_case": "...", "why": "..." },
                      "products": [
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." }
                      ]
                    }`
                },
                { role: "user", content: `المستخدم يسأل عن: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const aiData = JSON.parse(response.data.choices[0].message.content);
        res.json(aiData);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "تعذر تحليل البيانات حالياً" });
    }
});
