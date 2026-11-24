import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, RULE_PATH } from '../landing/demo-registry.ts';
import { isApplied, SCENARIOS, toggleScenario, type TextChange } from './scenarios.ts';
import { decodeShare, encodeShare } from './share.ts';

const apply = (text: string, changes: TextChange[]) =>
  [...changes].sort((a, b) => b.from - a.from).reduce((t, c) => t.slice(0, c.from) + c.insert + t.slice(c.to), text);

test('every scenario applies to the demo rule and undoes back to it', () => {
  const rule = DEMO_FILES[RULE_PATH];
  for (const scenario of SCENARIOS) {
    assert.equal(isApplied(scenario, rule), false, scenario.id);
    const on = apply(rule, toggleScenario(scenario, rule));
    assert.notEqual(on, rule, `${scenario.id} changes the rule`);
    assert.equal(isApplied(scenario, on), true, scenario.id);
    assert.equal(apply(on, toggleScenario(scenario, on)), rule, `${scenario.id} undoes`);
  }
});

test('share links round-trip, and junk decodes to null', async () => {
  const files = { 'objects/rules/a.yaml': 'name: é 😀\n' };
  const hash = await encodeShare(files);
  assert.match(hash, /^#s=[\w-]+$/);
  assert.deepEqual(await decodeShare(hash), files);
  assert.equal(await decodeShare('#s=not-deflate'), null);
  assert.equal(await decodeShare('#chapter'), null);
});
