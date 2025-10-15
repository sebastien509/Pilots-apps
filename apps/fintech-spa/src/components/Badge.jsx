export default function Badge({ children }) {
    return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 border border-white/20">
    {children}
    </span>
    );
    }