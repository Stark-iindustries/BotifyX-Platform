#!/data/data/com.termux/files/usr/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# BotifyX Platform — Termux Setup Script
# Run once after cloning the repo.
# Usage: bash termux-setup.sh
# ──────────────────────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  BotifyX Platform — Termux Setup     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Install system packages ────────────────────────────────────────────────
echo "[1/6] Installing Termux packages..."
pkg update -y -q
# nodejs-lts avoids the OSSL_PROVIDER_add_conf_parameter link error
# that the latest nodejs package has on many Android versions.
pkg install -y nodejs-lts git postgresql

# ── 2. Init & start PostgreSQL ────────────────────────────────────────────────
echo "[2/6] Setting up PostgreSQL..."
if [ ! -d "$PREFIX/var/lib/postgresql" ]; then
  initdb "$PREFIX/var/lib/postgresql"
fi

# Start postgres if not already running
if ! pg_ctl -D "$PREFIX/var/lib/postgresql" status > /dev/null 2>&1; then
  pg_ctl -D "$PREFIX/var/lib/postgresql" -l "$PREFIX/var/lib/postgresql/pg.log" start
  sleep 2
fi

# Create DB user + database (ignore errors if they already exist)
createuser --no-superuser --no-createrole --no-createdb botifyx 2>/dev/null || true
psql -c "ALTER USER botifyx WITH PASSWORD 'botifyx';" postgres 2>/dev/null || true
createdb -O botifyx botifyx 2>/dev/null || true
echo "    PostgreSQL ready → postgresql://botifyx:botifyx@localhost:5432/botifyx"

# ── 3. Install backend dependencies ──────────────────────────────────────────
echo "[3/6] Installing backend packages..."
npm install --silent

# ── 4. Install & build frontend ───────────────────────────────────────────────
echo "[4/6] Installing frontend packages..."
cd client
npm install --silent

echo "[5/6] Building frontend..."
npm run build
cd ..

# ── 5. Create .env if not present ────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "[6/6] Creating .env from template..."
  cp .env.example .env
  # Generate a random session secret
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/change_me_to_a_long_random_string/$SECRET/" .env
  echo "    .env created with a random SESSION_SECRET."
else
  echo "[6/6] .env already exists, skipping."
fi

echo ""
echo "✅  Setup complete!"
echo ""
echo "    Start the server:   npm start"
echo "    Open in browser:    http://localhost:3000"
echo ""
echo "    Note: Google sign-in requires GOOGLE_CLIENT_ID and"
echo "    GOOGLE_CLIENT_SECRET in .env — email/password works without them."
echo ""
