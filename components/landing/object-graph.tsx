'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

type NodeId = 'intel' | 'threat' | 'objective' | 'rule';

const nodes: {
  id: NodeId;
  label: string;
  schema: string;
  path: string;
  x: number;
  y: number;
  color: string;
  summary: string;
  detail: string;
  example: string;
}[] = [
  {
    id: 'intel',
    label: 'Intel',
    schema: 'feeds',
    path: 'intel/',
    x: 12,
    y: 50,
    color: '#71717a',
    summary: 'Threat intelligence and context that informs what to detect.',
    detail:
      'CVE advisories, actor reports, and internal findings flow into threat vector definitions — grounding detection work in real risk.',
    example: 'Actor profile · CVE-2024-XXXX · sector brief',
  },
  {
    id: 'threat',
    label: 'Threat',
    schema: 'threat::1.0',
    path: 'objects/threats/',
    x: 32,
    y: 50,
    color: '#003399',
    summary: 'Threat vector (TVM) definitions — the adversary behaviour you care about.',
    detail:
      'Threat objects capture techniques, assets, and narrative scope. Objectives and rules chain back to threats for traceability.',
    example: 'name: "Credential access via LSASS"\nmetadata:\n  schema: threat::1.0',
  },
  {
    id: 'objective',
    label: 'Objective',
    schema: 'objective::1.0',
    path: 'objects/objectives/',
    x: 58,
    y: 50,
    color: '#1a4fb5',
    summary: 'Detection objectives and signals — what “good detection” means here.',
    detail:
      'Objectives bridge threat intent to concrete detection logic. Multiple rules can satisfy one objective; validation checks references.',
    example: 'signals: [process_access, dump_creation]\nchains_to: threat uuid',
  },
  {
    id: 'rule',
    label: 'Rule',
    schema: 'rule::1.0',
    path: 'objects/rules/',
    x: 84,
    y: 50,
    color: '#ffcc00',
    summary: 'MDR rules with per-platform queries, schedules, and deploy configs.',
    detail:
      'Rules are the deployable unit. opentide validates queries per platform honestly, generates schemas, and dry-run deploys to SIEMs.',
    example: 'platforms:\n  sentinel: { query: "...", enabled: true }',
  },
];

const edges: [NodeId, NodeId][] = [
  ['intel', 'threat'],
  ['threat', 'objective'],
  ['objective', 'rule'],
];

export function ObjectGraph() {
  const [selected, setSelected] = useState<NodeId>('threat');
  const active = nodes.find((n) => n.id === selected)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="landing-surface-card overflow-hidden p-4 md:p-6">
        <svg
          viewBox="0 0 100 100"
          className="h-auto w-full min-h-[220px]"
          role="img"
          aria-label="Object graph: Intel to Threat to Objective to Rule"
        >
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#52525b" />
            </marker>
          </defs>
          {edges.map(([from, to]) => {
            const a = nodes.find((n) => n.id === from)!;
            const b = nodes.find((n) => n.id === to)!;
            const lit = selected === from || selected === to;
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x + 6}
                y1={a.y}
                x2={b.x - 6}
                y2={b.y}
                stroke={lit ? '#ffcc00' : '#3f3f46'}
                strokeWidth={lit ? 0.6 : 0.35}
                markerEnd="url(#arrow)"
                className="transition-all duration-300"
              />
            );
          })}
          {nodes.map((node) => {
            const on = selected === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => setSelected(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(node.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`${node.label}: ${node.summary}`}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={on ? 7.5 : 6}
                  fill={on ? node.color : '#0a0a0a'}
                  stroke={on ? '#ffcc00' : node.color}
                  strokeWidth={on ? 0.8 : 0.5}
                  className="transition-all duration-300"
                />
                <text
                  x={node.x}
                  y={node.y + 14}
                  textAnchor="middle"
                  className="fill-[#a1a1aa] text-[4px] font-medium"
                  style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-3 text-center text-xs text-[var(--landing-subtle)]">
          Click a node · Intel → Threat → Objective → Rule
        </p>
      </div>

      <div className="landing-surface-card flex h-full min-h-[280px] flex-col p-6 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
              {active.path}
            </p>
            <h3 className="mt-1 text-2xl font-bold" style={{ color: active.color }}>
              {active.label}
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--eu-yellow)]">{active.schema}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)]">{active.detail}</p>
        <pre className="mt-4 flex-1 overflow-x-auto rounded-lg border border-white/[0.06] bg-black p-4 font-mono text-[11px] leading-relaxed text-[var(--landing-subtle)]">
          {active.example}
        </pre>
        <Link
          href="/docs/usage/concepts/object-model/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)] transition hover:gap-2"
        >
          Object model docs <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
