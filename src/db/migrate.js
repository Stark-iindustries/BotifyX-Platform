'use strict';

const fs   = require('fs');
const path = require('path');
const pool = require('./index');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[DB] Schema ready.');
}

module.exports = migrate;

// Allow running directly: node src/db/migrate.js
if (require.main === module) {
  require('dotenv').config();
  migrate()
    .then(() => process.exit(0))
    .catch(err => { console.error('[DB] Migration failed:', err.message); process.exit(1); });
}
