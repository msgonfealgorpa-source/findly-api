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
                    content: `أنت خبير تسوق محترف. حلل طلب المستخدم وقدم رداً بصيغة JSON غني بالمعلومات.
                    يجب أن يحتوي الرد على تحليل كامل للنية والميزانية و3 منتجات حقيقية.
                    تجنب الردود الفارغة أو المختصرة.
                    
                    هيكل الرد المطلوب:
                    {
                      "analysis": {
                        "intent": "اكتب هنا نية المستخدم بناءً على طلبه",
                        "priorities": "اكتب الأولويات التقنية المناسبة له",
                        "budget_status": "قدر ميزانية الطلب (اقتصادية/متوسطة/رائدة)",
                        "use_case": "حدد طبيعة الاستخدام",
                        "why": "اكتب نصيحة خبير مفصلة للمستخدم"
                      },
                      "products": [
                        {
                          "name": "اسم المنتج الأول الحقيقي",
                          "recommendation_reason": "اشرح بدقة لماذا رشحت هذا المنتج للمستخدم",
                          "features": "اذكر المواصفات التقنية الجذابة"
                        },
                        {
                          "name": "اسم المنتج الثاني الحقيقي",
                          "recommendation_reason": "اشرح سبب الترشيح",
                          "features": "اذكر المميزات"
                        },
                        {
                          "name": "اسم المنتج الثالث الحقيقي",
                          "recommendation_reason": "اشرح سبب الترشيح",
                          "features": "اذكر المميزات"
                        }
                      ]
                    }`
                },
                { role: "user", content: `المستخدم يبحث عن: ${query}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const aiData = JSON.parse(response.data.choices[0].message.content);
        res.json(aiData);

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "تعذر التحليل حالياً" });
    }
});
