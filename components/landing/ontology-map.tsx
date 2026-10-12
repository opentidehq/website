'use client';

import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Tag } from '@/components/landing/ui';
import { UUID } from '@/lib/landing/demo-registry';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type NodeId = 'threat' | 'objective' | 'signals' | 'rule' | 'assets' | 'logsources' | 'detectors' | 'integrations';

type OntologyNode = {
  /** The detection catalogue under `objects/`, or the environment it lands in. */
  zone: 'catalogue' | 'environment';
  tag: string;
  title: string;
  question: string;
  body: string;
  file: string;
  /** Lines starting with `>` carry a link, and are highlighted. */
  excerpt: string;
  /** Centre on the map, in percent of its width and height. */
  at: [number, number];
  /** Signals are part of the objective: drawn smaller, and inside the catalogue. */
  nested?: boolean;
};

/** `uuid`: a reference by UUID that validation resolves. `name`: a name or a vocabulary value. */
type Edge = { from: NodeId; to: NodeId; field: string; kind: 'uuid' | 'nested' | 'name' };

const NODES: Record<NodeId, OntologyNode> = {
  threat: {
    zone: 'catalogue',
    tag: 'threat::1.0',
    title: 'Threat',
    question: 'What do we defend against?',
    body: 'An adversary capability, scored by severity, impact, leverage and viability, and mapped to ATT&CK techniques and actors. Its surface uses the same vocabulary as your assets, so every threat lands somewhere real.',
    file: 'objects/threats/gateway-exploitation-cve-2026-0300.yaml',
    excerpt: `name: Gateway exploitation (CVE-2026-0300)
metadata:
  uuid: ${UUID.threatGateway}
threat:
  severity: Significant incident
  viability: Likely
>  surface:
>    - Firewalls::Palo Alto Networks
  mitre_attack: [T1190, T1133]`,
    at: [13, 13],
  },
  objective: {
    zone: 'catalogue',
    tag: 'objective::1.0',
    title: 'Objective',
    question: 'What are we trying to detect?',
    body: 'The detection goal, with a priority, a type and a composition strategy. It lists the threats it covers, and the signals that together satisfy it.',
    file: 'objects/objectives/credential-access-via-lsass.yaml',
    excerpt: `name: Credential access via LSASS
objective:
  priority: High
  type: Threat
>  threats:
>    - ${UUID.threatGateway}
  composition:
    strategy: Combined
>  signals:
>    - name: LSASS process access`,
    at: [50, 13],
  },
  signals: {
    zone: 'catalogue',
    tag: 'signals[]',
    title: 'Signals',
    question: 'What evidence do we look for?',
    body: 'Each signal is one observable part of the objective: the entities it watches, its methodology and severity, the log sources it needs, and the detectors that already see it.',
    file: 'objects/objectives/credential-access-via-lsass.yaml',
    excerpt: `signals:
  - name: LSASS process access
    uuid: ${UUID.signalLsass}
    severity: High
    methodology: Behavioural
    entities: [Hostname, Process]
    data:
>      logsources:
>        - Endpoint process events
>    detectors:
>      - name: Defender for Endpoint`,
    at: [50, 41],
    nested: true,
  },
  rule: {
    zone: 'catalogue',
    tag: 'rule::1.1',
    title: 'Rule',
    question: 'How do we detect it, on which integration?',
    body: 'One configuration block per integration, each with its own query, status and schedule. The rule names the objective it implements, so every alert traces back to a threat.',
    file: 'objects/rules/lsass-memory-access.yaml',
    excerpt: `name: LSASS memory access
status: STAGING
techniques: [T1003.001]
>detection_model: ${UUID.objectiveCredential}
configurations:
>  sentinel:
    query: DeviceProcessEvents | where FileName =~ "lsass.exe" …
>  splunk:
    query: \`sysmon\` EventCode=10 TargetImage="*\\\\lsass.exe" …`,
    at: [87, 13],
  },
  detectors: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Detectors',
    question: 'What already sees it?',
    body: 'Vendor or in-house detections that watch your assets. Signals record the detectors that already cover them, so new work goes where nothing is looking yet.',
    file: '.opentide/configurations/visibility.toml',
    excerpt: `[[detectors]]
name = "Defender for Endpoint"
description = "Built-in credential theft alerts"
>assets = ["Corporate workstations"]`,
    at: [28, 65],
  },
  assets: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Assets',
    question: 'What do we run?',
    body: 'The systems in your environment, tagged with the surface vocabulary that threats use. A threat on Windows::Desktop meets the workstations that run it.',
    file: '.opentide/configurations/visibility.toml',
    excerpt: `[[assets]]
name = "Edge firewalls"
criticality = "High"
>surface = ["Firewalls::Palo Alto Networks"]

[[assets]]
name = "Corporate workstations"
>surface = ["Windows::Desktop::11"]`,
    at: [13, 87],
  },
  logsources: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Log sources',
    question: 'What do we collect, and where does it land?',
    body: 'Telemetry from your assets, and the integration it lands in. opentide generate writes the names into the JSON Schema, so a signal’s log sources complete in the editor.',
    file: '.opentide/configurations/visibility.toml',
    excerpt: `[[logsources]]
name = "Endpoint process events"
description = "DeviceProcessEvents, forwarded to Sentinel"
>system = "sentinel"
>assets = ["Corporate workstations"]`,
    at: [50, 87],
  },
  integrations: {
    zone: 'environment',
    tag: 'platforms/*.toml',
    title: 'Integrations',
    question: 'Where does it run?',
    body: 'Sentinel, Defender for Endpoint, Splunk, SentinelOne, Carbon Black Cloud, CrowdStrike and HarfangLab. Each is configured once per repository, with the tenants a plan deploys to.',
    file: '.opentide/configurations/platforms/sentinel.toml',
    excerpt: `[platform]
>identifier = "sentinel"
name = "Microsoft Sentinel"

[[tenants]]
name = "SOC Staging"
deployment = "STAGING"`,
    at: [87, 87],
  },
};

/** References point from the object that holds the field to the one it names. */
const EDGES: Edge[] = [
  { from: 'objective', to: 'threat', field: 'threats', kind: 'uuid' },
  { from: 'rule', to: 'objective', field: 'detection_model', kind: 'uuid' },
  { from: 'objective', to: 'signals', field: 'signals[]', kind: 'nested' },
  { from: 'threat', to: 'assets', field: 'surface', kind: 'name' },
  { from: 'signals', to: 'logsources', field: 'data.logsources', kind: 'name' },
  { from: 'signals', to: 'detectors', field: 'detectors', kind: 'name' },
  { from: 'rule', to: 'integrations', field: 'configurations', kind: 'name' },
  { from: 'logsources', to: 'assets', field: 'assets', kind: 'name' },
  { from: 'logsources', to: 'integrations', field: 'system', kind: 'name' },
  { from: 'detectors', to: 'assets', field: 'assets', kind: 'name' },
];

/** The guided tour reads like the story: what, where it lands, what to detect, how, where it runs. */
const TOUR: NodeId[] = ['threat', 'assets', 'objective', 'signals', 'logsources', 'detectors', 'rule', 'integrations'];
const STEP_MS = 5200;

const IDS = Object.keys(NODES) as NodeId[];
const GROUPS: { zone: OntologyNode['zone']; caption: string }[] = [
  { zone: 'catalogue', caption: 'objects/' },
  { zone: 'environment', caption: '.opentide/configurations/' },
];

type Segment = { x1: number; y1: number; x2: number; y2: number };

/** How far along (dx, dy) a line from a box's centre leaves a box of half-size (hw, hh). */
function exit(dx: number, dy: number, hw: number, hh: number) {
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
  return Math.min(tx, ty);
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
  const pair = text.match(/^(\s*-?\s*)([\w.[\]-]+)(\s*[:=])(.*)$/);
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
  const lines = node.excerpt.split('\n');
  return (
    <figure className="m-0 overflow-hidden rounded-xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] ring-1 ring-[var(--landing-border)]">
      <figcaption className="truncate border-b border-white/10 px-4 py-2 font-mono text-[11px] text-[var(--landing-code-dim)]">
        {node.file}
      </figcaption>
      <pre className="landing-code-scroll m-0 max-h-[16.5rem] overflow-auto py-3 font-mono text-[12.5px] leading-relaxed">
        <code>
          {lines.map((raw, i) => {
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
 * by UUID; and the environment they land in, linked by name and vocabulary: assets on a
 * surface, the log sources collected from them, the detectors that watch them, and the
 * integrations it all runs on. A guided tour walks the links; any node can be picked.
 */
export function OntologyMap() {
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, onScreen } = useOnScreen<HTMLDivElement>();
  const mapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Partial<Record<NodeId, HTMLButtonElement | null>>>({});
  const [segments, setSegments] = useState<Partial<Record<number, Segment>>>({});
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState<NodeId>('threat');
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [tick, setTick] = useState(0);

  const playing = auto && !reduced && onScreen && !hovering;

  // Edges draw in the first time the map is on screen, and stay drawn.
  if (onScreen && !drawn) setDrawn(true);

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
    const boxes: Partial<Record<NodeId, { x: number; y: number; hw: number; hh: number }>> = {};
    for (const id of IDS) {
      const el = nodeRefs.current[id];
      if (el) boxes[id] = { x: el.offsetLeft, y: el.offsetTop, hw: el.offsetWidth / 2, hh: el.offsetHeight / 2 };
    }
    const next: Partial<Record<number, Segment>> = {};
    EDGES.forEach((edge, i) => {
      const a = boxes[edge.from];
      const b = boxes[edge.to];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const gap = 6 / (Math.hypot(dx, dy) || 1);
      const ta = exit(dx, dy, a.hw, a.hh) + gap;
      const tb = exit(dx, dy, b.hw, b.hh) + gap;
      next[i] = { x1: a.x + dx * ta, y1: a.y + dy * ta, x2: b.x - dx * tb, y2: b.y - dy * tb };
    });
    setSegments(next);
  }, []);

  // A ResizeObserver reports once as soon as it observes, so it also takes the first measure.
  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ro = new ResizeObserver(measure);
    ro.observe(map);
    document.fonts?.ready.then(measure, () => undefined);
    return () => ro.disconnect();
  }, [measure, wide]);

  // Tour: advance on a timer while playing; the progress bar restarts with each node.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      setActive((current) => TOUR[(TOUR.indexOf(current) + 1) % TOUR.length]);
      setTick((t) => t + 1);
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, active, tick]);

  const pick = (id: NodeId) => {
    setActive(id);
    setAuto(false);
    setTick((t) => t + 1);
  };

  const node = NODES[active];
  const linked = new Set<NodeId>();
  EDGES.forEach((e) => {
    if (e.from === active) linked.add(e.to);
    if (e.to === active) linked.add(e.from);
  });
  const outgoing = EDGES.filter((e) => e.from === active);
  const incoming = EDGES.filter((e) => e.to === active);

  const nodeTone = (id: NodeId) =>
    id === active
      ? 'border-[var(--landing-accent)] shadow-[0_10px_30px_-12px_var(--landing-btn-shadow)]'
      : linked.has(id)
        ? 'border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]'
        : 'border-[var(--landing-border)] hover:border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]';

  return (
    <div ref={stageRef} className="landing-panel grid grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div
        className="relative flex flex-col justify-center gap-4 border-b border-[var(--landing-border)] p-4 sm:p-5 xl:border-b-0 xl:border-r"
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        {wide ? (
          <div ref={mapRef} className="relative aspect-[1000/860] w-full">
            {/* Zones: the catalogue in git, and the environment it lands in. */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] rounded-xl bg-[var(--landing-band)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[41%] rounded-xl border border-dashed border-[var(--landing-border)]" />
            <p className="absolute left-3 top-2 font-mono text-[11px] text-[var(--landing-subtle)]">objects/</p>
            <p className="absolute bottom-2 left-3 font-mono text-[11px] text-[var(--landing-subtle)]">.opentide/configurations/</p>

            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <marker id="onto-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 1 L10 5 L0 9 z" fill="color-mix(in srgb, var(--landing-ink) 32%, transparent)" />
                </marker>
                <marker id="onto-head-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 1 L10 5 L0 9 z" fill="var(--landing-accent)" />
                </marker>
              </defs>
              {EDGES.map((edge, i) => {
                const s = segments[i];
                if (!s) return null;
                const on = edge.from === active || edge.to === active;
                const d = `M${s.x1},${s.y1} L${s.x2},${s.y2}`;
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path
                      d={d}
                      pathLength={edge.kind === 'name' ? undefined : 1}
                      className={edge.kind === 'name' ? 'landing-fade-line' : 'landing-draw'}
                      strokeDasharray={edge.kind === 'name' ? '5 5' : undefined}
                      data-drawn={drawn || reduced ? '' : undefined}
                      style={{ transitionDelay: `${300 + i * 80}ms` }}
                      stroke={
                        on
                          ? 'color-mix(in srgb, var(--landing-accent) 40%, transparent)'
                          : 'color-mix(in srgb, var(--landing-ink) 24%, transparent)'
                      }
                      strokeWidth={edge.kind === 'nested' ? 2.5 : on ? 2 : 1.25}
                      fill="none"
                      markerEnd={edge.kind === 'nested' ? undefined : on ? 'url(#onto-head-on)' : 'url(#onto-head)'}
                    />
                    {on && !reduced && (
                      <path d={d} className="landing-flow" stroke="var(--landing-accent)" strokeWidth={2.5} fill="none" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Field names ride on their edges: solid for a UUID, dashed for a name or vocabulary. */}
            {EDGES.map((edge, i) => {
              const s = segments[i];
              if (!s) return null;
              const on = edge.from === active || edge.to === active;
              return (
                <span
                  key={`label-${edge.from}-${edge.to}`}
                  aria-hidden
                  className={`pointer-events-none absolute hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[11px] leading-4 transition-colors duration-300 md:block ${
                    edge.kind === 'name' ? 'border border-dashed' : 'border'
                  } ${
                    on
                      ? 'border-[var(--landing-accent)] bg-[var(--landing-panel)] text-[var(--landing-accent)]'
                      : 'border-[color-mix(in_srgb,var(--landing-ink)_18%,transparent)] bg-[var(--landing-panel)] text-[var(--landing-subtle)]'
                  }`}
                  style={{ left: (s.x1 + s.x2) / 2, top: (s.y1 + s.y2) / 2 }}
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
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-[var(--landing-panel)] text-left transition-[border-color,box-shadow,transform] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
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

      <div className="flex min-w-0 flex-col p-5 sm:p-7" aria-live="polite">
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
                setAuto((v) => !v);
                setTick((t) => t + 1);
              }}
              aria-pressed={!auto}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
            >
              {auto ? <Pause className="size-3 fill-current" aria-hidden /> : <Play className="size-3 fill-current" aria-hidden />}
              {auto ? 'Pause tour' : 'Play tour'}
            </button>
          )}
        </div>
        <span aria-hidden className="mt-3 block h-0.5 overflow-hidden rounded-full bg-[var(--landing-border)]">
          <span
            key={`${active}-${tick}-${playing}`}
            className={`block h-full rounded-full bg-[var(--landing-accent)] ${playing ? 'landing-progress' : ''}`}
            style={{ width: playing ? undefined : auto ? '0%' : '100%', animationDuration: `${STEP_MS}ms` }}
          />
        </span>

        <div key={active} className={reduced ? '' : 'landing-fade-slide'}>
          <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--landing-ink)]">{node.title}</h3>
          <p className="mt-1 text-lg text-[var(--landing-muted)]">{node.question}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">{node.body}</p>

          <ul className="mt-4 list-none space-y-1 p-0">
            {outgoing.map((e) => (
              <LinkRow key={`out-${e.to}`} field={e.field} onPick={() => pick(e.to)}>
                {NODES[e.to].title}
              </LinkRow>
            ))}
            {incoming.map((e) => (
              <LinkRow key={`in-${e.from}`} field={e.field} onPick={() => pick(e.from)} incoming>
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
