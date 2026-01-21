const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات البيئة (يفضل استخدام ملف .env)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const JWT_SECRET = process.env.JWT_SECRET || "findly_super_secret_key_2026";

// قاعدة بيانات وهمية للمستخدمين (في الذاكرة)
const users = []; 

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

/* -------------------------------------------
   1. نظام المصادقة (Authentication)
------------------------------------------- */

// Endpoint: تسجيل حساب جديد
app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });

        const userExists = users.find(u => u.email === email);
        if (userExists) return res.status(400).json({ message: "المستخدم موجود بالفعل" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), email, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ message: "تم إنشاء الحساب بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في عملية التسجيل" });
    }
});

// Endpoint: تسجيل الدخول
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ message: "تم تسجيل الدخول", token });
    } catch (error) {
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});

/* -------------------------------------------
   2. محرك البحث الذكي (Amazon Search)
------------------------------------------- */

app.get("/", (req, res) => {
    res.send("Findly API with Auth is running 🚀");
});

app.get("/search", async (req, res) => {
    const q = req.query.q;
    if (!q) return res.json({ top: [] });

    try {
        const response = await axios.get(
            "https://real-time-amazon-data.p.rapidapi.com/search",
            {
                params: {
                    query: q,
                    page: "1",
                    country: "US",
                    category_id: "aps"
                },
                headers: {
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
                }
            }
        );

        const products = response.data?.data?.products || [];

        // معالجة البيانات وتحسينها للواجهة
        const results = products.slice(0, 6).map(p => ({
            name: p.product_title,
            price: p.product_price || "—",
            rating: p.product_star_rating || 0,
            image: p.product_photo || "",
            link: p.product_url
        }));

        res.json({ top: results });

    } catch (error) {
        console.error("Amazon API error:", error.message);
        res.status(500).json({ error: "API Error", top: [] });
    }
});

/* -------------------------------------------
   3. تشغيل السيرفر
------------------------------------------- */
app.listen(PORT, () => {
    console.log(`Findly Server is running on port ${PORT}`);
});
