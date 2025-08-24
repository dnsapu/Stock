// models/Stock.js
const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    // Guardamos hashes de IP anonimizadas (no IP real)
    ipHashes: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

// Virtual: cantidad de likes = cantidad de IPs únicas
StockSchema.virtual('likes').get(function () {
  return this.ipHashes.length;
});

StockSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Stock', StockSchema);
