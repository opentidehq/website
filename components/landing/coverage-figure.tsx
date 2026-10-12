'use client';

import { Check, Minus } from 'lucide-react';
import { Tag } from '@/components/landing/ui';
import { useInView } from '@/lib/hooks/use-in-view';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const ROWS = [
  ['Granularity', 'technique', 'atomic threat vector'],
  ['Context', 'generic', 'surface and terrain'],
  ['Impact', 'implicit', 'severity · impact · leverage · viability'],
  ['Chaining', 'none', 'threat → threat attack paths'],
  ['Intel link', 'manual', 'actors, sightings, references'],
  ['Detection', 'separate', 'objective → signals → rules'],
] as const;

const COLS = 14;
const ROWS_N = 9;

/** A stable, uneven fill: about 85% of cells lit, in four strengths. */
function heat(i: number) {
  const h = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  const r = h - Math.floor(h);
  if (r < 0.15) return 0;
  return r < 0.42 ? 1 : r < 0.72 ? 2 : 3;
}

const STRENGTH = ['', 'opacity-25', 'opacity-55', 'opacity-90'];

function Heatmap({ shown }: { shown: boolean }) {
  return (
    <div
      aria-hidden
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: COLS * ROWS_N }, (_, i) => {
        const level = heat(i);
        const col = i % COLS;
        return (
          <span
            key={i}
            className="relative aspect-square rounded-[3px] bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)]"
          >
            {level > 0 && (
              <span
                className={`absolute inset-0 rounded-[3px] bg-[var(--landing-accent)] transition-opacity duration-500 ${shown ? STRENGTH[level] : 'opacity-0'}`}
                style={{ transitionDelay: `${col * 45 + (i % 3) * 30}ms` }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

type GNode = { id: string; label: string; x: number; y: number; gap?: boolean };

const THREATS: GNode[] = [
  { id: 't1', label: 'Gateway exploitation', x: 8, y: 14 },
  { id: 't2', label: 'Device-code phishing', x: 8, y: 66 },
  { id: 't3', label: 'Inbox rule abuse', x: 8, y: 118 },
  { id: 't4', label: 'npm supply chain', x: 8, y: 170, gap: true },
];
const OBJECTIVES: GNode[] = [
  { id: 'o1', label: 'Credential access', x: 148, y: 14 },
  { id: 'o2', label: 'OAuth token theft', x: 148, y: 66 },
  { id: 'o3', label: 'Mailbox persistence', x: 148, y: 118 },
];
const RULES: GNode[] = [
  { id: 'r1', label: 'LSASS · KQL', x: 288, y: 0 },
  { id: 'r2', label: 'LSASS · SPL', x: 288, y: 36 },
  { id: 'r3', label: 'Device code · KQL', x: 288, y: 82 },
  { id: 'r4', label: 'Forwarding · KQL', x: 288, y: 128 },
];
const W = 124;
const H = 26;
const LINKS: [GNode, GNode][] = [
  [THREATS[0], OBJECTIVES[0]],
  [THREATS[1], OBJECTIVES[1]],
  [THREATS[2], OBJECTIVES[2]],
  [OBJECTIVES[0], RULES[0]],
  [OBJECTIVES[0], RULES[1]],
  [OBJECTIVES[1], RULES[2]],
  [OBJECTIVES[2], RULES[3]],
];

function curve(a: GNode, b: GNode, w: number) {
  const x1 = a.x + w;
  const y1 = a.y + H / 2;
  const x2 = b.x;
  const y2 = b.y + H / 2;
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

function Box({ node, w, kind }: { node: GNode; w: number; kind: 'threat' | 'objective' | 'rule' }) {
  return (
    <g>
      {node.gap && (
        <rect
          x={node.x - 4}
          y={node.y - 4}
          width={w + 8}
          height={H + 8}
          rx={10}
          fill="none"
          stroke="var(--landing-accent)"
          strokeDasharray="3 3"
          className="landing-ring"
          style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
        />
      )}
      <rect
        x={node.x}
        y={node.y}
        width={w}
        height={H}
        rx={7}
        fill={kind === 'rule' ? 'color-mix(in srgb, var(--landing-accent) 10%, var(--landing-panel))' : 'var(--landing-panel)'}
        stroke={node.gap ? 'var(--landing-accent)' : 'color-mix(in srgb, var(--landing-ink) 20%, transparent)'}
        strokeDasharray={node.gap ? '4 3' : undefined}
      />
      <text
        x={node.x + 9}
        y={node.y + H / 2 + 3.5}
        fontSize={10.5}
        className={node.gap ? 'fill-[var(--landing-accent)] font-semibold' : 'fill-[var(--landing-ink)]'}
      >
        {node.label}
      </text>
    </g>
  );
}

function Graph({ shown, reduced }: { shown: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 420 200" className="h-auto w-full overflow-visible" role="img" aria-label="Threats covered by objectives and implemented by rules, with one threat that no objective covers">
      {['threats', 'objectives', 'rules'].map((label, i) => (
        <text key={label} x={[8, 148, 288][i]} y={-8} fontSize={9.5} className="fill-[var(--landing-subtle)] font-mono">
          {label}
        </text>
      ))}
      {LINKS.map(([a, b], i) => {
        const d = curve(a, b, W);
        return (
          <g key={`${a.id}-${b.id}`}>
            <path
              d={d}
              pathLength={1}
              fill="none"
              stroke="color-mix(in srgb, var(--landing-accent) 45%, transparent)"
              strokeWidth={1.5}
              className="landing-draw"
              data-drawn={shown || reduced ? '' : undefined}
              style={{ transitionDelay: `${200 + i * 110}ms` }}
            />
            {shown && !reduced && <path d={d} fill="none" stroke="var(--landing-accent)" strokeWidth={1.75} className="landing-flow" />}
          </g>
        );
      })}
      {THREATS.map((n) => (
        <Box key={n.id} node={n} w={W} kind="threat" />
      ))}
      {OBJECTIVES.map((n) => (
        <Box key={n.id} node={n} w={W} kind="objective" />
      ))}
      {RULES.map((n) => (
        <Box key={n.id} node={n} w={W} kind="rule" />
      ))}
      <text x={148} y={186} fontSize={10} className="fill-[var(--landing-accent)] font-mono">
        ← a gap: no objective covers it
      </text>
    </svg>
  );
}

function Rows({ side }: { side: 'heatmap' | 'graph' }) {
  const graph = side === 'graph';
  return (
    <dl className="m-0 mt-6 divide-y divide-[var(--landing-border)] border-t border-[var(--landing-border)] text-sm">
      {ROWS.map(([dimension, heatmap, graphValue]) => (
        <div key={dimension} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 py-2.5">
          <dt className="font-mono text-xs text-[var(--landing-subtle)]">{dimension.toLowerCase()}</dt>
          <dd className={`m-0 flex items-baseline gap-2 ${graph ? 'font-medium text-[var(--landing-ink)]' : 'text-[var(--landing-subtle)]'}`}>
            {graph ? (
              <Check className="size-3.5 shrink-0 translate-y-0.5 text-[var(--landing-accent)]" aria-hidden />
            ) : (
              <Minus className="size-3.5 shrink-0 translate-y-0.5 opacity-60" aria-hidden />
            )}
            {graph ? graphValue : heatmap}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Heatmap versus graph: the same coverage, and only one of them can say which threat is missing. */
export function CoverageFigure() {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <figure className="landing-panel m-0 flex flex-col p-6 md:p-8">
        <figcaption className="flex items-baseline justify-between gap-4">
          <span>
            <span className="block font-mono text-xs text-[var(--landing-subtle)]">att&amp;ck heatmap</span>
            <span className="mt-1 block text-sm font-semibold text-[var(--landing-ink)]">A score per technique</span>
          </span>
          <span className="text-right">
            <span className="block text-3xl font-bold tracking-[-0.03em] text-[var(--landing-muted)]">85%</span>
            <span className="font-mono text-[11px] text-[var(--landing-subtle)]">of techniques have a rule</span>
          </span>
        </figcaption>
        <div className="mt-5">
          <Heatmap shown={inView || reduced} />
        </div>
        <Rows side="heatmap" />
      </figure>

      <figure className="landing-panel m-0 flex flex-col p-6 ring-1 ring-[color-mix(in_srgb,var(--landing-accent)_35%,transparent)] md:p-8">
        <figcaption className="flex items-baseline justify-between gap-4">
          <span>
            <span className="block font-mono text-xs text-[var(--landing-accent)]">opentide graph</span>
            <span className="mt-1 block text-sm font-semibold text-[var(--landing-ink)]">A path per threat</span>
          </span>
          <Tag tone="accent">3 of 4 threats covered</Tag>
        </figcaption>
        <div className="mt-8 flex flex-1 items-center">
          <Graph shown={inView} reduced={reduced} />
        </div>
        <Rows side="graph" />
      </figure>
    </div>
  );
}
