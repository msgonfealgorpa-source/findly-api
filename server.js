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
                    content: `أنت خبير تسوق. حلل طلب المستخدم واستخرج النية، الأولويات، والميزانية.
                    يجب أن يكون الرد بتنسيق JSON حصراً بهذا الهيكل تماماً:
                    {
                      "analysis": { 
                        "intent": "النية هنا", 
                        "priorities": "الأولويات هنا", 
                        "budget_status": "الميزانية هنا",
                        "use_case": "الحالة هنا",
                        "why": "شرح عام للنصيحة"
                      },
                      "products": [
                        {
                          "name": "اسم المنتج",
                          "recommendation_reason": "سبب الترشيح",
                          "features": "المميزات"
                        }
                      ]
                    }`
                },
                { role: "user", content: `الطلب: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const aiResponse = JSON.parse(response.data.choices[0].message.content);
        res.json(aiResponse);
    } catch (error) {
        console.error("Error with AI:", error);
        res.status(500).json({ error: "خطأ في تحليل البيانات" });
    }
});
