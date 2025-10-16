// api/db.js
import pg from 'pg';
const { Pool } = pg;

function wantSSL() {
  const v = (process.env.DATABASE_SSL || '').toLowerCase();
  if (v === 'false' || v === '0') return false;
  if (v === 'true'  || v === '1') return true;
  // default to SSL in production
  return process.env.NODE_ENV === 'production';
}

const sslConfig = (() => {
  if (!wantSSL()) return false;

  // Option A (most common): don’t verify CA (works with Railway/Render proxies)
  if (!process.env.PG_CA) return { rejectUnauthorized: false };

  // Option B: verify using a provided CA bundle in env
  return { ca: process.env.PG_CA };
})();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,   // use your metro.proxy.rlwy.net URL
  ssl: sslConfig,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT || 5000),
});

export async function getOrgByKey(orgKey) {
  const { rows } = await pool.query('SELECT id, name FROM orgs WHERE org_key = $1', [orgKey]);
  return rows[0] || null;
}
