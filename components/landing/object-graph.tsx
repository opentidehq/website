'use client';

import Link from 'next/link';
import { ArrowRight, Crosshair, FileSearch, Shield, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { YamlPreview } from '@/components/landing/yaml-preview';

type NodeType = 'intel' | 'threat' | 'objective' | 'rule';

type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  sub: string;
  x: number;
  y: number;
};

const TYPE_COLOR: Record<NodeType, string> = {
  intel: 'var(--landing-subtle)',
  threat: 'var(--eu-blue)',
  objective: '#1a4fb5',
  rule: 'var(--eu-yellow)',
};

const TYPE_ICON = {
  intel: FileSearch,
  threat: Target,
  objective: Crosshair,
  rule: Shield,
} as const;

const nodes: GraphNode[] = [
  { id: 'intel-cve', type: 'intel', label: 'CVE-2024-1709', sub: 'CISA advisory', x: 16, y: 26 },
  { id: 'intel-actor', type: 'intel', label: 'UNC5537', sub: 'MSP actor brief', x: 16, y: 74 },
  { id: 'threat-gw', type: 'threat', label: 'ScreenConnect abuse', sub: 'threat::1.0', x: 42, y: 50 },
  { id: 'obj-lateral', type: 'objective', label: 'Lateral staging', sub: 'objective::1.0', x: 66, y: 28 },
  { id: 'obj-cred', type: 'objective', label: 'Credential access', sub: 'objective::1.0', x: 66, y: 72 },
  { id: 'rule-lsass', type: 'rule', label: 'LSASS dump', sub: 'rule::1.0', x: 88, y: 50 },
];

const edges = [
  ['intel-cve', 'threat-gw'],
  ['intel-actor', 'threat-gw'],
  ['threat-gw', 'obj-lateral'],
  ['threat-gw', 'obj-cred'],
  ['obj-cred', 'rule-lsass'],
] as const;

const TYPE_EXPLAIN: Record<NodeType, string> = {
  intel:
    'External context — advisories, actor profiles, sector briefs. Intel does not deploy; it informs which threats to model.',
  threat:
    'A threat vector (TVM) defines adversary behaviour, techniques, and assets in scope. Objectives and rules chain back here for traceability.',
  objective:
    'A detection objective states what “good detection” means — signals and success criteria. One or more rules can satisfy an objective.',
  rule:
    'An MDR rule is the deployable unit: platform queries, schedules, and metadata. opentide validates and dry-run deploys per SIEM.',
};

const previews: Record<
  string,
  {
    path: string;
    schema: string;
    title: string;
    paragraph?: string;
    yaml?: string;
  }
> = {
  'intel-cve': {
    path: 'intel/advisories/',
    schema: 'intelligence feed',
    title: 'CVE-2024-1709',
    paragraph:
      'On 21 February 2024, CISA released advisory AA24-073A for a critical authentication bypass in ConnectWise ScreenConnect (CVE-2024-1709). Exploitation allows unauthenticated remote code execution on gateway hosts — a common initial access path in MSP breaches. This intel item prioritises gateway-exploitation modelling and downstream credential-theft objectives for managed service providers.',
    yaml: `source: CISA AA24-073A
type: cve_advisory
published: 2024-02-21
cves:
  - CVE-2024-1709
sectors:
  - msp
  - it_services
severity: critical
feeds_threat:
  - screenconnect-abuse`,
  },
  'intel-actor': {
    path: 'intel/actors/',
    schema: 'intelligence feed',
    title: 'UNC5537',
    paragraph:
      'UNC5537 is a financially motivated cluster observed targeting MSP remote-management tooling, including ScreenConnect, during Q1 2024. Campaigns chain initial access to data theft and extortion. Attribution grounds objective tuning for lateral staging and credential access in MSP tenant environments.',
    yaml: `name: UNC5537
type: threat_actor
motivation: financial
sectors:
  - msp
ttps:
  - T1190
  - T1003
  - T1021
feeds_threat:
  - screenconnect-abuse`,
  },
  'threat-gw': {
    path: 'objects/threats/screenconnect-abuse.yaml',
    schema: 'threat::1.0',
    title: 'ScreenConnect abuse',
    yaml: `name: ScreenConnect gateway exploitation
metadata:
  schema: threat::1.0
  version: 1.0.0
  uuid: 8f3c2a1b-4e5d-6a7b-8c9d-0e1f2a3b4c5d
  tlp: clear
techniques:
  - T1190
  - T1133
assets:
  - edge_gateway
  - remote_management
narrative: >
  Adversaries exploit auth bypass in exposed
  ScreenConnect instances for initial access.`,
  },
  'obj-lateral': {
    path: 'objects/objectives/lateral-staging.yaml',
    schema: 'objective::1.0',
    title: 'Lateral staging',
    yaml: `name: Lateral movement staging
metadata:
  schema: objective::1.0
  version: 1.0.0
  uuid: b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e
chains_to:
  threat: 8f3c2a1b-4e5d-6a7b-8c9d-0e1f2a3b4c5d
signals:
  - remote_service_create
  - rdp_anomaly
  - new_scheduled_task`,
  },
  'obj-cred': {
    path: 'objects/objectives/credential-access.yaml',
    schema: 'objective::1.0',
    title: 'Credential access',
    yaml: `name: Credential access via LSASS
metadata:
  schema: objective::1.0
  version: 1.1.0
  uuid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
chains_to:
  threat: 8f3c2a1b-4e5d-6a7b-8c9d-0e1f2a3b4c5d
signals:
  - process_access
  - dump_creation
  - suspicious_handle`,
  },
  'rule-lsass': {
    path: 'objects/rules/credential-dump.yaml',
    schema: 'rule::1.0',
    title: 'LSASS dump',
    yaml: `name: Suspicious LSASS memory access
metadata:
  schema: rule::1.0
  version: 1.2.0
  uuid: c3d4e5f6-7890-abcd-ef12-3456789abcde
  tlp: clear
chains_to:
  objective: a1b2c3d4-e5f6-7890-abcd-ef1234567890
platforms:
  sentinel:
    enabled: true
    query: |
      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
      | where TargetImage has "lsass.exe"
  defender:
    enabled: true
    query: |
      DeviceProcessEvents
      | where FileName =~ "lsass.exe"`,
  },
};

function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function ObjectGraph() {
  const [selected, setSelected] = useState('intel-cve');
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), []);
  const active = previews[selected];
  const activeNode = nodeMap.get(selected)!;

  const lit = (id: string) =>
    selected === id || edges.some(([f, t]) => (f === selected || t === selected) && (f === id || t === id));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:items-stretch">
      <div className="landing-surface-card flex min-h-[360px] flex-col p-4 md:p-5">
        <svg viewBox="0 0 100 100" className="min-h-[300px] w-full flex-1" role="img" aria-label="Knowledge graph">
          <defs>
            <marker id="kg-arrow" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="var(--landing-dim)" />
            </marker>
          </defs>
          {edges.map(([from, to]) => {
            const a = nodeMap.get(from)!;
            const b = nodeMap.get(to)!;
            const on = lit(from) && lit(to);
            return (
              <path
                key={`${from}-${to}`}
                d={edgePath(a.x + 6, a.y, b.x - 6, b.y)}
                fill="none"
                stroke={on ? 'var(--eu-yellow)' : 'var(--landing-surface-raised)'}
                strokeWidth={on ? 0.4 : 0.28}
                markerEnd="url(#kg-arrow)"
                className="transition-all duration-300"
              />
            );
          })}
          {nodes.map((node) => {
            const on = selected === node.id;
            const dim = !lit(node.id);
            const Icon = TYPE_ICON[node.type];
            const iconColor =
              on && node.type === 'rule'
                ? 'var(--landing-bg)'
                : on
                  ? 'var(--landing-ink)'
                  : TYPE_COLOR[node.type];
            return (
              <g
                key={node.id}
                className={`cursor-pointer transition-opacity duration-300 ${dim ? 'opacity-35' : 'opacity-100'}`}
                onClick={() => setSelected(node.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    setSelected(node.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={on}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={on ? 6.2 : 5.2}
                  fill={on ? TYPE_COLOR[node.type] : 'var(--landing-surface)'}
                  stroke={on ? 'var(--eu-yellow)' : TYPE_COLOR[node.type]}
                  strokeWidth={on ? 0.65 : 0.45}
                  className="transition-all duration-300"
                />
                <foreignObject x={node.x - 3} y={node.y - 3} width={6} height={6}>
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="size-[10px]" style={{ color: iconColor }} strokeWidth={2.2} />
                  </div>
                </foreignObject>
                <text
                  x={node.x}
                  y={node.y + 11}
                  textAnchor="middle"
                  className="fill-[var(--landing-ink)] text-[3px] font-semibold"
                  style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 15}
                  textAnchor="middle"
                  className="fill-[var(--landing-subtle)] text-[2.5px]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-[10px] text-[var(--landing-subtle)]">
          Click a node · CVE-2024-1709 → ScreenConnect → objectives → rule
        </p>
      </div>

      <div className="landing-surface-card flex min-h-[360px] flex-col overflow-hidden">
        <div className="shrink-0 border-b border-white/[0.06] p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">{active.path}</p>
          <h3 className="mt-1 text-xl font-bold" style={{ color: TYPE_COLOR[activeNode.type] }}>
            {active.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-[var(--eu-yellow)]">{active.schema}</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--landing-subtle)]">{TYPE_EXPLAIN[activeNode.type]}</p>
          {active.paragraph && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{active.paragraph}</p>
          )}
        </div>
        {active.yaml && <YamlPreview yaml={active.yaml} path={active.path} className="flex-1 rounded-none border-0" />}
        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <Link
            href="/docs/usage/concepts/object-model/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)]"
          >
            Object model docs <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
