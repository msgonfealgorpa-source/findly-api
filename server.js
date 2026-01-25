const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// السماح بالاتصال من أي مصدر لضمان عمله على هاتفك
app.use(cors({ origin: '*' }));
app.use(express.json());

// اختبار سريع للتأكد أن السيرفر يعمل
app.get('/', (req, res) => res.send("Findly API is LIVE and Running! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key مفقود في إعدادات ريندر" });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `أنت مساعد تسوق ذكي. قدم رداً بصيغة JSON حصراً بدون أي نصوص إضافية.
                    الهيكل المطلوب:
                    {
                      "analysis": { "intent": "string", "priorities": "string", "budget_status": "string", "use_case": "string", "why": "string" },
                      "products": [ { "name": "string", "recommendation_reason": "string", "features": "string" } ]
                    }
                    طلب المستخدم: ${query}`
                }]
            }],
            generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.7
            }
        });

        // استلام الرد الخام
        let rawText = response.data.candidates[0].content.parts[0].text;
        
        // --- المعالج السحري ---
        // البحث عن أول { وآخر } لقص أي نصوص زائدة قد يضيفها Gemini
        const startBracket = rawText.indexOf('{');
        const endBracket = rawText.lastIndexOf('}') + 1;
        
        if (startBracket === -1) {
            throw new Error("الذكاء الاصطناعي لم يرسل بيانات صحيحة");
        }

        const cleanJson = rawText.substring(startBracket, endBracket);
        const finalData = JSON.parse(cleanJson);

        res.status(200).json(finalData);

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ 
            error: "عذراً، حدث خطأ في تحليل البيانات", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
