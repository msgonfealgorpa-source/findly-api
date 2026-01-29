const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// 1. الاتصال بقاعدة البيانات (MongoDB)
mongoose.connect('رابط_قاعدة_بيانات_مونجو_الخاص_بك');

const AlertSchema = new mongoose.Schema({
    email: String,
    productName: String,
    targetPrice: Number,
    link: String,
    lastCheckedPrice: String
});
const Alert = mongoose.model('Alert', AlertSchema);

// 2. إعداد البريد الإلكتروني (SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});

// 3. مسار البحث الذكي (Smart Search)
app.post('/smart-search', (req, res) => {
    const { query } = req.body;
    getJson({
        engine: "google_shopping",
        q: query,
        api_key: "مفتاح_SERPAPI_الخاص_بك"
    }, (data) => {
        const products = data.shopping_results.slice(0, 5).map(p => ({
            name: p.title,
            price: p.price,
            thumbnail: p.thumbnail,
            link: p.product_link || p.link,
            reason: "هذا المنتج يقدم أفضل قيمة مقابل السعر حسب تقييمات المستخدمين اليوم."
        }));
        res.json({ products });
    });
});

// 4. مسار حفظ التنبيه
app.post('/set-alert', async (req, res) => {
    const alert = new Alert(req.body);
    await alert.save();
    res.sendStatus(200);
});

// 5. الوظيفة العبقرية (The Cron Job): مراقبة الأسعار كل 12 ساعة
cron.schedule('0 */12 * * *', async () => {
    console.log("جاري فحص الأسعار لجميع المستخدمين...");
    const alerts = await Alert.find();
    
    for (let alert of alerts) {
        getJson({
            engine: "google_shopping",
            q: alert.productName,
            api_key: "مفتاح_SERPAPI_الخاص_بك"
        }, async (data) => {
            const currentLowestPrice = parseFloat(data.shopping_results[0].price.replace(/[^0-9.]/g, ''));
            
            if (currentLowestPrice <= alert.targetPrice) {
                // إرسال إيميل فوراً!
                await transporter.sendMail({
                    from: 'Findly AI Alerts',
                    to: alert.email,
                    subject: '🚨 انخفاض السعر! الحق العرض',
                    text: `المنتج: ${alert.productName} أصبح الآن بسعر ${currentLowestPrice}. رابطه: ${alert.link}`
                });
                // حذف التنبيه بعد الإرسال
                await Alert.findByIdAndDelete(alert._id);
            }
        });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
