'use strict';

const router      = require('express').Router();
const requireAuth = require('../../middleware/auth');
const pool        = require('../../db');
const railway     = require('../../services/railway');
const heroku      = require('../../services/heroku');

function svc(platform) {
  return platform === 'railway' ? railway : heroku;
}

// GET /api/bots — list user's bots
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bot_deployments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bots — deploy a new bot
router.post('/', requireAuth, async (req, res) => {
  const { platform, sessionId, displayName } = req.body;

  // Validate
  if (!['railway', 'heroku'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform. Must be railway or heroku.' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required.' });
  }
  if (!sessionId.startsWith('BOTIFY-X=')) {
    return res.status(400).json({ error: 'Invalid Session ID format. Must start with BOTIFY-X=' });
  }

  // Check platform token is configured
  if (platform === 'railway' && !process.env.RAILWAY_API_TOKEN) {
    return res.status(503).json({ error: 'Railway deployments are not configured yet.' });
  }
  if (platform === 'heroku' && !process.env.HEROKU_API_KEY) {
    return res.status(503).json({ error: 'Heroku deployments are not configured yet.' });
  }

  // Enforce 1-bot limit
  const { rows: existing } = await pool.query(
    'SELECT id FROM bot_deployments WHERE user_id = $1',
    [req.user.id]
  );
  if (existing.length >= 1) {
    return res.status(400).json({
      error: 'You already have a bot deployed. Delete it first to deploy a new one.',
    });
  }

  // Create deployment record immediately
  const { rows: [deployment] } = await pool.query(
    `INSERT INTO bot_deployments (user_id, platform, display_name, status)
     VALUES ($1, $2, $3, 'deploying') RETURNING *`,
    [req.user.id, platform, displayName || `BotifyX — ${req.user.name}`]
  );

  res.json(deployment);

  // Run the actual deploy in background
  setImmediate(async () => {
    try {
      const result = await svc(platform).deploy(deployment.id, req.user, sessionId);

      // Build update query dynamically from returned fields
      const fields  = Object.keys(result);
      const values  = Object.values(result);
      const setCols = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

      await pool.query(
        `UPDATE bot_deployments SET ${setCols}, updated_at = NOW() WHERE id = $1`,
        [deployment.id, ...values]
      );
    } catch (err) {
      console.error(`[Deploy] id=${deployment.id} error:`, err.message);
      await pool.query(
        `UPDATE bot_deployments SET status = 'failed', updated_at = NOW() WHERE id = $1`,
        [deployment.id]
      );
    }
  });
});

// GET /api/bots/:id — single bot with live status
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bot_deployments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Bot not found.' });
    const bot = rows[0];

    // If deploying or running, fetch live status
    if (!['failed', 'stopped'].includes(bot.status)) {
      try {
        const live = await svc(bot.platform).getStatus(bot);
        // Persist updated status + url + deployment id back to DB
        const updates = { status: live.status };
        if (live.url)          updates.app_url = live.url;
        if (live.deploymentId) updates.railway_deployment_id = live.deploymentId;

        const fields  = Object.keys(updates);
        const values  = Object.values(updates);
        const setCols = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        await pool.query(
          `UPDATE bot_deployments SET ${setCols}, updated_at = NOW() WHERE id = $1`,
          [bot.id, ...values]
        );

        return res.json({ ...bot, ...updates, app_url: live.url || bot.app_url });
      } catch (_) {
        // Return stale data on status check failure
      }
    }

    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bots/:id/logs
router.get('/:id/logs', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bot_deployments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Bot not found.' });
    const logs = await svc(rows[0].platform).getLogs(rows[0]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bots/:id/restart
router.post('/:id/restart', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bot_deployments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Bot not found.' });
    await svc(rows[0].platform).restart(rows[0]);
    await pool.query(
      `UPDATE bot_deployments SET status = 'deploying', updated_at = NOW() WHERE id = $1`,
      [rows[0].id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bots/:id — delete + remove from platform
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bot_deployments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Bot not found.' });

    await svc(rows[0].platform).remove(rows[0]);
    await pool.query('DELETE FROM bot_deployments WHERE id = $1', [rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
