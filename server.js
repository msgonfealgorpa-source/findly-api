const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Findly API is running! 🚀");
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
                    content: `أنت خبير تسوق محترف. يجب أن يكون الرد JSON نظيفاً تماماً. املأ الحقول: analysis (intent, priorities, budget_status, use_case, why) و products (name, recommendation_reason, features).`
                },
                { role: "user", content: `المستخدم يبحث عن: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        // التعديل الذي سينقذ السيرفر (داخل الـ try)
        const aiContent = JSON.parse(response.data.choices[0].message.content);
        res.json(aiContent);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "فشل في التحليل" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
