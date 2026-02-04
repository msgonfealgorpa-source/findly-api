
const priceEngine = require("./intelligence/price.engine");
const timingEngine = require("./intelligence/timing.engine");
const trustEngine = require("./intelligence/trust.engine");
const valueEngine = require("./intelligence/value.engine");
const decisionEngine = require("./intelligence/decision.engine");

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
