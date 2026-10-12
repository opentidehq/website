'use client';

import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Tag } from '@/components/landing/ui';
import { EDGES, NODES, TOUR, type NodeId, type OntologyNode } from '@/lib/landing/ontology';
import { useMeasure } from '@/lib/hooks/use-measure';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const STEP_MS = 5200;
const IDS = Object.keys(NODES) as NodeId[];
const GROUPS: { zone: OntologyNode['zone']; caption: string }[] = [
  { zone: 'catalogue', caption: 'objects/' },
  { zone: 'environment', caption: '.opentide/configurations/' },
];

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

function straight(a: Box, b: Box): Drawn {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
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
  // `- Firewalls::Palo Alto Networks` nothing is a key.
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
      <pre className="landing-code-scroll m-0 max-h-[17rem] overflow-auto py-3 font-mono text-[12.5px] leading-relaxed">
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

/**
 * The ontology as a map: threat, objective and its signals, and rule in the catalogue, linked
 * by UUID, with threats chained to threats; and the environment they land in, linked by name
 * and vocabulary: assets on a surface, the log sources collected from them, the detectors that
 * watch them, and the integrations it all runs on. A guided tour walks the links; any node can
 * be picked.
 */
export function OntologyMap() {
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, onScreen, seen } = useOnScreen<HTMLDivElement>();
  const mapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Partial<Record<NodeId, HTMLButtonElement | null>>>({});
  const [drawn, setDrawn] = useState<Partial<Record<number, Drawn>>>({});
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState<NodeId>('threat');
  const [auto, setAuto] = useState(true);
  // Pointer over the map, or keyboard focus inside it: the tour waits for the reader.
  const [engaged, setEngaged] = useState(false);

  const playing = auto && !reduced && onScreen && !engaged;
  const shown = seen || reduced;

  // Below `sm` there is no room to draw the graph: the nodes become two labelled groups.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Layout boxes, not client rects: the active node is scaled, and the edges should not move
  // with it. Each node is placed by its centre, so offsetLeft/Top already are the centre.
  const measure = useCallback(() => {
    const boxes: Partial<Record<NodeId, Box>> = {};
    for (const id of IDS) {
      const el = nodeRefs.current[id];
      if (el) boxes[id] = { x: el.offsetLeft, y: el.offsetTop, hw: el.offsetWidth / 2, hh: el.offsetHeight / 2 };
    }
    const next: Partial<Record<number, Drawn>> = {};
    EDGES.forEach((edge, i) => {
      const a = boxes[edge.from];
      const b = boxes[edge.to];
      if (!a || !b) return;
      next[i] = edge.from === edge.to ? loop(a) : straight(a, b);
    });
    setDrawn(next);
  }, []);
  useMeasure(mapRef, measure, [wide]);

  // Tour: move on while playing; the progress bar restarts with each node.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setActive((current) => TOUR[(TOUR.indexOf(current) + 1) % TOUR.length]), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, active]);

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
  const outgoing = EDGES.filter((e) => e.from === active);
  const incoming = EDGES.filter((e) => e.to === active && e.from !== active);

  const nodeTone = (id: NodeId) =>
    id === active
      ? 'border-[var(--landing-accent)] shadow-[0_10px_30px_-12px_var(--landing-btn-shadow)]'
      : linked.has(id)
        ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]'
        : 'border-[var(--landing-border)] hover:border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]';

  return (
    <div
      ref={stageRef}
      className="landing-panel grid grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false);
      }}
    >
      <div className="relative flex flex-col justify-center gap-4 border-b border-[var(--landing-border)] p-4 sm:p-5 xl:border-b-0 xl:border-r">
        {wide ? (
          <div ref={mapRef} className="relative aspect-[1000/880] w-full">
            {/* Zones: the catalogue in git, and the environment it lands in. */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-[56%] rounded-xl bg-[var(--landing-band)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[40%] rounded-xl border border-dashed border-[var(--landing-border)]" />
            <p className="absolute right-3 top-2 font-mono text-[11px] text-[var(--landing-subtle)]">objects/</p>
            <p className="absolute bottom-2 left-3 font-mono text-[11px] text-[var(--landing-subtle)]">.opentide/configurations/</p>

            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {EDGES.map((edge, i) => {
                const g = drawn[i];
                if (!g) return null;
                const on = edge.from === active || edge.to === active;
                const dashed = edge.kind === 'name';
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
                  className={`pointer-events-none absolute z-[5] hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-4 transition-colors duration-300 md:block ${
                    edge.kind === 'name' ? 'border border-dashed' : 'border'
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
              const primary = n.zone === 'catalogue' && !n.nested;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    nodeRefs.current[id] = el;
                  }}
                  type="button"
                  onClick={() => pick(id)}
                  aria-pressed={id === active}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-[var(--landing-panel)] text-left transition-[border-color,box-shadow,scale] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                    primary ? 'w-[22%] px-3.5 py-3' : 'w-[19%] px-3 py-2.5'
                  } ${id === active ? 'scale-[1.04]' : ''} ${nodeTone(id)}`}
                  style={{ left: `${n.at[0]}%`, top: `${n.at[1]}%` }}
                >
                  <span className={`block truncate font-mono text-[11px] ${id === active ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}>
                    {n.tag}
                  </span>
                  <span className={`mt-0.5 block font-semibold tracking-[-0.01em] text-[var(--landing-ink)] ${primary ? 'text-base' : 'text-sm'}`}>
                    {n.title}
                  </span>
                  {primary && (
                    <span className="mt-0.5 hidden text-xs leading-snug text-[var(--landing-muted)] lg:block">{n.question}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {GROUPS.map((group) => (
              <div key={group.zone}>
                <p className="font-mono text-[11px] text-[var(--landing-subtle)]">{group.caption}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {IDS.filter((id) => NODES[id].zone === group.zone).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => pick(id)}
                      aria-pressed={id === active}
                      className={`rounded-xl border bg-[var(--landing-panel)] px-3 py-2.5 text-left transition-[border-color,box-shadow] duration-300 ${nodeTone(id)}`}
                    >
                      <span className={`block truncate font-mono text-[10px] ${id === active ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'}`}>
                        {NODES[id].tag}
                      </span>
                      <span className="block text-sm font-semibold text-[var(--landing-ink)]">{NODES[id].title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <ul className="m-0 hidden list-none flex-wrap gap-x-6 gap-y-1 p-0 font-mono text-[11px] text-[var(--landing-subtle)] md:flex">
          <li className="flex items-center gap-2">
            <span aria-hidden className="block w-7 border-t-[1.5px] border-[color-mix(in_srgb,var(--landing-ink)_40%,transparent)]" />
            UUID reference, resolved by opentide validate
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="block w-7 border-t-[1.5px] border-dashed border-[color-mix(in_srgb,var(--landing-ink)_40%,transparent)]" />
            name or vocabulary value
          </li>
        </ul>
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
              onClick={() => setAuto((v) => !v)}
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

        <div key={active} className={reduced ? '' : 'landing-fade-slide'}>
          <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--landing-ink)]">{node.title}</h3>
          <p className="mt-1 text-lg text-[var(--landing-muted)]">{node.question}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">{node.body}</p>

          <ul className="mt-4 list-none space-y-1 p-0">
            {outgoing.map((e) => (
              <LinkRow key={`out-${e.to}-${e.field}`} field={e.field} onPick={() => pick(e.to)}>
                {e.from === e.to ? `another ${NODES[e.to].title.toLowerCase()}` : NODES[e.to].title}
              </LinkRow>
            ))}
            {incoming.map((e) => (
              <LinkRow key={`in-${e.from}-${e.field}`} field={e.field} onPick={() => pick(e.from)} incoming>
                {NODES[e.from].title}
              </LinkRow>
            ))}
          </ul>

          <div className="mt-5">
            <Excerpt node={node} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkRow({
  field,
  incoming,
  onPick,
  children,
}: {
  field: string;
  incoming?: boolean;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="group flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left font-mono text-xs text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)]"
      >
        {incoming ? (
          <>
            <ArrowLeft className="size-3 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            <span className="font-sans text-sm font-semibold text-[var(--landing-ink)] group-hover:text-[var(--landing-accent)]">
              {children}
            </span>
            <span className="text-[var(--landing-subtle)]">via {field}</span>
          </>
        ) : (
          <>
            <span className="text-[var(--landing-accent)]">{field}</span>
            <ArrowRight className="size-3 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            <span className="font-sans text-sm font-semibold text-[var(--landing-ink)] group-hover:text-[var(--landing-accent)]">
              {children}
            </span>
          </>
        )}
      </button>
    </li>
  );
}
