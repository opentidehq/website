import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, UUID, VISIBILITY_TOML } from './demo-registry.ts';
import { CHAINED, DOORS, OBJECTIVE, RULE, THREAT } from './showcase.ts';

const files = DEMO_FILES as Record<string, string>;
const lines = DOORS.flatMap((door) => door.scenarios.flatMap((s) => s.lines.map((l) => l.text)));
const text = lines.join('\n');

/** The broken-reference run points `detection_model` at an objective that must not exist. */
const MISSING = '00000000-0000-4000-8002-000000000002';

test('showcase: its UUIDs are the demo repository’s', () => {
  assert.equal(RULE, UUID.ruleLsass);
  assert.equal(OBJECTIVE, UUID.objectiveCredential);
  assert.equal(THREAT, UUID.threatGateway);
  assert.equal(CHAINED, UUID.threatLsass);
  const known = new Set<string>(Object.values(UUID));
  for (const uuid of text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g) ?? []) {
    if (uuid === MISSING) continue;
    assert.ok(known.has(uuid), `${uuid} is not a demo object`);
  }
  assert.ok(!Object.values(files).some((body) => body.includes(MISSING)), `${MISSING} must stay unknown`);
});

test('showcase: every file:line:column it prints quotes the demo file', () => {
  const refs = [...text.matchAll(/╭─▶ ([\w./-]+\.yaml):(\d+):(\d+)/g)];
  assert.ok(refs.length > 0);
  for (const [, path, n, col] of refs) {
    const file = Object.keys(files).find((p) => p.endsWith(path));
    assert.ok(file, `no demo file ${path}`);
    const source = files[file].split('\n');
    // The failing runs quote their edit: the rule points at the missing objective, and the
    // threat's severity is `Critical`, which severity::1.0 does not hold.
    const line = (source[Number(n) - 1] ?? '')
      .replace(OBJECTIVE, MISSING)
      .replace(/^( {2}severity: )Significant incident$/, '$1Critical');
    // The snippet quotes the line under its number, and the column starts the flagged value.
    assert.ok(text.includes(`${n} │ ${line}\n`), `${path}:${n} is "${line}", not the quoted line`);
    assert.ok(text.includes(`${Number(n) - 1} │ ${source[Number(n) - 2]}\n`), `${path}:${Number(n) - 1} is not the line above`);
    assert.match(line.slice(Number(col) - 1), /^[\w-]/, `${path}:${n}:${col} does not start a value`);
  }
  // `--json` reports the same line 0-based.
  const rule = files['objects/rules/lsass-memory-access.yaml'].split('\n');
  assert.match(text, /"yaml_line": 22,/);
  assert.ok(rule[22].startsWith('detection_model:'));
});

test('showcase: the objects it names exist in the demo repository', () => {
  const names = [
    'LSASS memory access',
    'Credential access via LSASS',
    'Gateway exploitation (CVE-2026-0300)',
    'Credential dumping from LSASS',
  ];
  for (const name of names) {
    assert.ok(text.includes(name), `the showcase no longer prints ${name}`);
    assert.ok(Object.values(files).some((body) => body.startsWith(`name: ${name}\n`)), `no demo object named ${name}`);
  }
  assert.ok(files['objects/objectives/credential-access-via-lsass.yaml'].includes('    - name: LSASS process access\n'));
  assert.ok(VISIBILITY_TOML.includes('name = "Endpoint process events"'));
  assert.ok(files['objects/threats/gateway-exploitation-cve-2026-0300.yaml'].includes(`    - relation: sequence::preceeds\n      vector: ${CHAINED}\n`));
});
