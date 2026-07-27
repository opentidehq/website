/** Inline wordmark: neutral open + brand accent tide (blue light / yellow dark). */
export function OpentideName({ className }: { className?: string }) {
  return (
    <span className={className}>
      open<span className="text-[var(--brand-accent)]">tide</span>
    </span>
  );
}
