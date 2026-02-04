const priceHistoryEngine = require("./price-history.engine");
const priceEngine = require("./price.engine");
const timingEngine = require("./timing.engine");
const trustEngine = require("./trust.engine");
const valueEngine = require("./value.engine");
const decisionEngine = require("./decision.engine");

function SageCore(product, allProducts) {
  const prices = allProducts
    .map(p => Number(p.price))
    .filter(p => !isNaN(p));

  const price = Number(product.price);

  const priceIntel = priceEngine(price, prices);
  const timingIntel = timingEngine(priceIntel);
  const trustIntel = trustEngine(product, priceIntel);
  const valueIntel = valueEngine(priceIntel, trustIntel);

  const finalVerdict = decisionEngine({
    priceIntel,
    timingIntel,
    trustIntel,
    valueIntel
  });

  return {
    priceIntel,
    timingIntel,
    trustIntel,
    valueIntel,
    finalVerdict
  };
}

module.exports = SageCore;
