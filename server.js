// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// ========================
// 1️⃣ MongoDB Connection
// ========================
mongoose.connect('mongodb://localhost/findly', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('MongoDB connected'));

// ========================
// 2️⃣ Schemas & Models
// ========================

// Price History
const priceHistorySchema = new mongoose.Schema({
    title: String,
    normalizedTitle: String,
    price: Number,
    date: { type: Date, default: Date.now },
});
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);

// User Profile
const userProfileSchema = new mongoose.Schema({
    userId: String,
    budget: Number,
    searchHistory: [String],
    watchlist: [String],
    preferredCategories: [String],
});
const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

// ========================
// 3️⃣ Utilities
// ========================

// Normalize title: احتفظ بالأرقام والكلمات الأساسية
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // إزالة الرموز
        .replace(/\s+/g, ' ')        // توحيد الفراغات
        .trim()
        .substring(0, 60);
}

// Parse product specs
function parseSpecs(title) {
    const specs = {
        cpu: null,
        ram: null,
        gpu: null,
        storage: null,
        category: null,
    };

    const t = title.toLowerCase();

    // CPU
    const cpuMatch = t.match(/i[3579]|ryzen\s\d/);
    if (cpuMatch) specs.cpu = cpuMatch[0];

    // RAM
    const ramMatch = t.match(/(\d{2,3})\s?gb/);
    if (ramMatch) specs.ram = ramMatch[1] + 'GB';

    // GPU
    const gpuMatch = t.match(/rtx\s?\d{3,4}|gtx\s?\d{3,4}/);
    if (gpuMatch) specs.gpu = gpuMatch[0].toUpperCase();

    // Storage
    const storageMatch = t.match(/(\d{2,4})(tb|gb)/);
    if (storageMatch) specs.storage = storageMatch[1] + storageMatch[2].toUpperCase();

    // Category (simple logic)
    if (t.includes('laptop') || t.includes('notebook') || t.includes('dell') || t.includes('hp')) {
        specs.category = 'Laptop';
    } else if (t.includes('phone') || t.includes('smartphone')) {
        specs.category = 'Phone';
    } else {
        specs.category = 'Other';
    }

    return specs;
}

// ========================
// 4️⃣ Advanced Decision Engine
// ========================

async function advancedDecisionEngine(product, userId) {
    const normalizedTitle = normalizeTitle(product.title);

    // --- Layer 1: Specs Understanding ---
    const specs = parseSpecs(product.title);

    // --- Layer 2: User Profile Intelligence ---
    const user = await UserProfile.findOne({ userId });
    let userMatchScore = 50; // default neutral
    if (user) {
        if (user.budget && product.price <= user.budget) userMatchScore += 20;
        if (user.preferredCategories.includes(specs.category)) userMatchScore += 15;
        if (user.watchlist.includes(product.title)) userMatchScore += 10;
    }

    // --- Layer 3: Price History Tracking ---
    const history = await PriceHistory.find({ normalizedTitle }).sort({ price: 1 });
    const isLowest = history.length === 0 || product.price < history[0].price;

    // حفظ السعر بعد الفحص
    await PriceHistory.create({
        title: product.title,
        normalizedTitle,
        price: product.price,
    });

    // --- Layer 4: Decision Logic ---
    let verdict = 'Good Deal';
    let decisionTag = '';
    if (product.price > 1000 && !isLowest) {
        verdict = 'Overpriced';
        decisionTag = 'avoid';
    } else if (isLowest && userMatchScore > 70) {
        verdict = 'Perfect for You';
        decisionTag = 'best_buy';
    } else if (isLowest) {
        verdict = 'Best Buy';
        decisionTag = 'best_buy';
    } else if (userMatchScore < 40) {
        verdict = 'Avoid';
        decisionTag = 'avoid';
    }

    // --- Layer 5: Rich Analysis Object ---
    const analysis = {
        pros: [
            isLowest ? 'Price historically low' : null,
            specs.cpu ? `CPU: ${specs.cpu}` : null,
            specs.gpu ? `GPU: ${specs.gpu}` : null,
            specs.ram ? `RAM: ${specs.ram}` : null,
        ].filter(Boolean),
        cons: [
            product.price > 1000 && !isLowest ? 'High price' : null,
            specs.storage && parseInt(specs.storage) < 256 ? 'Low storage' : null,
        ].filter(Boolean),
        verdict,
        savingsLabel: isLowest ? 'Lowest Price' : '',
        decisionTag,
        marketPosition: isLowest ? 'Market Competitive' : 'Market Normal',
        userMatchScore,
    };

    return {
        ...product,
        specs,
        analysis,
        isLowest,
    };
}

// ========================
// 5️⃣ API Endpoint
// ========================

app.post('/analyze', async (req, res) => {
    const { product, userId } = req.body;

    if (!product || !product.title || !product.price) {
        return res.status(400).json({ error: 'Missing product data' });
    }

    try {
        const result = await advancedDecisionEngine(product, userId || 'guest');
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========================
// 6️⃣ Start Server
// ========================

const PORT = 3000;
app.listen(PORT, () => console.log(`Findly server running on port ${PORT}`));
