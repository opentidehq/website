import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, RULE_PATH } from '../landing/demo-registry.ts';
import { compileRule, dedent, frequencyToCron, shortDuration, toIsoDuration } from './compile.ts';

const platforms = {
  sentinel: DEMO_FILES['.opentide/configurations/platforms/sentinel.toml'],
  splunk: DEMO_FILES['.opentide/configurations/platforms/splunk.toml'],
};

test('durations: shorthand becomes ISO 8601, ISO 8601 passes through', () => {
  assert.equal(toIsoDuration('30m'), 'PT30M');
  assert.equal(toIsoDuration('1d2h'), 'P1DT2H');
  assert.equal(toIsoDuration('PT1H'), 'PT1H');
  assert.equal(toIsoDuration('soon'), null);
  assert.equal(shortDuration('PT2H'), '2h');
});

test('frequencies become a stable cron', () => {
  assert.equal(frequencyToCron('15m', 'a'), frequencyToCron('15m', 'a'));
  assert.match(frequencyToCron('15m', 'seed')!, /^\d+-59\/15 \* \* \* \*$/);
  assert.match(frequencyToCron('1h', 'seed')!, /^\d+ \* \* \* \*$/);
  assert.equal(frequencyToCron('soon', 'seed'), null);
});

test('dedent strips a block scalar indent', () => {
  assert.equal(dedent('    a\n      b\n'), 'a\n  b');
});

test('the demo rule compiles for Sentinel and Splunk staging tenants', () => {
  const compiled = compileRule(DEMO_FILES[RULE_PATH], platforms);
  assert.equal(compiled.error, undefined);
  assert.equal(compiled.status, 'STAGING');
  const [sentinel, splunk] = compiled.targets;

  assert.equal(sentinel.key, 'sentinel');
  assert.equal(sentinel.strategy, 'PREVIEW');
  assert.deepEqual(sentinel.tenants, ['SOC Staging']);
  // The staging guardrail modifier quiets the alert and prefixes its title.
  assert.deepEqual(sentinel.modifiers, ['Staging guardrail']);
  assert.equal(sentinel.severity, 'Informational');
  assert.equal(sentinel.title, '[STAGING] LSASS memory access on {{DeviceName}}');
  const arm = JSON.parse(sentinel.artefact.text);
  assert.equal(arm.properties.queryFrequency, 'PT1H');
  assert.equal(arm.properties.queryPeriod, 'PT2H');
  assert.ok(arm.properties.query.startsWith('DeviceProcessEvents\n| where'));

  assert.equal(splunk.key, 'splunk');
  assert.deepEqual(splunk.tenants, ['ES Staging']);
  assert.match(splunk.artefact.text, /^\[LSASS memory access\]/);
  assert.match(splunk.artefact.text, /dispatch\.latest_time = -5m@m/);
  assert.match(splunk.artefact.text, /action\.notable\.param\.security_domain = endpoint/);
  assert.match(splunk.artefact.text, /alert\.severity = 5/);
});

test('PRODUCTION reaches the release tenant without the staging modifier', () => {
  const text = DEMO_FILES[RULE_PATH].replaceAll('status: STAGING', 'status: PRODUCTION');
  const [sentinel] = compileRule(text, platforms).targets;
  assert.equal(sentinel.strategy, 'RELEASE');
  assert.deepEqual(sentinel.tenants, ['SOC Production']);
  assert.deepEqual(sentinel.modifiers, []);
  assert.equal(sentinel.severity, 'High');
});

test('objects other than rules do not deploy', () => {
  const compiled = compileRule(DEMO_FILES['objects/objectives/credential-access-via-lsass.yaml'], platforms);
  assert.match(compiled.error ?? '', /Only rules deploy/);
});

test('broken YAML reports instead of throwing', () => {
  assert.match(compileRule('name: [', platforms).error ?? '', /does not parse/);
});

test('simulated hits take their columns from the query', async () => {
  const { resultColumns, simulateHits } = await import('./simulate.ts');
  assert.deepEqual(resultColumns('T\n| project Timestamp, DeviceName'), ['Timestamp', 'DeviceName']);
  assert.deepEqual(
    resultColumns('`sysmon`\n| stats count, min(_time) as firstTime by host, user\n| `macro(firstTime)`'),
    ['host', 'user', 'count', 'firstTime'],
  );
  const a = simulateHits('T | project DeviceName', 'seed', 3, 0);
  assert.deepEqual(a, simulateHits('T | project DeviceName', 'seed', 3, 0));
  assert.equal(a.rows.length, 3);
});
