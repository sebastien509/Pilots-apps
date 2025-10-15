import { v4 as uuid } from 'uuid';
import { getOrgByKey } from '../db.js';

// External OSDK endpoints
const BASE = process.env.OSDK_GATEWAY_URL;   // e.g. https://iosdk.onrender.com
const CP   = process.env.OSDK_CP_URL;        // optional: control-plane ingest
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // server-side key (external only)

// Map browser-provided policyKey → OSDK purpose string
// (You can expand this as you wish.)
const PURPOSE_MAP = {
  'health_pii_phi': 'health.intake',
  'fin_pci_pii': 'fintech.fraud_explainer', // uses external provider by policy
};

async function cpPost(evt) {
  if (!CP) return;
  try {
    await fetch(`${CP}/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(evt)
    });
  } catch { /* non-blocking */ }
}

export function osdkRouter(app) {
  app.post('/osdk/chat', async (req, res) => {
    try {
      const orgKey = req.header('X-Org-Key');
      if (!orgKey) return res.status(401).json({ error: 'missing org key' });

      // (Optional) verify org exists in DB
      const org = await getOrgByKey(orgKey);
      if (!org) return res.status(403).json({ error: 'invalid org key' });

      const { messages = [], policyKey, subject_id = 'web-demo-user', context_id } = req.body || {};
      const purpose = PURPOSE_MAP[policyKey] || 'notes.summarization';
      const session = `sess-${uuid()}`;

      await cpPost({ type: 'begin', ts: Date.now() / 1000, session, meta: { orgKey, purpose, policyKey } });

      // Optional: pull a saved context for quick "rehydrate"
      const prepend = [];
      if (context_id && process.env.INTERNAL_CONTEXT_URL) {
        try {
          const r = await fetch(`${process.env.INTERNAL_CONTEXT_URL}/api/contexts/${context_id}`, {
            headers: { 'X-Org-Key': orgKey }
          });
          if (r.ok) {
            const ctx = await r.json();
            prepend.push({ role: 'system', content: `Context: ${JSON.stringify(ctx.json)}` });
          }
        } catch { /* ignore */ }
      }

      // 1) Create consent on OSDK
      const cResp = await fetch(`${BASE}/v1/consent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject_id, purpose })
      });

      if (!cResp.ok) {
        const text = await cResp.text();
        await cpPost({ type: 'event', ts: Date.now()/1000, session, name: 'consent.error', data: { text } });
        return res.status(502).json({ error: 'consent_failed' });
      }
      const { id: consent_id } = await cResp.json();

      // 2) Chat via OSDK (external OpenAI by policy/purpose)
      const headers = { 'content-type': 'application/json' };

      // If your gateway expects BYOK header for provider auth:
      if (OPENAI_API_KEY) {
        headers['X-Provider-Auth'] = JSON.stringify({ openai: { api_key: OPENAI_API_KEY } });
      }

      const chatBody = {
        consent_id,
        purpose,
        messages: [...prepend, ...messages],
        // route external to OpenAI (policy will allow/deny)
        model: { provider: 'openai', model: 'gpt-4.1-mini' }
      };

      const gw = await fetch(`${BASE}/v1/llm/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(chatBody)
      });

      if (!gw.ok) {
        const text = await gw.text();
        await cpPost({ type: 'event', ts: Date.now()/1000, session, name: 'gateway.error', data: { text } });
        await cpPost({ type: 'end', ts: Date.now()/1000, session, ok: false });
        return res.status(502).json({ error: 'gateway_failed' });
      }

      const data = await gw.json();
      const content =
        data?.final_output ??
        data?.result?.message?.content ??
        '';

      await cpPost({
        type: 'end',
        ts: Date.now() / 1000,
        session,
        ok: true,
        summary: { chars: (content || '').length, consent_id, purpose }
      });

      // Minimal browser payload (no secrets)
      res.json({ content, meta: { session, purpose, consent_id } });

    } catch (e) {
      console.error('[osdk/chat] error', e);
      res.status(500).json({ error: 'internal' });
    }
  });
}
