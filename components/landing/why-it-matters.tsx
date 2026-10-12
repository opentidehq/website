'use client';

import { useInView } from '@/lib/hooks/use-in-view';
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
  { title: 'A spec', body: 'An ontology and a taxonomy for what a detection is.' },
  { title: 'Threat alignment', body: 'Every rule traces to an objective and a threat.' },
  { title: 'Quality gates', body: 'Strict validation in CI, for humans and agents alike.' },
  { title: 'Maintainability', body: 'One model across seven platforms, versioned in git.' },
] as const;

function MeterRow({ meter, shown, reduced }: { meter: Meter; shown: boolean; reduced: boolean }) {
  const bar = 'h-2.5 rounded-full';
  // Both bars share one track: the row minus room for the result label that follows.
  const track = '(100% - 6rem)';
  const grow = (to: number) => ({
    width: `calc(${track} * ${shown || reduced ? to : 0})`,
    transition: reduced ? undefined : 'width 900ms cubic-bezier(0.22, 1, 0.36, 1) 150ms',
  });

  return (
    <div>
      <p className="text-base font-semibold text-[var(--landing-ink)]">{meter.title}</p>
      <dl className="mt-3 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 font-mono text-xs">
        <dt className="text-[var(--landing-subtle)]">by hand</dt>
        <dd className="m-0">
          <span
            className={`${bar} block bg-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)]`}
            style={{ width: `calc(${track})` }}
          />
          <span className="sr-only">the baseline</span>
        </dd>
        <dt className="text-[var(--landing-subtle)]">with agents</dt>
        <dd className="m-0 flex items-center gap-3">
          <span className={`${bar} block shrink-0 bg-[var(--landing-accent)]`} style={grow(meter.withAgents)} aria-hidden />
          <span className="shrink-0 font-semibold text-[var(--landing-accent)]">{meter.result}</span>
        </dd>
      </dl>
    </div>
  );
}

/** Why it matters: the query got cheap, the alignment did not. What stays scarce is the spec. */
export function WhyItMatters() {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
      <div>
        <div className="space-y-10">
          {METERS.map((m) => (
            <MeterRow key={m.title} meter={m} shown={inView} reduced={reduced} />
          ))}
        </div>
        <p className="mt-10 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          Threat alignment, coverage and maintenance did not get cheaper with the text. A spec has to
          carry that work.
        </p>
      </div>

      <div>
        <p className="font-mono text-sm text-[var(--landing-subtle)]">what becomes scarce</p>
        <ol className="mt-4 list-none p-0">
          {SCARCE.map((item, i) => (
            <li
              key={item.title}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-t border-[var(--landing-border)] py-5 last:border-b"
            >
              <span className="pt-1 font-mono text-sm text-[var(--landing-accent)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)]">{item.title}</p>
                <p className="mt-1 text-base leading-relaxed text-[var(--landing-muted)]">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[var(--landing-accent)]">
          That is what opentide is.
        </p>
      </div>
    </div>
  );
}
