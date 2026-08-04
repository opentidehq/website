'use client';

import { FileText, Layers, Rocket, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

const steps: { label: string; icon: LucideIcon; desc: string }[] = [
  {
    label: 'Validate',
    icon: Shield,
    desc: 'Schema, query, and platform honesty checks',
  },
  {
    label: 'Generate',
    icon: Layers,
    desc: 'Schemas, templates, and indexes from your repo',
  },
  {
    label: 'Deploy',
    icon: Rocket,
    desc: 'Seven platforms, dry-run before production',
  },
  {
    label: 'Document',
    icon: FileText,
    desc: 'Published narratives for analysts and auditors',
  },
];

export function PipelineFlow() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="mt-16">
      <div className="hidden lg:flex lg:items-stretch lg:gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-stretch">
            <button
              type="button"
              className="landing-card group relative flex-1 list-none text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              style={{ '--i': i } as CSSProperties}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <div
                className={`landing-pipeline-card landing-surface-card h-full p-6 transition-all duration-300 ${
                  active === i
                    ? 'scale-[1.03] border-[var(--landing-accent)]/50 shadow-[0_0_40px_-12px_var(--landing-btn-shadow)]'
                    : active !== null
                      ? 'opacity-60'
                      : 'hover:border-[var(--landing-border)]'
                }`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] p-2.5 text-[var(--landing-accent)] ring-1 transition-all duration-300 ${
                    active === i ? 'scale-110 ring-[var(--landing-accent)]/40' : 'ring-[var(--landing-border)]'
                  }`}
                >
                  <step.icon className="size-5" aria-hidden />
                </div>
                <h3
                  className={`text-lg font-semibold transition-colors ${
                    active === i ? 'text-[var(--landing-accent)]' : ''
                  }`}
                >
                  {step.label}
                </h3>
                <p className="mt-2 text-sm text-[var(--landing-subtle)]">{step.desc}</p>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className="flex w-10 shrink-0 items-center justify-center self-center" aria-hidden>
                <div className="relative h-px w-full bg-gradient-to-r from-[var(--landing-accent)]/20 via-[var(--landing-accent)]/55 to-[var(--landing-accent)]">
                  <span
                    className={`absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--landing-accent)] transition-transform duration-300 ${
                      active === i ? 'scale-150' : ''
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {steps.map((step, i) => (
          <li
            key={step.label}
            className="landing-card group relative list-none"
            style={{ '--i': i } as CSSProperties}
          >
            <div className="landing-pipeline-card landing-surface-card h-full p-6 transition-all duration-300 active:scale-[0.98]">
              <div className="mb-4 inline-flex rounded-xl bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] p-2.5 text-[var(--landing-accent)] ring-1 ring-[var(--landing-border)]">
                <step.icon className="size-5" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold">{step.label}</h3>
              <p className="mt-2 text-sm text-[var(--landing-subtle)]">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
