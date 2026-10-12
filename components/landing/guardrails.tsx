import { Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { BlockHead } from '@/components/landing/ui';

const code = (text: string) => <code className="font-mono text-[0.85em] text-[var(--landing-ink)]">{text}</code>;

const AGENTS: ReactNode[] = [
  'Search, read and summarise objects and coverage',
  'Draft objects from templates',
  <>Run {code('validation_report')} and surface concrete errors</>,
  'Fix dangling references and vocabulary violations',
  <>Preview deploys with {code('dry_run=true')}</>,
];

const HUMANS: ReactNode[] = [
  'Real, non-dry-run deploys to production',
  <>Bulk promotion to {code('PRODUCTION')}</>,
  <>Credentials and deployment plans in {code('.opentide/configurations/')}</>,
  'Trusting a query check that did not run against the tenant',
  'Regenerating or hand-editing UUIDs',
];

function Side({
  title,
  caption,
  items,
  icon,
  className,
}: {
  title: string;
  caption: string;
  items: ReactNode[];
  icon: 'agent' | 'human';
  className?: string;
}) {
  return (
    <div className={`p-6 md:p-10 ${className ?? ''}`}>
      <p className="font-mono text-xs text-[var(--landing-subtle)]">{caption}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)]">{title}</p>
      <ul data-reveal-group className="mt-6 list-none space-y-3.5 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[var(--landing-muted)]">
            {icon === 'agent' ? (
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] text-[var(--landing-accent)]">
                <Check className="size-3" aria-hidden />
              </span>
            ) : (
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-[var(--landing-bg)]">
                <Lock className="size-2.5" aria-hidden />
              </span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Where the line sits between agents and people. */
export function Guardrails() {
  return (
    <div>
      <BlockHead title="What agents may do, and what stays human." />
      <div
        data-reveal
        className="landing-panel mt-8 grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_0_minmax(0,1fr)]"
      >
        <Side
          caption="agents and opentide"
          title="Let agents"
          items={AGENTS}
          icon="agent"
          className="bg-[color-mix(in_srgb,var(--landing-accent)_4%,transparent)] pb-12"
        />
        {/* The gate between the two: a pull request, and a person who merges it. */}
        <div aria-hidden className="relative flex h-0 items-center justify-center md:h-auto">
          <span className="absolute inset-x-0 top-0 h-px bg-[var(--landing-border)] md:inset-x-auto md:inset-y-0 md:left-0 md:h-full md:w-px" />
          <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-[var(--landing-bg)] ring-[6px] ring-[var(--landing-panel)]">
            <Lock className="size-4" />
          </span>
        </div>
        <Side caption="people" title="Keep a human in the loop" items={HUMANS} icon="human" className="pt-12 md:pl-14" />
      </div>

      <p className="mt-6 text-base font-semibold text-[var(--landing-ink)]">
        Strict gates keep agent output{' '}
        <span className="text-[var(--landing-accent)]">threat-aligned and shippable.</span>
      </p>
    </div>
  );
}
