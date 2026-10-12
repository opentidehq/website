'use client';

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { LIT_VOCABULARIES, VOCABULARIES } from '@/lib/landing/vocabularies';

function Chips({ hidden }: { hidden?: boolean }) {
  // Each copy carries its own trailing gap, so -50% is exactly one period and the loop is seamless.
  return (
    <ul className="m-0 flex list-none gap-2 p-0 pr-2" aria-hidden={hidden}>
      {VOCABULARIES.map((name) => {
        const lit = LIT_VOCABULARIES.has(name);
        return (
          <li
            key={name}
            className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs ${
              lit
                ? 'border-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--landing-accent)_8%,transparent)] text-[var(--landing-accent)]'
                : 'border-[var(--landing-border)] text-[var(--landing-subtle)]'
            }`}
          >
            {name}
          </li>
        );
      })}
    </ul>
  );
}

/** The taxonomy: every versioned vocabulary, drifting past. The list is the spec's, not decoration. */
export function TaxonomyRibbon() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="font-mono text-xs text-[var(--landing-subtle)]">the taxonomy</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
          {VOCABULARIES.length} versioned vocabularies keep every value comparable.
        </p>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full py-1 font-mono text-[11px] text-[var(--landing-subtle)] transition hover:text-[var(--landing-ink)] motion-reduce:hidden"
        >
          {paused ? <Play className="size-3 fill-current" aria-hidden /> : <Pause className="size-3 fill-current" aria-hidden />}
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
      <div className="landing-fade-x overflow-hidden motion-reduce:overflow-x-auto" aria-label="Vocabularies in the specification">
        {/* Two copies make the loop; the second is decoration for assistive tech. */}
        {/* Inline, because the marquee's animation shorthand would reset a utility's play state. */}
        <div className="landing-marquee flex w-max" style={paused ? { animationPlayState: 'paused' } : undefined}>
          <Chips />
          <Chips hidden />
        </div>
      </div>
    </div>
  );
}
