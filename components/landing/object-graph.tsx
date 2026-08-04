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
import { useCallback, useEffect, useRef, useState } from 'react';
import { YamlPreview } from '@/components/landing/yaml-preview';
import {
  GRAPH_NODES,
  GRAPH_TOUR,
  KIND_STYLE,
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

function edgeActive(activeId: GraphNodeId, to: GraphNodeId) {
  return GRAPH_TOUR.indexOf(activeId) >= GRAPH_TOUR.indexOf(to);
}

function HArrow({ active, label }: { active: boolean; label?: string }) {
  return (
    <div
      className={`hidden shrink-0 flex-col items-center justify-center gap-1 px-1.5 md:flex ${
        active ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-dim)]'
      }`}
      aria-hidden
    >
      {label && (
        <span className="font-mono text-[8px] uppercase tracking-wider opacity-70">{label}</span>
      )}
      <svg viewBox="0 0 36 12" className="h-3 w-9">
        <path
          d="M0 6 H28 M22 1.5 L30 6 L22 10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {active && (
            <animate attributeName="opacity" values="0.45;1;0.45" dur="1.2s" repeatCount="indefinite" />
          )}
        </path>
      </svg>
    </div>
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
}: {
  id: GraphNodeId;
  active: boolean;
  visited: boolean;
  progress: number;
  paused: boolean;
  reduced: boolean;
  onSelect: (id: GraphNodeId) => void;
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
      className={`group relative flex w-full overflow-hidden rounded-2xl bg-[var(--landing-bg)] text-left shadow-[0_1px_0_var(--landing-border)] transition duration-300 ${
        active
          ? `ring-2 ${style.ring} shadow-[0_8px_28px_-12px_color-mix(in_srgb,var(--landing-ink)_28%,transparent)]`
          : 'hover:shadow-[0_8px_24px_-16px_color-mix(in_srgb,var(--landing-ink)_22%,transparent)]'
      }`}
      aria-current={active ? 'step' : undefined}
    >
      {/* Whole-card progress fill */}
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 ${style.bar} transition-[width] duration-100 ease-linear ${
          active ? 'opacity-[0.16]' : visited ? 'opacity-[0.1]' : 'opacity-0'
        }`}
        style={{ width: `${pct * 100}%` }}
        aria-hidden
      />

      <span className="relative z-[1] flex w-full items-center gap-2.5 px-3.5 py-3.5">
        <span
          className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl transition duration-300 ${
            active || visited
              ? style.color
              : 'bg-[color-mix(in_srgb,var(--landing-ink)_7%,transparent)] text-[var(--landing-subtle)]'
          } ${active && !reduced ? 'scale-[1.04]' : ''}`}
        >
          <Icon className="size-3.5" aria-hidden />
          {active && !paused && !reduced && (
            <span className={`absolute inset-0 animate-ping rounded-xl opacity-20 ${style.bar}`} />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                active ? style.text : 'text-[var(--landing-dim)]'
              }`}
            >
              {node.label}
            </span>
            {isTrigger && (
              <span className="rounded-full bg-amber-400/20 px-1.5 py-px font-mono text-[8px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
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
  const [progress, setProgress] = useState(0);
  const [panelKey, setPanelKey] = useState(0);
  const elapsedRef = useRef(0);

  const activeId = GRAPH_TOUR[tourIdx];
  const meta = GRAPH_NODES[activeId];
  const style = KIND_STYLE[meta.kind];
  const activeTourIndex = tourIdx;
  const fillProgress = reduced ? 1 : progress;
  const tourPaused = reduced || paused;

  useEffect(() => {
    if (reduced || paused) return;

    let raf = 0;
    const origin = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = Math.min(STEP_MS, now - origin);
      elapsedRef.current = elapsed;
      const t = elapsed / STEP_MS;
      setProgress(t);
      if (t >= 1) {
        elapsedRef.current = 0;
        setProgress(0);
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
    setProgress(0);
    setPaused(true);
    setTourIdx(i);
    setPanelKey((k) => k + 1);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const visited = (id: GraphNodeId) => GRAPH_TOUR.indexOf(id) < activeTourIndex;

  const cardProps = {
    progress: fillProgress,
    paused: tourPaused,
    reduced,
    onSelect: select,
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,var(--landing-bg))]">
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

        {/* Balanced horizontal graph — equal-weight columns */}
        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-[760px] items-stretch gap-0 md:min-w-0">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <GraphCard
                id="trigger"
                active={activeId === 'trigger'}
                visited={visited('trigger')}
                {...cardProps}
              />
            </div>

            <HArrow active={edgeActive(activeId, 'threat')} label="author" />

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <GraphCard
                id="threat"
                active={activeId === 'threat'}
                visited={visited('threat')}
                {...cardProps}
              />
            </div>

            <HArrow active={edgeActive(activeId, 'obj-oauth')} />

            <div className="flex min-w-0 flex-[2.2] flex-col justify-center gap-2.5">
              <div className="flex items-center gap-0">
                <span className="mr-1.5 hidden w-12 shrink-0 font-mono text-[8px] uppercase tracking-wider text-blue-600 dark:text-blue-400 lg:block">
                  A
                </span>
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="obj-oauth"
                    active={activeId === 'obj-oauth'}
                    visited={visited('obj-oauth')}
                    {...cardProps}
                  />
                </div>
                <HArrow active={edgeActive(activeId, 'rule-entra')} label="impl" />
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
                <span className="mr-1.5 hidden w-12 shrink-0 font-mono text-[8px] uppercase tracking-wider text-blue-600 dark:text-blue-400 lg:block">
                  B
                </span>
                <div className="min-w-0 flex-1">
                  <GraphCard
                    id="obj-mailbox"
                    active={activeId === 'obj-mailbox'}
                    visited={visited('obj-mailbox')}
                    {...cardProps}
                  />
                </div>
                <HArrow active={edgeActive(activeId, 'rule-exo')} label="impl" />
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
