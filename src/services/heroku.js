'use strict';

const axios = require('axios');

const BASE         = 'https://api.heroku.com';
const BOTIFYX_REPO = process.env.BOTIFYX_REPO || 'Stark-iindustries/BotifyX';
const SOURCE_URL   = `https://github.com/${BOTIFYX_REPO}/archive/refs/heads/main.tar.gz`;

const TOKEN = () => {
  const t = process.env.HEROKU_API_KEY;
  if (!t) throw new Error('HEROKU_API_KEY not set on platform.');
  return t;
};

function api(token) {
  return axios.create({
    baseURL: BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.heroku+json; version=3',
      'Content-Type': 'application/json',
    },
  });
}

function generateAppName(userId) {
  const rand = Math.random().toString(36).slice(2, 7);
  // Heroku: lowercase, letters/numbers/hyphens, 1-30 chars
  return `bfyx-u${userId}-${rand}`.toLowerCase().slice(0, 30);
}

// ── Create app, set env vars, build from GitHub tarball ───────────────────────
async function deploy(deploymentId, user, sessionId) {
  const token   = TOKEN();
  const h       = api(token);
  const appName = generateAppName(user.id);

  // 1. Create app
  await h.post('/apps', { name: appName, region: 'us' });

  // 2. Set config vars
  await h.patch(`/apps/${appName}/config-vars`, {
    SESSION_ID: sessionId,
    NODE_ENV:   'production',
    PLATFORM:   'heroku',
  });

  // 3. Trigger build from public GitHub tarball
  const { data: build } = await h.post(`/apps/${appName}/builds`, {
    source_blob: { url: SOURCE_URL, version: 'main' },
  });

  return {
    status:           'deploying',
    heroku_app_name:  appName,
    heroku_app_id:    build.app?.id || null,
  };
}

// ── Get dyno status ───────────────────────────────────────────────────────────
async function getStatus(bot) {
  const token   = TOKEN();
  const h       = api(token);
  const appName = bot.heroku_app_name;

  try {
    // Check latest build
    const { data: builds } = await h.get(`/apps/${appName}/builds`, {
      headers: { Range: 'created_at; order=desc, max=1' },
    });
    const latest = Array.isArray(builds) ? builds[0] : null;

    if (latest?.status === 'pending' || latest?.status === 'building') {
      return { status: 'deploying', url: `https://${appName}.herokuapp.com` };
    }
    if (latest?.status === 'failed') {
      return { status: 'failed', url: null };
    }

    // Build succeeded — check dynos
    const { data: dynos } = await h.get(`/apps/${appName}/dynos`);
    if (!dynos.length) return { status: 'stopped', url: `https://${appName}.herokuapp.com` };
    const web = dynos.find(d => d.type === 'web') || dynos[0];
    return {
      status: web.state === 'up' ? 'running' : web.state,
      url:    `https://${appName}.herokuapp.com`,
    };
  } catch (err) {
    if (err.response?.status === 404) return { status: 'not_found', url: null };
    throw err;
  }
}

// ── Get logs ──────────────────────────────────────────────────────────────────
async function getLogs(bot) {
  const token   = TOKEN();
  const h       = api(token);
  const appName = bot.heroku_app_name;

  const { data: logSession } = await h.post(`/apps/${appName}/log-sessions`, {
    lines: 100, tail: false,
  });

  // Fetch the log lines from the log URL (plain text)
  const { data: raw } = await axios.get(logSession.logplex_url);
  return raw.split('\n').filter(Boolean).map(line => ({ message: line }));
}

// ── Restart dynos ─────────────────────────────────────────────────────────────
async function restart(bot) {
  const token = TOKEN();
  await api(token).delete(`/apps/${bot.heroku_app_name}/dynos`);
}

// ── Delete app ────────────────────────────────────────────────────────────────
async function remove(bot) {
  const token = TOKEN();
  if (!bot.heroku_app_name) return;
  await api(token).delete(`/apps/${bot.heroku_app_name}`);
}

module.exports = { deploy, getStatus, getLogs, restart, remove };
