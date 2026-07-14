-- BotifyX Platform Database Schema
-- Applied automatically on server startup — safe to run multiple times (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar NOT NULL COLLATE "default",
  "sess"   json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  google_id     VARCHAR(128) UNIQUE,          -- null for email/password users
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  password_hash TEXT,                         -- null for Google-only users
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_deployments (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_name                VARCHAR(255) NOT NULL DEFAULT 'BotifyX',
  platform                VARCHAR(16) NOT NULL CHECK (platform IN ('railway', 'heroku')),

  -- Railway-specific
  railway_project_id      VARCHAR(255),
  railway_service_id      VARCHAR(255),
  railway_environment_id  VARCHAR(255),
  railway_deployment_id   VARCHAR(255),

  -- Heroku-specific
  heroku_app_name         VARCHAR(255),
  heroku_app_id           VARCHAR(255),

  -- Shared
  display_name            VARCHAR(255),
  status                  VARCHAR(32) DEFAULT 'deploying',
  app_url                 TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_deployments_user_id ON bot_deployments(user_id);
