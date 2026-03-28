// server.js
// Main entry point for the Express server

require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Required for Render/Heroku — they sit behind a reverse proxy
app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// MIDDLEWARE SETUP
// ─────────────────────────────────────────────

// Parse incoming JSON requests
app.use(express.json());

// Enable CORS (allows frontend to communicate with backend)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
}));

// Rate limiting: prevents brute-force attacks on auth endpoints
// Max 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─────────────────────────────────────────────
// PAGE ROUTES — serve HTML pages
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "signup.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "dashboard.html"));
});

app.get("/verify-email", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "verify-email.html"));
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "forgot-password.html"));
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "reset-password.html"));
});

// ─────────────────────────────────────────────
// CONNECT TO MONGODB AND START SERVER
// ─────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
