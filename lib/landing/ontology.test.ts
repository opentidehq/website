import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_FILES, OBJECT_BLURBS, VISIBILITY_PATH, VISIBILITY_TOML } from './demo-registry.ts';
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
      for (const fact of [...record.facts, ...(record.tag ? [record.tag] : [])]) assert.ok(source.includes(fact), `"${fact}" is not in ${file}`);
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

/**
 * A node's schema tag (`threat::1.0`) is the one specification fact this module states in its
 * own words rather than copying from the demo file. `ontology.ts` is deliberately import-free so
 * the map does not pull the demo registry into the landing's first load, so the check lives here
 * instead of being a derivation.
 *
 * This is safe to assert, unlike the vocabulary tripwire this repo removed in #43: demo content
 * is hand-written in this repository and is never touched by the hourly submodule sync, so a
 * failure here is a local edit telling its author to update a label two lines away — it can
 * never freeze the automated deploy the way an upstream vocabulary change once did.
 */
test('ontology map: every schema tag matches the schema its demo file declares', () => {
  const schemaTags = Object.entries(NODES).filter(([, node]) => node.tag.includes('::'));
  assert.ok(schemaTags.length > 0, 'no schema-tagged nodes found');
  for (const [id, node] of schemaTags) {
    const source = sources[node.file];
    assert.ok(source, `no demo file at ${node.file}`);
    const declared = source.match(/^\s*schema:\s*(\S+)/m)?.[1];
    assert.equal(declared, node.tag, `${id}: tag says ${node.tag}, ${node.file} declares ${declared}`);
  }
});

/** The demo cards label each object with its schema; it must agree with the object itself. */
test('object blurbs: every schema label matches the demo object it describes', () => {
  const bySchema = new Map<string, string>();
  for (const [path, source] of Object.entries(sources)) {
    const declared = source.match(/^\s*schema:\s*(\S+)/m)?.[1];
    if (declared) bySchema.set(declared, path);
  }
  const labelled = Object.entries(OBJECT_BLURBS).filter(([, blurb]) => blurb.schema?.includes('::'));
  assert.ok(labelled.length > 0, 'no schema-labelled object blurbs found');
  for (const [id, blurb] of labelled) {
    assert.ok(
      bySchema.has(blurb.schema as string),
      `${id}: labelled ${blurb.schema}, which no demo object declares (demos declare ${[...bySchema.keys()].join(', ')})`,
    );
  }
});
