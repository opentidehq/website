/**
 * The ontology map's data: the objects of the demo repository, how they link, and the
 * excerpt each node shows. Every excerpt line is copied verbatim from the demo files in
 * lib/landing/demo-registry.ts, in order; `ontology.test.ts` fails when they drift apart.
 * A leading `>` marks a line that carries a link. Kept free of imports so the map does not
 * pull the demo registry into the landing's first load.
 */

export type NodeId =
  | 'threat'
  | 'objective'
  | 'signals'
  | 'rule'
  | 'assets'
  | 'logsources'
  | 'detectors'
  | 'integrations';

export type OntologyNode = {
  /** The detection catalogue under `objects/`, or the environment it lands in. */
  zone: 'catalogue' | 'environment';
  tag: string;
  title: string;
  question: string;
  body: string;
  file: string;
  excerpt: string[];
  /** Centre on the map, in percent of its width and height. */
  at: [number, number];
  /** Signals are part of the objective: drawn smaller, and inside the catalogue. */
  nested?: boolean;
};

/**
 * `uuid`: a reference by UUID that validation resolves. `nested`: a part of the object.
 * `name`: a name or a vocabulary value.
 */
export type Edge = { from: NodeId; to: NodeId; field: string; kind: 'uuid' | 'nested' | 'name' };

const VISIBILITY = '.opentide/configurations/visibility.toml';
const OBJECTIVE_FILE = 'objects/objectives/credential-access-via-lsass.yaml';

export const NODES: Record<NodeId, OntologyNode> = {
  threat: {
    zone: 'catalogue',
    tag: 'threat::1.0',
    title: 'Threat',
    question: 'What do we defend against?',
    body: 'An adversary capability, scored by severity, impact, leverage and viability, and mapped to ATT&CK. Threats chain into attack paths: one precedes, enables or implements another. Its surface uses the same vocabulary as your assets.',
    file: 'objects/threats/gateway-exploitation-cve-2026-0300.yaml',
    excerpt: [
      'name: Gateway exploitation (CVE-2026-0300)',
      'metadata:',
      '  uuid: 00000000-0000-4000-8001-000000000010',
      'threat:',
      '  severity: Significant incident',
      '>  surface:',
      '>    - Firewalls::Palo Alto Networks',
      '  mitre_attack:',
      '    - T1190',
      '>  chaining:',
      '>    - relation: sequence::preceeds',
      '>      vector: 00000000-0000-4000-8001-000000000020',
    ],
    at: [13, 18],
  },
  objective: {
    zone: 'catalogue',
    tag: 'objective::1.0',
    title: 'Objective',
    question: 'What are we trying to detect?',
    body: 'The detection goal, with a priority, a type and a composition strategy. It lists the threats it covers, and the signals that together satisfy it.',
    file: OBJECTIVE_FILE,
    excerpt: [
      'name: Credential access via LSASS',
      'objective:',
      '  priority: High',
      '  type: Threat',
      '  composition:',
      '    strategy: Combined',
      '>  threats:',
      '>    - 00000000-0000-4000-8001-000000000010',
      '>  signals:',
      '>    - name: LSASS process access',
    ],
    at: [50, 18],
  },
  signals: {
    zone: 'catalogue',
    tag: 'signals[]',
    title: 'Signals',
    question: 'What evidence do we look for?',
    body: 'Each signal is one observable part of the objective: the entities it watches, its methodology and severity, the log sources it needs, and the detectors that already see it.',
    file: OBJECTIVE_FILE,
    excerpt: [
      '  signals:',
      '    - name: LSASS process access',
      '      uuid: 00000000-0000-4000-8099-000000000001',
      '      severity: High',
      '      methodology: Behavioural',
      '      data:',
      '>        logsources:',
      '>          - Endpoint process events',
      '>      detectors:',
      '>        - name: Defender for Endpoint',
    ],
    at: [50, 44],
    nested: true,
  },
  rule: {
    zone: 'catalogue',
    tag: 'rule::1.1',
    title: 'Rule',
    question: 'How do we detect it, on which integration?',
    body: 'One configuration block per integration, each with its own query, status and schedule. The rule names the objective it implements, so every alert traces back to a threat.',
    file: 'objects/rules/lsass-memory-access.yaml',
    excerpt: [
      'name: LSASS memory access',
      'status: STAGING',
      '>detection_model: 00000000-0000-4000-8002-000000000001',
      'configurations:',
      '>  sentinel:',
      '    query: |',
      '      DeviceProcessEvents',
      '      | where FileName =~ "lsass.exe"',
      '>  splunk:',
      '    query: |',
      '      `sysmon` EventCode=10 TargetImage="*\\\\lsass.exe"',
    ],
    at: [87, 18],
  },
  detectors: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Detectors',
    question: 'What already sees it?',
    body: 'Vendor or in-house detections that watch your assets. Signals record the detectors that already cover them, so new work goes where nothing is looking yet.',
    file: VISIBILITY,
    excerpt: [
      '[[detectors]]',
      'name = "Defender for Endpoint"',
      'description = "Built-in credential theft alerts"',
      '>assets = ["Corporate workstations"]',
    ],
    at: [28, 67],
  },
  assets: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Assets',
    question: 'What do we run?',
    body: 'The systems in your environment, tagged with the surface vocabulary that threats use, and ranked by criticality. A threat on Windows::Desktop meets the workstations that run it.',
    file: VISIBILITY,
    excerpt: [
      '[[assets]]',
      'name = "Edge firewalls"',
      'criticality = "High"',
      '>surface = ["Firewalls::Palo Alto Networks"]',
      '',
      '[[assets]]',
      'name = "Corporate workstations"',
      '>surface = ["Windows::Desktop::11"]',
    ],
    at: [13, 88],
  },
  logsources: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Log sources',
    question: 'What do we collect, and where does it land?',
    body: 'Telemetry from your assets, and the integration it lands in. opentide generate writes the names into the JSON Schema, so a signal’s log sources complete in the editor.',
    file: VISIBILITY,
    excerpt: [
      '[[logsources]]',
      'name = "Endpoint process events"',
      'description = "Defender for Endpoint DeviceProcessEvents, forwarded to Sentinel"',
      '>system = "sentinel"',
      '>assets = ["Corporate workstations"]',
    ],
    at: [50, 88],
  },
  integrations: {
    zone: 'environment',
    tag: 'platforms/*.toml',
    title: 'Integrations',
    question: 'Where does it run?',
    body: 'The SIEM and EDR platforms the rules deploy to, each configured once per repository with the tenants a plan deploys to.',
    file: '.opentide/configurations/platforms/sentinel.toml',
    excerpt: [
      '[platform]',
      '>identifier = "sentinel"',
      'name = "Microsoft Sentinel"',
      '',
      '[[tenants]]',
      'name = "SOC Staging"',
      'deployment = "STAGING"',
    ],
    at: [87, 88],
  },
};

/** References point from the object that holds the field to the one it names. */
export const EDGES: Edge[] = [
  { from: 'threat', to: 'threat', field: 'chaining', kind: 'uuid' },
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
export const TOUR: NodeId[] = ['threat', 'assets', 'objective', 'signals', 'logsources', 'detectors', 'rule', 'integrations'];
