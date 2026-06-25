/** Spec-aligned sample registry — fields match threat::1.0, objective::1.0, rule::1.0 */

export const DEMO_REPO = 'detection-repo';

/** UUIDs from specifications/fixtures (cross-object chain) */
export const UUID = {
  threatGateway: '00000000-0000-4000-8001-000000000010',
  objectiveCredential: '00000000-0000-4000-8002-000000000001',
  ruleLsass: '00000000-0000-4000-8003-000000000001',
  signalLsass: '00000000-0000-4000-8099-000000000001',
} as const;

export const DEMO_PATHS = [
  'objects/threats/gateway-exploitation.yaml',
  'objects/objectives/credential-access.yaml',
  'objects/rules/lsass-memory-access.yaml',
  'objects/threats/ransomware-staging.yaml',
  'objects/objectives/lateral-movement.yaml',
  'objects/rules/suspicious-powershell.yaml',
  '.opentide/schemas/rule.1.0.schema.json',
  '.opentide/templates/rule.1.0.template.yaml',
] as const;

export type DemoPath = (typeof DEMO_PATHS)[number];

export const DEMO_FILES: Record<DemoPath, string> = {
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
  'objects/threats/ransomware-staging.yaml': `name: Ransomware staging
criticality: Medium

metadata:
  uuid: 00000000-0000-4000-8001-000000000099
  schema: threat::1.0
  version: 1
  tlp: clear

threat:
  description: Pre-encryption staging behaviour on endpoints
  severity: Medium
  impact: Data Breach
  leverage: Medium
  viability: Medium
  terrain: Endpoint
  att&ck:
    - T1486`,
  'objects/objectives/lateral-movement.yaml': `name: Lateral movement

metadata:
  uuid: 00000000-0000-4000-8002-000000000099
  schema: objective::1.0
  version: 1
  tlp: clear

composition:
  strategy: synergetic
  description: Remote service and RDP anomalies

objective:
  priority: Medium
  type: Threat
  description: Detect lateral movement staging
  composition:
    strategy: synergetic
    description: Corroborate remote execution signals
  threats:
    - ${UUID.threatGateway}
  signals:
    - name: Remote service creation
      uuid: 00000000-0000-4000-8099-000000000099
      description: New service on remote host
      severity: Medium
      methodology: analytics
      entities:
        - host
      data:
        availability: Partial
        requirements: Windows event logs`,
  'objects/rules/suspicious-powershell.yaml': `name: Suspicious PowerShell

metadata:
  uuid: 00000000-0000-4000-8003-000000000099
  schema: rule::1.0
  version: 1
  tlp: clear

description: Encoded PowerShell execution patterns
status: STAGING
severity: Medium
techniques:
  - T1059.001
detection_model: 00000000-0000-4000-8002-000000000099

configurations:
  sentinel:
    enabled: true
    name: Suspicious PowerShell
    query: |
      DeviceProcessEvents
      | where FileName has "powershell"
    scheduling:
      frequency: PT1H
      lookback: PT2H
    alert:
      title: Suspicious PowerShell`,
  '.opentide/schemas/rule.1.0.schema.json': `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "rule.1.0.schema.json",
  "title": "rule::1.0"
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

export const LSASS_RULE_PREVIOUS = `name: LSASS memory access

metadata:
  uuid: ${UUID.ruleLsass}
  schema: rule::1.0
  version: 1
  tlp: clear

description: Suspicious handle access to LSASS
status: STAGING
severity: High
techniques:
  - T1003.001
detection_model: ${UUID.objectiveCredential}

configurations:
  sentinel:
    enabled: true
    name: LSASS memory access
    query: |
      DeviceProcessEvents
      | where ActionType == "ProcessAccess"
`;
