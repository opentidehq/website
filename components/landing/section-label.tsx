import type { ReactNode } from 'react';

/**
 * Chapter label above a landing section: accent number, a short rule, lowercase mono.
 * Mirrors the deck's chapter tags; it replaces uppercase tracked eyebrows.
 */
export function SectionLabel({
  n,
  children,
  className,
}: {
  n?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`flex items-center gap-3 font-mono text-sm ${className ?? ''}`}>
      {n && <span className="font-semibold text-[var(--landing-accent)]">{n}</span>}
      {n && <span aria-hidden className="h-px w-6 bg-[var(--landing-border)]" />}
      <span className="text-[var(--landing-subtle)]">{children}</span>
    </p>
  );
}
