'use client';

import { Bot, Hand, SlidersHorizontal, Sparkles, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

const levels = [
  {
    id: 'human',
    label: 'Fully human',
    short: 'Human',
    icon: UserRound,
    pct: 0,
    desc: 'Engineers drive every change. Strict validation gates before merge.',
    trace: 'validate(strict=true) → human_review → deploy',
  },
  {
    id: 'loop',
    label: 'Human in the loop',
    short: 'HITL',
    icon: Hand,
    pct: 45,
    desc: 'Agents draft YAML and run dry-runs. Humans approve before deploy.',
    trace: 'agent draft → validate → approve → deploy',
  },
  {
    id: 'agentic',
    label: 'Fully agentic',
    short: 'Agentic',
    icon: Sparkles,
    pct: 100,
    desc: 'MCP skills orchestrate validate, generate, and dry-run deploy autonomously.',
    trace: 'search → validate → deploy(dry_run=true)',
  },
] as const;

export function AutonomySpectrum() {
  const [active, setActive] = useState(1);
  const level = levels[active];

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % levels.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="landing-surface-card overflow-hidden">
      <div className="border-b border-white/[0.06] p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="landing-mcp-ping absolute inline-flex size-full rounded-full bg-[var(--eu-yellow)] opacity-40" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[var(--eu-yellow)]" />
            </span>
            <p className="font-mono text-xs text-[var(--landing-muted)]">opentide-mcp · autonomy dial</p>
          </div>
          <SlidersHorizontal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
        </div>

        <div className="relative mt-8">
          <div className="h-2 rounded-full bg-[var(--landing-bg)] ring-1 ring-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--eu-blue)] via-[var(--eu-yellow)]/60 to-[var(--eu-yellow)] transition-all duration-700"
              style={{ width: `${level.pct}%` }}
            />
          </div>
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-0.5">
            {levels.map((l, i) => {
              const Icon = l.icon;
              const on = active === i;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex size-9 -translate-y-1 items-center justify-center rounded-full border transition-all duration-300 ${
                    on
                      ? 'border-[var(--eu-yellow)] bg-[var(--eu-yellow)] text-[var(--landing-bg)] shadow-[0_0_20px_rgba(255,204,0,0.35)]'
                      : 'border-white/10 bg-[var(--landing-surface)] text-[var(--landing-subtle)] hover:border-white/20'
                  }`}
                  aria-pressed={on}
                  aria-label={l.label}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex items-start justify-between gap-3 text-[10px] font-medium uppercase tracking-wider text-[var(--landing-subtle)]">
          <span className={active === 0 ? 'text-[var(--eu-blue)]' : ''}>Human</span>
          <span className={active === 1 ? 'text-[var(--eu-yellow)]' : ''}>Collaborative</span>
          <span className={active === 2 ? 'text-[var(--eu-yellow)]' : ''}>Agentic</span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-white/[0.06] p-5 md:border-b-0 md:border-r md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--eu-yellow)]">{level.short} mode</p>
          <h3 className="mt-2 text-lg font-bold text-[var(--landing-ink)]">{level.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{level.desc}</p>
        </div>

        <div className="bg-[var(--landing-bg)]/40 p-5 md:p-6">
          <div className="flex items-center gap-2 text-[10px] text-[var(--landing-subtle)]">
            <Bot className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
            <span className="font-mono">live trace</span>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {level.trace.split(' → ').map((step, i, arr) => (
              <span
                key={step}
                className={`w-fit rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-all duration-300 ${
                  i === arr.length - 1
                    ? 'bg-[var(--eu-yellow)]/10 text-[var(--eu-yellow)] ring-1 ring-[var(--eu-yellow)]/25'
                    : 'bg-[var(--landing-surface)] text-[var(--landing-muted)] ring-1 ring-white/[0.06]'
                }`}
              >
                {i > 0 && <span className="mr-1.5 text-[var(--landing-dim)]">→</span>}
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
