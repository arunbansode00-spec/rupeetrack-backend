const express  = require("express");
const auth     = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");
const router   = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get("/", auth, async (req, res) => {
  const { data } = await supabase
    .from("budgets").select("monthly_budget")
    .eq("user_id", req.user.id).single();
  res.json({ monthly_budget: data?.monthly_budget || 10000 });
});

router.post("/", auth, async (req, res) => {
  const { monthly_budget } = req.body;
  const { data, error } = await supabase
    .from("budgets")
    .upsert({ user_id: req.user.id, monthly_budget, updated_at: new Date() })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
