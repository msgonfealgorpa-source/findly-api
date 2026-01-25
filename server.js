const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
// تفعيل CORS للسماح للموقع بالاتصال بالسيرفر
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Findly API Active 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query, lang } = req.body;
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a shopping expert. Respond ONLY with a JSON object. 
                    Structure: {
                      "analysis": { "intent": "..", "priorities": "..", "budget_status": "..", "use_case": "..", "why": ".." },
                      "products": [ {"name": "..", "recommendation_reason": "..", "features": ".."} ]
                    }`
                },
                { role: "user", content: `User wants: ${query} in language: ${lang}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 50000 // زيادة وقت الانتظار لـ 50 ثانية
        });

        // إرسال البيانات كـ JSON صافي للمتصفح
        const result = JSON.parse(response.data.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "الذكاء الاصطناعي لم يستجب في الوقت المحدد" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
