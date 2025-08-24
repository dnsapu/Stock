// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const apiRoutes = require("./routes/api");

const app = express();

// Seguridad: Helmet + Content Security Policy mínimas exigidas por FCC
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
    },
  }),
);

// CORS abierto (el tester puede llamar a tu API)
app.use(cors({ origin: "*" }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Confiar en X-Forwarded-For (replit, glitch, etc.)
app.set("trust proxy", true);

// Static (UI mínima propia)
app.use(express.static(path.join(__dirname, "public")));

// API
app.use("/api", apiRoutes);

// DB
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fcc-stock";
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((e) => console.error("❌ Error MongoDB:", e.message));

// Server
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3000;
  app.listen(port, () =>
    console.log(`🚀 Servidor en http://localhost:${port}`),
  );
}

module.exports = app;
