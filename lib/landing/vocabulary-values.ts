/**
 * Sample values for the taxonomy ribbon, in the form a detection author writes them.
 *
 * Every value here is **derived** from `opentidehq/specifications` via
 * `lib/generated/vocabularies.ts`; none is transcribed. That matters beyond removing a
 * maintenance chore, because the hand-written list this replaced had silently drifted from the
 * specification: it showed `Account` and `Accept` for `signal.entities` and `malapi`, and a bare
 * `[Mobile] APT-C-23` for `actors`, where the specification's own rule for a staged vocabulary
 * (RFC 0005, and `specs/objects/threat-1.0.md`, which calls the unscoped form invalid) makes the
 * authored values `Host::Account`, `Internet::Accept` and `att&ck::G1028`.
 *
 * The generator picks a representative handful per vocabulary — the first few, or spread evenly
 * through a long one — so `surface` shows real hierarchy rather than six alphabetical neighbours.
 */
import { GENERATED_VOCABULARIES } from '../generated/vocabularies.ts';

/**
 * Vocabularies whose authored value is a stable identifier that means nothing to a reader, and
 * whose human-readable `name` the ribbon shows instead.
 *
 * `actors` is the clearest case: its authored values are correctly `att&ck::G1028` and
 * `misp::4b79d1f6-8333-44b6-ac32-d1ea7e47e77f`, so showing them raw fills the ribbon with UUIDs.
 * The generated artifact keeps the true authored value either way — this is display only.
 *
 * Purely presentational: an entry naming a vocabulary the specification no longer ships is
 * simply never consulted.
 */
const PREFER_LABEL: ReadonlySet<string> = new Set(['actors', 'att&ck.groups']);

export const VOCABULARY_VALUES: Record<string, readonly string[]> = Object.fromEntries(
  GENERATED_VOCABULARIES.map((vocabulary) => [
    vocabulary.field,
    vocabulary.samples.map((sample) =>
      PREFER_LABEL.has(vocabulary.field) ? sample.label : sample.value,
    ),
  ]),
);
