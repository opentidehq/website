import type { CSSProperties } from 'react';
import {
  Check,
  GitPullRequest,
  Lock,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

type Stop = {
  title: string;
  lines: [string, string];
  icon: LucideIcon;
  /** `agent`: agents or opentide do this step. `human`: a person has to act. */
  actor: 'source' | 'agent' | 'tool' | 'human' | 'env';
};

/** Who carries the segment that leaves each stop: agents and opentide, or a waiting human. */
type Segment = 'agent' | 'human';

const STOPS: Stop[] = [
  { title: 'Intel lands', lines: ['an advisory, a report,', 'a ticket'], icon: Radio, actor: 'source' },
  { title: 'Agent drafts', lines: ['the chain, in YAML', 'skills + MCP'], icon: Sparkles, actor: 'agent' },
  { title: 'opentide checks', lines: ['validate --strict', 'validate query --live'], icon: Check, actor: 'tool' },
  { title: 'PR opened', lines: ['branch + diff', 'CI gates run'], icon: GitPullRequest, actor: 'agent' },
  { title: 'STAGING', lines: ['from the pull request', '--plan STAGING'], icon: Rocket, actor: 'env' },
  { title: 'Human review', lines: ['a reviewer', 'approves the merge'], icon: Lock, actor: 'human' },
  { title: 'PRODUCTION', lines: ['on merge', '--plan PRODUCTION'], icon: ShieldCheck, actor: 'env' },
];

/** Where stop `i` sits on the wide track, as a percentage of its width. */
const centre = (i: number) => `${(((2 * i + 1) / (2 * STOPS.length)) * 100).toFixed(2)}%`;

const STAGING = STOPS.findIndex((s) => s.title === 'STAGING');
const REVIEW = STOPS.findIndex((s) => s.actor === 'human');

/** The pulse's waypoints: the first stop, STAGING, the human review, and the last stop. */
const TRACK = {
  '--voyage-from': centre(0),
  '--voyage-wait': centre(STAGING),
  '--voyage-merge': centre(REVIEW),
  '--voyage-to': centre(STOPS.length - 1),
} as CSSProperties;

/** SEGMENTS[i] joins STOPS[i] → STOPS[i + 1]. Dotted runs are time spent waiting on a person. */
const SEGMENTS: Segment[] = ['agent', 'agent', 'agent', 'agent', 'human', 'agent'];

function Node({ stop }: { stop: Stop }) {
  const Icon = stop.icon;
  const base = 'relative z-10 flex size-12 shrink-0 items-center justify-center md:size-14';
  if (stop.actor === 'human') {
    return (
      <span className={`${base} rounded-xl bg-[var(--landing-ink)] text-[var(--landing-bg)]`}>
        <Icon className="size-5" aria-hidden />
      </span>
    );
  }
  if (stop.actor === 'agent') {
    return (
      <span className={`${base} rounded-full bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]`}>
        <Icon className="size-5" aria-hidden />
      </span>
    );
  }
  if (stop.actor === 'source') {
    return (
      <span
        className={`${base} rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-subtle)]`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={`${base} rounded-full border-2 border-[var(--landing-accent)] bg-[var(--landing-panel)] text-[var(--landing-accent)]`}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function SegmentLine({ kind, vertical }: { kind: Segment; vertical?: boolean }) {
  if (kind === 'agent') {
    return (
      <span
        aria-hidden
        className={vertical ? 'block w-[3px] flex-1 bg-[var(--landing-accent)]' : 'block h-[3px] flex-1 bg-[var(--landing-accent)]'}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={
        vertical
          ? 'block flex-1 border-l-[3px] border-dotted border-[var(--landing-ink)] opacity-70'
          : 'block flex-1 border-t-[3px] border-dotted border-[var(--landing-ink)] opacity-70'
      }
    />
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-[var(--landing-subtle)]">
      <li className="flex items-center gap-3">
        <span aria-hidden className="block h-[3px] w-8 bg-[var(--landing-accent)]" />
        agents + opentide
      </li>
      <li className="flex items-center gap-3">
        <span aria-hidden className="block w-8 border-t-[3px] border-dotted border-[var(--landing-ink)] opacity-70" />
        waiting on a human
      </li>
    </ul>
  );
}

/**
 * Intel to reviewed, deployed detection, in the order `opentide setup ci` runs it: STAGING
 * deploys from the pull request, PRODUCTION from the human merge. Solid runs are agents and
 * opentide; the dotted run is a deliberate wait on a person. A pulse rides the wide track:
 * quick through the automated stretch, slow along the wait.
 */
export function NorthStar() {
  // Container queries, not viewport breakpoints: the same track sits in the landing and in
  // a blog article, and only the wide one has room for seven stops side by side.
  return (
    <div className="@container">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-xl font-mono text-sm text-[var(--landing-muted)]">
          <span className="font-semibold text-[var(--landing-accent)]">target</span> sub-hour from
          intel to STAGING, with a human approving every promotion
        </p>
        <Legend />
      </div>

      {/* Wide containers: one horizontal track, with the sub-hour stretch bracketed above it. */}
      <div className="relative mt-16 hidden @5xl:block" style={TRACK}>
        <div
          aria-hidden
          className="absolute -top-9 h-4 border-x-2 border-t-2 border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]"
          style={{ left: centre(0), right: `calc(100% - ${centre(STAGING)})` }}
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--landing-bg)] px-3 font-mono text-xs font-semibold text-[var(--landing-accent)]">
            under an hour
          </span>
        </div>
        {/* The pulse rides a track-wide layer, so translateX percentages are track percentages. */}
        <span aria-hidden className="landing-voyage pointer-events-none absolute inset-x-0 top-6 z-20 motion-reduce:hidden md:top-7">
          <span className="-ml-2 -mt-2 block size-4 rounded-full bg-[var(--landing-accent)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--landing-accent)_22%,transparent),0_0_24px_4px_color-mix(in_srgb,var(--landing-accent)_45%,transparent)]" />
        </span>
        <ol className="grid list-none p-0" style={{ gridTemplateColumns: `repeat(${STOPS.length}, minmax(0, 1fr))` }}>
          {STOPS.map((stop, i) => (
            <li key={stop.title} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center">
                {i === 0 ? <span className="flex-1" aria-hidden /> : <SegmentLine kind={SEGMENTS[i - 1]} />}
                <Node stop={stop} />
                {i === STOPS.length - 1 ? <span className="flex-1" aria-hidden /> : <SegmentLine kind={SEGMENTS[i]} />}
              </div>
              <p className="mt-5 text-base font-semibold tracking-tight text-[var(--landing-ink)] xl:text-lg">
                {stop.title}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--landing-subtle)] xl:text-xs">
                {stop.lines[0]}
                <br />
                {stop.lines[1]}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Narrow containers: the same track, vertical. */}
      <ol className="mt-10 list-none p-0 @5xl:hidden">
        {STOPS.map((stop, i) => (
          <li key={stop.title} className="flex gap-5">
            <div className="flex flex-col items-center">
              <Node stop={stop} />
              {i < STOPS.length - 1 && (
                <div className="flex min-h-10 flex-1 flex-col items-center">
                  <SegmentLine kind={SEGMENTS[i]} vertical />
                </div>
              )}
            </div>
            <div className="pb-8 pt-2">
              <p className="text-base font-semibold tracking-tight text-[var(--landing-ink)]">{stop.title}</p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--landing-subtle)]">
                {stop.lines[0]}
                <br />
                {stop.lines[1]}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
