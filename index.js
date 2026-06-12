const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const budgetRoutes  = require("./routes/budget");
const adminRoutes   = require("./routes/admin");

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://rupeetrack-frontend.vercel.app",
  "https://rupeetrack.vercel.app",  // ← update with your actual Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/", (req, res) => res.json({ status: "RupeeTrack API running ✅" }));

app.use("/api/auth",     authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budget",   budgetRoutes);
app.use("/api/admin",    adminRoutes);

const PORT = process.env.PORT || 5000;
// Add this at the bottom of index.js before app.listen
// Keep-alive ping every 14 minutes
if (process.env.NODE_ENV === "production") {
  const https = require("https");
  setInterval(() => {
    https.get("https://rupeetrack-backend.onrender.com/")
      .on("error", () => {});
  }, 14 * 60 * 1000);
}
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));