# BotifyX Platform

Web platform for deploying and managing BotifyX WhatsApp bots. Users sign in with Google, paste their session ID, and their bot deploys to Railway or Heroku — no account setup required on their end.

## How It Works

1. User signs in with Google
2. Clicks **Deploy Bot** → picks Railway or Heroku
3. Gets a Session ID from the BotifyX Portal
4. Pastes it and clicks **Deploy**
5. Platform deploys BotifyX to the selected platform under the platform's account
6. User manages their bot (start/stop/restart/logs/delete) from the dashboard

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway/Heroku add-on) |
| `SESSION_SECRET` | Long random string for session encryption |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Full URL: `https://your-domain.com/auth/google/callback` |
| `ENCRYPTION_KEY` | Exactly 32 characters (reserved for future use) |
| `RAILWAY_API_TOKEN` | Your Railway account token (from railway.app → Account Settings) |
| `HEROKU_API_KEY` | Your Heroku API key (from heroku.com → Account → API Key) |
| `PORTAL_URL` | URL of your BotifyX Portal deployment |
| `BOTIFYX_REPO` | `Stark-iindustries/BotifyX` (default, change if you fork) |

## Setup

### 1. Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URI: `https://your-domain.com/auth/google/callback`
5. Copy Client ID and Secret into env vars

### 2. Database
- **Railway**: Add a PostgreSQL plugin to your project — `DATABASE_URL` is auto-set
- **Heroku**: `heroku addons:create heroku-postgresql:essential-0`

After the database is running, apply the schema:
```bash
npm run setup-db
```

### 3. Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Push this repo to GitHub
2. Create a new Railway project → Deploy from GitHub repo
3. Add a PostgreSQL plugin
4. Set all environment variables in Railway dashboard
5. Run `npm run setup-db` once via Railway's shell or a one-off command

### 4. Deploy to Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
heroku config:set SESSION_SECRET=... GOOGLE_CLIENT_ID=... # etc.
git push heroku main
heroku run npm run setup-db
```

## Important Notes

- **Railway token**: The platform's Railway account token is used to deploy ALL user bots. Make sure it's a token with project creation permissions.
- **Railway + GitHub**: Your Railway account must have GitHub connected (Railway dashboard → Settings → Connected Accounts) for GitHub-sourced deployments to work.
- **Heroku API key**: Used to create and manage Heroku apps for users. Keep it secure.
- **1 bot per user** limit is enforced. Users must delete their current bot before deploying a new one.

## Local Development

```bash
# Install backend deps
npm install

# Install and build frontend
npm run build

# Apply DB schema (set DATABASE_URL first)
npm run setup-db

# Start server
npm run dev   # uses nodemon
```

Frontend hot-reloading during development:
```bash
cd client && npm install && npm run dev
# Vite proxies /api and /auth to localhost:3000
```
