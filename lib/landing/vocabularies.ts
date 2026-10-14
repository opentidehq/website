/**
 * The taxonomy ribbon's view of the specification's vocabularies.
 *
 * Membership is **derived**, never written down here: `GENERATED_VOCABULARIES` comes from
 * `lib/generated/vocabularies.ts`, which `pnpm sync:content` regenerates from
 * `OpenTideHQ/specifications`. A vocabulary added or retired upstream therefore reaches this
 * page by itself.
 *
 * `RIBBON_ORDER` below is the one genuinely editorial thing left: the left-to-right order the
 * ribbon reads best in. It is deliberately **not authoritative** — a vocabulary missing from it
 * still renders (appended, in specification order), and an entry naming a vocabulary the
 * specification no longer ships is ignored. Neither case can fail the build, which is the point:
 * retiring `responders` (specifications#38) once froze every deploy for ~20 hours because this
 * module hard-coded the list and a test asserted set-equality against the synced catalogue.
 */
import { GENERATED_VOCABULARIES } from '../generated/vocabularies.ts';

/** Editorial left-to-right order for the ribbon. Not a source of truth — see the note above. */
const RIBBON_ORDER: readonly string[] = [
  'surface',
  'att&ck',
  'actors',
  'chaining_relations',
  'severity',
  'impact',
  'leverage',
  'viability',
  'criticality',
  'killchain',
  'signal.entities',
  'detection.methodology',
  'detection.composition',
  'detection.types',
  'alert_severity',
  'datasources',
  'att&ck.groups',
  'mitigations',
  'malapi',
  'collection',
  'objectives',
  'stakeholders',
  'sectors',
  'resources',
  'efforts',
  'feasibility',
  'level',
  'maturity',
  'scheduling',
  'sophistication',
  'tier',
  'tlp',
  'pap',
  'rsit',
  'violation',
];

/** Sort derived vocabularies by the editorial order, with anything unlisted appended. */
function inRibbonOrder(fields: readonly string[]): readonly string[] {
  const rank = new Map(RIBBON_ORDER.map((field, i) => [field, i]));
  return [...fields].sort((a, b) => {
    const ra = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ra === rb ? a.localeCompare(b) : ra - rb;
  });
}

/** Every vocabulary the specification ships, in the order the ribbon shows them. */
export const VOCABULARIES: readonly string[] = inRibbonOrder(
  GENERATED_VOCABULARIES.map((vocabulary) => vocabulary.field),
);

/**
 * The vocabularies the demo objects on the landing page draw from, lit on the ribbon.
 *
 * This is an editorial selection, so it is listed here — but it is intersected with the derived
 * set, so naming a retired vocabulary quietly lights nothing instead of failing a build.
 */
const DEMO_VOCABULARIES: readonly string[] = [
  'surface',
  'att&ck',
  'chaining_relations',
  'severity',
  'impact',
  'leverage',
  'viability',
  'criticality',
  'killchain',
  'signal.entities',
  'detection.methodology',
  'detection.composition',
  'detection.types',
  'alert_severity',
  'tlp',
];

export const LIT_VOCABULARIES: ReadonlySet<string> = new Set(
  DEMO_VOCABULARIES.filter((field) => VOCABULARIES.includes(field)),
);
