'use client';

import { Archive, Pause, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const beats: { step: string; label: string; desc: string; icon: LucideIcon }[] = [
  {
    step: '01',
    label: 'Engine on PyPI',
    desc: 'pip install opentide==0.1.0 — CLI, MCP, and SDK on one version.',
    icon: Package,
  },
  {
    step: '02',
    label: 'Old tree archived',
    desc: 'The old engine and companion repos go read-only. Pinned checkouts keep resolving.',
    icon: Archive,
  },
  {
    step: '03',
    label: 'Four-week window',
    desc: 'Deployer bugs, docs, and migration questions. We are not adding platforms in this stretch.',
    icon: Pause,
  },
];

export function CutoverTimeline() {
  const reduced = usePrefersReducedMotion();

  return (
    <ol className="not-prose my-10 grid list-none gap-3 p-0 sm:grid-cols-3">
      {beats.map((beat, i) => {
        const Icon = beat.icon;
        return (
          <li
            key={beat.step}
            className={`landing-surface-card p-5 ${reduced ? '' : 'landing-fade-slide'}`}
            style={{ '--i': i, animationDelay: reduced ? undefined : `${i * 90}ms` } as CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)] ring-1 ring-[var(--landing-border)]">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-dim)]">
                {beat.step}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--landing-ink)]">
              {beat.label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{beat.desc}</p>
          </li>
        );
      })}
    </ol>
  );
}
