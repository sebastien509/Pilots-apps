// src/lib/osdk.js  (put this exact file in BOTH apps)
const RAW_BASE = (import.meta.env.VITE_API_BASE ?? '').trim();
const API_BASE = RAW_BASE.replace(/\/+$/, '');
const ORG_KEY  = import.meta.env.VITE_ORG_KEY || 'DEMO_ORG_KEY';

export async function osdkChat({ messages, policyKey, subject_id, context_id, timeoutMs = 20000 }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/osdk/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Org-Key': ORG_KEY },
      body: JSON.stringify({
        messages,
        policyKey,
        ...(subject_id ? { subject_id } : {}),
        ...(context_id ? { context_id } : {})
      }),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'OSDK chat failed');
    return res.json(); // { content, meta }
  } finally { clearTimeout(t); }
}
