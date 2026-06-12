const express  = require("express");
const auth     = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");
const router   = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get("/", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("expenses").select("*")
    .eq("user_id", req.user.id)
    .order("date", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", auth, async (req, res) => {
  const { category, emoji, label, amount, date, type } = req.body;
  const { data, error } = await supabase
    .from("expenses")
    .insert([{ user_id: req.user.id, category, emoji, label, amount, date, type }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/:id", auth, async (req, res) => {
  const { error } = await supabase
    .from("expenses").delete()
    .eq("id", req.params.id).eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
