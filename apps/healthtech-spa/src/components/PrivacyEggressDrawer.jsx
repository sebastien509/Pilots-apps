// src/components/PrivacyEgressDrawer.jsx
import React, { useEffect, useState } from "react";

export default function PrivacyEgressDrawer({ apiBase = "", sessionId, open, onClose }) {
  const [overlay, setOverlay] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !sessionId) return;

    let active = true;
    const pull = async () => {
      setErr("");
      try {
        const [o, r] = await Promise.all([
          fetch(`${apiBase}/osdk/overlay?session_id=${encodeURIComponent(sessionId)}`),
          fetch(`${apiBase}/osdk/receipt?session_id=${encodeURIComponent(sessionId)}`)
        ]);
        const ojson = o.ok ? await o.json() : null;
        const rjson = r.ok ? await r.json() : null;
        if (!active) return;
        if (!o.ok) throw new Error(await o.text());
        if (!r.ok) throw new Error(await r.text());
        setOverlay(ojson);
        setReceipt(rjson?.receipt || null);
      } catch (e) {
        if (active) setErr(e.message || String(e));
      }
    };

    pull();
    const id = setInterval(pull, 1500);
    return () => { active = false; clearInterval(id); };
  }, [open, sessionId, apiBase]);

  // derive sanitized message lines (never raw inputs)
  const sanitizedLines = (() => {
    try {
      const msgs = receipt?.prefilter?.sanitized?.messages || [];
      const lines = [];
      for (const m of msgs) {
        const c = (m?.content ?? "").trim();
        if (!c) continue;
        // Only include lines that contain redaction placeholders
        // e.g., "{EMAIL}", "{PHONE}", "{CARD}", "{IBAN}", "{ADDRESS}", etc.
        const hasPlaceholder = /\{[A-Z_]+\}/.test(c);
        if (hasPlaceholder) {
          // Keep it short; show role prefix and masked content
          lines.push(`[${m.role}] ${c}`);
        }
      }
      // If nothing matched, show a minimal sanitized sample
      return lines.length ? lines.slice(0, 8) : ["(No tokenized fragments; outbound was sanitized without PII placeholders)"];
    } catch {
      return ["(Sanitized view unavailable)"];
    }
  })();

  const redactionSummary = (() => {
    const r = overlay?.redactions || {};
    const entries = Object.entries(r)
      .filter(([, v]) => typeof v === "number" && v > 0)
      .sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "None";
    return entries.map(([k, v]) => `${k}:${v}`).join("  ");
  })();

  const route = overlay?.route || (overlay?.provider ? "external" : "local");
  const dest = route === "local"
    ? "Local model (edge)"
    : overlay?.provider
      ? `${overlay.provider}${overlay.model ? ` • ${overlay.model}` : ""}`
      : "External provider";

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-[60] transition-transform duration-300
                  ${open ? "translate-y-0" : "translate-y-full"}`}
      aria-hidden={!open}
    >
      <div className="mx-auto max-w-3xl rounded-t-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-sm font-semibold text-slate-800">AI Privacy Proof</div>
              <div className="text-xs text-slate-600">
                What left your browser (sanitized). No raw PII ever shown.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-sm px-3 py-1 rounded-md border border-slate-300 bg-white"
          >
            Close
          </button>
        </div>

        {err && (
          <div className="px-5 py-3 text-rose-700 bg-rose-50 border-b border-rose-200 text-sm">
            {err}
          </div>
        )}

        <div className="p-5 grid md:grid-cols-2 gap-4">
          {/* Left: Destination & Metrics */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <div className="text-xs font-semibold text-slate-500 uppercase">Destination</div>
              <div className="mt-1 text-slate-800 font-medium">{dest}</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Tokens</div>
                  <div className="font-mono">
                    {(overlay?.tokens_in ?? 0)}/{(overlay?.tokens_out ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Latency</div>
                  <div className="font-mono">{overlay?.latency_ms ?? 0} ms</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Cost (USD)</div>
                  <div className="font-mono">${Number(overlay?.cost_usd || 0).toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Consent Level</div>
                  <div className="font-mono">{overlay?.consent_level || "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <div className="text-xs font-semibold text-slate-500 uppercase">Redactions</div>
              <code className="mt-1 block text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
                {redactionSummary}
              </code>
            </div>
          </div>

          {/* Right: Sanitized Outbound Fragments */}
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Sanitized fragments that left the browser
            </div>
            <div className="text-xs text-slate-600 mb-2">
              Showing only lines with redaction placeholders (e.g., <code>{'{EMAIL}'}</code>, <code>{'{CARD}'}</code>, <code>{'{IBAN}'}</code>).
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <pre className="max-h-56 overflow-auto p-3 text-xs leading-5 whitespace-pre-wrap">
                {sanitizedLines.join("\n\n")}
              </pre>
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              This view is privacy-preserving by design: it never reveals raw identifiers. It
              shows the **sanitized** outbound that the policy allowed to egress.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600">
          InthraOS enforced policy, redaction, and destination controls. Zero-retention applied to external calls when configured.
        </div>
      </div>
    </div>
  );
}
