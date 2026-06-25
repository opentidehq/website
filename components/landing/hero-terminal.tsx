'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Line =
  | { kind: 'cmd'; text: string }
  | { kind: 'out'; text: string; ok?: boolean }
  | { kind: 'blank' };

const script: Line[] = [
  { kind: 'cmd', text: 'export OPENTIDE_REPO_ROOT=./detection-repo' },
  { kind: 'cmd', text: 'opentide setup --yes --platform sentinel' },
  { kind: 'out', text: '✓ scaffolded objects/, .opentide/, docs/' },
  { kind: 'cmd', text: 'opentide validate --strict' },
  { kind: 'out', text: '✓ schema · uuid-format · cross-object refs', ok: true },
  { kind: 'out', text: '0 blocking errors', ok: true },
  { kind: 'cmd', text: 'opentide deploy --platform sentinel --dry-run' },
  { kind: 'out', text: '✓ dry-run: 12 rules would deploy to Sentinel', ok: true },
];

export function HeroTerminal() {
  const reduced = usePrefersReducedMotion();
  const [animated, setAnimated] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = reduced ? script.length : animated;

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setAnimated(i);
      if (i >= script.length) window.clearInterval(id);
    }, 480);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visible]);

  return (
    <div className="border-t border-white/[0.06] bg-black px-4 py-6 md:px-8 md:py-8">
      <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
        Try it out
      </p>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-1 font-mono text-[11px] text-zinc-500">detection-repo</span>
          <span className="ml-auto font-mono text-[10px] text-zinc-600">zsh</span>
        </div>
        <div
          ref={scrollRef}
          className="h-[9.5rem] space-y-0.5 overflow-hidden p-4 font-mono text-[11px] leading-[1.65] sm:h-[10.5rem] sm:text-xs"
        >
          {script.slice(0, visible).map((line, i) => {
            if (line.kind === 'blank') return <div key={i} className="h-1" />;
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
    </div>
  );
}
