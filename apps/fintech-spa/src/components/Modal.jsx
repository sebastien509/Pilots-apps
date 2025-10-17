// src/components/Modal.jsx
import React, { useState } from "react";
import PrivacyEgressDrawer from "./PrivacyEgressDrawer";

export default function Modal({ open, onClose, title, children, actions, apiBase = "", orgKey = "", sessionId = "" }) {
  const [egressOpen, setEgressOpen] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      {/* Centered card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl glass border border-white/10 shadow-xl relative">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
          </div>

          <div className="p-5 max-h-[60vh] overflow-auto">{children}</div>

          {actions && (
            <div className="p-4 border-t border-white/10 flex gap-3 justify-end">
              {actions}
            </div>
          )}

          {/* Bottom-left button INSIDE the modal */}
          <button
            onClick={() => setEgressOpen(true)}
            disabled={!sessionId}
            title={sessionId ? "Show egress details" : "No session yet"}
            className="absolute left-4 -bottom-14 sm:bottom-4 sm:left-4 rounded-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold
                       bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
          >
            🛡️ AI Privacy Proof
          </button>
        </div>
      </div>

      {/* Bottom sheet drawer (overlays within the modal) */}
      <PrivacyEgressDrawer
        apiBase={apiBase}
        orgKey={orgKey}
        sessionId={sessionId}
        open={egressOpen}
        onClose={() => setEgressOpen(false)}
      />
    </div>
  );
}
