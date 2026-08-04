'use client';

import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const lines = [
  { text: '→ search_rules(query="lateral movement")', delay: 0 },
  { text: '→ validate(strict=true) · 142 objects', delay: 800 },
  { text: '→ deploy(dry_run=true, platform=sentinel)', delay: 1600, highlight: true },
];

export function McpTerminalDemo() {
  const reduced = usePrefersReducedMotion();
  const [animated, setAnimated] = useState(0);
  const visible = reduced ? lines.length : animated;

  useEffect(() => {
    if (reduced) return;
    const timers = lines.map((line, i) =>
      window.setTimeout(() => setAnimated(i + 1), line.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <div className="rounded-2xl border border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] p-8">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5" aria-hidden>
          <span className="landing-mcp-ping absolute inline-flex size-full rounded-full bg-[var(--landing-accent)] opacity-40" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[var(--landing-accent)]" />
        </span>
        <p className="font-mono text-sm text-[var(--landing-muted)]">opentide-mcp · connected</p>
      </div>
      <div className="mt-6 space-y-3 font-mono text-xs text-[var(--landing-muted)]">
        {lines.map((line, i) => (
          <p
            key={line.text}
            className={`rounded-lg px-3 py-2 ring-1 transition-opacity duration-500 ${
              i < visible ? 'opacity-100' : 'opacity-0'
            } ${
              line.highlight
                ? 'bg-[var(--landing-accent)]/10 text-[var(--landing-accent)] ring-[var(--landing-accent)]/25'
                : 'bg-black ring-[var(--landing-border-subtle)]'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}
