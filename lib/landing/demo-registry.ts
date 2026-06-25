/** Sample opentide-compliant detection repo for landing IDE demo */

export const DEMO_REPO = 'detection-repo';

export const DEMO_PATHS = [
  'objects/threats/screenconnect-abuse.yaml',
  'objects/objectives/credential-access.yaml',
  'objects/objectives/lateral-staging.yaml',
  'objects/rules/credential-dump.yaml',
  '.opentide/schemas/rule.1.0.schema.json',
  '.opentide/templates/rule.1.0.template.yaml',
  'intel/advisories/cve-2024-1709.md',
] as const;

export type DemoPath = (typeof DEMO_PATHS)[number];

export const DEMO_FILES: Record<DemoPath, string> = {
  'objects/threats/screenconnect-abuse.yaml': `name: ScreenConnect gateway exploitation
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
  Adversaries exploit CVE-2024-1709 auth bypass in exposed
  ScreenConnect instances for initial access in MSP tenants.`,
  'objects/objectives/credential-access.yaml': `name: Credential access via LSASS
metadata:
  schema: objective::1.0
  version: 1.1.0
  uuid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  tlp: clear
chains_to:
  threat: 8f3c2a1b-4e5d-6a7b-8c9d-0e1f2a3b4c5d
signals:
  - process_access
  - dump_creation
  - suspicious_handle`,
  'objects/objectives/lateral-staging.yaml': `name: Lateral movement staging
metadata:
  schema: objective::1.0
  version: 1.0.0
  uuid: b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e
chains_to:
  threat: 8f3c2a1b-4e5d-6a7b-8c9d-0e1f2a3b4c5d
signals:
  - remote_service_create
  - rdp_anomaly`,
  'objects/rules/credential-dump.yaml': `name: Suspicious LSASS memory access
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
  '.opentide/schemas/rule.1.0.schema.json': `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "rule.1.0.schema.json",
  "title": "rule::1.0",
  "type": "object",
  "required": ["name", "metadata"],
  "properties": {
    "name": { "type": "string" },
    "metadata": {
      "type": "object",
      "required": ["schema", "version", "uuid"]
    }
  }
}`,
  '.opentide/templates/rule.1.0.template.yaml': `name: "New rule"
metadata:
  schema: rule::1.0
  version: 1.0.0
  uuid: "<generate-uuid>"
  tlp: clear
chains_to:
  objective: "<objective-uuid>"
platforms:
  sentinel:
    enabled: false
    query: |
      # KQL query`,
  'intel/advisories/cve-2024-1709.md': `# CVE-2024-1709 — ConnectWise ScreenConnect

CISA advisory AA24-073A (21 Feb 2024). Critical authentication bypass
allows unauthenticated RCE on gateway hosts.

Feeds threat \`screenconnect-abuse\` and prioritises credential-access
objectives for MSP environments.`,
};

/** Prior revision shown in deploy diff */
export const CREDENTIAL_DUMP_PREVIOUS = `name: Suspicious LSASS memory access
metadata:
  schema: rule::1.0
  version: 1.1.0
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
`;
