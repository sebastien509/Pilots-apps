// api/db.js
import { Pool } from "pg";

function shouldUseSSL() {
  const url = process.env.DATABASE_URL || "";
  const env = (process.env.DATABASE_SSL || "").toLowerCase();

  if (env === "true") return true;
  if (/\bssl=true\b/i.test(url)) return true;
  if (/\bsslmode=require\b/i.test(url)) return true;

  return process.env.NODE_ENV === "production";
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL() ? { rejectUnauthorized: false } : false,
  // Helpful defaults for serverless-ish workloads
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30_000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT || 5_000),
});

pool.on("error", (err) => {
  console.error("[pg] idle client error:", err);
});



export async function getOrgByKey(orgKey) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM orgs WHERE org_key = $1",
      [orgKey]
    );
    return rows[0] || null;
  } catch (e) {
    // Optional local dev bypass for demo org
    if (process.env.ALLOW_NO_DB === "true" && orgKey === "DEMO_ORG_KEY") {
      console.warn("[pg] DB unavailable, bypassing for DEMO_ORG_KEY");
      return { id: "00000000-0000-0000-0000-000000000001", name: "Acme Demo Org" };
    }
    throw e;
  }
}
