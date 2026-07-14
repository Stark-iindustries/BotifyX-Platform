'use strict';

const router   = require('express').Router();
const passport = require('passport');
const bcrypt   = require('bcryptjs');
const pool     = require('../db');

const googleEnabled = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!googleEnabled()) {
    return res.redirect('/?auth=google_not_configured');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled()) return res.redirect('/?auth=google_not_configured');
  passport.authenticate('google', { failureRedirect: '/?auth=failed' })(req, res, () => {
    res.redirect('/dashboard');
  });
});

// ── Email / Password: Register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
    );
    if (existing.length)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3) RETURNING *`,
      [email.toLowerCase(), name.trim(), hash]
    );

    req.login(rows[0], (err) => {
      if (err) return res.status(500).json({ error: 'Login after register failed.' });
      res.json({ id: rows[0].id, name: rows[0].name, email: rows[0].email });
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── Email / Password: Login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase()]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'No account found with this email.' });

    const user = rows[0];

    if (!user.password_hash)
      return res.status(401).json({
        error: 'This account uses Google sign-in. Please continue with Google.',
      });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Incorrect password.' });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed.' });
      res.json({ id: user.id, name: user.name, email: user.email });
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true });
  });
});

module.exports = router;
