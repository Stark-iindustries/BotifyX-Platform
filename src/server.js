'use strict';

require('dotenv').config();

const express   = require('express');
const session   = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport  = require('passport');
const path      = require('path');
const helmet    = require('helmet');
const pool      = require('./db');
const migrate   = require('./db/migrate');

require('./config/passport');

const authRoutes = require('./routes/auth');
const botsRoutes = require('./routes/api/bots');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({ pool, tableName: 'session', createTableIfMissing: false }),
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/bots', botsRoutes);

app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    id:     req.user.id,
    name:   req.user.name,
    email:  req.user.email,
    avatar: req.user.avatar_url,
  });
});

app.get('/api/config', (_, res) => {
  res.json({ portalUrl: process.env.PORTAL_URL || null });
});

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ── Serve built React app ─────────────────────────────────────────────────────
const DIST = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(DIST));
app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));

// ── Boot: migrate DB then listen ──────────────────────────────────────────────
async function boot() {
  try {
    await migrate();
  } catch (err) {
    console.error('[DB] Auto-migration failed:', err.message);
    // Non-fatal — continue starting up; DB may already be set up
  }
  app.listen(PORT, () => console.log(`[BotifyX Platform] Running on port ${PORT}`));
}

boot();
