'use client';

import Link from 'next/link';
import { ArrowRight, Crosshair, FileText, Shield, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { YamlPreview } from '@/components/landing/yaml-preview';
import { DEMO_FILES, OBJECT_BLURBS } from '@/lib/landing/demo-registry';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type NodeType = 'intel' | 'threat' | 'objective' | 'rule';

type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  chain: boolean;
};

const TYPE_COLOR: Record<NodeType, string> = {
  intel: '#a1a1aa',
  threat: '#ef4444',
  objective: '#c9a000',
  rule: '#22c55e',
};

const TYPE_ICON = {
  intel: FileText,
  threat: Target,
  objective: Crosshair,
  rule: Shield,
} as const;

/** Fluid layout — primary chain plus background examples */
const nodes: GraphNode[] = [
  { id: 'intel', type: 'intel', label: 'CVE-2024-1709', x: 11, y: 24, chain: true },
  { id: 'intel-bg', type: 'intel', label: 'UNC5537', x: 11, y: 52, chain: false },
  { id: 'threat', type: 'threat', label: 'Gateway exploit', x: 30, y: 38, chain: true },
  { id: 'threat-bg', type: 'threat', label: 'Phishing', x: 28, y: 62, chain: false },
  { id: 'objective', type: 'objective', label: 'Credential access', x: 54, y: 30, chain: true },
  { id: 'objective-bg', type: 'objective', label: 'Lateral prep', x: 54, y: 56, chain: false },
  { id: 'rule', type: 'rule', label: 'LSASS access', x: 78, y: 38, chain: true },
  { id: 'rule-bg1', type: 'rule', label: 'PowerShell', x: 76, y: 58, chain: false },
  { id: 'rule-bg2', type: 'rule', label: 'RDP brute', x: 88, y: 22, chain: false },
  { id: 't-bg2', type: 'threat', label: 'Ransomware', x: 42, y: 18, chain: false },
];

const CHAIN_IDS = ['intel', 'threat', 'objective', 'rule'] as const;

const chainEdges = [
  { from: 'intel', to: 'threat' },
  { from: 'threat', to: 'objective' },
  { from: 'objective', to: 'rule' },
];

const bgEdges = [
  { from: 'intel-bg', to: 'threat' },
  { from: 'threat-bg', to: 'objective-bg' },
  { from: 'objective-bg', to: 'rule-bg1' },
  { from: 't-bg2', to: 'threat' },
  { from: 'rule-bg2', to: 'objective' },
];

const previews: Record<
  string,
  { path: string; blurbKey: keyof typeof OBJECT_BLURBS; yaml: string }
> = {
  intel: {
    path: 'intel/advisories/cve-2024-1709.md',
    blurbKey: 'intel',
    yaml: DEMO_FILES['intel/advisories/cve-2024-1709.md'],
  },
  threat: {
    path: 'objects/threats/gateway-exploitation.yaml',
    blurbKey: 'threat',
    yaml: DEMO_FILES['objects/threats/gateway-exploitation.yaml'],
  },
  objective: {
    path: 'objects/objectives/credential-access.yaml',
    blurbKey: 'objective',
    yaml: DEMO_FILES['objects/objectives/credential-access.yaml'],
  },
  rule: {
    path: 'objects/rules/lsass-memory-access.yaml',
    blurbKey: 'rule',
    yaml: DEMO_FILES['objects/rules/lsass-memory-access.yaml'],
  },
};

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const bend = (y2 - y1) * 0.15;
  return `M ${x1} ${y1} C ${mx} ${y1 + bend}, ${mx} ${y2 - bend}, ${x2} ${y2}`;
}

function chainAdjacent(id: string, selected: string) {
  const idx = CHAIN_IDS.indexOf(selected as (typeof CHAIN_IDS)[number]);
  if (idx < 0) return id === selected;
  const selIdx = CHAIN_IDS.indexOf(id as (typeof CHAIN_IDS)[number]);
  if (selIdx < 0) return false;
  return Math.abs(selIdx - idx) <= 1;
}

export function ObjectGraph() {
  const reduced = usePrefersReducedMotion();
  const [selected, setSelected] = useState<string>('threat');
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), []);

  const active = previews[selected] ?? previews.threat;
  const meta = OBJECT_BLURBS[active.blurbKey];
  const activeNode = nodeMap.get(selected) ?? nodeMap.get('threat')!;

  const isChainEdge = (from: string, to: string) =>
    chainEdges.some((e) => e.from === from && e.to === to);

  const edgeLit = (from: string, to: string) => {
    if (!isChainEdge(from, to)) return false;
    return chainAdjacent(from, selected) && chainAdjacent(to, selected);
  };

  return (
    <div className="grid max-h-[min(520px,70vh)] gap-5 overflow-hidden lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] lg:items-stretch">
      <div className="landing-surface-card relative flex max-h-[280px] min-h-0 flex-col overflow-hidden p-4 md:max-h-[300px] md:p-5">
        <svg
          viewBox="0 0 100 72"
          preserveAspectRatio="xMidYMid meet"
          className="h-full max-h-[240px] w-full shrink-0"
          role="img"
          aria-label="Object chain graph"
        >
          <defs>
            <filter id="chain-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[...bgEdges, ...chainEdges].map((e) => {
            const a = nodeMap.get(e.from)!;
            const b = nodeMap.get(e.to)!;
            const lit = isChainEdge(e.from, e.to) && edgeLit(e.from, e.to);
            const chain = isChainEdge(e.from, e.to);
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={edgePath(a.x + 4.2, a.y, b.x - 4.2, b.y)}
                fill="none"
                stroke={lit ? '#ffcc00' : chain ? '#2a2a2a' : '#141414'}
                strokeWidth={lit ? 0.5 : 0.22}
                strokeDasharray={lit && !reduced ? '2 1.5' : undefined}
                className="transition-colors duration-500"
                style={{ opacity: chain ? 1 : 0.3 }}
              >
                {lit && !reduced && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-10"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
            );
          })}

          {nodes.map((node) => {
            const on = selected === node.id;
            const adj = node.chain && chainAdjacent(node.id, selected);
            const lit = on || adj;
            const dim = !node.chain;
            const Icon = TYPE_ICON[node.type];
            const r = on ? 4.8 : node.chain ? 4.2 : 3.4;

            return (
              <g
                key={node.id}
                className={`cursor-pointer ${dim ? 'opacity-[0.16]' : lit ? 'opacity-100' : 'opacity-35'} transition-opacity duration-500`}
                onClick={() => previews[node.id] && setSelected(node.id)}
                role="button"
                tabIndex={previews[node.id] ? 0 : -1}
                aria-pressed={on}
                onKeyDown={(ev) => {
                  if ((ev.key === 'Enter' || ev.key === ' ') && previews[node.id]) {
                    ev.preventDefault();
                    setSelected(node.id);
                  }
                }}
              >
                {lit && node.chain && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 1.6}
                    fill="none"
                    stroke="#ffcc00"
                    strokeWidth={0.32}
                    opacity={on ? 0.85 : 0.4}
                    filter="url(#chain-glow)"
                  >
                    {!reduced && (
                      <animate
                        attributeName="opacity"
                        values={on ? '0.5;0.9;0.5' : '0.25;0.5;0.25'}
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={on ? TYPE_COLOR[node.type] : 'var(--landing-surface)'}
                  stroke={lit && node.chain ? '#ffcc00' : TYPE_COLOR[node.type]}
                  strokeWidth={on ? 0.5 : 0.3}
                />
                <foreignObject
                  x={node.x - 2.8}
                  y={node.y - 2.8}
                  width={5.6}
                  height={5.6}
                  className="pointer-events-none overflow-visible"
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon
                      className="size-[9px]"
                      style={{ color: on ? 'var(--landing-ink)' : TYPE_COLOR[node.type] }}
                      strokeWidth={2.2}
                    />
                  </div>
                </foreignObject>
                <text
                  x={node.x}
                  y={node.y + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-[var(--landing-ink)] text-[2.8px] font-medium"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 shrink-0 text-left text-[10px] text-[var(--landing-subtle)]">
          Click a chain node — intel → threat → objective → rule
        </p>
      </div>

      <div className="landing-surface-card flex min-h-0 max-h-[280px] flex-col overflow-hidden md:max-h-[300px]">
        <div className="shrink-0 border-b border-white/[0.06] p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
            {meta.kind}
          </p>
          <h3 className="mt-1 text-xl font-bold" style={{ color: TYPE_COLOR[activeNode.type] }}>
            {meta.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{meta.blurb}</p>
          {meta.note && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--landing-subtle)]">{meta.note}</p>
          )}
        </div>
        {active.path.endsWith('.md') ? (
          <pre className="min-h-0 flex-1 overflow-auto border-t border-white/[0.06] bg-black p-4 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-zinc-400 sm:text-[11px]">
            {active.yaml}
          </pre>
        ) : (
          <YamlPreview yaml={active.yaml} path={active.path} className="min-h-0 flex-1 rounded-none border-0" />
        )}
        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <Link
            href="/docs/usage/concepts/object-model/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)]"
          >
            Object model <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
