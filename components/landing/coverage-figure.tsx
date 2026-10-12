'use client';

import { ArrowDown, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tag } from '@/components/landing/ui';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

/**
 * One attack path, as the graph holds it: four threats chained in sequence, each landing on
 * one of your assets through its surface, and each covered by an objective and its rules, or
 * not. Illustrative content; the shape is the ontology's.
 */
type Step = {
  asset: string;
  surface: string;
  criticality: string;
  threat: string;
  ref: string;
  objective: string | null;
  rules: string[];
};

const PATH: Step[] = [
  {
    asset: 'Edge firewalls',
    surface: 'Firewalls::Palo Alto Networks',
    criticality: 'High',
    threat: 'Gateway exploitation',
    ref: 'T1190 · CVE-2026-0300',
    objective: 'Portal exploitation on PAN-OS',
    rules: ['Threat log · SPL'],
  },
  {
    asset: 'Corporate workstations',
    surface: 'Windows::Desktop::11',
    criticality: 'Medium',
    threat: 'Credential dumping from LSASS',
    ref: 'T1003.001',
    objective: 'Credential access via LSASS',
    rules: ['LSASS · KQL', 'LSASS · SPL'],
  },
  {
    asset: 'Windows servers',
    surface: 'Windows::Server::2022',
    criticality: 'High',
    threat: 'Lateral movement over SMB',
    ref: 'T1021.002',
    objective: null,
    rules: [],
  },
  {
    asset: 'File servers',
    surface: 'Windows::Server::2022',
    criticality: 'Severe',
    threat: 'Ransomware deployment',
    ref: 'T1486',
    objective: 'Mass file encryption',
    rules: ['Encryption burst · KQL'],
  },
];

const COVERED = PATH.filter((s) => s.objective).length;

type Focus = 'assets' | 'path' | 'detection' | 'gap';

const QUESTIONS: { key: Focus; question: string; answer: string }[] = [
  { key: 'assets', question: 'Does it hit what we run?', answer: 'Each threat’s surface meets your assets, ranked by criticality.' },
  { key: 'path', question: 'How does the attack unfold?', answer: 'Threats chain into an attack path, one step after another.' },
  { key: 'detection', question: 'What fires at each step?', answer: 'An objective and its signals, implemented by rules on your integrations.' },
  { key: 'gap', question: 'Where does detection break?', answer: 'Lateral movement on High-criticality servers: nothing covers it.' },
];

const BEAT_MS = 1300;
const HOLD_MS = 2600;

/* Heatmap */

const COLS = 14;
const ROWS = 9;

/** A stable, uneven fill: about 85% of cells lit, in three strengths. */
function heat(i: number) {
  const h = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  const r = h - Math.floor(h);
  if (r < 0.15) return 0;
  return r < 0.42 ? 1 : r < 0.72 ? 2 : 3;
}

const STRENGTH = ['', 'opacity-25', 'opacity-55', 'opacity-90'];

function Heatmap({ shown }: { shown: boolean }) {
  return (
    <div aria-hidden className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const level = heat(i);
        return (
          <span key={i} className="relative aspect-square rounded-[3px] bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)]">
            {level > 0 && (
              <span
                className={`absolute inset-0 rounded-[3px] bg-[var(--landing-accent)] transition-opacity duration-500 ${shown ? STRENGTH[level] : 'opacity-0'}`}
                style={{ transitionDelay: `${(i % COLS) * 45 + (i % 3) * 30}ms` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/* Attack path */

const node = 'rounded-xl border bg-[var(--landing-panel)] px-3 py-2.5 transition-[border-color,box-shadow,opacity] duration-300';

function Link({ on, gap, dim }: { on: boolean; gap?: boolean; dim: boolean }) {
  return (
    <span
      aria-hidden
      className={`block self-center transition-opacity duration-300 ${dim ? 'opacity-25' : ''} ${
        gap
          ? 'border-t border-dashed border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]'
          : `h-px ${on ? 'bg-[var(--landing-accent)]' : 'bg-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)]'}`
      }`}
    />
  );
}

function AttackPath({ at, focus }: { at: number; focus: Focus | null }) {
  const dim = (...parts: Focus[]) => focus !== null && !parts.includes(focus);

  return (
    <div className="grid grid-cols-[minmax(0,0.95fr)_1rem_minmax(0,1.15fr)_1rem_minmax(0,1fr)_1rem_minmax(0,0.85fr)] gap-y-7">
      {['your assets', 'attack path', 'objectives', 'rules'].map((label, k) => (
        <p key={label} className={`-mb-4 font-mono text-[11px] text-[var(--landing-subtle)] ${k > 0 ? 'col-span-2 pl-4' : ''}`}>
          {label}
        </p>
      ))}

      {PATH.map((step, i) => {
        const reached = i <= at;
        const current = i === at;
        const covered = step.objective !== null;
        // Asking about the gap fades every step that is covered.
        const row = focus === 'gap' && covered ? 'opacity-25' : '';
        return (
          <div key={step.threat} className="contents">
            <div
              className={`${node} ${row || (dim('assets') ? 'opacity-25' : '')} ${
                focus === 'assets' ? 'border-[var(--landing-accent)]' : 'border-[var(--landing-border)]'
              }`}
            >
              <p className="text-[13px] font-semibold leading-snug text-[var(--landing-ink)]">{step.asset}</p>
              <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-[var(--landing-subtle)] [overflow-wrap:anywhere]">
                {step.surface}
              </p>
              <p className="mt-1 font-mono text-[10.5px] text-[var(--landing-muted)]">criticality {step.criticality}</p>
            </div>

            <Link on={reached} dim={Boolean(row) || dim('assets', 'path')} />

            <div
              className={`relative ${node} ${row || (dim('path', 'gap') ? 'opacity-25' : '')} ${
                current || focus === 'path'
                  ? 'border-[var(--landing-accent)] shadow-[0_8px_24px_-14px_var(--landing-btn-shadow)]'
                  : reached
                    ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]'
                    : 'border-[var(--landing-border)]'
              }`}
            >
              <p className="font-mono text-[10.5px] text-[var(--landing-subtle)]">
                {String(i + 1).padStart(2, '0')} · {step.ref}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[var(--landing-ink)]">{step.threat}</p>
              {/* The chain: this threat precedes the next one. */}
              {i < PATH.length - 1 && (
                <span aria-hidden className="absolute left-1/2 top-full flex h-7 -translate-x-1/2 flex-col items-center">
                  <span className="relative block w-px flex-1 bg-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)]">
                    <span
                      className={`absolute inset-0 origin-top bg-[var(--landing-accent)] transition-transform duration-500 ${
                        i < at ? 'scale-y-100' : 'scale-y-0'
                      }`}
                    />
                  </span>
                  <ArrowDown
                    className={`-mt-1.5 size-3 transition-colors ${
                      i < at ? 'text-[var(--landing-accent)]' : 'text-[color-mix(in_srgb,var(--landing-ink)_35%,transparent)]'
                    }`}
                  />
                </span>
              )}
            </div>

            <Link on={reached && covered} gap={!covered} dim={Boolean(row) || dim('detection', 'gap')} />

            {covered ? (
              <div
                className={`${node} ${row || (dim('detection') ? 'opacity-25' : '')} ${
                  reached ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]' : 'border-[var(--landing-border)]'
                }`}
              >
                <p className="font-mono text-[10.5px] text-[var(--landing-subtle)]">objective</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[var(--landing-ink)]">{step.objective}</p>
              </div>
            ) : (
              <div
                className={`relative flex flex-col justify-center rounded-xl border border-dashed px-3 py-2.5 transition-[border-color,opacity] duration-300 ${
                  dim('detection', 'gap') ? 'opacity-25' : ''
                } ${reached || focus === 'gap' ? 'border-[var(--landing-accent)]' : 'border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]'}`}
              >
                {reached && (
                  <span
                    aria-hidden
                    className="landing-ring pointer-events-none absolute -inset-1.5 rounded-[0.9rem] border border-dashed border-[var(--landing-accent)]"
                  />
                )}
                <p className={`font-mono text-[10.5px] ${reached ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}>gap</p>
                <p
                  className={`mt-0.5 text-[13px] font-semibold leading-snug ${
                    reached ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-muted)]'
                  }`}
                >
                  No objective covers it
                </p>
              </div>
            )}

            <Link on={reached && covered} gap={!covered} dim={Boolean(row) || dim('detection', 'gap')} />

            <div className={`flex flex-col justify-center gap-1.5 transition-opacity duration-300 ${row || (dim('detection', 'gap') ? 'opacity-25' : '')}`}>
              {covered ? (
                step.rules.map((rule) => (
                  <span
                    key={rule}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors duration-300 ${
                      reached
                        ? 'border-transparent bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                        : 'border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-ink)]'
                    }`}
                  >
                    <Radio className={`size-3 shrink-0 ${reached && current ? 'animate-pulse' : ''}`} aria-hidden />
                    {rule}
                  </span>
                ))
              ) : (
                <span className={`font-mono text-[11px] ${reached ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}>
                  undetected
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Narrow screens: the same path as a list, each step with its asset and what covers it. */
function AttackPathList({ at }: { at: number }) {
  return (
    <ol className="m-0 list-none space-y-3 p-0">
      {PATH.map((step, i) => {
        const reached = i <= at;
        const covered = step.objective !== null;
        return (
          <li
            key={step.threat}
            className={`rounded-xl border p-3.5 transition-colors duration-300 ${
              !covered && reached
                ? 'border-dashed border-[var(--landing-accent)]'
                : reached
                  ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]'
                  : 'border-[var(--landing-border)]'
            }`}
          >
            <p className="font-mono text-[10.5px] text-[var(--landing-subtle)]">
              {String(i + 1).padStart(2, '0')} · {step.asset} · {step.criticality}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--landing-ink)]">{step.threat}</p>
            <p className={`mt-1 text-[13px] ${covered ? 'text-[var(--landing-muted)]' : 'font-semibold text-[var(--landing-accent)]'}`}>
              {covered ? `${step.objective} → ${step.rules.join(', ')}` : 'Gap: no objective covers it'}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Heatmap versus graph. The heatmap scores techniques; the graph follows an attack path across
 * your assets and shows which steps fire a rule. A replay walks the path; the questions below
 * light up the part of the graph that answers them.
 */
export function CoverageFigure() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen, seen } = useOnScreen<HTMLDivElement>();
  // The step the replay has reached; PATH.length means the whole path is shown, which is also
  // the static render, so the page reads the same without JavaScript.
  const [at, setAt] = useState(PATH.length);
  const [focus, setFocus] = useState<Focus | null>(null);

  const playing = onScreen && !reduced && focus === null;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setAt((n) => (n >= PATH.length ? 0 : n + 1)), at >= PATH.length ? HOLD_MS : BEAT_MS);
    return () => window.clearTimeout(id);
  }, [playing, at]);

  const shownAt = focus !== null || reduced ? PATH.length : at;

  return (
    <div ref={ref}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <figure className="landing-panel m-0 flex flex-col p-6 md:p-8">
          <figcaption className="flex items-start justify-between gap-4">
            <span>
              <span className="block font-mono text-xs text-[var(--landing-subtle)]">att&amp;ck heatmap</span>
              <span className="mt-1 block text-sm font-semibold text-[var(--landing-ink)]">A score per technique</span>
            </span>
            <span className="text-right">
              <span className="block text-3xl font-bold tracking-[-0.03em] text-[var(--landing-muted)]">85%</span>
              <span className="font-mono text-[11px] text-[var(--landing-subtle)]">of techniques have a rule</span>
            </span>
          </figcaption>
          <div className="mx-auto mt-6 w-full max-w-md xl:max-w-none">
            <Heatmap shown={seen || reduced} />
          </div>
          <p className="mt-auto pt-6 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">
            A colour per technique. It cannot say which threats reach your assets, or where an attack path goes
            unseen.
          </p>
        </figure>

        <figure className="landing-panel m-0 flex flex-col p-6 ring-1 ring-[color-mix(in_srgb,var(--landing-accent)_35%,transparent)] md:p-8">
          <figcaption className="flex flex-wrap items-start justify-between gap-3">
            <span>
              <span className="block font-mono text-xs text-[var(--landing-accent)]">opentide graph</span>
              <span className="mt-1 block text-sm font-semibold text-[var(--landing-ink)]">An attack path across your assets</span>
            </span>
            <Tag tone="accent">
              {COVERED} of {PATH.length} steps detected
            </Tag>
          </figcaption>
          <div className="mt-6 hidden sm:block">
            <AttackPath at={shownAt} focus={focus} />
          </div>
          <div className="mt-6 sm:hidden">
            <AttackPathList at={shownAt} />
          </div>
        </figure>
      </div>

      <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-border)] p-0 sm:grid-cols-2 xl:grid-cols-4">
        {QUESTIONS.map((q, k) => {
          const on = focus === q.key;
          return (
            <li key={q.key} className="bg-[var(--landing-panel)]">
              <button
                type="button"
                onPointerEnter={() => setFocus(q.key)}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus(q.key)}
                onBlur={() => setFocus(null)}
                className={`flex h-full w-full flex-col items-start p-5 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                  on ? 'bg-[color-mix(in_srgb,var(--landing-accent)_6%,var(--landing-panel))]' : ''
                }`}
              >
                <span className={`font-mono text-xs ${on ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}>
                  {String(k + 1).padStart(2, '0')}
                </span>
                <span className={`mt-2 text-base font-semibold tracking-[-0.01em] ${on ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-ink)]'}`}>
                  {q.question}
                </span>
                <span className="mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">{q.answer}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
