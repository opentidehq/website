'use client';

import { useEffect, useState } from 'react';

const lines = [
  { text: '→ search_rules(query="lateral movement")', delay: 0 },
  { text: '→ validate(strict=true) · 142 objects', delay: 800 },
  { text: '→ deploy(dry_run=true, platform=sentinel)', delay: 1600, highlight: true },
];

export function McpTerminalDemo() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(lines.length);
      return;
    }
    const timers = lines.map((line, i) =>
      window.setTimeout(() => setVisible(i + 1), line.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[var(--landing-surface)] p-8">
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
                : 'bg-black ring-white/[0.06]'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}
