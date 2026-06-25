'use client';

import Link from 'next/link';
import { ArrowRight, Crosshair, Shield, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { YamlPreview } from '@/components/landing/yaml-preview';
import { DEMO_FILES, UUID } from '@/lib/landing/demo-registry';

type NodeType = 'threat' | 'objective' | 'rule';

type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  sub: string;
  x: number;
  y: number;
  chain?: boolean;
};

const TYPE_COLOR: Record<NodeType, string> = {
  threat: '#ef4444',
  objective: '#003399',
  rule: '#22c55e',
};

const TYPE_ICON = { threat: Target, objective: Crosshair, rule: Shield } as const;

/** Background registry nodes + highlighted CVE chain */
const nodes: GraphNode[] = [
  { id: 't-ransom', type: 'threat', label: 'Ransomware staging', sub: 'threat::1.0', x: 18, y: 12 },
  { id: 't-phish', type: 'threat', label: 'Phishing delivery', sub: 'threat::1.0', x: 12, y: 38 },
  { id: 't-gw', type: 'threat', label: 'Gateway exploit', sub: 'CVE-2024-1709', x: 32, y: 28, chain: true },
  { id: 'o-persist', type: 'objective', label: 'Persistence', sub: 'objective::1.0', x: 52, y: 10 },
  { id: 'o-lateral', type: 'objective', label: 'Lateral movement', sub: 'objective::1.0', x: 48, y: 48 },
  { id: 'o-cred', type: 'objective', label: 'Credential access', sub: 'objective::1.0', x: 58, y: 30, chain: true },
  { id: 'r-ps', type: 'rule', label: 'PowerShell', sub: 'rule::1.0', x: 78, y: 14 },
  { id: 'r-rdp', type: 'rule', label: 'RDP anomaly', sub: 'rule::1.0', x: 72, y: 52 },
  { id: 'r-lsass', type: 'rule', label: 'LSASS access', sub: 'rule::1.0', x: 84, y: 32, chain: true },
];

const edges: { from: string; to: string; chain?: boolean }[] = [
  { from: 't-gw', to: 'o-cred', chain: true },
  { from: 'o-cred', to: 'r-lsass', chain: true },
  { from: 't-gw', to: 'o-lateral' },
  { from: 'o-lateral', to: 'r-rdp' },
  { from: 't-ransom', to: 'o-persist' },
  { from: 't-phish', to: 'o-persist' },
  { from: 'o-persist', to: 'r-ps' },
];

const TYPE_EXPLAIN: Record<NodeType, string> = {
  threat:
    'threat::1.0 — threat vector (TVM) with severity, impact, and att&ck mapping. Objectives reference threat UUIDs in objective.threats.',
  objective:
    'objective::1.0 — detection objective (DOM) with composition strategy and structured signals. Rules link via detection_model.',
  rule:
    'rule::1.0 — deployable MDR rule with configurations per platform. Implements an objective through detection_model UUID.',
};

const previews: Record<
  string,
  { path: string; schema: string; title: string; note?: string; yaml: string }
> = {
  't-gw': {
    path: 'objects/threats/gateway-exploitation.yaml',
    schema: 'threat::1.0',
    title: 'Gateway exploitation',
    note: 'CVE-2024-1709 — ConnectWise ScreenConnect auth bypass (CISA AA24-073A).',
    yaml: DEMO_FILES['objects/threats/gateway-exploitation.yaml'],
  },
  'o-cred': {
    path: 'objects/objectives/credential-access.yaml',
    schema: 'objective::1.0',
    title: 'Credential access',
    yaml: DEMO_FILES['objects/objectives/credential-access.yaml'],
  },
  'r-lsass': {
    path: 'objects/rules/lsass-memory-access.yaml',
    schema: 'rule::1.0',
    title: 'LSASS memory access',
    yaml: DEMO_FILES['objects/rules/lsass-memory-access.yaml'],
  },
  'o-lateral': {
    path: 'objects/objectives/lateral-movement.yaml',
    schema: 'objective::1.0',
    title: 'Lateral movement',
    yaml: DEMO_FILES['objects/objectives/lateral-movement.yaml'],
  },
  'r-ps': {
    path: 'objects/rules/suspicious-powershell.yaml',
    schema: 'rule::1.0',
    title: 'Suspicious PowerShell',
    yaml: DEMO_FILES['objects/rules/suspicious-powershell.yaml'],
  },
  't-ransom': {
    path: 'objects/threats/ransomware-staging.yaml',
    schema: 'threat::1.0',
    title: 'Ransomware staging',
    yaml: DEMO_FILES['objects/threats/ransomware-staging.yaml'],
  },
};

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function ObjectGraph() {
  const [selected, setSelected] = useState('t-gw');
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), []);
  const active = previews[selected] ?? previews['t-gw'];
  const activeNode = nodeMap.get(selected) ?? nodeMap.get('t-gw')!;

  const inChain = (id: string) => {
    const n = nodeMap.get(id);
    if (!n?.chain) return selected === id;
    return (
      selected === id ||
      edges.some(
        (e) =>
          e.chain &&
          ((e.from === selected || e.to === selected) && (e.from === id || e.to === id)),
      )
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-stretch">
      <div className="landing-surface-card relative flex min-h-[380px] flex-col overflow-hidden p-4 md:p-5">
        <svg viewBox="0 0 100 62" className="min-h-[320px] w-full flex-1" role="img" aria-label="Registry graph">
          {edges.map((e) => {
            const a = nodeMap.get(e.from)!;
            const b = nodeMap.get(e.to)!;
            const on = e.chain ? inChain(e.from) && inChain(e.to) : false;
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={edgePath(a.x + 5, a.y, b.x - 5, b.y)}
                fill="none"
                stroke={on ? '#ffcc00' : '#1f1f1f'}
                strokeWidth={on ? 0.45 : 0.22}
                className="transition-all duration-500"
              />
            );
          })}
          {nodes.map((node) => {
            const on = selected === node.id;
            const dim = !inChain(node.id) && !on;
            const Icon = TYPE_ICON[node.type];
            return (
              <g
                key={node.id}
                className={`cursor-pointer transition-all duration-500 ${dim ? 'opacity-20' : node.chain ? 'opacity-100' : 'opacity-45'}`}
                onClick={() => previews[node.id] && setSelected(node.id)}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onKeyDown={(ev) => {
                  if ((ev.key === 'Enter' || ev.key === ' ') && previews[node.id]) {
                    ev.preventDefault();
                    setSelected(node.id);
                  }
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={on ? 5.5 : node.chain ? 4.8 : 4}
                  fill={on ? TYPE_COLOR[node.type] : 'var(--landing-surface)'}
                  stroke={on ? '#ffcc00' : TYPE_COLOR[node.type]}
                  strokeWidth={on ? 0.6 : 0.35}
                />
                <foreignObject x={node.x - 2.5} y={node.y - 2.5} width={5} height={5}>
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
                  className="fill-[var(--landing-ink)] text-[2.8px] font-medium"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 12.5}
                  textAnchor="middle"
                  className="fill-[var(--landing-subtle)] text-[2.2px]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 text-center text-[10px] text-[var(--landing-subtle)]">
          Highlighted chain · {UUID.threatGateway.slice(0, 8)}… → objective → rule
        </p>
      </div>

      <div className="landing-surface-card flex min-h-[380px] flex-col overflow-hidden">
        <div className="shrink-0 border-b border-white/[0.06] p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">{active.path}</p>
          <h3 className="mt-1 text-xl font-bold" style={{ color: TYPE_COLOR[activeNode.type] }}>
            {active.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-[var(--eu-yellow)]">{active.schema}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--landing-subtle)]">{TYPE_EXPLAIN[activeNode.type]}</p>
          {active.note && <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{active.note}</p>}
        </div>
        <YamlPreview yaml={active.yaml} path={active.path} className="flex-1 rounded-none border-0" />
        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <Link
            href="/docs/specifications/specs/objects/rule-1.0/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)]"
          >
            Object specs <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
