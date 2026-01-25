const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Findly API is Online! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query, lang } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت خبير تسوق محترف. يجب أن يكون الرد بصيغة JSON حصراً. املأ البيانات التالية:
                    {
                      "analysis": { "intent": "...", "priorities": "...", "budget_status": "...", "use_case": "...", "why": "..." },
                      "products": [
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." }
                      ]
                    }`
                },
                { role: "user", content: `المستخدم يبحث عن: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        // استخراج النص وتحويله لكائن JSON
        const aiResponseText = response.data.choices[0].message.content;
        const aiData = JSON.parse(aiResponseText);

        // أهم سطر: إرسال البيانات كـ JSON حقيقي للمتصفح
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(aiData));

    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ error: "فشل في جلب البيانات" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
