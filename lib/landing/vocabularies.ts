/**
 * The taxonomy: every versioned vocabulary in the specification, by field name, in the order the
 * ribbon shows them. `vocabularies.test.ts` holds the list to the synced catalog
 * (content/docs/specifications/specs/vocabularies/catalog.mdx), so a new vocabulary fails the
 * build until it is added here.
 */
export const VOCABULARIES = [
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
  'responders',
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
] as const;

/** The vocabularies the demo objects use, lit on the ribbon. */
export const LIT_VOCABULARIES: ReadonlySet<string> = new Set([
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
]);
