// api/routes/osdk.js
import { v4 as uuid } from 'uuid';

// ----- Config / ENV -----
const BASE = (process.env.OSDK_GATEWAY_URL || '').replace(/\/+$/, ''); // e.g. https://iosdk.onrender.com
const CP   = process.env.OSDK_CP_URL || '';                            // optional control-plane ingest
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';               // optional BYOK header
const ALLOW_NO_DB = process.env.ALLOW_NO_DB === 'true';                // set true in Vercel while debugging

// Map browser policyKey → OSDK purpose
const PURPOSE_MAP = {
  health_pii_phi: 'health.intake',
  fin_pci_pii: 'fintech.fraud_explainer',
};

function resolveOrgKey(req) {
  // choose your truth source; header works well when SPA sets it
  return (
    req.get('x-org-key') ||
    (req.user && req.user.org_key) ||
    req.cookies?.org_key ||
    process.env.ORG_KEY ||
    'DEMO_ORG_KEY'
  );
}

async function cpPost(evt) {
  if (!CP) return;
  try {
    await fetch(`${CP.replace(/\/+$/,'')}/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(evt),
    });
  } catch {
    /* non-blocking */
  }
}

export function osdkRouter(app) {
  // Sanity: CORS + body parsing
  app.post('/osdk/ping', (req, res) => res.json({ ok: true, echo: req.body || {} }));

  // Main chat entrypoint used by your SPA(s)
  app.post('/osdk/chat', async (req, res) => {
    const t0 = Date.now();
    try {
      const orgKey = resolveOrgKey(req);
      const { messages = [], policyKey, subject_id = 'web-demo-user', context_id } = req.body || {};

      if (!policyKey || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'bad_request' });
      }

      // Optional org key validation (DB)
      if (!ALLOW_NO_DB) {
        try {
          const { getOrgByKey } = await import('../db.js');
          const org = await getOrgByKey(orgKey);
          if (!org) return res.status(403).json({ error: 'invalid_org_key' });
        } catch (e) {
          console.error('[osdk/chat] db error:', e?.message);
          return res.status(500).json({ error: 'db_unavailable' });
        }
      } else {
        console.log('[osdk/chat] ALLOW_NO_DB=true — skipping org lookup');
      }

      const purpose = PURPOSE_MAP[policyKey] || 'notes.summarization';
      const session = `sess-${uuid()}`;

      await cpPost({ type: 'begin', ts: Date.now()/1000, session, meta: { orgKey, purpose, policyKey } });

      // Optional: prepend internal context
      const prepend = [];
      if (context_id && process.env.INTERNAL_CONTEXT_URL) {
        try {
          const r = await fetch(`${process.env.INTERNAL_CONTEXT_URL.replace(/\/+$/,'')}/api/contexts/${context_id}`, {
            headers: { 'X-Org-Key': orgKey }
          });
          if (r.ok) {
            const ctx = await r.json();
            prepend.push({ role: 'system', content: `Context: ${JSON.stringify(ctx.json)}` });
          }
        } catch {/* ignore */}
      }

      // If gateway isn’t configured, stub
      if (!BASE) {
        console.warn('[osdk/chat] OSDK_GATEWAY_URL is not set — returning stubbed response');
        return res.json({
          content: `🧪 Stubbed response (no gateway).\npurpose=${purpose}\nmessages=${JSON.stringify(messages)}`,
          meta: { session, purpose, stub: true, elapsed_ms: Date.now() - t0 },
        });
      }

      // 1) Create consent (authoritative source for org scoping)
      const cResp = await fetch(`${BASE}/v1/consent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject_id,
          purpose,
          metadata: { org_key: orgKey },   // <- tag consent with org
        })
      });

      if (!cResp.ok) {
        const text = await cResp.text().catch(() => '');
        console.error('[osdk/chat] consent_failed', cResp.status, text);
        await cpPost({ type: 'event', ts: Date.now()/1000, session, name: 'consent.error', data: { status: cResp.status, text: text.slice(0, 300) } });
        return res.status(502).json({ error: 'consent_failed' });
      }
      const { id: consent_id } = await cResp.json();

      // 2) Chat via gateway
      const headers = { 'content-type': 'application/json', 'X-Org-Key': orgKey }; // <- propagate org
      if (OPENAI_API_KEY) {
        headers['X-Provider-Auth'] = JSON.stringify({ openai: { api_key: OPENAI_API_KEY } });
      }

      const body = {
        consent_id,
        purpose,
        messages: [...prepend, ...messages],
        model: { provider: 'openai', model: 'gpt-4.1-mini' },
        session_id: session, // <- ensure gateway stores overlay/receipt under our session id
      };

      const gw = await fetch(`${BASE}/v1/llm/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!gw.ok) {
        const text = await gw.text().catch(() => '');
        console.error('[osdk/chat] gateway_failed', gw.status, text);
        await cpPost({ type: 'event', ts: Date.now()/1000, session, name: 'gateway.error', data: { status: gw.status, text: text.slice(0, 300) } });
        await cpPost({ type: 'end', ts: Date.now()/1000, session, ok: false });
        return res.status(502).json({ error: 'gateway_failed' });
      }

      const data = await gw.json();
      const content = data?.final_output ?? data?.result?.message?.content ?? '';
      const gwSession = data?.session_id || session;

      await cpPost({
        type: 'end',
        ts: Date.now()/1000,
        session: gwSession,
        ok: true,
        summary: { chars: (content || '').length, consent_id, purpose },
      });

      return res.json({ content, meta: { session: gwSession, purpose, consent_id, elapsed_ms: Date.now() - t0 } });

    } catch (e) {
      console.error('[osdk/chat] error', { message: e?.message, stack: e?.stack, BASE: BASE || '(unset)' });
      return res.status(500).json({ error: 'internal' });
    }
  });
}
