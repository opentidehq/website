import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, VISIBILITY_PATH, VISIBILITY_TOML } from './demo-registry.ts';
import { EDGES, NODES, TOUR } from './ontology.ts';

const sources: Record<string, string> = { ...DEMO_FILES, [VISIBILITY_PATH]: VISIBILITY_TOML };

for (const [id, node] of Object.entries(NODES)) {
  test(`ontology map: the ${id} excerpt is copied from ${node.file}, line for line`, () => {
    const source = sources[node.file];
    assert.ok(source, `no demo file at ${node.file}`);
    const lines = source.split('\n');
    let at = -1;
    for (const raw of node.excerpt) {
      const text = raw.startsWith('>') ? raw.slice(1) : raw;
      if (text.trim() === '') continue;
      const next = lines.indexOf(text, at + 1);
      assert.ok(next > at, `"${text}" is not in ${node.file} after line ${at + 1}`);
      at = next;
    }
  });
}

test('ontology map: every edge joins two known nodes, and the tour visits each node once', () => {
  for (const edge of EDGES) {
    assert.ok(edge.from in NODES && edge.to in NODES, `${edge.from} → ${edge.to}`);
  }
  assert.deepEqual([...TOUR].sort(), Object.keys(NODES).sort());
});
