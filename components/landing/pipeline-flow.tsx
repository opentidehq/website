'use client';

import { Check, ChevronRight, GitMerge } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const STAGES = [
  {
    title: 'Author',
    body: 'Threats, objectives and rules as YAML, from generated templates.',
    command: 'objects/*.yaml',
  },
  {
    title: 'Generate',
    body: 'Deterministic schemas, templates, vocabularies and snippets. Safe to commit.',
    command: 'opentide generate',
  },
  {
    title: 'Validate',
    body: 'Schema, unique UUIDs, references, vocabularies. Exit 1 blocks the merge.',
    command: 'opentide validate --strict',
  },
  {
    title: 'Deploy',
    body: 'Per integration and tenant. Staging from the pull request, production on merge.',
    command: 'opentide deploy',
  },
  {
    title: 'Document',
    body: 'Wiki pages with chaining diagrams and ATT&CK coverage.',
    command: 'opentide generate docs',
  },
] as const;

const PR_LANE = ['validate --strict', 'lint --strict', 'validate query --live', 'generate', 'deploy --plan STAGING'] as const;

/**
 * One run of the pipeline, as a script: the stages light up in turn, then the CI that
 * `opentide setup ci` writes runs the pull request, waits on a person, and ships. Each beat
 * lasts `ms`; the last one is the hold before the next run.
 */
const BEATS = [
  ...STAGES.map(() => 900),
  ...PR_LANE.map(() => 650),
  1600, // a human merges
  800, // deploy --plan PRODUCTION
  2600, // hold
];
const STAGE_END = STAGES.length;
const PR_END = STAGE_END + PR_LANE.length;
const MERGE = PR_END;
const PROD = PR_END + 1;
const DONE = BEATS.length - 1;

type State = 'idle' | 'run' | 'done';

function stateAt(beat: number, at: number): State {
  if (beat > at) return 'done';
  return beat === at ? 'run' : 'idle';
}

function Chip({ children, state, solid }: { children: ReactNode; state: State; solid?: boolean }) {
  const tone =
    state === 'idle'
      ? 'border border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-subtle)]'
      : solid
        ? 'border border-transparent bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
        : 'border border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)] bg-[var(--landing-panel)] text-[var(--landing-ink)]';
  return (
    <span className={`relative inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition-colors duration-300 ${tone}`}>
      {state === 'run' && (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="landing-ping absolute inset-0 rounded-full bg-current" />
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      )}
      {state === 'done' && <Check className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

function Lane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[8rem_minmax(0,1fr)] md:items-center md:gap-6">
      <p className="font-mono text-xs text-[var(--landing-subtle)]">{label}</p>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">{children}</div>
    </div>
  );
}

const arrow = <ChevronRight className="size-3.5 shrink-0 text-[var(--landing-dim)]" aria-hidden />;

/** Author → generate → validate → deploy → document, and the CI that `opentide setup ci` writes for it. */
export function PipelineFlow() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen } = useOnScreen<HTMLDivElement>();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduced || !onScreen) return;
    const id = window.setTimeout(() => setBeat((b) => (b >= DONE ? 0 : b + 1)), BEATS[beat]);
    return () => window.clearTimeout(id);
  }, [beat, onScreen, reduced]);

  // Reduced motion shows a finished run.
  const now = reduced ? DONE : beat;

  return (
    <div ref={ref} className="landing-panel overflow-hidden">
      {/* gap-px over a border-coloured fill draws the dividers for any column count. */}
      <ol className="grid list-none grid-cols-1 gap-px bg-[var(--landing-border)] p-0 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage, i) => {
          const state = stateAt(now, i);
          return (
            <li
              key={stage.title}
              className={`relative flex flex-col p-6 transition-colors duration-500 sm:last:col-span-2 lg:last:col-span-1 ${
                state === 'run' ? 'bg-[color-mix(in_srgb,var(--landing-accent)_5%,var(--landing-panel))]' : 'bg-[var(--landing-panel)]'
              }`}
            >
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-[var(--landing-accent)] transition-transform ease-linear ${
                  state === 'idle' ? 'scale-x-0 duration-0' : 'scale-x-100 duration-[900ms]'
                }`}
              />
              <span className="flex items-center gap-2 font-mono text-xs text-[var(--landing-accent)]">
                {String(i + 1).padStart(2, '0')}
                {state === 'done' && <Check className="size-3.5" aria-hidden />}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-[var(--landing-ink)]">{stage.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--landing-muted)]">{stage.body}</p>
              <code
                className={`mt-5 self-start rounded-md px-2 py-1 font-mono text-xs transition-colors duration-300 ${
                  state === 'run'
                    ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                    : 'bg-[color-mix(in_srgb,var(--landing-ink)_5%,transparent)] text-[var(--landing-ink)]'
                }`}
              >
                {stage.command}
              </code>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-[var(--landing-border)] bg-[var(--landing-band)] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs text-[var(--landing-subtle)]">
          <p>
            ci, generated by <span className="text-[var(--landing-ink)]">opentide setup ci</span> · github · gitlab
            · azure
          </p>
          <p>pins the opentide version you ran</p>
        </div>
        <div className="mt-5 space-y-4">
          <Lane label="pull request">
            {PR_LANE.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1">
                {i > 0 && arrow}
                <Chip state={stateAt(now, STAGE_END + i)} solid={i === PR_LANE.length - 1}>
                  {step}
                </Chip>
              </span>
            ))}
          </Lane>
          <Lane label="merge to main">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition-colors duration-300 ${
                stateAt(now, MERGE) === 'idle'
                  ? 'border border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-subtle)]'
                  : 'border border-transparent bg-[var(--landing-ink)] text-[var(--landing-bg)]'
              }`}
            >
              <GitMerge className="size-3.5" aria-hidden />
              {stateAt(now, MERGE) === 'run' ? 'waiting on a reviewer…' : 'a human merges'}
            </span>
            {arrow}
            <Chip state={stateAt(now, PROD)} solid>
              deploy --plan PRODUCTION
            </Chip>
            <span className="ml-2 font-mono text-xs text-[var(--landing-subtle)]">
              add a protected environment for a second approval
            </span>
          </Lane>
        </div>
      </div>
    </div>
  );
}
