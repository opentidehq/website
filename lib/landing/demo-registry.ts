/** Spec-aligned sample registry: prompt → threat → objective → rule → review scenario */

export const DEMO_REPO = 'detection-repo';

export const DEMO_BRANCH = 'feat/lsass-credential-access';

export const UUID = {
  threatGateway: '00000000-0000-4000-8001-000000000010',
  objectiveCredential: '00000000-0000-4000-8002-000000000001',
  ruleLsass: '00000000-0000-4000-8003-000000000001',
  signalLsass: '00000000-0000-4000-8099-000000000001',
} as const;

/** Starting engineer brief — simulated as a prompt, not a repo folder. */
export const SCENARIO_PROMPT =
  'Turn this CERT-EU advisory into deployable detections for our Sentinel and Splunk estates — strict validation, staged deploy: cert.europa.eu/publications/security-advisories/2026-006';

/**
 * The advisory the agent opens in a browser tab before it writes anything.
 *
 * Content is condensed from the real CERT-EU Security Advisory 2026-006 so the beat
 * the scenario detects — an unauthenticated root RCE on the PAN-OS edge firewall
 * portal (CVE-2026-0300, T1190) — is a quote the visitor can actually read.
 */
export type AdvisoryBlock =
  | { kind: 'p'; text: string; mark?: boolean }
  | { kind: 'h3'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'files'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] };

export type AdvisorySection = { heading: string; blocks: AdvisoryBlock[] };

export type AdvisoryPage = {
  url: string;
  host: string;
  path: string;
  /** Label for the editor tab strip. */
  tab: string;
  site: string;
  siteTagline: string;
  banner: { text: string; hint: string };
  nav: string[];
  breadcrumb: string[];
  label: string;
  code: string;
  title: string;
  meta: { label: string; value: string }[];
  topics: string;
  glance: { heading: string; items: string[] };
  sections: AdvisorySection[];
  tags: string[];
  legal: string;
};

export const ADVISORY: AdvisoryPage = {
  url: 'https://cert.europa.eu/publications/security-advisories/2026-006/',
  host: 'cert.europa.eu',
  path: '/publications/security-advisories/2026-006/',
  tab: 'cert.europa.eu/2026-006',
  site: 'CERT-EU',
  siteTagline: 'Cybersecurity Service for the Union institutions, bodies, offices and agencies',
  banner: {
    text: 'TLP:CLEAR',
    hint: 'Subject to standard copyright rules',
  },
  nav: ['Threat Intelligence', 'Publications', 'Services', 'About us', 'Contact'],
  breadcrumb: ['Home', 'Publications', 'Security Advisories'],
  label: 'Security Advisory',
  code: '2026-006',
  title: 'Critical Vulnerability in PAN-OS',
  meta: [
    { label: 'Release Date', value: '06 May 2026' },
    { label: 'Reference', value: '2026-006 · v1.0' },
    { label: 'CVSS', value: '9.3 (Critical)' },
  ],
  topics: 'Edge Gateway, Remote Code Execution, Palo Alto Networks, Exploited in the wild',
  glance: {
    heading: 'At a glance',
    items: [
      'Unauthenticated remote code execution as root on the firewall itself.',
      'Affects PA-Series and VM-Series appliances using the User-ID Authentication Portal.',
      'Palo Alto has observed limited exploitation in the wild.',
    ],
  },
  sections: [
    {
      heading: 'Summary',
      blocks: [
        {
          kind: 'note',
          text: 'History — v1.0 (06/05/2026): Initial publication.',
        },
        {
          kind: 'p',
          text: 'On 6 May 2026, Palo Alto Networks published a security advisory addressing a critical vulnerability affecting [[PAN-OS]]. This vulnerability allows an unauthenticated attacker to execute arbitrary code with root privileges.',
        },
        {
          kind: 'p',
          text: 'Palo Alto observed limited exploitation of this vulnerability. CERT-EU strongly recommends updating affected appliances as soon as patches are available, and applying the workarounds and mitigations in the meantime.',
        },
        {
          kind: 'files',
          items: ['Download MARKDOWN', 'Download JSON (STIX 2.1)'],
        },
      ],
    },
    {
      heading: 'Technical Details',
      blocks: [
        {
          kind: 'p',
          mark: true,
          text: 'The vulnerability [[CVE-2026-0300]], with a CVSS score of 9.3, is a buffer overflow in the User-ID Authentication Portal (aka Captive Portal) service of Palo Alto Networks PAN-OS software.',
        },
        {
          kind: 'p',
          mark: true,
          text: 'An unauthenticated attacker could execute arbitrary code with root privileges on the PA-Series and VM-Series firewalls by sending specially crafted packets [T1190].',
        },
        {
          kind: 'p',
          text: 'The flaw is reachable before authentication on any firewall that exposes the portal to an untrusted zone, handing an adversary a root foothold on the network perimeter.',
        },
      ],
    },
    {
      heading: 'Affected Products',
      blocks: [
        {
          kind: 'p',
          text: 'This issue is applicable only to PA-Series and VM-Series firewalls that are configured to use the User-ID Authentication Portal. The following PAN-OS release trains are affected:',
        },
        {
          kind: 'table',
          caption: 'Fixed versions per PAN-OS release train',
          head: ['Release train', 'Fixed in'],
          rows: [
            ['PAN-OS 12.1', '12.1.4-h5 · 12.1.7'],
            ['PAN-OS 11.2', '11.2.4-h17 · 11.2.12'],
            ['PAN-OS 11.1', '11.1.4-h33 · 11.1.15'],
            ['PAN-OS 10.2', '10.2.7-h34 · 10.2.18-h6'],
          ],
        },
      ],
    },
    {
      heading: 'Recommendations',
      blocks: [
        {
          kind: 'p',
          text: 'The patches are not available at the time of writing but are scheduled for release in the near future. It is recommended updating affected devices as soon as the patches are released.',
        },
        { kind: 'h3', text: 'Mitigation' },
        {
          kind: 'list',
          items: [
            'Restrict User-ID Authentication Portal access to trusted zones only.',
            'Disable the User-ID Authentication Portal if it is not required.',
          ],
        },
      ],
    },
    {
      heading: 'References',
      blocks: [
        {
          kind: 'list',
          items: [
            '[1] Palo Alto Networks — CVE-2026-0300 PAN-OS Authentication Portal Buffer Overflow (security.paloaltonetworks.com)',
          ],
        },
      ],
    },
  ],
  tags: ['PAN-OS', 'Palo Alto Networks', 'Remote Code Execution', 'Edge Gateway'],
  legal: 'CERT-EU · TLP:CLEAR — free to distribute without restriction, subject to standard copyright rules.',
};

export const DEMO_PATHS = [
  'objects/threats/gateway-exploitation.yaml',
  'objects/objectives/credential-access.yaml',
  'objects/rules/lsass-memory-access.yaml',
  '.opentide/configurations/platforms/sentinel.toml',
  '.opentide/configurations/platforms/splunk.toml',
] as const;

export type DemoPath = (typeof DEMO_PATHS)[number];

export const RULE_PATH = 'objects/rules/lsass-memory-access.yaml' satisfies DemoPath;

/** Sentinel KQL before the inline tuning pass — kept as a constant so the patch always applies. */
const SENTINEL_QUERY_BASE = `      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
      | where FileName =~ "lsass.exe"
      | where InitiatingProcessFileName !in~ ("csrss.exe", "services.exe")`;

/** Same query after the engineer asks for the inventory-agent exclusion. */
const SENTINEL_QUERY_TUNED = `      let BenignAccessors = dynamic(["csrss.exe", "services.exe", "wmiprvse.exe"]);
      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
      | where FileName =~ "lsass.exe"
      | where InitiatingProcessFileName !in~ (BenignAccessors)
      | where InitiatingProcessCommandLine !has "inventory-scan"`;

export const DEMO_FILES: Record<DemoPath, string> = {
  'objects/threats/gateway-exploitation.yaml': `name: Gateway exploitation (CVE-2026-0300)
criticality: High

metadata:
  uuid: ${UUID.threatGateway}
  schema: threat::1.0
  version: 1.1.0
  created: "2026-05-06"
  modified: "2026-05-08"
  tlp: clear
  author: detection-team

threat:
  description: |
    Adversaries exploit the PAN-OS User-ID Authentication Portal
    buffer overflow (CVE-2026-0300) for unauthenticated root RCE on
    internet-facing PA-Series and VM-Series firewalls, then pivot
    toward credential access on the internal estate.
  severity: High
  impact: Data Breach
  leverage: High
  viability: High
  terrain: Edge Gateway
  killchain: Exploitation
  att&ck:
    - T1190
    - T1133
  actors:
    - Unknown

references:
  public:
    1: https://cert.europa.eu/publications/security-advisories/2026-006/
`,
  'objects/objectives/credential-access.yaml': `name: Credential access via LSASS

metadata:
  uuid: ${UUID.objectiveCredential}
  schema: objective::1.0
  version: 1.2.0
  created: "2026-01-01"
  modified: "2026-03-01"
  tlp: clear

composition:
  strategy: synergetic
  description: |
    Require corroborating LSASS-access signals after a gateway
    foothold — not a single noisy process-access event alone.

objective:
  priority: High
  type: Threat
  description: |
    Detect credential dumping that follows initial access via the
    PAN-OS gateway threat vector.
  composition:
    strategy: synergetic
    description: Signals must corroborate unusual LSASS handle access
  threats:
    - ${UUID.threatGateway}
  attack:
    - T1003.001
  signals:
    - name: LSASS process access
      uuid: ${UUID.signalLsass}
      description: Suspicious handle access to lsass.exe from an unusual process
      severity: High
      methodology: analytics
      entities:
        - host
        - process
      data:
        availability: Complete
        requirements: EDR process / handle telemetry
`,
  'objects/rules/lsass-memory-access.yaml': `name: LSASS memory access

metadata:
  uuid: ${UUID.ruleLsass}
  schema: rule::1.0
  version: 1.3.0
  created: "2026-01-01"
  modified: "2026-03-01"
  tlp: clear

description: |
  Suspicious handle access to LSASS. Implements the credential-access
  objective so every alert traces back to the gateway threat narrative.
status: STAGING
severity: High
techniques:
  - T1003.001
detection_model: ${UUID.objectiveCredential}

response:
  alert_severity: High
  procedure:
    analysis: |
      Confirm source process reputation, parent chain, and whether
      the host recently showed gateway-related initial access.

configurations:
  sentinel:
    enabled: true
    name: LSASS memory access
    status: STAGING
    query: |
${SENTINEL_QUERY_BASE}
      | project Timestamp, DeviceName, InitiatingProcessFileName, InitiatingProcessAccountUpn
    scheduling:
      frequency: PT1H
      lookback: PT2H
    alert:
      title: LSASS memory access on {{DeviceName}}
      severity: High
      suppression: false
      create_incident: true
      tactics:
        - CredentialAccess
      techniques:
        - T1003.001
    grouping:
      event: AlertPerResult
    entities:
      - entity: Host
        mappings:
          - identifier: HostName
            column: DeviceName
      - entity: Account
        mappings:
          - identifier: FullName
            column: InitiatingProcessAccountUpn
  splunk:
    enabled: true
    name: LSASS memory access
    status: STAGING
    query: |
      \`sysmon\` EventCode=10 TargetImage="*\\\\lsass.exe"
      | search NOT SourceImage IN ("*\\\\csrss.exe", "*\\\\services.exe")
      | stats count, min(_time) as firstTime by host, user, SourceImage, GrantedAccess
      | \`security_content_ctime(firstTime)\`
    scheduling:
      type: continuous
      expires: 24h
      schedule:
        frequency: 15m
      timerange:
        lookback: 15m
    trigger:
      comparator: greater than
      threshold: 0
      throttling:
        fields:
          - host
          - SourceImage
        duration: 2h
    actions:
      notable:
        event:
          title: LSASS memory access on $host$
          description: Unusual process opened a handle to LSASS memory.
        security_domain: endpoint
      risk:
        message: LSASS handle access by $SourceImage$ on $host$
        risk_objects:
          - field: host
            type: system
            score: 40
          - field: user
            type: user
            score: 25
`,
  '.opentide/configurations/platforms/sentinel.toml': `[platform]
enabled = true
identifier = "sentinel"
name = "Microsoft Sentinel"
subschema = "Microsoft Sentinel"
description = """Microsoft Sentinel delivers intelligent security analytics
across the estate — attack detection, threat visibility, proactive hunting
and response."""
flags = ["cti"]

[[tenants]]
name = "SOC Staging"
description = "Pre-production workspace — receives STAGING content"
deployment = "STAGING"
[tenants.setup]
proxy = false
ssl = true
resource_group = "rg-secops-sentinel-stg"
workspace_name = "law-secops-staging"
workspace_id = "$AZURE_STAGING_WORKSPACE_ID"
azure_tenant_id = "$AZURE_TENANT_ID"
azure_subscription_id = "$AZURE_SUBSCRIPTION_ID"
azure_client_id = "$AZURE_CLIENT_ID"
azure_client_secret = "$AZURE_CLIENT_SECRET"

[[tenants]]
name = "SOC Production"
description = "Production workspace — promotion gated by a protected environment"
deployment = "PRODUCTION"
[tenants.setup]
proxy = false
ssl = true
resource_group = "rg-secops-sentinel-prd"
workspace_name = "law-secops-prod"
workspace_id = "$AZURE_PROD_WORKSPACE_ID"
azure_tenant_id = "$AZURE_TENANT_ID"
azure_subscription_id = "$AZURE_SUBSCRIPTION_ID"
azure_client_id = "$AZURE_CLIENT_ID"
azure_client_secret = "$AZURE_CLIENT_SECRET"

[[modifiers]]
name = "Staging guardrail"
description = "Staged analytics alert quietly until they are promoted"
[modifiers.conditions]
status = ["STAGING"]
[modifiers.modifications]
alert.severity = "Informational"
alert.title = "prefix::[STAGING] "
`,
  '.opentide/configurations/platforms/splunk.toml': `[platform]
enabled = true
identifier = "splunk"
name = "Splunk Enterprise Security"
subschema = "Splunk Sub Schema"
description = """Splunk Enterprise Security runs the same detection content as
correlation searches, raising notables and risk-based alerting objects."""
flags = ["rba"]

[[tenants]]
name = "ES Staging"
description = "Enterprise Security search head — receives STAGING content"
deployment = "STAGING"
[tenants.setup]
proxy = false
ssl = true
url = "$SPLUNK_URL"
port = "$SPLUNK_PORT"
token = "$SPLUNK_TOKEN"
app = "$SPLUNK_APP"
correlation_searches = true
enterprise_security = true
allow_skew = "20%"
schedule_offset = 5
frequency_scheduling = "random"
actions_enabled = ["notable", "risk"]
default_actions = ["notable"]

[[modifiers]]
name = "Platform defaults"
description = "Applied to every scheduled search deployed by OpenTide"
[modifiers.conditions]
default = true
[modifiers.modifications]
"request.ui_dispatch_app" = "SplunkEnterpriseSecuritySuite"
"dispatch.latest_time" = "-5m@m"
"alert.digest_mode" = "1"
"alert.track" = "1"
`,
};

/** Inline agent edit performed on the rule during the tuning step. */
export const INLINE_EDIT = {
  path: RULE_PATH,
  ask: 'Exclude the inventory agent — WmiPrvSE trips this every scan.',
  tuned: DEMO_FILES[RULE_PATH].replace(SENTINEL_QUERY_BASE, SENTINEL_QUERY_TUNED),
} as const;

/** Merge request opened once the object chain is authored. */
export const REVIEW_MR = {
  id: '!142',
  title: 'Detect LSASS credential access after PAN-OS gateway exploitation',
  branch: DEMO_BRANCH,
  target: 'main',
  author: 'detection-team',
  labels: ['detection-content', 'sentinel', 'splunk'],
  summary: [
    'Turns CERT-EU 2026-006 into a linked object chain: gateway threat vector → credential-access objective → deployable rule.',
    'The rule ships one Sentinel analytics rule (KQL) and one Splunk ES correlation search (SPL) from the same detection intent.',
  ],
  approval: 'SOC lead approved these changes',
  promotion:
    'Production promotion runs from a protected environment and needs its own approval — this merge only reaches STAGING.',
} as const;

export type ReviewMr = typeof REVIEW_MR;

export type ReviewJob = {
  id: string;
  name: string;
  trigger: string;
  meta: string;
  duration: string;
  lines: string[];
};

/**
 * Jobs mirror the workflow `opentide setup ci github` writes into a detection repo:
 * Validate → Generate → Deploy Staging, with production promotion held behind an
 * environment approval. Log lines follow the real structlog/Rich console format
 * (`HH:MM:SS  LEVEL  event_name` + indented fields, `== Section ==` panels).
 */
export const REVIEW_JOBS: ReviewJob[] = [
  {
    id: 'validate',
    name: 'Validate',
    trigger: 'on: pull_request',
    meta: 'ubuntu-latest · python 3.12 · pip install opentide==0.1.0',
    duration: '48s',
    lines: [
      '::group::Validate objects',
      '$ opentide validate',
      '09:41:02  INFO     validates_all_opentide_objects_via_model_validate',
      '09:41:04  INFO     step_completed',
      '  detail: Successfully verified 5 OpenTide objects',
      '09:41:04  INFO     all_content_successfully_passed_validation',
      '::group::Validate Sentinel queries',
      '$ opentide validate query --platform sentinel',
      '== Query Validation - Microsoft Sentinel ==',
      '09:41:11  INFO     acquiring_azure_credentials_for_tenant',
      '  detail: SOC Staging',
      '09:41:14  INFO     sending_query_to_azure_monitor_workspace',
      '  detail: LSASS memory access (…8003-000000000001)',
      '09:41:17  INFO     the_query_is_a_valid_sentinel_kql',
      '  detail: LSASS memory access (…8003-000000000001)',
      '::group::Validate Splunk queries',
      '$ opentide validate query --platform splunk',
      '== Query Validation - Splunk Enterprise Security ==',
      '09:41:23  INFO     validating_spl_query',
      '  mdr_name: LSASS memory access',
      '09:41:26  INFO     valid_spl_query',
      '  mdr_name: LSASS memory access',
    ],
  },
  {
    id: 'generate',
    name: 'Generate',
    trigger: 'needs: validate',
    meta: 'schemas · templates · vocabularies · exports · docs',
    duration: '33s',
    lines: [
      '::group::Generate schemas, exports and docs',
      '$ opentide generate',
      '== Object vocabulary generation ==',
      '09:41:44  INFO     generated_all_json_schemas',
      '== Export generation ==',
      '09:41:49  INFO     correctly_exported',
      '  detail: navigator-layer.json',
      '== Documentation generation ==',
      '09:41:53  INFO     index_written',
      '  output: docs',
      '09:41:53  INFO     step_completed',
      '  detail: Completed successfully',
    ],
  },
  {
    id: 'deploy-staging',
    name: 'Deploy Staging',
    trigger: 'environment: staging',
    duration: '1m 12s',
    meta: 'DEPLOYMENT_PLAN=STAGING · secrets from environment',
    lines: [
      '::group::Deploy to staging tenants',
      '$ opentide deploy --plan STAGING',
      '== MDR Deployment ==',
      '09:42:06  INFO     currently_targeting_tenant',
      '  detail: SOC Staging',
      '09:42:09  INFO     processing_rule',
      '  detail: LSASS memory access',
      '09:42:14  INFO     deployed_mdr_successfully',
      '  arg0: [STAGING] LSASS memory access',
      '09:42:18  INFO     currently_targeting_tenant',
      '  tenant: ES Staging',
      '09:42:24  INFO     deployed_on_splunk',
      '  name: LSASS memory access',
      '09:42:24  INFO     all_content_passed_deployment',
    ],
  },
];

export type ObjectBlurb = {
  title: string;
  kind: string;
  schema?: string;
  intent: string;
  blurb: string;
  points: string[];
  facts: { label: string; value: string }[];
  next?: string;
  note?: string;
};

/** Human-readable blurbs for graph detail panel */
export const OBJECT_BLURBS: Record<string, ObjectBlurb> = {
  intel: {
    title: 'CERT-EU 2026-006 brief',
    kind: 'Engineer prompt',
    intent:
      'Starting brief — not an OpenTide object. The engineer (or agent) turns this narrative into a threat vector.',
    blurb:
      'External intel arrives as a link the agent opens, not a folder in the object graph. Authoring starts when you write the first threat::1.0.',
    points: [
      'External source of truth (vendor / CERT-EU / blog)',
      'Maps candidate ATT&CK techniques before authoring',
      'Feeds the first normative object: a threat::1.0 vector',
    ],
    facts: [
      { label: 'Source', value: 'CERT-EU 2026-006' },
      { label: 'CVE', value: 'CVE-2026-0300' },
      { label: 'Form', value: 'Prompt / brief' },
    ],
    next: 'Author a threat vector that scores severity, terrain, and ATT&CK.',
    note: 'PAN-OS auth-portal RCE → credential-access follow-on',
  },
  threat: {
    title: 'Gateway exploitation',
    kind: 'Threat vector (TVM)',
    schema: 'threat::1.0',
    intent:
      'Describe the adversary capability: how severe it is, where it hits, and which ATT&CK techniques apply — independent of any specific query.',
    blurb:
      'Threat vectors are the “why” node. Objectives and rules link back here so every detection stays anchored to a scenario your org actually cares about.',
    points: [
      'Required body: severity, impact, leverage, viability, terrain',
      'ATT&CK list is mandatory (non-empty)',
      'Stable UUID for objectives to reference in objective.threats',
    ],
    facts: [
      { label: 'Criticality', value: 'High' },
      { label: 'Terrain', value: 'Edge Gateway' },
      { label: 'ATT&CK', value: 'T1190 · T1133' },
    ],
    next: 'Define an objective: what behaviours prove this threat is underway.',
  },
  objective: {
    title: 'Credential access via LSASS',
    kind: 'Detection objective (DOM)',
    schema: 'objective::1.0',
    intent:
      'State what “good detection” means: prioritized signals, how they compose, and which threat UUIDs they cover — before writing platform queries.',
    blurb:
      'Objectives separate detection intent from deployable queries. Rules implement an objective via detection_model; they do not replace it.',
    points: [
      'Signals declare entities, methodology, and data requirements',
      'Composition strategy (e.g. synergetic) defines how signals combine',
      'threats[] chains back to the gateway exploitation vector',
    ],
    facts: [
      { label: 'Priority', value: 'High' },
      { label: 'Strategy', value: 'synergetic' },
      { label: 'Signals', value: '1 (LSASS process access)' },
    ],
    next: 'Ship MDR rules with platform configs that implement this objective.',
  },
  rule: {
    title: 'LSASS memory access',
    kind: 'Detection rule (MDR)',
    schema: 'rule::1.0',
    intent:
      'The deployable unit: platform queries, lifecycle status, ATT&CK techniques, and optional response guidance — linked to an objective UUID.',
    blurb:
      'One rule carries a Sentinel analytics rule and a Splunk ES correlation search. Honest adapters validate queries where the platform supports it; deploy-only elsewhere.',
    points: [
      'detection_model → objective UUID (chaining check in validate)',
      'configurations.* hold native queries per platform (KQL, SPL)',
      'status STAGING until you promote to production',
    ],
    facts: [
      { label: 'Status', value: 'STAGING' },
      { label: 'Platforms', value: 'Sentinel · Splunk' },
      { label: 'Technique', value: 'T1003.001' },
    ],
    next: 'opentide validate → CI gate → staged deploy → promote status.',
  },
};
