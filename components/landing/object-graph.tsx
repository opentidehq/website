'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Crosshair,
  FileWarning,
  KeyRound,
  Mail,
  Pause,
  Play,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { YamlPreview } from '@/components/landing/yaml-preview';
import {
  GRAPH_NODES,
  GRAPH_TOUR,
  KIND_STYLE,
  type GraphKind,
  type GraphNodeId,
} from '@/lib/landing/graph-demo';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const ICONS: Record<GraphNodeId, typeof Target> = {
  trigger: Zap,
  threat: Target,
  'obj-oauth': KeyRound,
  'rule-entra': Shield,
  'obj-mailbox': Mail,
  'rule-exo': Crosshair,
};

const STEP_MS = 3800;
const PANEL_H = 'h-[min(52vh,420px)]';

type EdgeState = 'pending' | 'flowing' | 'done';

/**
 * Where an edge sits relative to the tour: not walked yet, being walked right now, or
 * already behind us. Only the edge feeding the current node animates, so the graph reads
 * as one path being traced rather than every connector pulsing at once.
 */
function edgeState(activeId: GraphNodeId, to: GraphNodeId): EdgeState {
  const at = GRAPH_TOUR.indexOf(activeId);
  const target = GRAPH_TOUR.indexOf(to);
  if (target > at) return 'pending';
  return target === at ? 'flowing' : 'done';
}

/** Edges stay neutral until walked, then take the colour of whatever they feed. */
function edgeTone(state: EdgeState, kind: GraphKind) {
  if (state === 'pending') return 'text-[var(--landing-dim)]';
  return `${KIND_STYLE[kind].text}${state === 'done' ? ' opacity-60' : ''}`;
}

const EDGE_LABEL =
  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[15px] whitespace-nowrap font-mono text-[8px] uppercase leading-none tracking-wider';

/**
 * Straight connector between two adjacent cards.
 *
 * Stays 48px wide — the box the cards have always been laid out around — and keeps the
 * rail on the centre line so it meets the cards it joins. The label is taken out of flow
 * for that same reason: in normal flow it pushed the rail off centre.
 */
function EdgeLink({ state, kind, label }: { state: EdgeState; kind: GraphKind; label?: string }) {
  return (
    <div
      className={`relative hidden shrink-0 items-center justify-center px-1.5 transition-[color,opacity] duration-500 md:flex ${edgeTone(state, kind)}`}
      aria-hidden
    >
      {label && <span className={EDGE_LABEL}>{label}</span>}
      <svg viewBox="0 0 36 12" className="h-3 w-9" fill="none">
        <path d="M1 6h26" stroke="currentColor" strokeWidth="1.25" />
        <path d="M26 2.7 L33 6 L26 9.3 Z" fill="currentColor" />
        {state === 'flowing' && (
          <path
            className="landing-edge-comet"
            d="M1 6h26"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 32"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * One arm of the fan-out: down (or up) from the trunk, round the elbow, out to the card.
 *
 * Drawn with borders rather than SVG because the run from the trunk to the row's centre
 * line depends on the card heights, and only CSS can follow that without measuring.
 */
function ForkArm({ state, side }: { state: EdgeState; side: 'top' | 'bottom' }) {
  const elbow =
    side === 'top'
      ? 'top-1/2 -bottom-1.5 rounded-tl-lg border-l border-t'
      : '-top-1.5 bottom-1/2 rounded-bl-lg border-b border-l';

  return (
    <div
      className={`relative flex-1 transition-[color,opacity] duration-500 ${edgeTone(state, 'objective')}`}
    >
      <span className={`absolute left-[18px] right-[13px] border-current lg:right-0 ${elbow}`} />
      {/* The branch tag carries the head once there's room for it. */}
      <svg
        viewBox="0 0 7 12"
        className="absolute right-1.5 top-1/2 h-3 w-[7px] -translate-y-1/2 lg:hidden"
        fill="currentColor"
      >
        <path d="M0 2.7 L7 6 L0 9.3 Z" />
      </svg>
      {state === 'flowing' && (
        <span className="landing-edge-spark absolute left-[19px] top-1/2 size-[3px] rounded-full bg-current" />
      )}
    </div>
  );
}

/**
 * Fan-out from the threat into both objective branches.
 *
 * Mirrors the branch column's own `flex-col gap-3`, so each arm lands dead centre on its
 * row whatever height the cards settle at, and the trunk meets the spine in the gap
 * between the rows — which is exactly this column's own centre line.
 */
function ForkLink({ a, b }: { a: EdgeState; b: EdgeState }) {
  return (
    <div className="relative hidden w-12 shrink-0 flex-col gap-3 md:flex" aria-hidden>
      <span
        className={`absolute left-1.5 top-1/2 w-[13px] border-t border-current transition-[color,opacity] duration-500 ${edgeTone(a, 'objective')}`}
      />
      <ForkArm state={a} side="top" />
      <ForkArm state={b} side="bottom" />
    </div>
  );
}

/**
 * The lettered tail of a fork arm. Only shown where the layout affords it, and it carries
 * the arrowhead at that width so the whole branch reads as one line into the card.
 */
function BranchTag({ label, state }: { label: string; state: EdgeState }) {
  return (
    <span
      className={`relative mr-1.5 hidden w-12 shrink-0 items-center transition-[color,opacity] duration-500 lg:flex ${edgeTone(state, 'objective')}`}
      aria-hidden
    >
      <span className={`${EDGE_LABEL} font-medium`}>{label}</span>
      <svg viewBox="0 0 48 12" className="h-3 w-12" fill="none">
        <path d="M0 6h41" stroke="currentColor" strokeWidth="1.25" />
        <path d="M41 2.7 L48 6 L41 9.3 Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function GraphCard({
  id,
  active,
  visited,
  progress,
  paused,
  reduced,
  onSelect,
  fillRef,
}: {
  id: GraphNodeId;
  active: boolean;
  visited: boolean;
  progress: number;
  paused: boolean;
  reduced: boolean;
  onSelect: (id: GraphNodeId) => void;
  fillRef?: RefObject<HTMLSpanElement | null>;
}) {
  const node = GRAPH_NODES[id];
  const style = KIND_STYLE[node.kind];
  const Icon = ICONS[id];
  const isTrigger = node.kind === 'trigger';
  const pct = active ? progress : visited ? 1 : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group relative isolate w-full rounded-2xl border-2 bg-[var(--landing-bg)] text-left transition-[border-color,box-shadow] duration-300 ${
        active
          ? `${style.border} shadow-[0_8px_28px_-12px_color-mix(in_srgb,var(--landing-ink)_28%,transparent)]`
          : 'border-[var(--landing-border)] hover:shadow-[0_8px_24px_-16px_color-mix(in_srgb,var(--landing-ink)_22%,transparent)]'
      }`}
      aria-current={active ? 'step' : undefined}
    >
      {/* Fill only — never clip icon/label (ring/scale used to get cut off here) */}
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[0.9rem]"
        aria-hidden
      >
        <span
          ref={active ? fillRef : undefined}
          className={`absolute inset-0 origin-left will-change-transform ${style.bar} ${
            active ? 'opacity-[0.16]' : visited ? 'opacity-[0.1]' : 'opacity-0'
          }`}
          style={{ transform: `scaleX(${pct})` }}
        />
      </span>

      <span className="relative z-[1] flex w-full items-center gap-2.5 px-3.5 py-3.5">
        <span
          className={`relative flex size-9 shrink-0 items-center justify-center overflow-visible rounded-xl ${
            active || visited
              ? style.color
              : 'bg-[color-mix(in_srgb,var(--landing-ink)_7%,transparent)] text-[var(--landing-subtle)]'
          }`}
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {active && !paused && !reduced && (
            <span
              className={`pointer-events-none absolute inset-0 animate-ping rounded-xl opacity-20 ${style.bar}`}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                active ? style.text : 'text-[var(--landing-dim)]'
              }`}
            >
              {node.label}
            </span>
            {isTrigger && (
              <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                not an object
              </span>
            )}
          </span>
          <span
            className={`mt-0.5 block truncate text-sm font-semibold ${
              active ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-muted)]'
            }`}
          >
            {node.short}
          </span>
        </span>
      </span>
    </button>
  );
}

function IntelTriggerPanel() {
  return (
    <div className="landing-code-scroll flex h-full min-h-0 flex-col overflow-auto p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
          <Zap className="size-3" aria-hidden />
          Intel trigger
        </span>
        <span className="rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] px-2.5 py-1 font-mono text-[10px] text-[var(--landing-subtle)]">
          not an object
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--landing-dim)]">ISAC-2026-441</span>
      </div>

      <div className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
            <FileWarning className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-dim)]">
              Vendor / ISAC brief · 2026-06-11
            </p>
            <h4 className="mt-1 text-base font-bold text-[var(--landing-ink)]">
              Device-code phishing against SaaS admins
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
              Operators complete an OAuth device-code flow. Stolen tokens hit Microsoft Graph for
              mailbox and directory access — no password required.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {['T1528', 'T1078.004', 'T1114.003', 'Identity', 'M365'].map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[var(--landing-bg)] px-2 py-0.5 font-mono text-[10px] text-[var(--landing-ink)] shadow-[0_0_0_1px_var(--landing-border)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] px-3 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Translate into objects
        </p>
        <ul className="mt-2 space-y-1.5 text-xs text-[var(--landing-muted)]">
          <li>
            <span className="text-red-500">→</span>{' '}
            <strong className="text-[var(--landing-ink)]">threat::1.0</strong> device-code phishing
          </li>
          <li>
            <span className="text-blue-600">→</span>{' '}
            <strong className="text-[var(--landing-ink)]">objective::1.0</strong> ×2 branches
          </li>
          <li>
            <span className="text-emerald-500">→</span>{' '}
            <strong className="text-[var(--landing-ink)]">rule::1.0</strong> Entra + inbox rule
          </li>
        </ul>
      </div>
    </div>
  );
}

export function ObjectGraph() {
  const reduced = usePrefersReducedMotion();
  const [tourIdx, setTourIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [fillProgress, setFillProgress] = useState(0);
  const [seenTour, setSeenTour] = useState(0);
  const elapsedRef = useRef(0);
  const activeFillRef = useRef<HTMLSpanElement | null>(null);

  if (seenTour !== tourIdx) {
    setSeenTour(tourIdx);
    setFillProgress(0);
  }

  const activeId = GRAPH_TOUR[tourIdx];
  const meta = GRAPH_NODES[activeId];
  const style = KIND_STYLE[meta.kind];
  const activeTourIndex = tourIdx;
  const cardProgress = reduced ? 1 : fillProgress;
  const tourPaused = reduced || paused;

  useEffect(() => {
    if (reduced || paused) return;

    let raf = 0;
    const origin = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = Math.min(STEP_MS, now - origin);
      elapsedRef.current = elapsed;
      const t = elapsed / STEP_MS;
      const el = activeFillRef.current;
      if (el) el.style.transform = `scaleX(${t})`;
      if (t >= 1) {
        elapsedRef.current = 0;
        setTourIdx((i) => (i + 1) % GRAPH_TOUR.length);
        setPanelKey((k) => k + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduced, tourIdx]);

  const select = useCallback((id: GraphNodeId) => {
    const i = GRAPH_TOUR.indexOf(id);
    if (i < 0) return;
    elapsedRef.current = 0;
    setFillProgress(0);
    setPaused(true);
    setTourIdx(i);
    setPanelKey((k) => k + 1);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (!p) setFillProgress(elapsedRef.current / STEP_MS);
      return !p;
    });
  }, []);

  const visited = (id: GraphNodeId) => GRAPH_TOUR.indexOf(id) < activeTourIndex;

  const cardProps = {
    progress: cardProgress,
    paused: tourPaused,
    reduced,
    onSelect: select,
    fillRef: activeFillRef,
  };

  return (
    <div className="rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,var(--landing-bg))]">
      <div className="px-4 pt-5 md:px-6 md:pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--landing-subtle)]">
            Object graph
          </p>
          {!reduced && (
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--landing-bg)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--landing-ink)] shadow-[0_0_0_1px_var(--landing-border)] transition hover:bg-[var(--landing-hover)]"
              aria-pressed={paused}
            >
              {paused ? (
                <>
                  <Play className="size-3.5 fill-current" aria-hidden />
                  Play
                </>
              ) : (
                <>
                  <Pause className="size-3.5 fill-current" aria-hidden />
                  Pause
                </>
              )}
            </button>
          )}
        </div>

        {/* Pad the graph so card borders aren't clipped by scroll/overflow */}
        <div className="mt-5 overflow-x-auto py-1">
          <div className="flex min-w-[760px] items-stretch gap-0 px-0.5 md:min-w-0">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <GraphCard
                id="trigger"
                active={activeId === 'trigger'}
                visited={visited('trigger')}
                {...cardProps}
              />
            </div>

            <EdgeLink state={edgeState(activeId, 'threat')} kind="threat" label="author" />

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <GraphCard
                id="threat"
                active={activeId === 'threat'}
                visited={visited('threat')}
                {...cardProps}
              />
            </div>

            <ForkLink a={edgeState(activeId, 'obj-oauth')} b={edgeState(activeId, 'obj-mailbox')} />

            <div className="flex min-w-0 flex-[2.2] flex-col justify-center gap-3">
              <div className="flex items-center gap-0">
                <BranchTag label="A" state={edgeState(activeId, 'obj-oauth')} />
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="obj-oauth"
                    active={activeId === 'obj-oauth'}
                    visited={visited('obj-oauth')}
                    {...cardProps}
                  />
                </div>
                <EdgeLink state={edgeState(activeId, 'rule-entra')} kind="rule" label="impl" />
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="rule-entra"
                    active={activeId === 'rule-entra'}
                    visited={visited('rule-entra')}
                    {...cardProps}
                  />
                </div>
              </div>

              <div className="flex items-center gap-0">
                <BranchTag label="B" state={edgeState(activeId, 'obj-mailbox')} />
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="obj-mailbox"
                    active={activeId === 'obj-mailbox'}
                    visited={visited('obj-mailbox')}
                    {...cardProps}
                  />
                </div>
                <EdgeLink state={edgeState(activeId, 'rule-exo')} kind="rule" label="impl" />
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="rule-exo"
                    active={activeId === 'rule-exo'}
                    visited={visited('rule-exo')}
                    {...cardProps}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 pt-5 lg:grid-cols-2 md:p-5 md:pt-5">
        <div
          key={`copy-${panelKey}`}
          className={`landing-code-scroll flex ${PANEL_H} flex-col overflow-auto rounded-2xl bg-[var(--landing-bg)] px-5 py-5 md:px-6 md:py-6 ${
            reduced ? '' : 'landing-fade-slide'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${style.soft}`}
            >
              {meta.kind === 'trigger' ? 'Intel trigger' : meta.label}
            </span>
            {meta.schema ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--landing-subtle)]">
                {meta.schema}
              </span>
            ) : (
              <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10px] text-amber-800 dark:text-amber-300">
                outside objects/
              </span>
            )}
          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[var(--landing-ink)]">
            {meta.title}
          </h3>
          <p className={`mt-3 text-sm font-medium leading-relaxed ${style.text}`}>{meta.intent}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{meta.blurb}</p>

          <ul className="mt-4 space-y-2">
            {meta.points.map((point) => (
              <li key={point} className="flex gap-2 text-sm leading-snug text-[var(--landing-muted)]">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${style.bar}`} aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <dl className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {meta.facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] px-3 py-2"
              >
                <dt className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-dim)]">
                  {f.label}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-[var(--landing-ink)]">{f.value}</dd>
              </div>
            ))}
          </dl>

          {meta.next && (
            <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] px-3 py-2 text-xs leading-relaxed text-[var(--landing-subtle)]">
              <span className={`font-semibold ${style.text}`}>Next → </span>
              {meta.next}
            </p>
          )}

          <Link
            href="/docs/usage/concepts/object-model/"
            className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
          >
            Object model <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div
          key={`file-${panelKey}`}
          className={`${PANEL_H} overflow-hidden rounded-2xl bg-[var(--landing-bg)] ${
            reduced ? '' : 'landing-fade-slide'
          }`}
        >
          {meta.kind === 'trigger' ? (
            <IntelTriggerPanel />
          ) : meta.yaml && meta.path ? (
            <YamlPreview yaml={meta.yaml} path={meta.path} className="h-full rounded-2xl" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
