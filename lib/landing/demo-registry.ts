/** Spec-aligned sample registry: single CVE → threat → objective → rule scenario */

export const DEMO_REPO = 'detection-repo';

export const UUID = {
  threatGateway: '00000000-0000-4000-8001-000000000010',
  objectiveCredential: '00000000-0000-4000-8002-000000000001',
  ruleLsass: '00000000-0000-4000-8003-000000000001',
  signalLsass: '00000000-0000-4000-8099-000000000001',
} as const;

export const DEMO_PATHS = [
  'intel/advisories/cve-2024-1709.md',
  'objects/threats/gateway-exploitation.yaml',
  'objects/objectives/credential-access.yaml',
  'objects/rules/lsass-memory-access.yaml',
  '.opentide/schemas/rule.1.0.schema.json',
  '.opentide/templates/rule.1.0.template.yaml',
] as const;

export type DemoPath = (typeof DEMO_PATHS)[number];

export const DEMO_FILES: Record<DemoPath, string> = {
  'intel/advisories/cve-2024-1709.md': `# CVE-2024-1709 — ConnectWise ScreenConnect

> CISA AA24-073A · Published 2024-02-21 · TLP:CLEAR

Authentication bypass in ScreenConnect ≤ 23.9.7 enables unauthenticated
remote code execution on internet-exposed gateways.

## Detection focus

| Stage | Technique | What to watch |
|-------|-----------|---------------|
| Initial access | T1190 / T1133 | Anomalous gateway auth & RCE |
| Follow-on | T1003.001 | LSASS dump after foothold |

## Ingest checklist

- [x] Advisory filed under \`intel/advisories/\`
- [ ] Threat vector authored (\`threat::1.0\`)
- [ ] Objective + signals defined
- [ ] Platform rules linked via \`detection_model\`

## References

- https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-073a
`,
  'objects/threats/gateway-exploitation.yaml': `name: Gateway exploitation (CVE-2024-1709)
criticality: High

metadata:
  uuid: ${UUID.threatGateway}
  schema: threat::1.0
  version: 1.1.0
  created: "2024-02-21"
  modified: "2026-03-01"
  tlp: clear
  author: detection-team

threat:
  description: |
    Adversaries exploit ConnectWise ScreenConnect authentication bypass
    (CVE-2024-1709) for unauthenticated RCE on exposed gateway hosts,
    then pivot toward credential access on the internal estate.
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
    1: https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-073a
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
    ScreenConnect gateway threat vector.
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
      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
      | where TargetImage has "lsass.exe"
      | where InitiatingProcessFileName !in~ ("csrss.exe", "services.exe")
    scheduling:
      frequency: PT1H
      lookback: PT2H
    alert:
      title: LSASS memory access
  defender_for_endpoint:
    enabled: true
    name: LSASS memory access
    status: STAGING
    query: |
      DeviceProcessEvents
      | where FileName =~ "lsass.exe"
      | where ActionType == "ProcessAccess"
    scheduling: 1H
    alert:
      category: CredentialAccess
`,
  '.opentide/schemas/rule.1.0.schema.json': `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "rule.1.0.schema.json",
  "title": "rule::1.0",
  "description": "Generated from Pydantic models"
}`,
  '.opentide/templates/rule.1.0.template.yaml': `name: "New rule"
metadata:
  schema: rule::1.0
  version: 1
  uuid: "<generate-uuid>"
  tlp: clear
description: |
  Rule narrative
status: STAGING
severity: Informational
detection_model: "<objective-uuid>"
configurations:
  sentinel:
    enabled: false
    name: New rule
    query: |
      # KQL`,
};

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
    title: 'CVE-2024-1709 advisory',
    kind: 'Threat intelligence',
    intent:
      'Raw intake — not yet an OpenTide object. Captures the external narrative so authors and agents can translate it into a threat vector.',
    blurb:
      'CISA AA24-073A lands in the repo as markdown under intel/. Nothing validates against a schema yet; this is the prompt that starts the chain.',
    points: [
      'External source of truth (vendor / CISA / blog)',
      'Maps candidate ATT&CK techniques before authoring',
      'Feeds the first normative object: a threat::1.0 vector',
    ],
    facts: [
      { label: 'Source', value: 'CISA AA24-073A' },
      { label: 'CVE', value: 'CVE-2024-1709' },
      { label: 'Path', value: 'intel/advisories/' },
    ],
    next: 'Author a threat vector that scores severity, terrain, and ATT&CK.',
    note: 'ConnectWise ScreenConnect auth bypass → RCE',
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
      'One rule can carry Sentinel + Defender configs. Honest adapters validate queries where the platform supports it; deploy-only elsewhere.',
    points: [
      'detection_model → objective UUID (chaining check in validate)',
      'configurations.* hold native queries per platform',
      'status STAGING until you promote to production',
    ],
    facts: [
      { label: 'Status', value: 'STAGING' },
      { label: 'Platforms', value: 'Sentinel · MDE' },
      { label: 'Technique', value: 'T1003.001' },
    ],
    next: 'opentide validate → deploy --dry-run → promote status.',
  },
};
