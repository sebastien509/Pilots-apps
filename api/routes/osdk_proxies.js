// api/routes/osdk_proxies.js
import express from 'express';

function resolveOrgKey(req) {
  return (
    req.get('x-org-key') ||
    (req.user && req.user.org_key) ||
    req.cookies?.org_key ||
    process.env.ORG_KEY ||
    ''
  );
}

export function osdkProxyRoutes(app) {
  const BASE = (process.env.OSDK_GATEWAY_URL || '').replace(/\/+$/, '');
  if (!BASE) {
    console.warn('[osdkProxyRoutes] OSDK_GATEWAY_URL not set; overlay/receipt proxies disabled');
    return;
  }

  // ---- LIVE OVERLAY (requires X-Org-Key) ----
  app.get('/osdk/overlay', async (req, res) => {
    const session_id = req.query.session_id;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });
    try {
      const orgKey = resolveOrgKey(req);
      const r = await fetch(`${BASE}/v1/demo/overlay?session_id=${encodeURIComponent(session_id)}`, {
        headers: { ...(orgKey ? { 'X-Org-Key': orgKey } : {}) },
      });
      const text = await r.text();
      res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
    } catch {
      res.status(502).json({ error: 'gateway_failed' });
    }
  });

  // ---- AUDIT RECEIPT (requires X-Org-Key) ----
  app.get('/osdk/receipt', async (req, res) => {
    const session_id = req.query.session_id;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });
    try {
      const orgKey = resolveOrgKey(req);
      const r = await fetch(`${BASE}/v1/audit/report?session_id=${encodeURIComponent(session_id)}`, {
        headers: { ...(orgKey ? { 'X-Org-Key': orgKey } : {}) },
      });
      const text = await r.text();
      res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
    } catch {
      res.status(502).json({ error: 'gateway_failed' });
    }
  });

  // ---- AUDIT FRAGMENTS (optional UX endpoint; requires X-Org-Key) ----
  app.get('/osdk/fragments', async (req, res) => {
    const session_id = req.query.session_id;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });
    try {
      const orgKey = resolveOrgKey(req);
      const r = await fetch(`${BASE}/v1/audit/fragments?session_id=${encodeURIComponent(session_id)}`, {
        headers: { ...(orgKey ? { 'X-Org-Key': orgKey } : {}) },
      });
      const text = await r.text();
      res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
    } catch {
      res.status(502).json({ error: 'gateway_failed' });
    }
  });

  // ---- RECENT SESSIONS (QP filter server-side) ----
  app.get('/osdk/recent-sessions', async (req, res) => {
    try {
      const orgKey = resolveOrgKey(req);
      const qs = new URLSearchParams();
      if (orgKey) qs.set('org_key', orgKey);
      if (req.query.user_id) qs.set('user_id', String(req.query.user_id));
      const r = await fetch(`${BASE}/v1/demo/recent_sessions${qs.toString() ? `?${qs}` : ''}`);
      const text = await r.text();
      res.status(r.status).type(r.headers.get('content-type') || 'application/json').send(text);
    } catch {
      res.status(502).json({ error: 'gateway_failed' });
    }
  });
}
