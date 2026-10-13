'use client';

import {
  Activity,
  ArrowDown,
  CornerDownRight,
  Database,
  FileCode2,
  Pause,
  Play,
  Plug,
  Radar,
  Server,
  Swords,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tag, VocabValue } from '@/components/landing/ui';
import {
  CANVAS,
  EDGES,
  NODES,
  TOUR,
  ZONES,
  type Edge,
  type NodeId,
  type NodeRecord,
  type OntologyNode,
} from '@/lib/landing/ontology';
import { useMeasure } from '@/lib/hooks/use-measure';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const STEP_MS = 5200;
const IDS = Object.keys(NODES) as NodeId[];
/** Below this the map stops shrinking and scrolls sideways instead. */
const MIN_SCALE = 0.8;
const NODE_W = 200;
/** Wider cards: the threat carries the chain, two threats with their technique and severity
 * each; the assets carry a criticality beside each name. */
const WIDTH: Partial<Record<NodeId, number>> = { threat: 224, assets: 224 };

const ICONS: Record<NodeId, LucideIcon> = {
  threat: Swords,
  objective: Target,
  signals: Activity,
  rule: FileCode2,
  detectors: Radar,
  assets: Server,
  logsources: Database,
  integrations: Plug,
};

const KIND: Record<Edge['kind'], string> = { uuid: 'UUID', nested: 'nested', name: 'name', vocabulary: 'vocabulary' };

/** The scroll area's side padding: the canvas starts after it. */
const inset = (el: HTMLElement) => parseFloat(getComputedStyle(el).paddingLeft) || 0;

/** An edge as drawn: its path, where its label sits, and the arrowhead at its end. */
type Drawn = { d: string; lx: number; ly: number; head: string };

type Box = { x: number; y: number; hw: number; hh: number };

/** How far along (dx, dy) a line from a box's centre leaves a box of half-size (hw, hh). */
function exit(dx: number, dy: number, hw: number, hh: number) {
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
  return Math.min(tx, ty);
}

/** A 7px arrowhead with its tip at (x, y), pointing along the unit vector (ux, uy). */
function arrowhead(x: number, y: number, ux: number, uy: number) {
  const bx = x - ux * 7;
  const by = y - uy * 7;
  return `M${x},${y} L${bx - uy * 3.5},${by + ux * 3.5} L${bx + uy * 3.5},${by - ux * 3.5} Z`;
}

/** A threat chains to other threats: a loop that leaves the top of the node and lands on it. */
function loop(b: Box): Drawn {
  const x1 = b.x - b.hw * 0.42;
  const x2 = b.x + b.hw * 0.42;
  const y0 = b.y - b.hh - 3;
  const lift = 52;
  const c2x = b.x + b.hw * 0.62;
  const cy = y0 - lift;
  const len = Math.hypot(x2 - c2x, y0 - cy) || 1;
  return {
    d: `M${x1},${y0} C${b.x - b.hw * 0.62},${cy} ${c2x},${cy} ${x2},${y0}`,
    lx: b.x,
    ly: y0 - lift * 0.75,
    head: arrowhead(x2, y0, (x2 - c2x) / len, (y0 - cy) / len),
  };
}

function straight(a: Box, b: Box): Drawn | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return null;
  const len = Math.hypot(dx, dy);
  const gap = 6 / len;
  const ta = exit(dx, dy, a.hw, a.hh) + gap;
  const tb = exit(dx, dy, b.hw, b.hh) + gap;
  const x1 = a.x + dx * ta;
  const y1 = a.y + dy * ta;
  const x2 = b.x - dx * tb;
  const y2 = b.y - dy * tb;
  return { d: `M${x1},${y1} L${x2},${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2, head: arrowhead(x2, y2, dx / len, dy / len) };
}

/** One line of excerpt, lightly coloured: keys, strings, and the TOML table headers. */
function ExcerptLine({ text }: { text: string }) {
  const table = text.match(/^(\s*)(\[\[?[^\]]+\]\]?)(.*)$/);
  if (table) {
    return (
      <>
        {table[1]}
        <span className="text-[var(--landing-code-key)]">{table[2]}</span>
        {table[3]}
      </>
    );
  }
  // A key ends at `:` followed by a space or the line end, or at `=`: in
  // `- Infrastructure::Firewalls::Palo Alto Networks` nothing is a key.
  const pair = text.match(/^(\s*-?\s*)([\w.[\]-]+)(\s*(?::(?=\s|$)|=))(.*)$/);
  if (!pair) return <>{text}</>;
  const value = pair[4];
  const quoted = value.match(/^(\s*)(".*")(.*)$/);
  return (
    <>
      {pair[1]}
      <span className="text-[var(--landing-code-key)]">{pair[2]}</span>
      <span className="text-[var(--landing-code-dim)]">{pair[3]}</span>
      {quoted ? (
        <>
          {quoted[1]}
          <span className="text-[var(--landing-code-str)]">{quoted[2]}</span>
          {quoted[3]}
        </>
      ) : (
        value
      )}
    </>
  );
}

function Excerpt({ node }: { node: OntologyNode }) {
  return (
    <figure className="m-0 overflow-hidden rounded-xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] ring-1 ring-[var(--landing-border)]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 font-mono text-[11px] text-[var(--landing-code-dim)]">
        <span className="truncate">{node.file}</span>
        <span className="shrink-0">excerpt</span>
      </figcaption>
      <pre className="landing-code-scroll m-0 max-h-[22rem] overflow-auto py-2.5 font-mono text-[12.5px] leading-relaxed">
        <code>
          {node.excerpt.map((raw, i) => {
            const mark = raw.startsWith('>');
            const text = mark ? raw.slice(1) : raw;
            return (
              <span key={i} className={`block px-4 ${mark ? 'bg-[#ffcc00]/[0.1]' : ''}`}>
                <ExcerptLine text={text || ' '} />
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

/** The demo objects behind a node: names and values from the files, and the chain between threats. */
function Records({ records }: { records: NodeRecord[] }) {
  return (
    <span className="mt-2.5 block space-y-2 border-t border-[var(--landing-border)] pt-2.5">
      {records.map((record) => (
        <span key={record.name} className="block">
          {record.via && (
            <span className="mb-2 flex items-center gap-1 font-mono text-[10px] text-[var(--landing-accent)]">
              <ArrowDown className="size-3" aria-hidden />
              {record.via}
            </span>
          )}
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-medium leading-4 text-[var(--landing-ink)]">{record.name}</span>
            {record.tag && <span className="shrink-0 font-mono text-[10px] text-[var(--landing-subtle)]">{record.tag}</span>}
          </span>
          <span className="mt-1 flex flex-wrap gap-1">
            {record.facts.map((fact) => (
              <span
                key={fact}
                className="rounded bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] px-1 py-px font-mono text-[10px] leading-[14px] text-[var(--landing-muted)]"
              >
                <VocabValue value={fact} />
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * The ontology as a map: threat, objective and its signals, and rule in the catalogue, linked
 * by UUID, with threats chained to threats; and the environment they land in, linked by name
 * and vocabulary: assets on a surface, the log sources collected from them, the detectors that
 * watch them, and the integrations it all runs on. Each node carries the demo objects it stands
 * for. A guided tour walks the links; any node can be picked.
 */
export function OntologyMap() {
  const reduced = usePrefersReducedMotion();
  // Starts with the panel's reveal, so the edges draw in where they can be seen.
  const { ref: stageRef, onScreen, seen } = useOnScreen<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Partial<Record<NodeId, HTMLButtonElement | null>>>({});
  const [drawn, setDrawn] = useState<Partial<Record<number, Drawn>>>({});
  const [scale, setScale] = useState(1);
  const [scrollable, setScrollable] = useState(false);
  const [active, setActive] = useState<NodeId>('threat');
  const [auto, setAuto] = useState(true);
  const [view, setView] = useState<View>('links');
  // Pointer over the map, or keyboard focus inside it: the tour waits for the reader.
  const [engaged, setEngaged] = useState(false);

  const playing = auto && !reduced && onScreen && !engaged;
  const shown = seen || reduced;

  // The canvas keeps its layout and scales to the column; past MIN_SCALE it scrolls instead.
  const fit = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const room = el.clientWidth - inset(el) * 2;
    const next = Math.min(1, Math.max(MIN_SCALE, room / CANVAS.w));
    setScale(next);
    setScrollable(CANVAS.w * next > room + 1);
  }, []);
  useMeasure(scrollRef, fit);

  // Layout boxes, not client rects: the canvas and the active node are scaled, and the edges
  // should not move with them. Each node is placed by its centre, so offsetLeft/Top already
  // are the centre.
  const measure = useCallback(() => {
    const boxes: Partial<Record<NodeId, Box>> = {};
    for (const id of IDS) {
      const el = nodeRefs.current[id];
      // A map without layout (a hidden tab, a collapsed parent) puts every node at 0,0: skip it,
      // or coinciding centres turn the edges into NaN. The observer measures again once it shows.
      if (el && el.offsetWidth > 0) boxes[id] = { x: el.offsetLeft, y: el.offsetTop, hw: el.offsetWidth / 2, hh: el.offsetHeight / 2 };
    }
    const next: Partial<Record<number, Drawn>> = {};
    EDGES.forEach((edge, i) => {
      const a = boxes[edge.from];
      const b = boxes[edge.to];
      if (!a || !b) return;
      const g = edge.from === edge.to ? loop(a) : straight(a, b);
      if (g) next[i] = g;
    });
    setDrawn(next);
  }, []);
  useMeasure(mapRef, measure);

  // Tour: move on while playing; the progress bar restarts with each node.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setActive((current) => TOUR[(TOUR.indexOf(current) + 1) % TOUR.length]), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, active]);

  // When the map scrolls, bring the active node to the middle of the view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !scrollable) return;
    const left = inset(el) + NODES[active].at[0] * scale - el.clientWidth / 2;
    el.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, scale, scrollable, reduced]);

  const pick = (id: NodeId) => {
    setActive(id);
    setAuto(false);
  };

  const node = NODES[active];
  const linked = new Set<NodeId>();
  EDGES.forEach((e) => {
    if (e.from === active) linked.add(e.to);
    if (e.to === active) linked.add(e.from);
  });

  const nodeTone = (id: NodeId) =>
    id === active
      ? 'border-[var(--landing-accent)] shadow-[0_10px_30px_-12px_var(--landing-btn-shadow)]'
      : linked.has(id)
        ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]'
        : 'border-[var(--landing-border)] hover:border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]';

  return (
    <div
      ref={stageRef}
      className="landing-panel grid grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false);
      }}
    >
      <div className="relative flex min-w-0 flex-col justify-center gap-4 border-b border-[var(--landing-border)] p-4 xl:border-b-0 xl:border-r">
        <div
          ref={scrollRef}
          role="group"
          aria-label="Ontology map"
          className="landing-code-scroll -mx-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4"
        >
          <div className="relative mx-auto" style={{ width: CANVAS.w * scale, height: CANVAS.h * scale }}>
            <div
              ref={mapRef}
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: CANVAS.w, height: CANVAS.h, transform: scale === 1 ? undefined : `scale(${scale})` }}
            >
              {/* Zones: the catalogue in git, and the environment it lands in. */}
              <div
                aria-hidden
                className="absolute inset-x-0 rounded-xl bg-[var(--landing-band)]"
                style={{ top: ZONES.catalogue.top, height: ZONES.catalogue.bottom - ZONES.catalogue.top }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 rounded-xl border border-dashed border-[var(--landing-border)]"
                style={{ top: ZONES.environment.top, height: ZONES.environment.bottom - ZONES.environment.top }}
              />
              <p className="absolute right-3 top-2 font-mono text-[11px] text-[var(--landing-subtle)]">{ZONES.catalogue.caption}</p>
              {/* Both zone captions sit in their zone's top-right corner; this one masks the edge behind it. */}
              <p
                className="absolute right-3 rounded bg-[var(--landing-panel)] px-1 font-mono text-[11px] text-[var(--landing-subtle)]"
                style={{ top: ZONES.environment.top + 8 }}
              >
                {ZONES.environment.caption}
              </p>

              <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                {EDGES.map((edge, i) => {
                  const g = drawn[i];
                  if (!g) return null;
                  const on = edge.from === active || edge.to === active;
                  const dashed = edge.kind === 'name' || edge.kind === 'vocabulary';
                  const delay = 300 + i * 80;
                  return (
                    <g key={`${edge.from}-${edge.to}-${edge.field}`}>
                      <path
                        d={g.d}
                        pathLength={dashed ? undefined : 1}
                        className={dashed ? 'landing-fade-line' : 'landing-draw'}
                        strokeDasharray={dashed ? '5 5' : undefined}
                        data-drawn={shown ? '' : undefined}
                        style={{ transitionDelay: `${delay}ms` }}
                        stroke={
                          on
                            ? 'color-mix(in srgb, var(--landing-accent) 40%, transparent)'
                            : 'color-mix(in srgb, var(--landing-ink) 24%, transparent)'
                        }
                        strokeWidth={edge.kind === 'nested' ? 2.5 : on ? 2 : 1.25}
                        fill="none"
                      />
                      {/* Heads appear once their line has drawn in; a dash cannot hide a marker. */}
                      {edge.kind !== 'nested' && (
                        <path
                          d={g.head}
                          className="landing-fade-line"
                          data-drawn={shown ? '' : undefined}
                          style={{ transitionDelay: `${dashed ? delay : delay + 700}ms` }}
                          fill={on ? 'var(--landing-accent)' : 'color-mix(in srgb, var(--landing-ink) 32%, transparent)'}
                        />
                      )}
                      {on && playing && (
                        <path d={g.d} className="landing-flow" stroke="var(--landing-accent)" strokeWidth={2.5} fill="none" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Field names ride on their edges: solid for a UUID, dashed for a name or vocabulary. */}
              {EDGES.map((edge, i) => {
                const g = drawn[i];
                if (!g) return null;
                const on = edge.from === active || edge.to === active;
                return (
                  <span
                    key={`label-${edge.from}-${edge.to}-${edge.field}`}
                    aria-hidden
                    className={`pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-4 transition-colors duration-300 ${
                      edge.kind === 'name' || edge.kind === 'vocabulary' ? 'border border-dashed' : 'border'
                    } ${
                      on
                        ? 'border-[var(--landing-accent)] bg-[var(--landing-panel)] text-[var(--landing-accent)]'
                        : 'border-[color-mix(in_srgb,var(--landing-ink)_18%,transparent)] bg-[var(--landing-panel)] text-[var(--landing-subtle)]'
                    }`}
                    style={{ left: g.lx, top: g.ly }}
                  >
                    {edge.field}
                  </span>
                );
              })}

              {IDS.map((id) => {
                const n = NODES[id];
                const NodeIcon = ICONS[id];
                const on = id === active;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      nodeRefs.current[id] = el;
                    }}
                    type="button"
                    onClick={() => pick(id)}
                    aria-pressed={on}
                    aria-label={`${n.title}: ${n.records.map((r) => r.name).join(', ')}`}
                    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-[var(--landing-panel)] p-3 text-left transition-[border-color,box-shadow,scale] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                      on ? 'scale-[1.03]' : ''
                    } ${nodeTone(id)}`}
                    style={{ left: n.at[0], top: n.at[1], width: WIDTH[id] ?? NODE_W }}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-lg transition-colors duration-300 ${
                          on
                            ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                            : 'bg-[color-mix(in_srgb,var(--landing-accent)_9%,transparent)] text-[var(--landing-accent)]'
                        }`}
                      >
                        <NodeIcon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate font-mono text-[10px] leading-3 ${on ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}
                        >
                          {n.tag}
                        </span>
                        <span className="mt-0.5 block text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[var(--landing-ink)]">
                          {n.title}
                        </span>
                      </span>
                    </span>
                    <Records records={n.records} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0 font-mono text-[11px] text-[var(--landing-subtle)]">
            <li className="flex items-center gap-2">
              <span aria-hidden className="block w-7 border-t-[1.5px] border-[color-mix(in_srgb,var(--landing-ink)_40%,transparent)]" />
              UUID reference, resolved by opentide validate
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="block w-7 border-t-[1.5px] border-dashed border-[color-mix(in_srgb,var(--landing-ink)_40%,transparent)]" />
              name or vocabulary value
            </li>
          </ul>
          {scrollable && <p className="m-0 font-mono text-[11px] text-[var(--landing-subtle)]">scroll sideways for the whole map</p>}
        </div>
      </div>

      {/* Announced only once the reader picks a node: the tour would talk over them every 5s. */}
      <div className="flex min-w-0 flex-col p-5 sm:p-7" aria-live={auto ? 'off' : 'polite'}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag tone={node.zone === 'catalogue' ? 'accent' : 'outline'}>{node.tag}</Tag>
            <span className="font-mono text-[11px] text-[var(--landing-subtle)]">
              {String(TOUR.indexOf(active) + 1).padStart(2, '0')}/{String(TOUR.length).padStart(2, '0')}
            </span>
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={() => {
                setAuto(!auto);
                if (!auto) setEngaged(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
            >
              {auto ? <Pause className="size-3 fill-current" aria-hidden /> : <Play className="size-3 fill-current" aria-hidden />}
              {auto ? 'Pause tour' : 'Play tour'}
            </button>
          )}
        </div>
        <span aria-hidden className="mt-3 block h-0.5 overflow-hidden rounded-full bg-[var(--landing-border)]">
          <span
            key={`${active}-${playing}`}
            className={`block h-full w-full origin-left rounded-full bg-[var(--landing-accent)] ${playing ? 'landing-progress' : ''}`}
            style={{ transform: playing ? undefined : `scaleX(${auto ? 0 : 1})`, animationDuration: `${STEP_MS}ms` }}
          />
        </span>

        {/* Every node's detail shares one grid cell, so the panel is as tall as the tallest and
            keeps its height as the tour moves on: nothing below it jumps. */}
        <div className="grid grid-cols-[minmax(0,1fr)]">
          {IDS.map((id) => (
            <div
              key={id}
              inert={id !== active}
              className={`[grid-area:1/1] ${id === active ? (reduced ? '' : 'landing-fade-slide') : 'invisible'}`}
            >
              <Detail id={id} onPick={pick} view={view} onView={setView} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type View = 'links' | 'file';

/**
 * What a node is for, then either every link it holds or receives, or the file it lives in:
 * one at a time, so the panel stays as tall as the map. The choice holds through the tour.
 */
function Detail({ id, onPick, view, onView }: { id: NodeId; onPick: (id: NodeId) => void; view: View; onView: (view: View) => void }) {
  const node = NODES[id];
  const Icon = ICONS[id];
  const links = [...EDGES.filter((e) => e.from === id), ...EDGES.filter((e) => e.to === id && e.from !== id)];
  const tab = (value: View, label: string) => (
    <button
      type="button"
      aria-pressed={view === value}
      onClick={() => onView(value)}
      className={`rounded-full px-3 py-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
        view === value
          ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
          : 'text-[var(--landing-muted)] hover:text-[var(--landing-ink)]'
      }`}
    >
      {label}
    </button>
  );
  return (
    <>
      <div className="mt-4 flex items-center gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-[var(--landing-ink)]">{node.title}</h3>
          <p className="text-base text-[var(--landing-muted)]">{node.question}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">{node.body}</p>

      <div className="mt-5 inline-flex self-start rounded-full border border-[var(--landing-border)] p-0.5 font-mono text-[11px]">
        {tab('links', `links · ${links.length}`)}
        {tab('file', 'file')}
      </div>
      {view === 'links' ? (
        <ul className="mt-3 list-none space-y-2 p-0">
          {links.map((edge) => (
            <LinkCard key={`${edge.from}-${edge.to}-${edge.field}`} edge={edge} here={id} onPick={onPick} />
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <Excerpt node={node} />
        </div>
      )}
    </>
  );
}

/**
 * One link from the active node, read from its end: the typed field it travels on, what it
 * means, the value in the demo file, and the object that value names.
 */
function LinkCard({ edge, here, onPick }: { edge: Edge; here: NodeId; onPick: (id: NodeId) => void }) {
  const out = edge.from === here;
  const other = out ? edge.to : edge.from;
  const OtherIcon = ICONS[other];
  const dashed = edge.kind === 'name' || edge.kind === 'vocabulary';
  const end = (id: NodeId) => (
    <span className={id === here ? 'text-[var(--landing-ink)]' : 'font-semibold text-[var(--landing-accent)]'}>{id}</span>
  );
  const body = (
    <>
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--landing-accent)_9%,transparent)] text-[var(--landing-accent)]">
          <OtherIcon className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 font-mono text-xs text-[var(--landing-subtle)]">
          {end(edge.from)}.<span className="text-[var(--landing-ink)]">{edge.field}</span> → {end(edge.to)}
        </span>
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-px font-mono text-[10px] leading-4 ${
            dashed
              ? 'border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_28%,transparent)] text-[var(--landing-subtle)]'
              : 'border border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)] text-[var(--landing-accent)]'
          }`}
        >
          {KIND[edge.kind]}
        </span>
      </span>
      <span className="mt-1.5 block text-[13px] leading-snug text-[var(--landing-muted)]">{out ? edge.says : edge.back}</span>
      <span className="mt-1.5 block rounded-lg bg-[var(--landing-band)] px-2.5 py-1 font-mono text-[11.5px] leading-relaxed text-[var(--landing-ink)]">
        {edge.value.map((line) => (
          <span key={line} className="block [overflow-wrap:anywhere]">
            {line}
          </span>
        ))}
        {edge.resolves?.map((name) => (
          <span key={name} className="mt-0.5 flex items-center gap-1.5 font-sans text-xs text-[var(--landing-muted)]">
            <CornerDownRight className="size-3 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            {name}
          </span>
        ))}
      </span>
    </>
  );
  const frame = 'block w-full rounded-xl border border-[var(--landing-border)] bg-[var(--landing-panel)] px-3 py-2.5 text-left';
  return (
    <li>
      {other === here ? (
        <div className={frame}>{body}</div>
      ) : (
        <button
          type="button"
          onClick={() => onPick(other)}
          className={`${frame} transition hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]`}
        >
          {body}
        </button>
      )}
    </li>
  );
}
