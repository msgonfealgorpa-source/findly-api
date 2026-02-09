const mongoose = require('mongoose');

const SearchCacheSchema = new mongoose.Schema({
  query: { type: String, index: true },
  lang: String,
  results: Array,
  createdAt: { type: Date, default: Date.now }
});

// حذف تلقائي بعد 48 ساعة
SearchCacheSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 48 }
);

module.exports = mongoose.model('SearchCache', SearchCacheSchema);
