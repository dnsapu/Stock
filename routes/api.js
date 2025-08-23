// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Stock = require('../models/Stock');

const PROXY_BASE = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock';

function anonymizeIp(ip) {
  const salt = process.env.IP_SALT || 'fcc_stock_salt';
  // SHA-256 + salt, truncamos para no guardar un hash largo innecesario
  return crypto.createHash('sha256').update(`${salt}|${ip}`).digest('hex').slice(0, 32);
}

function normalizeSymbol(s) {
  return String(s || '').trim().toUpperCase();
}

function parseSymbols(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.includes(',')) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [raw];
}

async function fetchPrice(symbol) {
  const url = `${PROXY_BASE}/${encodeURIComponent(symbol)}/quote`;
  const { data } = await axios.get(url, {
    timeout: 5000,
    validateStatus: s => s >= 200 && s < 500
  });

  // El proxy válido devuelve objeto con latestPrice (number)
  if (!data || typeof data.latestPrice !== 'number') {
    throw new Error('INVALID_SYMBOL');
  }
  return data.latestPrice;
}

async function ensureStockDoc(symbol, doLike, ipHash) {
  const filter = { symbol };
  const update = {};
  if (doLike && ipHash) {
    update.$addToSet = { ipHashes: ipHash }; // like único por IP
  }
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  return await Stock.findOneAndUpdate(filter, update, options);
}

router.get('/stock-prices', async (req, res) => {
  try {
    const likeParam = req.query.like;
    const like =
      likeParam === true ||
      String(likeParam).toLowerCase() === 'true' ||
      String(likeParam) === '1';

    // confía en X-Forwarded-For (configurado en server.js)
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ipHash = like ? anonymizeIp(ip) : null;

    const symbols = parseSymbols(req.query.stock)
      .map(normalizeSymbol)
      .filter(Boolean);

    if (symbols.length === 0 || symbols.length > 2) {
      return res.status(400).json({ error: 'Provide one or two stock symbols using ?stock=' });
    }

    // Un solo símbolo
    if (symbols.length === 1) {
      const s = symbols[0];
      // Primero validamos que exista/obtiene precio; si es inválido, no ensuciamos DB
      const price = await fetchPrice(s);
      const doc = await ensureStockDoc(s, like, ipHash);
      const likes = (doc?.ipHashes?.length ?? 0);

      return res.status(200).json({
        stockData: { stock: s, price, likes }
      });
    }

    // Dos símbolos
    const [s1, s2] = symbols;

    const [price1, price2] = await Promise.all([
      fetchPrice(s1),
      fetchPrice(s2)
    ]);

    const [doc1, doc2] = await Promise.all([
      ensureStockDoc(s1, like, ipHash),
      ensureStockDoc(s2, like, ipHash)
    ]);

    const l1 = (doc1?.ipHashes?.length ?? 0);
    const l2 = (doc2?.ipHashes?.length ?? 0);

    return res.status(200).json({
      stockData: [
        { stock: s1, price: price1, rel_likes: l1 - l2 },
        { stock: s2, price: price2, rel_likes: l2 - l1 }
      ]
    });
  } catch (err) {
    if (err.message === 'INVALID_SYMBOL') {
      return res.status(200).json({ stockData: { error: 'invalid symbol' } });
    }
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
