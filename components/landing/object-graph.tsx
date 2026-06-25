'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

type NodeType = 'intel' | 'threat' | 'objective' | 'rule';

type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  sub: string;
  x: number;
  y: number;
};

type GraphEdge = { from: string; to: string; label?: string };

const TYPE_COLOR: Record<NodeType, string> = {
  intel: '#71717a',
  threat: '#003399',
  objective: '#1a4fb5',
  rule: '#ffcc00',
};

const nodes: GraphNode[] = [
  { id: 'intel-cve', type: 'intel', label: 'CVE-2024-1709', sub: 'ConnectWise advisory', x: 14, y: 28 },
  { id: 'intel-actor', type: 'intel', label: 'UNC5537', sub: 'MSP sector brief', x: 14, y: 72 },
  { id: 'threat-gw', type: 'threat', label: 'Gateway exploit', sub: 'threat::1.0', x: 38, y: 50 },
  { id: 'obj-lateral', type: 'objective', label: 'Lateral movement prep', sub: 'objective::1.0', x: 62, y: 30 },
  { id: 'obj-cred', type: 'objective', label: 'Credential access', sub: 'objective::1.0', x: 62, y: 70 },
  { id: 'rule-lsass', type: 'rule', label: 'LSASS dump', sub: 'rule::1.0', x: 86, y: 50 },
];

const edges: GraphEdge[] = [
  { from: 'intel-cve', to: 'threat-gw', label: 'informs' },
  { from: 'intel-actor', to: 'threat-gw', label: 'attributes' },
  { from: 'threat-gw', to: 'obj-lateral' },
  { from: 'threat-gw', to: 'obj-cred' },
  { from: 'obj-cred', to: 'rule-lsass', label: 'satisfied by' },
];

const previews: Record<
  string,
  { path: string; schema: string; title: string; body: string; yaml: string; links: string[] }
> = {
  'intel-cve': {
    path: 'intel/advisories/',
    schema: 'intel feed',
    title: 'CVE-2024-1709',
    body: 'CISA advisory on ConnectWise ScreenConnect auth bypass. Feeds the gateway exploitation threat vector and prioritises detection objectives for MSP environments.',
    yaml: `source: CISA AA24-073A
type: cve_advisory
published: 2024-02-21
cves:
  - CVE-2024-1709
sectors: [msp, it_services]
severity: critical
chains_to:
  - threat: gateway-exploitation`,
    links: ['ConnectWise RCE', 'T1190 exploitation'],
  },
  'intel-actor': {
    path: 'intel/actors/',
    schema: 'intel feed',
    title: 'UNC5537',
    body: 'Threat actor cluster targeting MSP tooling. Linked to ScreenConnect abuse and follow-on credential theft — grounds objective tuning for managed service providers.',
    yaml: `name: UNC5537
type: threat_actor
motivation: financial
sectors: [msp]
ttps: [T1190, T1003, T1021]
feeds_threat:
  - gateway-exploitation`,
    links: ['MSP targeting', 'Tooling abuse'],
  },
  'threat-gw': {
    path: 'objects/threats/',
    schema: 'threat::1.0',
    title: 'Gateway exploitation',
    body: 'Threat vector for initial access via exposed management gateways. Objectives chain here; rules inherit ATT&CK coverage from this node.',
    yaml: `name: Gateway exploitation
metadata:
  schema: threat::1.0
  version: 1.0.0
  uuid: 8f3c2a1b-…
techniques: [T1190]
assets: [edge_gateway, vpn]`,
    links: ['T1190', '2 objectives'],
  },
  'obj-lateral': {
    path: 'objects/objectives/',
    schema: 'objective::1.0',
    title: 'Lateral movement prep',
    body: 'Detection objective for post-exploitation staging before pivot. Signals include new service creation and unusual RDP patterns.',
    yaml: `name: Lateral movement prep
metadata:
  schema: objective::1.0
chains_to:
  threat: 8f3c2a1b-…
signals:
  - remote_service_create
  - rdp_anomaly`,
    links: ['Staging behaviour', '0 rules yet'],
  },
  'obj-cred': {
    path: 'objects/objectives/',
    schema: 'objective::1.0',
    title: 'Credential access',
    body: 'Objective covering LSASS and memory dump patterns after gateway compromise. Satisfied by the LSASS dump rule deployed to Sentinel.',
    yaml: `name: Credential access
metadata:
  schema: objective::1.0
chains_to:
  threat: 8f3c2a1b-…
signals:
  - process_access
  - dump_creation`,
    links: ['1 rule', 'Sentinel + Defender'],
  },
  'rule-lsass': {
    path: 'objects/rules/',
    schema: 'rule::1.0',
    title: 'LSASS dump',
    body: 'Deployable MDR rule with Sentinel KQL and Defender queries. Validates honestly per platform — dry-run before production push.',
    yaml: `name: Suspicious LSASS access
metadata:
  schema: rule::1.0
  version: 1.2.0
chains_to:
  objective: a1b2c3d4-…
platforms:
  sentinel:
    query: |
      DeviceProcessEvents
      | where …
    enabled: true`,
    links: ['Sentinel', 'Defender', 'dry-run OK'],
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

  const litEdge = (e: GraphEdge) => selected === e.from || selected === e.to;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
      <div className="landing-surface-card flex min-h-[340px] flex-col p-4 md:p-5">
        <svg viewBox="0 0 100 100" className="min-h-[280px] w-full flex-1" role="img" aria-label="Knowledge graph">
          <defs>
            <marker id="kg-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#52525b" />
            </marker>
          </defs>
          {edges.map((e) => {
            const a = nodeMap.get(e.from)!;
            const b = nodeMap.get(e.to)!;
            const lit = litEdge(e);
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={edgePath(a.x + 5, a.y, b.x - 5, b.y)}
                fill="none"
                stroke={lit ? '#ffcc00' : '#27272a'}
                strokeWidth={lit ? 0.45 : 0.3}
                markerEnd="url(#kg-arrow)"
                className="transition-all duration-300"
              />
            );
          })}
          {nodes.map((node) => {
            const on = selected === node.id;
            const dim =
              selected !== node.id &&
              !edges.some((e) => litEdge(e) && (e.from === node.id || e.to === node.id));
            return (
              <g
                key={node.id}
                className={`cursor-pointer transition-opacity duration-300 ${dim ? 'opacity-40' : 'opacity-100'}`}
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
                <rect
                  x={node.x - 9}
                  y={node.y - 5}
                  width={18}
                  height={10}
                  rx={2}
                  fill={on ? TYPE_COLOR[node.type] : '#0a0a0a'}
                  stroke={on ? '#ffcc00' : TYPE_COLOR[node.type]}
                  strokeWidth={on ? 0.55 : 0.35}
                  className="transition-all duration-300"
                />
                <text
                  x={node.x}
                  y={node.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[3.2px] font-semibold"
                  style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  className="fill-[#71717a] text-[2.6px]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 border-t border-white/[0.06] pt-3 text-[10px] text-[var(--landing-subtle)]">
          {(['intel', 'threat', 'objective', 'rule'] as NodeType[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ backgroundColor: TYPE_COLOR[t] }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-surface-card flex min-h-[340px] flex-col p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
          {active.path}
        </p>
        <h3 className="mt-1 text-2xl font-bold" style={{ color: TYPE_COLOR[activeNode.type] }}>
          {active.title}
        </h3>
        <p className="mt-1 font-mono text-xs text-[var(--eu-yellow)]">{active.schema}</p>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--landing-muted)]">{active.body}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {active.links.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/[0.08] bg-black px-2 py-0.5 font-mono text-[10px] text-[var(--landing-subtle)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <pre className="mt-4 max-h-[180px] overflow-auto rounded-lg border border-white/[0.06] bg-black p-4 font-mono text-[10px] leading-relaxed text-zinc-400 sm:text-[11px]">
          {active.yaml}
        </pre>
        <Link
          href="/docs/usage/concepts/object-model/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)]"
        >
          Object model docs <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
