/** Spec-aligned sample registry — single CVE → threat → objective → rule scenario */

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

**Source:** CISA AA24-073A · Published 2024-02-21

ConnectWise ScreenConnect 23.9.7 and prior contain an authentication bypass
allowing unauthenticated remote code execution on exposed gateway hosts.

## Recommended detection focus

- Initial access via exposed remote management gateways (T1190)
- Credential access following foothold — LSASS dumping (T1003.001)

## References

- https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-073a
`,
  'objects/threats/gateway-exploitation.yaml': `name: Gateway exploitation (CVE-2024-1709)
criticality: High

metadata:
  uuid: ${UUID.threatGateway}
  schema: threat::1.0
  version: 1
  created: "2024-02-21"
  modified: "2026-03-01"
  tlp: clear

threat:
  description: |
    Adversaries exploit ConnectWise ScreenConnect authentication bypass
    (CVE-2024-1709) for unauthenticated RCE on exposed gateway hosts.
  severity: High
  impact: Data Breach
  leverage: High
  viability: High
  terrain: Edge Gateway
  att&ck:
    - T1190
    - T1133`,
  'objects/objectives/credential-access.yaml': `name: Credential access via LSASS

metadata:
  uuid: ${UUID.objectiveCredential}
  schema: objective::1.0
  version: 1
  created: "2026-01-01"
  modified: "2026-03-01"
  tlp: clear

composition:
  strategy: synergetic
  description: Compose signals for credential access after gateway compromise

objective:
  priority: High
  type: Threat
  description: Detect credential dumping following initial access
  composition:
    strategy: synergetic
    description: Signals must corroborate LSASS access patterns
  threats:
    - ${UUID.threatGateway}
  signals:
    - name: LSASS process access
      uuid: ${UUID.signalLsass}
      description: Suspicious access to lsass.exe from an unusual process
      severity: High
      methodology: analytics
      entities:
        - host
        - process
      data:
        availability: Complete
        requirements: EDR process telemetry`,
  'objects/rules/lsass-memory-access.yaml': `name: LSASS memory access

metadata:
  uuid: ${UUID.ruleLsass}
  schema: rule::1.0
  version: 1
  created: "2026-01-01"
  modified: "2026-03-01"
  tlp: clear

description: |
  Suspicious handle access to LSASS — implements credential-access objective.
status: STAGING
severity: High
techniques:
  - T1003.001
detection_model: ${UUID.objectiveCredential}

response:
  alert_severity: High

configurations:
  sentinel:
    enabled: true
    name: LSASS memory access
    status: STAGING
    query: |
      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
      | where TargetImage has "lsass.exe"
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
    scheduling: 1H
    alert:
      category: CredentialAccess`,
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

/** Human-readable blurbs for graph detail panel */
export const OBJECT_BLURBS: Record<string, { title: string; kind: string; blurb: string; note?: string }> = {
  intel: {
    title: 'CVE-2024-1709 advisory',
    kind: 'Threat intelligence',
    blurb:
      'External advisory ingested from CISA — the starting point before any opentide objects exist. Analysts or agents translate this into structured threats, objectives, and rules.',
    note: 'CISA AA24-073A · ConnectWise ScreenConnect auth bypass',
  },
  threat: {
    title: 'Gateway exploitation',
    kind: 'Threat',
    blurb:
      'Describes the attack scenario you care about — how severe it is, where it hits your environment, and which MITRE techniques apply. Objectives link back here to show why a detection exists.',
  },
  objective: {
    title: 'Credential access',
    kind: 'Detection objective',
    blurb:
      'States what “good detection” means for this scenario: which behaviours to look for, how signals combine, and which threat it covers. Rules implement objectives — they do not replace them.',
  },
  rule: {
    title: 'LSASS memory access',
    kind: 'Detection rule',
    blurb:
      'The query you actually run in Sentinel or Defender. Linked to the credential-access objective so every alert traces back to the threat narrative.',
  },
};
