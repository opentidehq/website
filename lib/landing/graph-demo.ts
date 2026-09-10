/** Branched object-graph demo: intel trigger → threat → two objective/rule branches */

export const GRAPH_UUID = {
  threatDeviceCode: '00000000-0000-4000-8001-000000000020',
  objectiveOauth: '00000000-0000-4000-8002-000000000010',
  objectiveMailbox: '00000000-0000-4000-8002-000000000011',
  ruleEntra: '00000000-0000-4000-8003-000000000010',
  ruleExo: '00000000-0000-4000-8003-000000000011',
  signalDeviceCode: '00000000-0000-4000-8099-000000000010',
  signalInboxRule: '00000000-0000-4000-8099-000000000011',
} as const;

export type GraphNodeId =
  | 'trigger'
  | 'threat'
  | 'obj-oauth'
  | 'rule-entra'
  | 'obj-mailbox'
  | 'rule-exo';

export type GraphKind = 'trigger' | 'threat' | 'objective' | 'rule';

export type GraphNodeMeta = {
  id: GraphNodeId;
  kind: GraphKind;
  label: string;
  short: string;
  title: string;
  schema?: string;
  intent: string;
  blurb: string;
  points: string[];
  facts: { label: string; value: string }[];
  next?: string;
  /** YAML path for opentide objects; trigger has none */
  path?: string;
  yaml?: string;
  lane: 'trigger' | 'threat' | 'left' | 'right';
};

export const GRAPH_TOUR: GraphNodeId[] = [
  'trigger',
  'threat',
  'obj-oauth',
  'rule-entra',
  'obj-mailbox',
  'rule-exo',
];

export const GRAPH_YAML = {
  threat: `name: Device-code phishing (SaaS identity)
criticality: High

metadata:
  uuid: ${GRAPH_UUID.threatDeviceCode}
  schema: threat::1.0
  version: 1.0.0
  created: "2026-06-12"
  modified: "2026-07-01"
  tlp: clear
  author: detection-team

threat:
  description: |
    Adversaries phish operators into completing an OAuth device-code
    flow, then redeem the issued tokens against Microsoft 365 APIs
    for mailbox and directory access — without stealing passwords.
  severity: High
  impact: Data Breach
  leverage: High
  viability: High
  terrain: Identity
  killchain: Exploitation
  att&ck:
    - T1528
    - T1078.004
    - T1114.003
  actors:
    - Unknown
`,
  'obj-oauth': `name: Anomalous device-code OAuth grant

metadata:
  uuid: ${GRAPH_UUID.objectiveOauth}
  schema: objective::1.0
  version: 1.0.0
  created: "2026-06-12"
  modified: "2026-07-01"
  tlp: clear

composition:
  strategy: synergetic
  description: |
    Correlate device-code auth with unusual client app, geo,
    and first-seen device — not a single sign-in event alone.

objective:
  priority: High
  type: Threat
  description: |
    Detect suspicious OAuth device-code completions that indicate
    token theft against Entra ID / Microsoft 365.
  composition:
    strategy: synergetic
    description: Device-code + anomalous client/geo must concur
  threats:
    - ${GRAPH_UUID.threatDeviceCode}
  attack:
    - T1528
    - T1078.004
  signals:
    - name: Device code from atypical client
      uuid: ${GRAPH_UUID.signalDeviceCode}
      description: DeviceCode flow completed by a rare or unverified client app
      severity: High
      methodology: analytics
      entities:
        - user
        - application
      data:
        availability: Complete
        requirements: Entra ID sign-in & audit logs
`,
  'rule-entra': `name: Suspicious device-code OAuth grant

metadata:
  uuid: ${GRAPH_UUID.ruleEntra}
  schema: rule::1.0
  version: 1.0.0
  created: "2026-06-14"
  modified: "2026-07-01"
  tlp: clear

description: |
  Flags device-code OAuth completions from atypical clients or
  geographies. Implements the anomalous device-code objective.
status: STAGING
severity: High
techniques:
  - T1528
  - T1078.004
detection_model: ${GRAPH_UUID.objectiveOauth}

response:
  alert_severity: High
  procedure:
    analysis: |
      Confirm whether the user initiated the device code, revoke
      refresh tokens, and review subsequent Graph API activity.

configurations:
  sentinel:
    enabled: true
    name: Suspicious device-code OAuth grant
    status: STAGING
    query: |
      SigninLogs
      | where AuthenticationProtocol == "deviceCode"
      | where ResultType == 0
      | where AppDisplayName !in ("Microsoft Office", "Microsoft Teams")
    scheduling:
      frequency: PT15M
      lookback: PT1H
    alert:
      title: Suspicious device-code OAuth grant
`,
  'obj-mailbox': `name: Post-auth mailbox abuse

metadata:
  uuid: ${GRAPH_UUID.objectiveMailbox}
  schema: objective::1.0
  version: 1.0.0
  created: "2026-06-12"
  modified: "2026-07-01"
  tlp: clear

composition:
  strategy: synergetic
  description: |
    After a suspected token theft, watch for inbox rules and
    forwarding that enable silent mail collection.

objective:
  priority: High
  type: Threat
  description: |
    Detect mailbox persistence and exfil patterns that follow
    device-code phishing against the identity threat vector.
  composition:
    strategy: synergetic
    description: New inbox rule + unusual forwarding destination
  threats:
    - ${GRAPH_UUID.threatDeviceCode}
  attack:
    - T1114.003
  signals:
    - name: Suspicious inbox rule
      uuid: ${GRAPH_UUID.signalInboxRule}
      description: Inbox rule created that hides or forwards mail externally
      severity: High
      methodology: analytics
      entities:
        - user
        - mailbox
      data:
        availability: Complete
        requirements: Exchange Online audit / Unified Audit Log
`,
  'rule-exo': `name: Suspicious inbox rule after token use

metadata:
  uuid: ${GRAPH_UUID.ruleExo}
  schema: rule::1.0
  version: 1.0.0
  created: "2026-06-14"
  modified: "2026-07-01"
  tlp: clear

description: |
  New inbox rules that forward or hide mail shortly after anomalous
  OAuth activity. Implements the post-auth mailbox abuse objective.
status: STAGING
severity: High
techniques:
  - T1114.003
detection_model: ${GRAPH_UUID.objectiveMailbox}

response:
  alert_severity: High

configurations:
  sentinel:
    enabled: true
    name: Suspicious inbox rule after token use
    status: STAGING
    query: |
      OfficeActivity
      | where Operation == "New-InboxRule"
      | where Parameters has_any ("ForwardTo", "RedirectTo", "MoveToFolder")
    scheduling:
      frequency: PT30M
      lookback: PT2H
    alert:
      title: Suspicious inbox rule after token use
`,
} as const;

export const GRAPH_NODES: Record<GraphNodeId, GraphNodeMeta> = {
  trigger: {
    id: 'trigger',
    kind: 'trigger',
    label: 'Trigger',
    short: 'ISAC brief',
    title: 'Device-code phishing campaign',
    intent:
      'Not an opentide object — just the spark. External intel you ingest before anything is authored under objects/.',
    blurb:
      'A feed item, advisory, or ticket that tells the team what to model. Authors and agents translate it into a threat::1.0 vector; the trigger itself never validates against a schema.',
    points: [
      'Lives outside the normative object model',
      'Carries ATT&CK hints and severity — not UUIDs',
      'One trigger can fan out into multiple objectives and rules',
    ],
    facts: [
      { label: 'Source', value: 'ISAC / vendor brief' },
      { label: 'Focus', value: 'OAuth device code' },
      { label: 'Estate', value: 'Entra · M365' },
    ],
    next: 'Author the threat vector that scores this identity scenario.',
    lane: 'trigger',
  },
  threat: {
    id: 'threat',
    kind: 'threat',
    label: 'Threat',
    short: 'Device-code phish',
    title: 'Device-code phishing (SaaS identity)',
    schema: 'threat::1.0',
    intent:
      'Normative threat vector (TVM): adversary capability, terrain, and ATT&CK — independent of any query.',
    blurb:
      'This is the hub of the graph. Both detection objectives below reference this UUID so every rule still answers “why do we care?”',
    points: [
      'Required severity / impact / leverage / viability / terrain',
      'ATT&CK list is mandatory',
      'Stable UUID — objectives link via objective.threats',
    ],
    facts: [
      { label: 'Criticality', value: 'High' },
      { label: 'Terrain', value: 'Identity' },
      { label: 'ATT&CK', value: 'T1528 · T1078.004' },
    ],
    next: 'Branch into objectives — one per detection intent.',
    path: 'objects/threats/device-code-phishing.yaml',
    yaml: GRAPH_YAML.threat,
    lane: 'threat',
  },
  'obj-oauth': {
    id: 'obj-oauth',
    kind: 'objective',
    label: 'Objective',
    short: 'OAuth grant',
    title: 'Anomalous device-code OAuth grant',
    schema: 'objective::1.0',
    intent:
      'Detection objective (DOM): what “good detection” means for the grant itself — signals before any platform query.',
    blurb:
      'Branch A covers the authentication moment: unusual device-code completions against Entra ID.',
    points: [
      'Signals declare entities + telemetry requirements',
      'Composition strategy = how signals must concur',
      'threats[] → device-code phishing UUID',
    ],
    facts: [
      { label: 'Priority', value: 'High' },
      { label: 'Branch', value: 'A · auth' },
      { label: 'Signal', value: 'Atypical client' },
    ],
    next: 'Implement with an MDR rule on SigninLogs.',
    path: 'objects/objectives/anomalous-device-code-oauth.yaml',
    yaml: GRAPH_YAML['obj-oauth'],
    lane: 'left',
  },
  'rule-entra': {
    id: 'rule-entra',
    kind: 'rule',
    label: 'Rule',
    short: 'Entra grant',
    title: 'Suspicious device-code OAuth grant',
    schema: 'rule::1.0',
    intent:
      'Deployable MDR: Sentinel KQL (and peers) linked to the OAuth objective via detection_model.',
    blurb:
      'Branch A leaf — the query you run when a device-code grant looks wrong.',
    points: [
      'detection_model → objective UUID',
      'Platform configs hold native queries',
      'status STAGING until promoted',
    ],
    facts: [
      { label: 'Platform', value: 'Sentinel' },
      { label: 'Status', value: 'STAGING' },
      { label: 'Technique', value: 'T1528' },
    ],
    next: 'Walk the second branch — post-auth mailbox abuse.',
    path: 'objects/rules/suspicious-device-code-oauth.yaml',
    yaml: GRAPH_YAML['rule-entra'],
    lane: 'left',
  },
  'obj-mailbox': {
    id: 'obj-mailbox',
    kind: 'objective',
    label: 'Objective',
    short: 'Mailbox abuse',
    title: 'Post-auth mailbox abuse',
    schema: 'objective::1.0',
    intent:
      'Second detection objective on the same threat — persistence and exfil after the token is stolen.',
    blurb:
      'Branch B covers what happens after auth: inbox rules and forwarding that quietly collect mail.',
    points: [
      'Same threat UUID, different signals',
      'Shows why the graph branches — one scenario, many intents',
      'Rules implement this objective separately from Branch A',
    ],
    facts: [
      { label: 'Priority', value: 'High' },
      { label: 'Branch', value: 'B · post-auth' },
      { label: 'Signal', value: 'Inbox rule' },
    ],
    next: 'Ship the Exchange Online hunting rule.',
    path: 'objects/objectives/post-auth-mailbox-abuse.yaml',
    yaml: GRAPH_YAML['obj-mailbox'],
    lane: 'right',
  },
  'rule-exo': {
    id: 'rule-exo',
    kind: 'rule',
    label: 'Rule',
    short: 'Inbox rule',
    title: 'Suspicious inbox rule after token use',
    schema: 'rule::1.0',
    intent:
      'Branch B leaf — MDR on OfficeActivity / Unified Audit for malicious inbox rules.',
    blurb:
      'Closes the graph: token theft narrative → mailbox persistence detection, still chained by UUID.',
    points: [
      'detection_model → mailbox abuse objective',
      'Shares the parent threat with Branch A',
      'Validate + dry-run deploy like any other rule',
    ],
    facts: [
      { label: 'Platform', value: 'Sentinel' },
      { label: 'Status', value: 'STAGING' },
      { label: 'Technique', value: 'T1114.003' },
    ],
    next: 'opentide validate --strict · deploy --dry-run',
    path: 'objects/rules/suspicious-inbox-rule.yaml',
    yaml: GRAPH_YAML['rule-exo'],
    lane: 'right',
  },
};

/** Kind styling: amber trigger · red threat · blue objective · green rule (Tailwind tokens). */
export const KIND_STYLE: Record<
  GraphKind,
  { color: string; border: string; soft: string; bar: string; text: string; line: string }
> = {
  trigger: {
    color: 'bg-amber-400 text-amber-950',
    border: 'border-amber-400',
    soft: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
    bar: 'bg-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
    line: 'text-amber-400',
  },
  threat: {
    color: 'bg-red-500 text-white',
    border: 'border-red-500',
    soft: 'bg-red-500/15 text-red-700 dark:text-red-300',
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    line: 'text-red-500',
  },
  objective: {
    color: 'bg-blue-600 text-white',
    border: 'border-blue-500',
    soft: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    line: 'text-blue-600',
  },
  rule: {
    color: 'bg-emerald-500 text-white',
    border: 'border-emerald-500',
    soft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    line: 'text-emerald-500',
  },
};
