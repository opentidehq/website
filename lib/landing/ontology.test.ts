import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, VISIBILITY_PATH, VISIBILITY_TOML } from './demo-registry.ts';
import { CANVAS, EDGES, NODES, TOUR } from './ontology.ts';

const sources: Record<string, string> = { ...DEMO_FILES, [VISIBILITY_PATH]: VISIBILITY_TOML };
const named = (name: string) =>
  Object.values(sources).some((source) => source.includes(`name: ${name}\n`) || source.includes(`name = "${name}"`));

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

  test(`ontology map: the ${id} records are demo objects, with their own values`, () => {
    for (const record of node.records) {
      const file = record.file ?? node.file;
      const source = sources[file];
      assert.ok(source, `no demo file at ${file}`);
      assert.ok(named(record.name) && source.includes(record.name), `"${record.name}" is not an object in ${file}`);
      for (const fact of record.facts) assert.ok(source.includes(fact), `"${fact}" is not in ${file}`);
      if (record.via) assert.ok(sources[node.file].includes(`relation: ${record.via}`), `no ${record.via} chaining in ${node.file}`);
    }
  });
}

test('ontology map: every link value is in the file that holds the field, and names a real object', () => {
  for (const edge of EDGES) {
    const holder = sources[NODES[edge.from].file];
    for (const line of edge.value) {
      assert.ok(holder.includes(line), `${edge.from}.${edge.field}: "${line}" is not in ${NODES[edge.from].file}`);
    }
    for (const name of edge.resolves ?? []) assert.ok(named(name), `${edge.from}.${edge.field}: no object named "${name}"`);
  }
});

test('ontology map: every edge joins two known nodes, and the tour visits each node once', () => {
  for (const edge of EDGES) {
    assert.ok(edge.from in NODES && edge.to in NODES, `${edge.from} → ${edge.to}`);
  }
  assert.deepEqual([...TOUR].sort(), Object.keys(NODES).sort());
});

test('ontology map: every node sits on the canvas', () => {
  for (const [id, node] of Object.entries(NODES)) {
    const [x, y] = node.at;
    assert.ok(x > 0 && x < CANVAS.w && y > 0 && y < CANVAS.h, `${id} at ${x},${y}`);
  }
});
