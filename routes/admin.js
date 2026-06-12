const express  = require("express");
const auth     = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");
const router   = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // must be service role key, not anon key
);

const adminOnly = (req, res, next) => {
  if (!req.user?.is_admin)
    return res.status(403).json({ error: "Admin access required" });
  next();
};

// POST /api/admin/make-admin
// Body: { email, secret }
// Secret lives in .env as ADMIN_SECRET — never hardcoded
router.post("/make-admin", async (req, res) => {
  const { email, secret } = req.body;

  // FIX #1: use env variable, not hardcoded string
  if (secret !== process.env.ADMIN_SECRET)
    return res.status(403).json({ error: "Wrong secret" });

  // FIX #2: find by email first, then update by id (safer & verifiable)
  const { data: existing, error: findError } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (findError || !existing)
    return res.status(404).json({ error: "User not found", detail: findError?.message });

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, user: data });
});

// GET /api/admin/users
router.get("/users", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/expenses
router.get("/expenses", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, profiles(name, email)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/stats
router.get("/stats", auth, adminOnly, async (req, res) => {
  const { data: users }    = await supabase.from("profiles").select("id");
  // FIX #3: include user_id so Admin.jsx can filter expenses per user correctly
  const { data: expenses } = await supabase.from("expenses").select("amount, type, user_id");

  const totalUsers        = users?.length || 0;
  const totalIncome       = expenses?.filter(e => e.type === "income") .reduce((s, e) => s + Number(e.amount), 0) || 0;
  const totalExpenses     = expenses?.filter(e => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0) || 0;
  const totalTransactions = expenses?.length || 0;

  res.json({ totalUsers, totalIncome, totalExpenses, totalTransactions });
});

// GET /api/admin/users/:userId/expenses
router.get("/users/:userId/expenses", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", req.params.userId)
    .order("date", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;