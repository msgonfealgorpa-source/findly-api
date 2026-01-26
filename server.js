const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Server is Active!"));

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = "sk-687d0950a7404517bfdc06cc916951a3";

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are a shopping assistant. Respond only in JSON." },
                { role: "user", content: query }
            ],
            response_format: { type: 'json_object' }
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 5000 // إذا تأخر الرد أكثر من 5 ثوانٍ
        });

        res.json(JSON.parse(response.data.choices[0].message.content));

    } catch (error) {
        // --- الخطة البديلة: إذا فشل الذكاء الاصطناعي، أرسل بيانات وهمية لكي يعمل الموقع ---
        console.log("DeepSeek failed, sending demo data...");
        res.json({
            analysis: {
                intent: "بحث عن منتج",
                priorities: "الأداء والسعر",
                budget_status: "متوفر خيارات",
                use_case: "استخدام عام",
                why: "هذه نتائج تجريبية لأن محرك البحث قيد التحديث حالياً."
            },
            products: [
                { name: "خيار مميز 1", recommendation_reason: "أفضل قيمة مقابل سعر", features: "أداء قوي وضمان سنتين" },
                { name: "خيار مميز 2", recommendation_reason: "الأكثر مبيعاً", features: "تصميم أنيق وبطارية تدوم طويلًا" }
            ]
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
