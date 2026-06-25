/** Geometric mark: EU star arc + tide wave inside a hex frame. Yellow on void. */
export function OpentideMark({ className, size = 28 }: { className?: string; size?: number }) {
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      const b = ((i * 72 - 90 + 36) * Math.PI) / 180;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      pts.push(`${cx + r * 0.42 * Math.cos(b)},${cy + r * 0.42 * Math.sin(b)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
      role="presentation"
    >
      <path
        d="M16 2.5 27 8.75v14.5L16 29.5 5 23.25V8.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const cx = 16 + 9 * Math.cos(a);
        const cy = 13 + 9 * Math.sin(a);
        return <path key={deg} d={star(cx, cy, 1.35)} fill="currentColor" />;
      })}
      <path
        d="M7 21.5c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <circle cx="16" cy="21.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function OpentideWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <OpentideMark size={26} className="text-[var(--eu-yellow)]" />
      <span className="font-semibold tracking-[-0.03em]">
        <span className="text-[var(--eu-yellow)]">open</span>
        <span>tide</span>
      </span>
    </span>
  );
}
