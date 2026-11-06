// Dual-engine data layer.
// SQLite (Node's built-in node:sqlite) by default, stored at SQLITE_PATH or
// ./data/compass.db. When DATABASE_URL is a postgres:// URL (e.g. a Neon
// database on Render), the same queries run against Postgres instead.
// All SQL uses `?` placeholders; they are rewritten to $1..$n for Postgres.
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || '';
const usePg =
  DATABASE_URL.startsWith('postgres://') ||
  DATABASE_URL.startsWith('postgresql://');

let pgPool = null;
let sqliteDb = null;

if (usePg) {
  const { Pool } = require('pg');
  const needsSsl =
    DATABASE_URL.includes('sslmode=require') ||
    DATABASE_URL.includes('sslmode=prefer');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
} else {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath =
    process.env.SQLITE_PATH ||
    path.join(__dirname, '..', 'data', 'compass.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqliteDb = new DatabaseSync(dbPath);
}

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Returns an array of row objects.
async function query(sql, params = []) {
  if (usePg) {
    const res = await pgPool.query(toPg(sql), params);
    return res.rows;
  }
  return sqliteDb.prepare(sql).all(...params);
}

// Run DDL / statements that return no rows.
async function exec(sql) {
  if (usePg) {
    await pgPool.query(sql);
    return;
  }
  sqliteDb.exec(sql);
}

module.exports = { query, exec, usePg };
