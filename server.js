const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// إعدادات الوصول (CORS) لضمان عمله على الهاتف والموقع
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Findly System is Online & Ready! 🚀");
});

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. التأكد من وجود المفتاح
    if (!apiKey) {
        return res.status(500).json({ error: "API Key مفقود في إعدادات ريندر" });
    }

    try {
        console.log("Processing query:", query);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `أنت خبير تسوق محترف. حلل طلب المستخدم وقدم رداً بصيغة JSON حصراً.
                    المطلوب:
                    {
                      "analysis": { "intent": "string", "priorities": "string", "budget_status": "string", "use_case": "string", "why": "string" },
                      "products": [ { "name": "string", "recommendation_reason": "string", "features": "string" } ]
                    }
                    طلب المستخدم: ${query}`
                }]
            }],
            generationConfig: { response_mime_type: "application/json" }
        });

        // 2. استخراج النص وتنظيفه من أي زوائد
        let rawText = response.data.candidates[0].content.parts[0].text;
        
        // البحث عن أول { وآخر } لضمان الحصول على JSON صافي
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const cleanJson = rawText.substring(start, end);

        // 3. تحويل النص إلى JSON وإرساله للمتصفح
        const aiData = JSON.parse(cleanJson);
        res.status(200).json(aiData);

    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ 
            error: "فشل في معالجة البيانات من المصدر", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
