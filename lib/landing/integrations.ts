/**
 * The integrations the landing's integration fan shows: one `configurations` key each, with what
 * `opentide deploy` creates there and three lines of a real block. `integrations.test.ts` checks
 * every key and field against the platform specs synced into `content/`.
 */
export type Integration = {
  key: string;
  name: string;
  /** What `opentide deploy` creates there, in the platform specs' words. */
  deploys: string;
  src: string;
  kind: 'color' | 'mono' | 'raster';
  /**
   * Three lines of the block, indented under its key. Real fields of each `platform::<key>::1.0`
   * spec, taken from the specifications' platform fixtures.
   */
  block: [string, string, string];
};

export const INTEGRATIONS: Integration[] = [
  {
    key: 'sentinel',
    name: 'Microsoft Sentinel',
    deploys: 'KQL analytics rule',
    src: '/icons/platforms/sentinel.svg',
    kind: 'color',
    block: [
      'query: SecurityEvent | where EventID == 4688',
      'scheduling: { frequency: PT1H, lookback: PT2H }',
      'alert: { title: Suspicious process creation }',
    ],
  },
  {
    key: 'defender_for_endpoint',
    name: 'Defender for Endpoint',
    deploys: 'KQL custom detection',
    src: '/icons/platforms/defender.svg',
    kind: 'color',
    block: [
      'query: DeviceProcessEvents | where FileName =~ "cmd.exe"',
      'scheduling: 1H',
      'alert: { category: Execution, severity: High }',
    ],
  },
  {
    key: 'splunk',
    name: 'Splunk Enterprise Security',
    deploys: 'SPL saved search',
    src: '/icons/platforms/splunk.svg',
    kind: 'mono',
    block: [
      'query: index=main sourcetype=WinEventLog EventCode=4688',
      'scheduling: { schedule: { frequency: 1h } }',
      'trigger: { condition: number of events }',
    ],
  },
  {
    key: 'sentinel_one',
    name: 'SentinelOne',
    deploys: 'S1QL STAR rule',
    src: '/icons/platforms/sentinelone.svg',
    kind: 'color',
    block: ['condition:', '  type: Single Event', '  single_event: { query: TgtProcName Contains "cmd.exe" }'],
  },
  {
    key: 'carbon_black_cloud',
    name: 'Carbon Black Cloud',
    deploys: 'Lucene watchlist IOC',
    src: '/icons/platforms/carbon-black.png',
    kind: 'raster',
    block: ['query: process_name:cmd.exe', 'watchlist: opentide', 'report: Suspicious command processor'],
  },
  {
    key: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    deploys: 'correlation rule',
    src: '/icons/platforms/crowdstrike.png',
    kind: 'raster',
    block: [
      'query: event_simpleName=ProcessRollup2 FileName=cmd.exe',
      'details: { outcome: detection, tactic: Execution }',
      'schedule: { frequency: 1h, lookback: 2h }',
    ],
  },
  {
    key: 'harfanglab',
    name: 'HarfangLab',
    deploys: 'Sigma or YARA rule',
    src: '/icons/platforms/harfanglab.png',
    kind: 'raster',
    block: ['action: "Alert & Block"', 'yara:', "  signature: 'rule mz { condition: uint16(0) == 0x5A4D }'"],
  },
  {
    key: 'elastic',
    name: 'Elastic Security',
    deploys: 'KQL, EQL or ES|QL rule',
    src: '/icons/platforms/elastic.svg',
    kind: 'color',
    block: ['type: query', 'language: kuery', `query: 'event.category : "process"'`],
  },
  {
    key: 'sysdig',
    name: 'Sysdig Secure + Falco',
    deploys: 'Falco rule',
    src: '/icons/platforms/falco.svg',
    kind: 'color',
    block: ['condition: evt.type = execve and proc.name = nc', 'priority: WARNING', 'tags: [network]'],
  },
  {
    key: 'bitdefender',
    name: 'Bitdefender GravityZone',
    deploys: 'custom detection or YARA rule',
    src: '/icons/platforms/bitdefender.svg',
    kind: 'color',
    block: ['detection:', '  target: process', '  criteria: [{ field: Process.Name, is: mshta.exe }]'],
  },
];
