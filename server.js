const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// لجعل الصفحة البيضاء تختفي وتظهر رسالة نجاح
app.get('/', (req, res) => res.send("Findly API is Online!"));

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: `أجب بصيغة JSON فقط لهذا الطلب: "${query}". الهيكل: {"analysis": {"intent": "..", "priorities": "..", "budget_status": "..", "use_case": "..", "why": ".."}, "products": [{"name": "..", "recommendation_reason": "..", "features": ".."}]}` }] }]
        });

        let text = response.data.candidates[0].content.parts[0].text;
        // استخراج الـ JSON فقط لضمان عدم حدوث خطأ "فشل التحليل"
        const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        
        // إرسال البيانات بالهيكل الذي ينتظره ملف الـ HTML الخاص بك
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "فشل في معالجة البيانات من المصدر" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready'));
