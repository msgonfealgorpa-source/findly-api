const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// إعدادات الأمان والسماح للواجهة بالاتصال بالسيرفر
app.use(cors());
app.use(express.json());

// 1. إعداد الاتصال بـ Apify باستخدام المفتاح الموجود في المتغيرات
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN, // يقرأ التوكن من إعدادات Render
});

// رسالة ترحيب للتأكد أن السيرفر يعمل
app.get('/', (req, res) => {
    res.send('Findly AI Server is Running! 🚀');
});

// 2. نقطة البحث (API Endpoint)
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'الرجاء إدخال كلمة بحث' });
        }

        console.log(`🔎 جاري البحث عن: ${query}...`);

        // إعداد مدخلات البحث لـ Amazon Scraper
        // نستخدم Actor ID الخاص بأمازون الموجود في متغيرات البيئة
        const actorInput = {
            category: "all",
            keyword: query, // كلمة البحث القادمة من المستخدم
            country: "US",  // البحث في المتجر الأمريكي (يمكن تغييره)
        };

        // تشغيل الـ Actor (هذه العملية قد تستغرق بضع ثوانٍ)
        const run = await client.actor(process.env.AMAZON_ACTOR_ID).call(actorInput);

        console.log('✅ تم انتهاء البحث، جاري جلب النتائج...');

        // جلب النتائج من قاعدة البيانات (Dataset)
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // تصفية وتنسيق البيانات لتناسب واجهة Findly
        // سنأخذ أول 10 نتائج فقط للسرعة
        const formattedResults = items.slice(0, 10).map((item, index) => {
            return {
                id: index,
                name: item.title,
                price: item.price ? item.price.amount : 'غير متوفر', // تأكد من هيكل البيانات القادمة من الـ Actor
                currency: item.price ? item.price.currency : 'USD',
                img: item.thumbnailUrl || 'https://via.placeholder.com/150', // صورة بديلة إذا لم تتوفر
                link: item.url,
                // محاكاة تقييم الذكاء الاصطناعي بناءً على النجوم الحقيقية
                score: item.stars ? Math.round(item.stars * 20) : Math.floor(Math.random() * (99 - 80) + 80), 
                tags: ["Amazon", "Best Seller"]
            };
        });

        // إرسال النتائج للواجهة الأمامية
        res.json({
            status: 'success',
            advisorMessage: `وجدت لك ${formattedResults.length} منتجاً ممتازاً من أمازون بناءً على بحثك عن "${query}".`,
            results: formattedResults
        });

    } catch (error) {
        console.error('❌ حدث خطأ أثناء البحث:', error);
        res.status(500).json({ 
            error: 'حدث خطأ في الخادم أثناء جلب البيانات.',
            details: error.message 
        });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
