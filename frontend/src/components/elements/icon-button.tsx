/* ── Small reusable button primitives ── */
 
export const IconButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({
  onClick, title, children,
}) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-slate-100 transition-all duration-150 active:scale-95"
  >
    {children}
  </button>
);
 