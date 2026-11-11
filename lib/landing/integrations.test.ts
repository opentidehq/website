import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { INTEGRATIONS } from './integrations.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const platformSpecs = join(repoRoot, 'content', 'docs', 'specifications', 'specs', 'platforms');

/** The field names a snippet line writes, quoted strings left out (a YARA condition is not a field). */
function fieldsOf(line: string): string[] {
  const unquoted = line.replace(/'[^']*'|"[^"]*"/g, '""');
  return [...unquoted.matchAll(/(?:^|[{,]\s*)\s*([A-Za-z_][A-Za-z0-9_]*):(?=\s|$)/g)].map((m) => m[1]);
}

test('every integration is a synced platform spec, with its icon in the repo', () => {
  const keys = INTEGRATIONS.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length, 'a configurations key is listed twice');
  for (const p of INTEGRATIONS) {
    const spec = join(platformSpecs, `${p.key.replaceAll('_', '-')}-1.0.mdx`);
    assert.ok(existsSync(spec), `${p.key}: no platform spec at ${spec}`);
    assert.match(readFileSync(spec, 'utf8'), new RegExp(`platform::${p.key}::1\\.0`), `${p.key}: spec names another platform`);
    assert.ok(existsSync(join(repoRoot, 'public', p.src)), `${p.key}: no icon at public${p.src}`);
  }
});

test("every field a block shows is a field of that integration's spec", () => {
  for (const p of INTEGRATIONS) {
    assert.equal(p.block.length, 3, `${p.key}: a block is three lines, so the rule file keeps its height`);
    const spec = readFileSync(join(platformSpecs, `${p.key.replaceAll('_', '-')}-1.0.mdx`), 'utf8');
    const fields = p.block.flatMap(fieldsOf);
    assert.ok(fields.length > 0, `${p.key}: the block shows no field`);
    for (const field of fields) {
      assert.ok(spec.includes(`| \`${field}\` |`), `${p.key}: \`${field}\` is not a field of platform::${p.key}::1.0`);
    }
  }
});
