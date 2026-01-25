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
                    content: `أنت خبير تسوق ذكي جداً. مهمتك تحليل طلب المستخدم وتقديم أفضل 3 ترشيحات دقيقة.
                    يجب أن يكون الرد بتنسيق JSON حصراً بهذا الهيكل:
                    {
                      "analysis": { 
                        "intent": "استخرج نية المستخدم (مثال: شراء هاتف للألعاب)", 
                        "why": "شرح منطقي لسبب اختيار هذه المنتجات بناءً على طلب المستخدم",
                        "priorities": "الأولويات (مثل: الأداء، البطارية، السعر)",
                        "budget_status": "تقدير الميزانية (اقتصادية، متوسطة، رائدة)",
                        "use_case": "طريقة الاستخدام"
                      },
                      "products": [
                        {
                          "name": "اسم المنتج الأول بدقة",
                          "recommendation_reason": "لماذا هذا المنتج مثالي لهذا المستخدم؟",
                          "features": "أهم مميزتين تقنيتين"
                        },
                        {
                          "name": "اسم المنتج الثاني",
                          "recommendation_reason": "سبب الترشيح",
                          "features": "المميزات"
                        },
                        {
                          "name": "اسم المنتج الثالث",
                          "recommendation_reason": "سبب الترشيح",
                          "features": "المميزات"
                        }
                      ]
                    }`
                },
                { role: "user", content: `المستخدم يريد: ${query}. اللغة المطلوبة للرد: ${lang === 'en' ? 'English' : 'العربية'}` }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        // إرسال البيانات النهائية للموقع
        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        console.error("AI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "خطأ في تحليل العقل الذكي" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
