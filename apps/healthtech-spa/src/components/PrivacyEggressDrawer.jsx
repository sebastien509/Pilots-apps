import React, { useEffect, useState } from "react";

const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const API_BASE = RAW_BASE.replace(/\/+$/, "");
const orgKey = import.meta.env.VITE_ORG_KEY || 'DEMO_ORG_KEY';


export default function PrivacyEgressDrawer({ open, onClose, sessionId }) {
  const [overlay, setOverlay] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !sessionId) return;

    let cancelled = false;
    const load = async () => {
      setErr("");
      try {
        const [ovR, rcR] = await Promise.all([
          fetch(`${API_BASE}/osdk/overlay?session_id=${encodeURIComponent(sessionId)}`, { headers: { 'X-Org-Key': orgKey } }),
          fetch(`${API_BASE}/osdk/receipt?session_id=${encodeURIComponent(sessionId)}`, { headers: { 'X-Org-Key': orgKey } }),
        ]);
        if (!ovR.ok || !rcR.ok) {
          const t1 = await ovR.text().catch(() => "");
          const t2 = await rcR.text().catch(() => "");
          throw new Error(
            `overlay:${ovR.status} ${t1?.slice(0, 160)} | receipt:${rcR.status} ${t2?.slice(0, 160)}`
          );
        }
        const [ov, rc] = await Promise.all([ovR.json(), rcR.json()]);
        if (!cancelled) {
          setOverlay(ov || null);
          setReceipt(rc?.receipt || null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-[min(560px,95vw)] bg-white shadow-2xl border-l rounded-l-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">
            Privacy &amp; Egress ·{" "}
            <span className="font-mono text-slate-500">{sessionId || "—"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-full">
          {err && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {err}
            </div>
          )}

          <section className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase">
              Live Overlay
            </div>
            <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-56">
              {overlay ? JSON.stringify(overlay, null, 2) : "—"}
            </pre>
          </section>

          <section className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase">
              Audit Receipt (sanitized)
            </div>
            <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-56">
              {receipt ? JSON.stringify(receipt, null, 2) : "—"}
            </pre>
          </section>
        </div>
      </aside>
    </div>
  );
}
