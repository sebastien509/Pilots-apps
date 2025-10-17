// src/components/PrivacyEgressDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";

function Line({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-28 shrink-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-800/90">{children ?? "—"}</div>
    </div>
  );
}

function Pretty({ obj }) {
  const text = useMemo(() => {
    try { return typeof obj === "string" ? obj : JSON.stringify(obj, null, 2); }
    catch { return String(obj ?? ""); }
  }, [obj]);
  return (
    <pre className="text-[12px] leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-56">
      {text}
    </pre>
  );
}

export default function PrivacyEgressDrawer({ apiBase = "", orgKey = "", sessionId = "", open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [fragments, setFragments] = useState([]); // only sentences with placeholders/tokens
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(""); setOverlay(null); setReceipt(null); setFragments([]);
      try {
        // we’ll call both proxies and the gateway fragments endpoint
        const headers = { ...(orgKey ? { "X-Org-Key": orgKey } : {}) };

        const [ovR, rcR, frR] = await Promise.all([
          fetch(`${apiBase.replace(/\/+$/,'')}/osdk/overlay?session_id=${encodeURIComponent(sessionId)}`, { headers }),
          fetch(`${apiBase.replace(/\/+$/,'')}/osdk/receipt?session_id=${encodeURIComponent(sessionId)}`, { headers }),
          fetch(`${apiBase.replace(/\/+$/,'')}/v1/audit/fragments?session_id=${encodeURIComponent(sessionId)}`, { headers }),
        ]);

        if (!ovR.ok) throw new Error(`overlay ${ovR.status}`);
        if (!rcR.ok) throw new Error(`receipt ${rcR.status}`);
        // fragments may 404 if session not yet cached—don’t block
        let frags = [];
        if (frR.ok) {
          const fj = await frR.json();
          frags = Array.isArray(fj.fragments) ? fj.fragments : [];
        }

        const ov = await ovR.json();
        const rc = await rcR.json();

        if (!cancelled) {
          setOverlay(ov || null);
          setReceipt(rc?.receipt || null);
          setFragments(frags);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, sessionId, apiBase, orgKey]);

  const usage = {
    tokensIn: overlay?.tokens_in ?? 0,
    tokensOut: overlay?.tokens_out ?? 0,
    cost: overlay?.cost_usd ?? 0,
    latency: overlay?.latency_ms ?? 0,
    provider: overlay?.model_fingerprint?.provider || (receipt?.meta?.model_fingerprint?.provider) || "—",
    model: overlay?.model_fingerprint?.name || overlay?.model_fingerprint?.model || "—",
    policyHash: overlay?.policy_hash || receipt?.meta?.policy_hash || "—",
    consentLevel: overlay?.consent_level || receipt?.meta?.consent_level || "—",
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] transition-transform duration-300 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!open}
    >
      {/* Sheet backdrop */}
      <div className="absolute inset-0 -top-[100vh]" onClick={onClose} />

      {/* Sheet panel */}
      <div className="mx-auto max-w-3xl rounded-t-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-sm font-bold text-slate-800 tracking-wide">AI Privacy Proof</div>
              <div className="text-[11px] text-slate-600">
                Shows what the LLM saw (sanitized) + session metrics. Org-scoped.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-800 text-sm">Close</button>
        </div>

        <div className="p-5 space-y-5">
          {err && (
            <div className="text-rose-700 text-sm bg-rose-50 border border-rose-200 rounded-lg p-3">
              {err}
            </div>
          )}

          {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Tokens</div>
              <div className="text-lg font-bold">{usage.tokensIn} / {usage.tokensOut}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Latency</div>
              <div className="text-lg font-bold">{usage.latency}ms</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Cost (USD)</div>
              <div className="text-lg font-bold">${Number(usage.cost || 0).toFixed(4)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Consent</div>
              <div className="text-lg font-bold">{usage.consentLevel}</div>
            </div>
          </div>

          {/* Wire data line */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex flex-wrap items-center gap-3">
            <span className="text-emerald-700 text-sm font-semibold">Wire:</span>
            <code className="text-xs bg-white border border-emerald-200 px-2 py-1 rounded">
              /v1/llm/chat → provider={usage.provider} model={usage.model}
            </code>
            <code className="text-xs bg-white border border-emerald-200 px-2 py-1 rounded">
              X-Org-Key {orgKey ? '✓' : '—'}
            </code>
            <code className="text-xs bg-white border border-emerald-200 px-2 py-1 rounded">
              Policy {String(usage.policyHash).slice(0, 10)}…
            </code>
          </div>

          {/* “Only the parts with tokens/surrogates” */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">Sanitized fragments (token-bearing)</div>
            {loading ? (
              <div className="text-slate-500 text-sm">Loading…</div>
            ) : fragments?.length ? (
              <div className="grid gap-2">
                {fragments.map((frag, i) => (
                  <div key={i} className="text-[13px] bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    {/* lightly highlight {…} placeholders */}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: frag
                          .replace(/\{/g, '<mark class="bg-yellow-200 px-0.5 rounded">{')
                          .replace(/\}/g, '}</mark>')
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No token-bearing fragments found for this session.</div>
            )}
          </div>

          {/* Advanced: peek at receipt (sanitized) */}
          <details className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold bg-slate-50">Receipt (sanitized view)</summary>
            <div className="p-4 space-y-3">
              <Line label="Session">{sessionId || '—'}</Line>
              <Line label="Purpose">{receipt?.meta?.purpose}</Line>
              <Line label="Consent">{receipt?.meta?.consent_id}</Line>
              <Line label="Org">{receipt?.meta?.org_key || '—'}</Line>
              <Line label="Provider">{usage.provider}</Line>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-600 uppercase">Sanitized messages</div>
                <Pretty obj={(receipt?.prefilter?.sanitized?.messages || []).map(m => ({ role: m.role }))} />
                <div className="text-[11px] text-slate-500">
                  Full text is not shown here—only token-bearing lines are shown above to preserve privacy.
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
