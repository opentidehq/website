/** The vocabularies in `specifications/vocabularies/`. The ones the ontology map uses are lit. */
const VOCABULARIES = [
  'surface',
  'att&ck',
  'actors',
  'severity',
  'impact',
  'leverage',
  'viability',
  'criticality',
  'killchain',
  'chaining_relations',
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

const LIT = new Set<string>(['surface', 'att&ck', 'actors', 'severity', 'impact', 'leverage', 'viability', 'signal.entities', 'detection.methodology', 'alert_severity']);

function Chip({ name }: { name: string }) {
  const lit = LIT.has(name);
  return (
    <li
      className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs ${
        lit
          ? 'border-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--landing-accent)_8%,transparent)] text-[var(--landing-accent)]'
          : 'border-[var(--landing-border)] text-[var(--landing-subtle)]'
      }`}
    >
      {name}
    </li>
  );
}

/** The taxonomy: every versioned vocabulary, drifting past. The list is real, not decoration. */
export function TaxonomyRibbon() {
  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="font-mono text-xs text-[var(--landing-subtle)]">the taxonomy</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
          36 versioned vocabularies keep every value comparable.
        </p>
      </div>
      <div className="landing-fade-x overflow-hidden motion-reduce:overflow-x-auto" aria-label="Vocabularies in the specification">
        {/* Two copies make the loop seamless; the second is decoration for assistive tech. */}
        <div className="landing-marquee flex w-max gap-6">
          <ul className="m-0 flex list-none gap-2 p-0">
            {VOCABULARIES.map((name) => (
              <Chip key={name} name={name} />
            ))}
          </ul>
          <ul className="m-0 flex list-none gap-2 p-0" aria-hidden>
            {VOCABULARIES.map((name) => (
              <Chip key={name} name={name} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
