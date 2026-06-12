const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const budgetRoutes  = require("./routes/budget");
const adminRoutes   = require("./routes/admin");

const app = express();

app.use(cors());

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