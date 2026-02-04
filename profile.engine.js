function profileEngine(userHistory = {}) {
  return {
    priceWeight: userHistory.priceSensitive ? 0.6 : 0.3,
    trustWeight: userHistory.trustIssues ? 0.4 : 0.2,
    timingWeight: 0.1
  };
}

module.exports = profileEngine;
