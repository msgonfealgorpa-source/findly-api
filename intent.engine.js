function intentEngine(userEvents = {}) {
  const {
    priceChecks = 0,
    buyClicks = 0,
    watchDays = 0
  } = userEvents;

  if (buyClicks > 0) return "ready_to_buy";
  if (priceChecks >= 3 && watchDays >= 2) return "waiting_for_drop";
  if (priceChecks > 0) return "price_sensitive";

  return "browsing";
}

module.exports = intentEngine;
