'use client';

import { useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const LAYERS = [
  {
    id: 'spec',
    title: 'Specification',
    role: 'the contract',
    items: ['threats', 'objectives', 'rules', 'vocabularies'],
    detail:
      'Published schemas every detection object has to satisfy. Not the Python package, and not your YAML.',
  },
  {
    id: 'pkg',
    title: 'opentide',
    role: 'the engine you run',
    items: ['CLI', 'Python', 'MCP'],
    detail: 'One package that implements the spec. Install from PyPI, then lock it like any other dependency.',
    pill: 'PyPI',
  },
  {
    id: 'repo',
    title: 'Your detection repo',
    role: 'the YAML you write',
    items: ['objects/threats', 'objects/objectives', 'objects/rules'],
    detail: 'Detections stay in git. The package reads this tree; the spec says what is valid.',
  },
] as const;

type LayerId = (typeof LAYERS)[number]['id'];

function TideSeam({ label }: { label: string }) {
  return (
    <div
      className="relative isolate h-7 select-none"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--landing-accent) 9%, var(--landing-bg))',
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 28"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-[var(--landing-accent)]"
      >
        <path
          d="M0 16 C 40 6, 60 26, 100 16 S 160 6, 200 16 S 260 26, 300 16 S 360 6, 400 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          opacity="0.55"
        />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 px-2 font-mono text-[10px] leading-none text-[var(--landing-muted)]"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--landing-accent) 9%, var(--landing-bg))',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function SpecStack() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<LayerId>('pkg');

  return (
    <div className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)]">
      {LAYERS.map((layer, i) => {
        const isOpen = open === layer.id;
        const wash =
          layer.id === 'spec'
            ? '4%'
            : layer.id === 'pkg'
              ? '16%'
              : '7%';

        return (
          <div key={layer.id}>
            {i === 1 && <TideSeam label="implements" />}
            {i === 2 && <TideSeam label="runs against" />}
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={`${layer.title}, ${layer.role}`}
              onClick={() => setOpen(layer.id)}
              onMouseEnter={() => setOpen(layer.id)}
              onFocus={() => setOpen(layer.id)}
              className={`block w-full px-5 text-left transition-[background-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--landing-accent)] ${
                layer.id === 'pkg' ? 'py-6 sm:py-7' : 'py-4 sm:py-5'
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, var(--landing-accent) ${wash}, var(--landing-bg))`,
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={`font-semibold tracking-tight text-[var(--landing-ink)] ${
                      layer.id === 'pkg' ? 'font-mono text-lg sm:text-xl' : 'text-base sm:text-lg'
                    }`}
                  >
                    {layer.title}
                  </span>
                  <span className="text-sm text-[var(--landing-muted)]">{layer.role}</span>
                </div>
                {'pill' in layer && layer.pill ? (
                  <span className="rounded-md bg-[var(--landing-accent)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--brand-accent-foreground)]">
                    {layer.pill}
                  </span>
                ) : null}
              </div>

              <p
                className={`mt-3 font-mono text-[11px] leading-relaxed text-[var(--landing-subtle)] sm:text-xs ${
                  layer.id === 'pkg' ? 'tracking-wide' : ''
                }`}
              >
                {layer.items.join('  ·  ')}
              </p>

              <div
                className="grid"
                aria-hidden={!isOpen}
                style={{
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: reduced ? undefined : 'grid-template-rows 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <p className="overflow-hidden">
                  <span className="mt-3 block max-w-[62ch] text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">
                    {layer.detail}
                  </span>
                </p>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
