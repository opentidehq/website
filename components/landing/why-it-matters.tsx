'use client';

import { Caption } from '@/components/landing/ui';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Meter = {
  title: string;
  /** Share of the by-hand effort that is left once agents help, 0–1. */
  withAgents: number;
  result: string;
};

const METERS: Meter[] = [
  { title: 'Writing a detection query', withAgents: 0.05, result: 'seconds' },
  { title: 'Aligning and maintaining it', withAgents: 0.86, result: 'still hours' },
];

const SCARCE = [
  { title: 'A spec', body: 'An ontology and a taxonomy for what a detection is.', art: 'spec' },
  { title: 'Threat alignment', body: 'Every rule traces to an objective and a threat.', art: 'chain' },
  { title: 'Quality gates', body: 'Strict validation in CI, for humans and agents alike.', art: 'gate' },
  { title: 'Maintainability', body: 'One model across every integration, versioned in git.', art: 'fan' },
] as const;

type Art = (typeof SCARCE)[number]['art'];

/** A small real artefact at the top of each card: what that scarce thing looks like in opentide. */
function Artefact({ art }: { art: Art }) {
  const mono = 'font-mono text-[11.5px] leading-[1.7]';
  if (art === 'spec') {
    return (
      <p className={`${mono} text-[var(--landing-muted)]`}>
        <span className="text-[var(--landing-subtle)]">schema:</span> rule::1.1
        <br />
        <span className="text-[var(--landing-subtle)]">severity:</span>{' '}
        <span className="rounded bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] px-1 text-[var(--landing-accent)]">
          Significant incident
        </span>
        <span className="block pl-[5.2em] text-[var(--landing-dim)]">↳ severity::1.0</span>
      </p>
    );
  }
  if (art === 'gate') {
    return (
      <p className={`${mono} text-[var(--landing-ink)]`}>
        <span className="text-[var(--landing-subtle)]">$</span> opentide validate --strict
        <br />
        <span className="font-semibold text-[var(--landing-accent)]">OK</span> Validation passed
        <br />
        <span className="text-[var(--landing-subtle)]">$</span>{' '}
        <span className="landing-caret inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-[var(--landing-ink)]" />
      </p>
    );
  }
  if (art === 'chain') {
    return (
      <svg viewBox="0 0 220 56" className="h-14 w-full max-w-[15rem]" aria-hidden>
        {[0, 1].map((k) => (
          <g key={k}>
            <path d={`M${58 + k * 80},28 H${82 + k * 80}`} stroke="color-mix(in srgb, var(--landing-accent) 35%, transparent)" strokeWidth="1.5" fill="none" />
            <path d={`M${58 + k * 80},28 H${82 + k * 80}`} stroke="var(--landing-accent)" strokeWidth="2" fill="none" className="landing-flow" />
          </g>
        ))}
        {['rule', 'objective', 'threat'].map((label, k) => (
          <g key={label}>
            <rect x={2 + k * 80} y={16} width={56} height={24} rx={12} fill="var(--landing-panel)" stroke={k === 2 ? 'var(--landing-accent)' : 'color-mix(in srgb, var(--landing-ink) 22%, transparent)'} />
            <text x={30 + k * 80} y={31.5} textAnchor="middle" fontSize={10} className={`font-mono ${k === 2 ? 'fill-[var(--landing-accent)]' : 'fill-[var(--landing-ink)]'}`}>
              {label}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  const keys = ['sentinel', 'splunk', 'sentinel_one', 'crowdstrike'];
  return (
    <svg viewBox="0 0 220 64" className="h-16 w-full max-w-[15rem]" aria-hidden>
      {keys.map((key, k) => {
        const y = 8 + k * 16;
        const d = `M62,32 C96,32 96,${y} 130,${y}`;
        return (
          <g key={key}>
            <path d={d} stroke="color-mix(in srgb, var(--landing-accent) 35%, transparent)" strokeWidth="1.25" fill="none" />
            <path d={d} stroke="var(--landing-accent)" strokeWidth="1.75" fill="none" className="landing-flow" style={{ animationDelay: `${k * -0.2}s` }} />
            <text x={136} y={y + 3.5} fontSize={10} className="fill-[var(--landing-muted)] font-mono">
              {key}
            </text>
          </g>
        );
      })}
      <rect x={4} y={20} width={58} height={24} rx={12} fill="var(--landing-panel)" stroke="var(--landing-accent)" />
      <text x={33} y={35.5} textAnchor="middle" fontSize={10} className="fill-[var(--landing-accent)] font-mono">
        rule
      </text>
    </svg>
  );
}

function MeterCard({ meter, shown, reduced }: { meter: Meter; shown: boolean; reduced: boolean }) {
  const bar = 'block h-3 rounded-full';

  return (
    <div className="p-6 md:p-8">
      <p className="text-base font-semibold text-[var(--landing-ink)]">{meter.title}</p>
      <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[var(--landing-accent)] md:text-4xl">
        {meter.result}
      </p>
      <dl className="mt-6 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 font-mono text-xs">
        <dt className="text-[var(--landing-subtle)]">by hand</dt>
        <dd className="m-0">
          <span className={`${bar} bg-[color-mix(in_srgb,var(--landing-ink)_16%,transparent)]`} />
          <span className="sr-only">the baseline</span>
        </dd>
        <dt className="text-[var(--landing-subtle)]">with agents</dt>
        <dd className="m-0">
          <span
            className={`${bar} bg-[var(--landing-accent)]`}
            style={{
              width: `${(shown || reduced ? meter.withAgents : 0) * 100}%`,
              transition: reduced ? undefined : 'width 900ms cubic-bezier(0.22, 1, 0.36, 1) 150ms',
            }}
          />
          <span className="sr-only">{meter.result}</span>
        </dd>
      </dl>
    </div>
  );
}

/** Why it matters: the query got cheap, the alignment did not. What stays scarce is the spec. */
export function WhyItMatters() {
  const reduced = usePrefersReducedMotion();
  const { ref, seen: inView } = useOnScreen<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px' });

  return (
    <div className="mt-12 md:mt-16">
      <div
        ref={ref}
        className="landing-panel grid grid-cols-1 divide-y divide-[var(--landing-border)] md:grid-cols-2 md:divide-x md:divide-y-0"
      >
        {METERS.map((m) => (
          <MeterCard key={m.title} meter={m} shown={inView} reduced={reduced} />
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
        Threat alignment, coverage and maintenance did not get cheaper with the text. A spec has to
        carry that work.
      </p>

      <Caption className="mt-16 md:mt-20">what becomes scarce</Caption>
      <ol data-reveal-group className="mt-5 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {SCARCE.map((item, i) => (
          <li key={item.title} className="landing-panel flex flex-col overflow-hidden">
            <div className="flex h-28 items-center justify-center border-b border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-band)_60%,var(--landing-panel))] px-5">
              <Artefact art={item.art} />
            </div>
            <div className="p-6">
              <span className="font-mono text-sm text-[var(--landing-accent)]">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)]">{item.title}</p>
              <p className="mt-2 text-base leading-relaxed text-[var(--landing-muted)]">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-12 text-2xl font-bold tracking-[-0.025em] text-[var(--landing-accent)] md:text-3xl">
        That is what opentide is.
      </p>
    </div>
  );
}
