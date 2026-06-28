/* ── Small reusable button primitives ── */
 
 
export const TextButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick, children,
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:text-white transition-all duration-150 shadow-sm active:scale-[0.98]"
  >
    {children}
  </button>
);