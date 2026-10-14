import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import {
  authoredValues,
  buildVocabularyIndex,
  deriveVocabularies,
  listVocabularyFiles,
  pickSamples,
  readVocabularyFile,
  stageIdsFor,
  stagesForEntry,
  valueKeyFor,
  VOCAB_DIR,
} from './vocab-derive.mjs';

const temps = [];
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/** A throwaway specifications tree holding the given `<field>.vocab.toml` files. */
function specTree(files) {
  const root = mkdtempSync(join(tmpdir(), 'vocab-derive-'));
  temps.push(root);
  mkdirSync(join(root, VOCAB_DIR), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, VOCAB_DIR, name), body);
  }
  return root;
}

test('pickSamples: takes everything when the vocabulary is short', () => {
  assert.deepEqual(pickSamples(['a', 'b', 'c'], 6), ['a', 'b', 'c']);
});

test('pickSamples: spreads through a long vocabulary, keeping first and last', () => {
  const values = Array.from({ length: 100 }, (_, i) => `v${i}`);
  const picked = pickSamples(values, 6);
  assert.equal(picked.length, 6);
  assert.equal(picked[0], 'v0');
  assert.equal(picked.at(-1), 'v99');
  // Strictly increasing: a spread sample, not six neighbours.
  const indices = picked.map((v) => Number(v.slice(1)));
  for (let i = 1; i < indices.length; i += 1) assert.ok(indices[i] > indices[i - 1]);
});

test('valueKeyFor: honours the declared key, else infers from the first entry', () => {
  assert.equal(valueKeyFor({ key: 'id' }), 'id');
  assert.equal(valueKeyFor({ keys: [{ name: 'alpha' }] }), 'name');
  assert.equal(valueKeyFor({ keys: [{ id: 'X1' }] }), 'id');
});

test('stagesForEntry: normalises scalar and list stage scopes', () => {
  assert.deepEqual(stagesForEntry({ 'tide.vocab.stages': 'Host' }), ['Host']);
  assert.deepEqual(stagesForEntry({ 'tide.vocab.stages': ['Host', 'Cloud'] }), ['Host', 'Cloud']);
  assert.deepEqual(stagesForEntry({}), []);
});

test('stageIdsFor: stage TABLES scope a vocabulary, a plain string list does not', () => {
  // `[[stages]]` tables — surface, signal.entities, actors, chaining_relations, malapi.
  assert.deepEqual(stageIdsFor({ stages: [{ id: 'sequence' }, { id: 'support' }] }), [
    'sequence',
    'support',
  ]);
  // `stages = ["Reconnaissance", ...]` — att&ck and killchain carry tactic classification only.
  assert.deepEqual(stageIdsFor({ stages: ['Reconnaissance', 'Impact'] }), []);
  assert.deepEqual(stageIdsFor({}), []);
});

test('authoredValues: an unstaged vocabulary keeps bare values', () => {
  const doc = { stages: ['Defense Evasion'] };
  const values = authoredValues(doc, [{ id: 'T1548', name: 'Abuse Elevation' }], 'id');
  assert.deepEqual(values, [{ value: 'T1548', label: 'Abuse Elevation' }]);
});

test('authoredValues: a staged vocabulary prefixes <stage>::<key>', () => {
  const doc = { stages: [{ id: 'sequence' }] };
  const values = authoredValues(doc, [{ name: 'preceeds', 'tide.vocab.stages': 'sequence' }], 'name');
  assert.deepEqual(values, [{ value: 'sequence::preceeds', label: 'preceeds' }]);
});

test('authoredValues: a multi-stage key yields one authored value per stage', () => {
  const doc = { stages: [{ id: 'Host' }, { id: 'Cloud' }] };
  const values = authoredValues(doc, [{ name: 'Account', 'tide.vocab.stages': ['Host', 'Cloud'] }], 'name');
  assert.deepEqual(values.map((v) => v.value), ['Host::Account', 'Cloud::Account']);
});

test('authoredValues: a key removed in place leaves the contract', () => {
  const entries = [
    { name: 'live', version: '1.0' },
    { name: 'retired', version: '1.0', removed: '2.0' },
  ];
  const values = authoredValues({}, entries, 'name');
  assert.deepEqual(values.map((v) => v.value), ['live']);
});

test('readVocabularyFile: warns when the declared field disagrees with the filename', () => {
  const root = specTree({
    'mismatch.vocab.toml': 'name = "Mismatch"\nfield = "other"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "a"\n',
  });
  const { vocabulary, warnings } = readVocabularyFile(join(root, VOCAB_DIR, 'mismatch.vocab.toml'));
  assert.equal(vocabulary.field, 'other');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /declares field "other" but the filename says "mismatch"/);
});

test('listVocabularyFiles: returns [] for a specifications tree with no vocabularies', () => {
  const root = mkdtempSync(join(tmpdir(), 'vocab-derive-empty-'));
  temps.push(root);
  assert.deepEqual(listVocabularyFiles(root), []);
});

test('buildVocabularyIndex: a malformed TOML is a warning, not a thrown build failure', () => {
  const root = specTree({
    'good.vocab.toml': 'name = "Good"\nfield = "good"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "a"\n',
    'broken.vocab.toml': 'this is not = = valid toml [[[\n',
  });
  const index = buildVocabularyIndex(root, { sha: 'abc123' });
  assert.equal(index.count, 1, 'the good vocabulary is still derived');
  assert.equal(index.vocabularies[0].field, 'good');
  assert.equal(index.warnings.length, 1);
  assert.match(index.warnings[0], /broken\.vocab\.toml: could not be parsed/);
});

test('buildVocabularyIndex: records the source commit', () => {
  const root = specTree({
    'tlp.vocab.toml': 'name = "TLP"\nfield = "tlp"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "clear"\n',
  });
  const index = buildVocabularyIndex(root, { sha: 'deadbeef' });
  assert.equal(index.source.sha, 'deadbeef');
  assert.equal(index.source.repo, 'OpenTideHQ/specifications');
});

test('deriveVocabularies: a removed vocabulary simply disappears from the artifact', () => {
  const before = specTree({
    'alpha.vocab.toml': 'name = "Alpha"\nfield = "alpha"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "a"\n',
    'doomed.vocab.toml': 'name = "Doomed"\nfield = "doomed"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "d"\n',
  });
  const after_ = specTree({
    'alpha.vocab.toml': 'name = "Alpha"\nfield = "alpha"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "a"\n',
  });

  const out = join(mkdtempSync(join(tmpdir(), 'vocab-derive-out-')), 'vocabularies.ts');
  temps.push(join(out, '..'));

  const first = deriveVocabularies({ specificationsRoot: before, outPath: out });
  assert.equal(first.count, 2);
  assert.ok(readFileSync(out, 'utf8').includes('"doomed"'));

  // This is the regression the whole module exists for: retiring a vocabulary must regenerate
  // cleanly rather than fail, as `responders` did when the list was hand-written.
  const second = deriveVocabularies({ specificationsRoot: after_, outPath: out });
  assert.equal(second.count, 1);
  const rendered = readFileSync(out, 'utf8');
  assert.ok(!rendered.includes('"doomed"'), 'the retired vocabulary is gone from the artifact');
  assert.ok(rendered.includes('"alpha"'));
});

test('deriveVocabularies: emits a module that declares its generated provenance', () => {
  const root = specTree({
    'tlp.vocab.toml': 'name = "TLP"\nfield = "tlp"\nkey = "name"\n[[keys]]\nversion = "1.0"\nname = "clear"\n',
  });
  const out = join(mkdtempSync(join(tmpdir(), 'vocab-derive-mod-')), 'vocabularies.ts');
  temps.push(join(out, '..'));
  deriveVocabularies({ specificationsRoot: root, outPath: out, sha: 'cafe' });
  const rendered = readFileSync(out, 'utf8');
  assert.match(rendered, /GENERATED FILE — DO NOT EDIT/);
  assert.match(rendered, /export const GENERATED_VOCABULARIES: readonly GeneratedVocabulary\[\]/);
  assert.match(rendered, /export const VOCABULARY_SOURCE/);
  assert.match(rendered, /sha: "cafe"/);
});
