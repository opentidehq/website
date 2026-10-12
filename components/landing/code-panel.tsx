import type { ReactNode } from 'react';

/**
 * A deep-tide terminal panel for real artefacts: commands and their output, JSON, Python.
 * Navy in both themes. `min-w-0` lets the code scroll inside the panel instead of widening
 * the grid track it sits in.
 */
export function CodePanel({
  caption,
  aside,
  children,
  className,
}: {
  caption: string;
  aside?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`m-0 flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] ring-1 ring-[var(--landing-border)] ${className ?? ''}`}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-2.5 font-mono text-[11px] text-[var(--landing-code-dim)]">
        <span>{caption}</span>
        {aside && <span>{aside}</span>}
      </figcaption>
      <pre className="landing-code-scroll m-0 flex-1 overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

/** Token colours for code highlighted by hand inside a CodePanel. */
export const tok = {
  key: (text: ReactNode) => <span className="text-[var(--landing-code-key)]">{text}</span>,
  dim: (text: ReactNode) => <span className="text-[var(--landing-code-dim)]">{text}</span>,
  str: (text: ReactNode) => <span className="text-[var(--landing-code-str)]">{text}</span>,
  ok: (text: ReactNode) => <span className="text-emerald-300">{text}</span>,
};
