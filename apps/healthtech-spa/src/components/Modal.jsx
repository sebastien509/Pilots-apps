export default function Modal({ open, onClose, title, children, actions }) {
    if (!open) return null;
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-2xl rounded-2xl glass border border-white/10 shadow-xl">
    <div className="p-5 border-b border-white/10 flex items-center justify-between">
    <h3 className="text-xl font-semibold">{title}</h3>
    <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
    </div>
    <div className="p-5 max-h-[60vh] overflow-auto">{children}</div>
    {actions && <div className="p-4 border-t border-white/10 flex gap-3 justify-end">{actions}</div>}
    </div>
    </div>
    );
    }