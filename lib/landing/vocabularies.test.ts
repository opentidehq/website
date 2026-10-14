import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildVocabularyIndex, VOCAB_DIR } from '../../scripts/lib/vocab-derive.mjs';
import { GENERATED_VOCABULARIES, VOCABULARY_SOURCE } from '../generated/vocabularies.ts';
import { LIT_VOCABULARIES, VOCABULARIES } from './vocabularies.ts';
import { VOCABULARY_VALUES } from './vocabulary-values.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const specificationsRoot = join(repoRoot, 'vendor', 'specifications');
/** CI lints and tests without submodules; the sync job and local dev have them checked out. */
const hasSpecifications = existsSync(join(specificationsRoot, VOCAB_DIR));

test('the taxonomy is derived from the specification, not transcribed', () => {
  assert.ok(GENERATED_VOCABULARIES.length > 0, 'the generated artifact is empty');
  assert.ok(VOCABULARY_SOURCE.repo.includes('specifications'));
  // Membership comes from the artifact, so these are the same set by construction. Asserting it
  // guards against someone reintroducing a hand-written list.
  assert.deepEqual(
    [...VOCABULARIES].sort(),
    GENERATED_VOCABULARIES.map((v) => v.field).sort(),
  );
});

test('every vocabulary carries values, and each is the shape the ribbon needs', () => {
  for (const vocabulary of GENERATED_VOCABULARIES) {
    assert.ok(vocabulary.field, 'a vocabulary has no field');
    assert.ok(vocabulary.keyCount > 0, `${vocabulary.field}: no keys`);
    assert.ok(vocabulary.valueCount > 0, `${vocabulary.field}: no authored values`);
    assert.ok(vocabulary.samples.length > 0, `${vocabulary.field}: no samples`);
    for (const sample of vocabulary.samples) {
      assert.equal(typeof sample.value, 'string');
      assert.ok(sample.value.length > 0, `${vocabulary.field}: empty sample value`);
    }
  }
});

test('the ribbon renders a value list for every vocabulary it shows', () => {
  for (const field of VOCABULARIES) {
    assert.ok((VOCABULARY_VALUES[field]?.length ?? 0) > 0, `${field}: no values to show`);
  }
});

test('the editorial lit-vocabulary selection cannot name a retired vocabulary', () => {
  for (const field of LIT_VOCABULARIES) {
    assert.ok(VOCABULARIES.includes(field), `${field} is lit but not in the specification`);
  }
});

test('staged vocabularies are stage-prefixed, unstaged ones are not (RFC 0005)', () => {
  const byField = new Map(GENERATED_VOCABULARIES.map((v) => [v.field, v]));

  // `specs/objects/threat-1.0.md`: a ThreatActor name is `<stage>::<id>`; unscoped is invalid.
  const actors = byField.get('actors');
  if (actors) {
    assert.ok(actors.staged, 'actors is a staged vocabulary');
    for (const sample of actors.samples) {
      assert.match(sample.value, /^[^:]+::/, `actors value ${sample.value} is not stage-scoped`);
    }
  }

  // `att&ck` declares `stages` as a plain string list — tactic classification, not a prefix.
  const attack = byField.get('att&ck');
  if (attack) {
    assert.equal(attack.staged, false, 'att&ck is not a staged vocabulary');
    for (const sample of attack.samples) {
      assert.doesNotMatch(sample.value, /::/, `att&ck value ${sample.value} must stay bare`);
    }
  }

  // RFC 0005 states the scoped enum is 35 values over 28 keys. That arithmetic is the clearest
  // single check that multi-stage expansion is working.
  const entities = byField.get('signal.entities');
  if (entities) {
    assert.ok(entities.staged, 'signal.entities is scoped as of RFC 0005');
    assert.equal(entities.keyCount, 28, 'signal.entities key count changed upstream');
    assert.equal(entities.valueCount, 35, 'signal.entities scoped value count changed upstream');
  }
});

test('the specification reported no integrity problems while deriving', () => {
  // Warnings are advisory by design — they must never fail a deploy — but a clean tree should
  // have none, so this surfaces a real upstream defect in review rather than in silence.
  const index = hasSpecifications ? buildVocabularyIndex(specificationsRoot) : { warnings: [] };
  assert.deepEqual(index.warnings, [], `specification integrity warnings: ${index.warnings.join('; ')}`);
});

test('the committed artifact matches the specification it was derived from', (t) => {
  if (!hasSpecifications) {
    t.skip('vendor/specifications is not checked out (CI lints without submodules)');
    return;
  }
  // The real equivalence check: re-derive from the TOMLs and compare. This is what catches a
  // committed artifact that went stale against a bumped submodule.
  const fresh = buildVocabularyIndex(specificationsRoot);
  assert.deepEqual(
    fresh.vocabularies.map((v) => v.field).sort(),
    GENERATED_VOCABULARIES.map((v) => v.field).sort(),
    'lib/generated/vocabularies.ts is stale — run `pnpm sync:content`',
  );
  for (const derived of fresh.vocabularies) {
    const committed = GENERATED_VOCABULARIES.find((v) => v.field === derived.field);
    assert.ok(committed, `${derived.field} missing from the committed artifact`);
    assert.equal(committed.valueCount, derived.valueCount, `${derived.field}: value count is stale`);
    assert.equal(committed.staged, derived.staged, `${derived.field}: staged flag is stale`);
    assert.deepEqual(
      committed.samples.map((s) => s.value),
      derived.samples.map((s) => s.value),
      `${derived.field}: samples are stale`,
    );
  }
});
