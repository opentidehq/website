/**
 * The CLI · SDK · MCP showcase's runs. Plain data, so `showcase.test.ts` can hold every UUID,
 * object name and line number it prints to the demo repository in demo-registry.ts.
 */

export type Line = { kind: 'in' | 'out' | 'note'; text: string; mark?: boolean };
export type Scenario = { id: string; label: string; lines: Line[]; /** Promises this run shows. */ lights: number[] };
export type Door = {
  id: string;
  name: string;
  audience: string;
  prompt: string;
  promises: { title: string; body: string }[];
  scenarios: Scenario[];
};

/** The demo repository's UUIDs, as literals: `showcase.test.ts` checks them against it. */
export const RULE = '00000000-0000-4000-8003-000000000001';
export const OBJECTIVE = '00000000-0000-4000-8002-000000000001';
export const THREAT = '00000000-0000-4000-8001-000000000010';
export const CHAINED = '00000000-0000-4000-8001-000000000020';

const i = (text: string): Line => ({ kind: 'in', text });
const o = (text: string, mark?: boolean): Line => ({ kind: 'out', text, mark });
const n = (text: string): Line => ({ kind: 'note', text });

/**
 * Runs captured from opentide 0.18.0 against the demo repository this page shows: the same
 * threat, objective and rule. The CLI's closing `opentide validate · check again` and `--json`
 * tip lines are left out, the `--json` document is pretty-printed, and long payloads are cut
 * to `…`.
 */
export const DOORS: Door[] = [
  {
    id: 'cli',
    name: 'CLI',
    audience: 'For humans and CI pipelines.',
    prompt: '$ ',
    promises: [
      { title: 'Every link resolves', body: 'A rule names a real objective, an objective names real threats, or validation fails.' },
      { title: 'Every value is in the taxonomy', body: 'Vocabulary fields take versioned values only: severity::1.0, surface::1.0, att&ck::1.2.' },
      { title: 'One JSON document on stdout', body: '--json returns ok and a status, and every issue with its code, file, line and field.' },
      { title: 'Exit codes gate CI', body: '0 success · 1 error · 2 usage. No parsing needed.' },
    ],
    scenarios: [
      {
        id: 'validate',
        label: 'validate',
        lights: [0, 1, 3],
        lines: [i('opentide validate --strict'), o('✓ 4 objects valid · 1.3s'), i('echo $?'), o('0')],
      },
      {
        id: 'link',
        label: 'a broken link',
        lights: [0, 3],
        lines: [
          n('# the rule names an objective that does not exist'),
          i('opentide validate --strict'),
          o("error[invalid_ref]: Unknown objective or signal reference '00000000-0000-4000-8002-000000000002'", true),
          o('   ╭─▶ objects/rules/lsass-memory-access.yaml:23:18'),
          o('   │'),
          o('22 │   - T1003.001'),
          o('23 │ detection_model: 00000000-0000-4000-8002-000000000002'),
          o('   │                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ no object has this id', true),
          o('   │'),
          o('   ╰─ help: opentide info objectives lists the ones that exist'),
          o(''),
          o('✗ 1 error in 1 file · 4 objects checked · 0.8s'),
          o('→ opentide explain invalid_ref · how to fix it'),
          i('echo $?'),
          o('1'),
        ],
      },
      {
        id: 'json',
        label: 'the --json report',
        lights: [2, 0],
        lines: [
          i('opentide --json validate --file lsass-memory-access.yaml'),
          o('{'),
          o('  "checks": { "schema": { "status": "failed" }, … },'),
          o('  "report": {'),
          o('    "ok": false,'),
          o('    "issues": [{'),
          o('      "code": "invalid_ref",', true),
          o('      "severity": "error",'),
          o(`      "object_uuid": "${RULE}",`),
          o('      "path": "objects/rules/lsass-memory-access.yaml",', true),
          o('      "line": 23, "column": 18, "yaml_line": 22,', true),
          o('      "field_path": ["detection_model"],', true),
          o(`      "message": "Unknown objective or signal reference '00000000-0000-4000-8002-000000000002'",`),
          o('      "help": "opentide info objectives lists the ones that exist",'),
          o('      "explain": "opentide explain invalid_ref"'),
          o('    }],'),
          o('    "stats": { "objects_checked": 1, … }'),
          o('  },'),
          o('  "ok": false,'),
          o('  "status": "failed",'),
          o('  "exit_code": 1,'),
          o('  "summary": { "objects": 1, "errors": 1, "warnings": 0, "files": 1, … },'),
          o('  "next_actions": [{ "command": "opentide --json explain invalid_ref", "reason": "how to fix it" }, …],'),
          o('  "failure": { "code": "issues_found", "message": "Validation failed", … }'),
          o('}'),
        ],
      },
      {
        id: 'taxonomy',
        label: 'a taxonomy check',
        lights: [1, 3],
        lines: [
          n('# severity takes a severity::1.0 value'),
          i('opentide validate --file gateway-exploitation-cve-2026-0300.yaml'),
          o("error[vocab_unknown]: 'Critical' is not a severity value", true),
          o('   ╭─▶ objects/threats/gateway-exploitation-cve-2026-0300.yaml:22:13'),
          o('   │'),
          o('21 │     toward credential access on the internal estate.'),
          o('22 │   severity: Critical'),
          o('   │             ━━━━━━━━ not in severity::1.0', true),
          o(''),
          o('✗ 1 error in 1 file · 1 object checked · 0.6s'),
          o('→ opentide explain vocab_unknown · how to fix it'),
        ],
      },
      {
        id: 'deploy',
        label: 'deploy plan',
        lights: [3],
        lines: [
          i('opentide deploy --dry-run --strategy PREVIEW --all'),
          o('Deploy plan · strategy PREVIEW · 2 platforms, 2 tenants · dry run, nothing is sent'),
          o(''),
          o('sentinel · 1 tenant'),
          o('  SOC Staging'),
          o('    + create or update  LSASS memory access  …000000000001  status STAGING', true),
          o(''),
          o('splunk · 1 tenant'),
          o('  ES Staging'),
          o('    + create or update  LSASS memory access  …000000000001  status STAGING', true),
          o(''),
          o('Plan: 0 to create, 0 to update, 2 to create or update, 0 to disable, 0 to delete'),
          i('echo $?'),
          o('0'),
        ],
      },
    ],
  },
  {
    id: 'sdk',
    name: 'SDK',
    audience: 'For Python tools and tests.',
    prompt: '>>> ',
    promises: [
      { title: 'Typed models', body: 'DetectionRule, DetectionObjective and ThreatVector, the models the JSON Schema is generated from.' },
      { title: 'A lazy registry', body: 'initialise() loads the index; objects parse on first access.' },
      { title: 'The whole graph', body: 'detection_model, threats, signals and threat chaining are attributes you follow.' },
      { title: 'Small, plain results', body: 'deploy() returns a DeploymentResult: platform, uuids, dry_run and a message.' },
    ],
    scenarios: [
      {
        id: 'chain',
        label: 'walk the chain',
        lights: [1, 2],
        lines: [
          i('from opentide import Opentide'),
          i('Opentide.initialise()'),
          i(`rule = Opentide.Rules["${RULE}"]`),
          i('objective = Opentide.Objectives[rule.detection_model]'),
          i('threat = Opentide.Threats[objective.objective.threats[0]]'),
          i('print(rule.name, "→", objective.name, "→", threat.name)'),
          o('LSASS memory access → Credential access via LSASS → Gateway exploitation (CVE-2026-0300)', true),
        ],
      },
      {
        id: 'chaining',
        label: 'follow the chain',
        lights: [2],
        lines: [
          i(`threat = Opentide.Threats["${THREAT}"]`),
          i('link = threat.threat.chaining[0]'),
          i('link["relation"], Opentide.Threats[link["vector"]].name'),
          o("('sequence::preceeds', 'Credential dumping from LSASS')", true),
          i('Opentide.Models.chaining'),
          o(`{'${THREAT}': {'sequence::preceeds': ['${CHAINED}']}}`),
        ],
      },
      {
        id: 'signal',
        label: 'read a signal',
        lights: [0, 2],
        lines: [
          i('signal = objective.objective.signals[0]'),
          i('signal.name, signal.data.logsources'),
          o("('LSASS process access', ['Endpoint process events'])", true),
        ],
      },
      {
        id: 'deploy',
        label: 'dry-run deploy',
        lights: [3],
        lines: [
          i('rule.deploy("sentinel", dry_run=True)'),
          o(`DeploymentResult(platform='sentinel', uuids=['${RULE}'],`),
          o("                 dry_run=True, message='dry-run')", true),
        ],
      },
    ],
  },
  {
    id: 'mcp',
    name: 'MCP',
    audience: 'For AI agents in the editor.',
    prompt: '› ',
    promises: [
      { title: 'Search the graph', body: 'search, get_chaining and coverage read the same index as the CLI, attack paths included.' },
      { title: 'The report CI gates on', body: 'validation_report returns the issues validate --strict fails on.' },
      { title: 'Dry-run by default', body: 'deploy_rule simulates unless you pass dry_run=false.' },
      { title: 'Live only on request', body: 'validate_query touches a tenant only with live: true.' },
    ],
    scenarios: [
      {
        id: 'search',
        label: 'search',
        lights: [0],
        lines: [
          i('search(query="lsass", type="rule")'),
          o(`→ [{ "uuid": "${RULE}", "type": "rule",`),
          o('     "title": "LSASS memory access", "status": "STAGING" }]', true),
        ],
      },
      {
        id: 'chaining',
        label: 'get_chaining',
        lights: [0],
        lines: [
          i(`get_chaining(uuid="${THREAT}")`),
          o(`→ { "uuid": "${THREAT}", "found": true, "type": "threat",`),
          o(`    "graph": { "sequence::preceeds": ["${CHAINED}"] },`, true),
          o('    "chaining_index": { … },'),
          o(`    "lineage": { "threats": ["${THREAT}", "${CHAINED}"],`, true),
          o(`                 "objectives": ["${OBJECTIVE}"],`),
          o(`                 "rules": ["${RULE}"] } }`),
        ],
      },
      {
        id: 'report',
        label: 'validation_report',
        lights: [1],
        lines: [
          i(`validation_report(uuid="${RULE}")`),
          o('→ { "ok": true, "issues": [], "warnings": [], "stats": { "objects_checked": 1, … } }', true),
        ],
      },
      {
        id: 'deploy',
        label: 'deploy_rule',
        lights: [2],
        lines: [
          i(`deploy_rule(uuid="${RULE}", platform="sentinel")`),
          o(`→ { "action": "dry-run", "tenant": null, "rule_id": "${RULE}",`, true),
          o('    "status": "STAGING", "dry_run": true, "platform": "sentinel", "message": "dry-run" }'),
        ],
      },
      {
        id: 'query',
        label: 'validate_query',
        lights: [3],
        lines: [
          i('validate_query(query="", platform="sentinel")'),
          o('→ { "valid": null, "supported": true, "status": "failed",'),
          o('    "message": "Query validation checks the tenant. Pass live: true.", "query_preview": "",', true),
          o('    "next_actions": [{ "tool": "validate_query", "arguments": { …, "live": true }, … }] }'),
        ],
      },
    ],
  },
];
