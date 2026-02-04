module.exports = function priceEngine(price, marketPrices) {
  const prices = marketPrices.filter(p => p > 0);
  const avg = prices.reduce((a,b)=>a+b,0) / prices.length;
  const deltaPercent = ((price - avg) / avg) * 100;

  return {
    marketAverage: avg.toFixed(2),
    deltaPercent: deltaPercent.toFixed(1),
    position: deltaPercent < -15 ? "BELOW_MARKET" :
              deltaPercent < 5   ? "FAIR" : "ABOVE_MARKET",
    confidence: prices.length >= 5 ? 0.9 : 0.6
  };
};
