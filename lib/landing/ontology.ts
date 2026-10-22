/**
 * The ontology map's data: the objects of the demo repository, how they link, and the
 * excerpt each node shows. Every excerpt line, record and link value is copied verbatim from
 * the demo files in lib/landing/demo-registry.ts; `ontology.test.ts` fails when they drift
 * apart. A leading `>` marks an excerpt line that carries a link. Kept free of imports so the
 * map does not pull the demo registry into the landing's first load.
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

/** One demo object as its node shows it: its name, and the values that identify it. */
export type NodeRecord = {
  name: string;
  /** A short value shown beside the name, such as an asset's criticality. */
  tag?: string;
  facts: string[];
  /** The demo file that holds it, when it is not the node's file. */
  file?: string;
  /** The chaining relation from the record above, as the node's file records it. */
  via?: string;
};

export type OntologyNode = {
  /** The detection catalogue under `objects/`, or the environment it lands in. */
  zone: 'catalogue' | 'environment';
  tag: string;
  title: string;
  question: string;
  body: string;
  file: string;
  excerpt: string[];
  records: NodeRecord[];
  /** Centre on the map's canvas, in px. */
  at: [number, number];
  /** Signals are part of the objective: drawn inside the catalogue, without a schema of their own. */
  nested?: boolean;
};

/**
 * `uuid`: a reference by UUID that validation resolves. `nested`: a part of the object.
 * `name`: a name from the configuration. `vocabulary`: a value from a versioned vocabulary.
 */
export type EdgeKind = 'uuid' | 'nested' | 'name' | 'vocabulary';

export type Edge = {
  from: NodeId;
  to: NodeId;
  field: string;
  kind: EdgeKind;
  /** The link read from the object that holds the field. */
  says: string;
  /** The same link read from the object it names. */
  back: string;
  /** The field's value in the holder's demo file, a line at a time. */
  value: string[];
  /** The objects the value names, when the value is not their name already. */
  resolves?: string[];
};

/** The map is drawn on a fixed canvas and scaled to fit, so the layout holds at any width. */
export const CANVAS = { w: 900, h: 800 } as const;

/** Where each zone's band sits on the canvas, top and bottom, in px. */
export const ZONES = {
  catalogue: { top: 0, bottom: 440, caption: 'objects/' },
  environment: { top: 462, bottom: 800, caption: '.opentide/configurations/' },
} as const;

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
      '>    - Infrastructure::Firewalls::Palo Alto Networks',
      '  mitre_attack:',
      '    - T1190',
      '>  chaining:',
      '>    - relation: sequence::preceeds',
      '>      vector: 00000000-0000-4000-8001-000000000020',
    ],
    records: [
      { name: 'Gateway exploitation (CVE-2026-0300)', facts: ['T1190', 'Significant incident'] },
      {
        name: 'Credential dumping from LSASS',
        facts: ['T1003.001', 'Significant incident'],
        file: 'objects/threats/credential-dumping-from-lsass.yaml',
        via: 'sequence::preceeds',
      },
    ],
    at: [122, 172],
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
      '>    - 00000000-0000-4000-8001-000000000020',
      '>  signals:',
      '>    - name: LSASS process access',
    ],
    records: [{ name: 'Credential access via LSASS', facts: ['High', 'Threat', 'Combined'] }],
    at: [450, 172],
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
    records: [{ name: 'LSASS process access', facts: ['High', 'Behavioural'] }],
    at: [450, 352],
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
    records: [{ name: 'LSASS memory access', facts: ['STAGING', 'sentinel', 'splunk'] }],
    at: [790, 172],
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
    records: [{ name: 'Defender for Endpoint', facts: ['Corporate workstations'] }],
    at: [272, 520],
  },
  assets: {
    zone: 'environment',
    tag: 'visibility.toml',
    title: 'Assets',
    question: 'What do we run?',
    body: 'The systems in your environment, tagged with the surface vocabulary that threats use, and ranked by criticality. A threat on OS::Windows::Desktop meets the workstations that run it.',
    file: VISIBILITY,
    excerpt: [
      '[[assets]]',
      'name = "Edge firewalls"',
      'criticality = "High"',
      '>surface = ["Infrastructure::Firewalls::Palo Alto Networks"]',
      '',
      '[[assets]]',
      'name = "Corporate workstations"',
      '>surface = ["OS::Windows::Desktop::11"]',
    ],
    records: [
      { name: 'Edge firewalls', tag: 'High', facts: ['Infrastructure::Firewalls::Palo Alto Networks'] },
      { name: 'Corporate workstations', tag: 'Medium', facts: ['OS::Windows::Desktop::11'] },
    ],
    at: [122, 702],
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
    records: [
      { name: 'Endpoint process events', facts: ['sentinel'] },
      { name: 'Firewall traffic', facts: ['splunk'] },
    ],
    at: [450, 702],
  },
  integrations: {
    zone: 'environment',
    tag: 'platforms/*.toml',
    title: 'Integrations',
    question: 'Where does it run?',
    body: 'The SIEM and EDR platforms the rules deploy to, each configured once per repository with the tenants and the deploy strategies each one accepts.',
    file: '.opentide/configurations/platforms/sentinel.toml',
    excerpt: [
      '[platform]',
      '>identifier = "sentinel"',
      'name = "Microsoft Sentinel"',
      '',
      '[[tenants]]',
      'name = "SOC Staging"',
      'strategies = ["PREVIEW"]',
    ],
    records: [
      { name: 'Microsoft Sentinel', facts: ['sentinel'] },
      { name: 'Splunk Enterprise Security', facts: ['splunk'], file: '.opentide/configurations/platforms/splunk.toml' },
    ],
    at: [790, 702],
  },
};

/** References point from the object that holds the field to the one it names. */
export const EDGES: Edge[] = [
  {
    from: 'threat',
    to: 'threat',
    field: 'chaining',
    kind: 'uuid',
    says: 'Other threats, and how this one relates to them: it precedes, implements or enables them.',
    back: 'Threats that chain into this one.',
    value: ['relation: sequence::preceeds', 'vector: 00000000-0000-4000-8001-000000000020'],
    resolves: ['Credential dumping from LSASS'],
  },
  {
    from: 'objective',
    to: 'threat',
    field: 'threats',
    kind: 'uuid',
    says: 'The threats this objective covers.',
    back: 'Objectives that cover this threat.',
    value: ['- 00000000-0000-4000-8001-000000000010', '- 00000000-0000-4000-8001-000000000020'],
    resolves: ['Gateway exploitation (CVE-2026-0300)', 'Credential dumping from LSASS'],
  },
  {
    from: 'rule',
    to: 'objective',
    field: 'detection_model',
    kind: 'uuid',
    says: 'The objective this rule implements.',
    back: 'Rules that implement this objective.',
    value: ['detection_model: 00000000-0000-4000-8002-000000000001'],
    resolves: ['Credential access via LSASS'],
  },
  {
    from: 'objective',
    to: 'signals',
    field: 'signals[]',
    kind: 'nested',
    says: 'The evidence that, combined, satisfies the objective.',
    back: 'Each signal lives inside the objective it serves.',
    value: ['- name: LSASS process access'],
  },
  {
    from: 'threat',
    to: 'assets',
    field: 'surface',
    kind: 'vocabulary',
    says: 'Where the threat lands, in the surface vocabulary your assets use too.',
    back: 'Threats whose surface matches this asset’s.',
    value: ['- Infrastructure::Firewalls::Palo Alto Networks'],
    resolves: ['Edge firewalls'],
  },
  {
    from: 'signals',
    to: 'logsources',
    field: 'data.logsources',
    kind: 'name',
    says: 'The telemetry this signal needs.',
    back: 'Signals that need this telemetry.',
    value: ['- Endpoint process events'],
  },
  {
    from: 'signals',
    to: 'detectors',
    field: 'detectors',
    kind: 'name',
    says: 'Detectors that already see this signal.',
    back: 'Signals this detector already covers.',
    value: ['- name: Defender for Endpoint'],
  },
  {
    from: 'rule',
    to: 'integrations',
    field: 'configurations',
    kind: 'name',
    says: 'One block per integration the rule deploys to.',
    back: 'Rules with a configuration block for this integration.',
    value: ['sentinel:', 'splunk:'],
  },
  {
    from: 'logsources',
    to: 'assets',
    field: 'assets',
    kind: 'name',
    says: 'The assets this telemetry comes from.',
    back: 'Log sources collected from this asset.',
    value: ['assets = ["Corporate workstations"]'],
  },
  {
    from: 'logsources',
    to: 'integrations',
    field: 'system',
    kind: 'name',
    says: 'The integration this telemetry lands in.',
    back: 'Log sources that land in this integration.',
    value: ['system = "sentinel"'],
    resolves: ['Microsoft Sentinel'],
  },
  {
    from: 'detectors',
    to: 'assets',
    field: 'assets',
    kind: 'name',
    says: 'The assets this detector watches.',
    back: 'Detectors that watch this asset.',
    value: ['assets = ["Corporate workstations"]'],
  },
];

/** The guided tour reads like the story: what, where it lands, what to detect, how, where it runs. */
export const TOUR: NodeId[] = ['threat', 'assets', 'objective', 'signals', 'logsources', 'detectors', 'rule', 'integrations'];
