'use client';

import { FileText, Layers, Rocket, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

const steps: { label: string; icon: LucideIcon; desc: string; color: string; bg: string }[] = [
  {
    label: 'Validate',
    icon: Shield,
    desc: 'Schema, query, and platform honesty checks',
    color: '#ffcc00',
    bg: 'rgba(255, 204, 0, 0.12)',
  },
  {
    label: 'Generate',
    icon: Layers,
    desc: 'Schemas, templates, and indexes from your repo',
    color: '#e6b800',
    bg: 'rgba(255, 204, 0, 0.08)',
  },
  {
    label: 'Deploy',
    icon: Rocket,
    desc: 'Seven platforms, dry-run before production',
    color: '#fff0a3',
    bg: 'rgba(255, 204, 0, 0.15)',
  },
  {
    label: 'Document',
    icon: FileText,
    desc: 'Published narratives for analysts and auditors',
    color: '#c9a000',
    bg: 'rgba(255, 204, 0, 0.1)',
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
                    ? 'scale-[1.03] border-[var(--landing-accent)]/50 bg-[var(--landing-surface-raised)] shadow-[0_0_40px_-12px_rgba(255,204,0,0.35)]'
                    : active !== null
                      ? 'opacity-60'
                      : 'hover:border-white/20'
                }`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-2.5 ring-1 transition-all duration-300 ${
                    active === i ? 'scale-110 ring-[var(--landing-accent)]/40' : 'ring-white/10'
                  }`}
                  style={{ backgroundColor: step.bg, color: step.color }}
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
                <div className="relative h-px w-full bg-gradient-to-r from-[var(--eu-blue)] via-[var(--eu-blue)]/40 to-[var(--eu-yellow)]">
                  <span
                    className={`absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--eu-yellow)] transition-transform duration-300 ${
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
              <div
                className="mb-4 inline-flex rounded-xl p-2.5 ring-1 ring-white/10"
                style={{ backgroundColor: step.bg, color: step.color }}
              >
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
