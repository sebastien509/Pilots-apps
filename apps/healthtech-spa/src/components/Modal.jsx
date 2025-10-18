import React, { useState } from "react";
import PrivacyEgressDrawer from "./PrivacyEggressDrawer";

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  sessionId, // <-- new: used to link to the session in the drawer
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-2xl rounded-2xl glass border border-white/10 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 id="modal-title" className="text-xl font-semibold">
            {title}
          </h3>

          <div className="flex items-center gap-2">
            {sessionId ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-semibold transition-colors"
                title="View privacy policy, egress details, and live overlay for this session"
              >
                🔒 Privacy &amp; Egress
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-base leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-auto">{children}</div>

        {actions && (
          <div className="p-4 border-t border-white/10 flex gap-3 justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Drawer lives alongside the modal so it overlays cleanly */}
      <PrivacyEgressDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessionId={sessionId}
      />
    </div>
  );
}
