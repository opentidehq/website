import type { CSSProperties } from 'react';
import { LIT_VOCABULARIES, VOCABULARIES } from '@/lib/landing/vocabularies';
import { VOCABULARY_VALUES } from '@/lib/landing/vocabulary-values';

/** A value's rough width at 10.5px mono, to set pills side by side without touching. */
const width = (value: string) => Math.min(224, value.length * 6.4 + 20);

/**
 * Where each value lands around its vocabulary: two rows above and two below, nearest first,
 * so they pop out in that order. Pills that share a row sit either side of the centre.
 */
function placements(values: readonly string[]) {
  const side = (i: number, sign: number) => sign * (width(values[i] ?? '') / 2 + 5);
  const spots: [number, number][] = [
    [side(0, -1), -40],
    [side(1, 1), -40],
    [side(2, -1), 40],
    [side(3, 1), 40],
    [0, -74],
    [0, 74],
  ];
  return values.slice(0, spots.length).map((value, i) => ({ value, x: spots[i][0], y: spots[i][1] }));
}

function Chips({ hidden }: { hidden?: boolean }) {
  // Each copy carries its own trailing gap, so -50% is exactly one period and the loop is seamless.
  // Without motion there is no loop, and the second copy would list every vocabulary twice.
  return (
    <ul className={`m-0 flex list-none gap-2 p-0 pr-2 ${hidden ? 'motion-reduce:hidden' : ''}`} aria-hidden={hidden}>
      {VOCABULARIES.map((name) => {
        const lit = LIT_VOCABULARIES.has(name);
        const values = VOCABULARY_VALUES[name] ?? [];
        // Some vocabularies ship empty, for each organisation to fill in (its responder teams).
        const shown = values.length ? values : ['yours to define'];
        return (
          <li
            key={name}
            tabIndex={hidden ? undefined : 0}
            aria-label={hidden ? undefined : `${name}: ${shown.join(', ')}`}
            className="landing-vocab relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
            <span
              className={`landing-vocab-name block rounded-full border px-3 py-1 font-mono text-xs ${
                lit
                  ? 'border-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--landing-accent)_8%,var(--landing-bg))] text-[var(--landing-accent)]'
                  : 'border-[var(--landing-border)] bg-[var(--landing-bg)] text-[var(--landing-subtle)]'
              }`}
            >
              {name}
            </span>
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
              {placements(shown).map(({ value, x, y }, i) => (
                <span
                  key={value}
                  className={`landing-vocab-value ${values.length ? '' : 'landing-vocab-value-open'}`}
                  style={{ '--i': i, '--x': `${x}px`, '--y': `${y}px` } as CSSProperties}
                >
                  {value}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The taxonomy: every versioned vocabulary, drifting past. The list is the spec's, not
 * decoration. Hover or focus one and the ribbon stops while its values pop out around it.
 */
export function TaxonomyRibbon() {
  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="font-mono text-xs text-[var(--landing-subtle)]">the taxonomy</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
          {VOCABULARIES.length} versioned vocabularies keep every value comparable.
        </p>
        <p className="mt-2 font-mono text-[11px] text-[var(--landing-subtle)]">hover one to see its values</p>
      </div>
      {/* Room above and below for the values, taken from the neighbours without moving them: the
          strip lets the pointer through everywhere but on its chips. */}
      <div
        className="landing-ribbon landing-fade-x pointer-events-none -my-24 overflow-hidden py-24 motion-reduce:pointer-events-auto motion-reduce:overflow-x-auto"
        aria-label="Vocabularies in the specification"
      >
        {/* Two copies make the loop; the second is decoration for assistive tech. */}
        <div className="landing-marquee flex w-max *:pointer-events-auto">
          <Chips />
          <Chips hidden />
        </div>
      </div>
    </div>
  );
}
