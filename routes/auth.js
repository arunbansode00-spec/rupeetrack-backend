const express = require("express");
const jwt     = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const router  = express.Router();

// Hardcoded admin emails — no DB check needed
const ADMIN_EMAILS = [
  "arunbansode0318@gmail.com",
  "arunbansode18@gmail.com",
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
    }
  }
);

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Retry ${i + 1}...`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: "All fields required" });
  try {
    const { data, error } = await withRetry(() =>
      supabase.auth.admin.createUser({
        email, password,
        user_metadata: { name },
        email_confirm: true,
      })
    );
    if (error) return res.status(400).json({ error: error.message });

    await new Promise(r => setTimeout(r, 500));

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    await supabase.from("profiles").upsert({
      id: data.user.id, name, email, is_admin: isAdmin,
    });

    const token = jwt.sign(
      { id: data.user.id, email, name, is_admin: isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, user: { id: data.user.id, email, name, is_admin: isAdmin } });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Connection timeout — please try again" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await withRetry(() =>
      supabase.auth.signInWithPassword({ email, password })
    );
    if (error) return res.status(400).json({ error: "Invalid email or password" });

    // Check admin by email — no DB lookup needed
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    // Try to get name from profile, fallback to email prefix
    let userName = email.split("@")[0];
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .single();
      if (profile?.name) userName = profile.name;
    } catch {}

    const token = jwt.sign(
      { id: data.user.id, email, name: userName, is_admin: isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log(`✅ Login: ${email} | admin: ${isAdmin}`);

    res.json({
      token,
      user: { id: data.user.id, email, name: userName, is_admin: isAdmin }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Connection timeout — please try again" });
  }
});

module.exports = router;