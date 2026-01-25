const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// المسار الجديد للتحليل الذكي والترشيح
app.post('/get-ai-advice', async (req, res) => {
    const { query, products, lang } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت خبير تسوق ذكي. حلل طلب المستخدم واستخرج: (الهدف، الأولويات، الميزانية).
                    يجب أن ترد بتنسيق JSON حصراً كالتالي:
                    {
                      "analysis": {
                        "intent": "شرح ماذا يريد المستخدم",
                        "why": "لماذا يحتاج هذه المواصفات",
                        "budget_status": "تحليل الميزانية"
                      },
                      "recommendations": [
                        {
                          "rank": "🥇 أفضل اختيار",
                          "name": "اسم المنتج الكامل",
                          "reason": "سبب الترشيح بدقة",
                          "pros": ["ميزة 1", "ميزة 2"],
                          "price": "السعر",
                          "image": "رابط الصورة",
                          "link": "رابط الشراء"
                        }
                      ]
                    }
                    اللغة المستخدمة: ${lang}.`
                },
                {
                    role: "user",
                    content: `طلب المستخدم: ${query}. قائمة المنتجات الخام: ${JSON.stringify(products)}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });

        const aiResult = JSON.parse(response.data.choices[0].message.content);
        res.json(aiResult);
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "حدث خطأ في تحليل البيانات" });
    }
});

// مسار البحث التقليدي (Search API) يظل كما هو لجلب البيانات الخام
app.get('/search', async (req, res) => {
    // كود البحث الخاص بك هنا (Serper أو Google)
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// إضافة مسار اختبار للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.send("Findly API is running perfectly! 🚀");
});

// تشغيل السيرفر على المنفذ المحدد
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});
