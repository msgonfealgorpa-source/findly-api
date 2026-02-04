const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(__dirname, "price-history.json");

// تحميل السجل
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
}

// حفظ السجل
function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// المحرك الرئيسي
function priceHistoryEngine(productId, currentPrice) {
  const history = loadHistory();

  if (!history[productId]) {
    history[productId] = [];
  }

  history[productId].push({
    price: currentPrice,
    date: new Date().toISOString()
  });

  // نقيّد الحجم (مثلاً آخر 30 سجل)
  if (history[productId].length > 30) {
    history[productId] = history[productId].slice(-30);
  }

  saveHistory(history);

  const prices = history[productId].map(h => h.price);
  const avg =
    prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    observations: prices.length,
    averagePastPrice: avg.toFixed(2),
    isBelowOwnAverage: currentPrice < avg,
    historyAvailable: prices.length > 1
  };
}

module.exports = priceHistoryEngine;
