app.post('/get-ai-advice', async (req, res) => {
    const { query, products } = req.body;
    const apiKey = process.env.GROQ_API_KEY; 

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile", 
            messages: [
                { 
                    role: "system", 
                    content: `أنت خبير تسوق تقني محترف ومستشار شراء ذكي. 
                    مهمتك: تحليل المنتجات المعروضة ومقارنتها بطلب المستخدم.
                    يجب أن يتضمن ردك:
                    1. تقييم سريع: هل السعر مناسب لهذا المنتج؟
                    2. نصيحة احترافية: ذكر ميزة تنافسية أو عيب يجب الحذر منه.
                    3. حكم نهائي: هل تنصح بالشراء الآن أم الانتظار؟
                    أسلوبك: تفاعلي، ممتع، وباللغة العربية الجذابة.` 
                },
                { 
                    role: "user", 
                    content: `المستخدم يبحث عن: "${query}". النتائج التي وجدناها: ${JSON.stringify(products)}` 
                }
            ],
            temperature: 0.7 // رفعنا درجة الإبداع قليلاً
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });

        res.json({ advice: response.data.choices[0].message.content });
    } catch (error) {
        res.json({ advice: "يبدو أنني بحاجة لبعض الوقت لتحليل هذه الصفقة المميزة، ألقِ نظرة على العروض بالأسفل!" });
    }
});
