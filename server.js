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
    const { query, products, lang } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `أنت خبير تسوق ذكي. حلل طلب المستخدم واستخرج: (الهدف، الأولويات، الميزانية). يجب أن ترد بتنسيق JSON حصراً. اللغة: ${lang}.`
                },
                {
                    role: "user",
                    content: `طلب المستخدم: ${query}. المنتجات: ${JSON.stringify(products)}`
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
        console.error("AI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "حدث خطأ في تحليل البيانات" });
    }
});

// 3. مسار البحث (تأكد من إضافة كود البحث الخاص بك هنا لاحقاً)
app.get('/search', async (req, res) => {
    res.json({ message: "Search endpoint is ready" });
});

// 4. تشغيل السيرفر (مرة واحدة فقط!)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
