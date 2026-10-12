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
