import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LIT_VOCABULARIES, VOCABULARIES } from './vocabularies.ts';

const catalog = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../content/docs/specifications/specs/vocabularies/catalog.mdx'),
  'utf8',
);

test('taxonomy ribbon: lists exactly the vocabularies in the synced catalog', () => {
  const fields = [...catalog.matchAll(/^\| `[^`]+\.vocab\.toml` \| [^|]+ \| `([^`]+)` \|$/gm)].map((m) => m[1]);
  assert.ok(fields.length > 0, 'no vocabulary rows found in the catalog');
  assert.deepEqual([...VOCABULARIES].sort(), fields.sort());
  for (const name of LIT_VOCABULARIES) assert.ok((VOCABULARIES as readonly string[]).includes(name), name);
});

test('taxonomy ribbon: every vocabulary has values to pop, and the demo uses real ones', async () => {
  const { VOCABULARY_VALUES } = await import('./vocabulary-values.ts');
  // responders was retired (specifications#38): it shipped with keys = [] while the
  // rule schema pinned a field to it, so no instance could validate a value. It is
  // now a deployment.toml configuration enum. Every vocabulary the spec still ships
  // carries values, so nothing is exempt from the >= 3 floor — keep this set empty
  // rather than allow-listing the next empty vocabulary instead of fixing it.
  const empty = new Set<string>();
  for (const name of VOCABULARIES) {
    const count = VOCABULARY_VALUES[name]?.length ?? 0;
    assert.ok(empty.has(name) ? count === 0 : count >= 3, `${name}: ${count} values`);
  }
  // Values the demo objects use, as the shipped vocabularies spell them.
  assert.ok(VOCABULARY_VALUES['chaining_relations'].includes('sequence::preceeds'));
  assert.ok(VOCABULARY_VALUES['severity'].includes('Significant incident'));
  assert.ok(VOCABULARY_VALUES['criticality'].includes('High'));
});
