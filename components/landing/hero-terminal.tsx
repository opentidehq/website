'use client';

import { useEffect, useState } from 'react';

type Line =
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string; ok?: boolean }
  | { kind: 'blank' };

const script: Line[] = [
  { kind: 'cmd', text: 'export OPENTIDE_REPO_ROOT=./detection-repo' },
  { kind: 'cmd', text: 'opentide setup --yes --platform sentinel' },
  { kind: 'out', text: '✓ scaffolded objects/, .opentide/, docs/' },
  { kind: 'cmd', text: 'opentide generate' },
  { kind: 'out', text: '→ rule.1.0.schema.json, objective.1.0.schema.json, templates' },
  { kind: 'cmd', text: 'opentide validate --strict' },
  { kind: 'out', text: '✓ schema · uuid-format · id-uniqueness', ok: true },
  { kind: 'out', text: '✓ cross-object references', ok: true },
  { kind: 'out', text: '0 blocking errors', ok: true },
  { kind: 'cmd', text: 'opentide validate query --platform sentinel' },
  { kind: 'out', text: '✓ KQL syntax honest (sentinel)', ok: true },
  { kind: 'cmd', text: 'opentide deploy --platform sentinel --dry-run' },
  { kind: 'out', text: '✓ dry-run: 12 rules would deploy to Sentinel', ok: true },
];

export function HeroTerminal() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(script.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= script.length) window.clearInterval(id);
    }, 520);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
        <span className="ml-1 font-mono text-[11px] text-zinc-500">detection-repo</span>
        <span className="ml-auto font-mono text-[10px] text-zinc-600">zsh</span>
      </div>
      <div className="min-h-[220px] space-y-1 overflow-x-auto p-4 font-mono text-[11px] leading-[1.7] sm:text-xs">
        {script.slice(0, visible).map((line, i) => {
          if (line.kind === 'blank') return <div key={i} className="h-2" />;
          if (line.kind === 'cmd') {
            return (
              <p key={i} className="text-zinc-300">
                <span className="text-[var(--eu-yellow)]">❯</span>{' '}
                <span className="text-zinc-500">$ </span>
                {line.text}
              </p>
            );
          }
          return (
            <p
              key={i}
              className={`pl-4 ${line.ok ? 'text-emerald-500/90' : 'text-zinc-400'}`}
            >
              {line.text}
            </p>
          );
        })}
        {visible < script.length && (
          <span className="inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)]" />
        )}
      </div>
    </div>
  );
}
