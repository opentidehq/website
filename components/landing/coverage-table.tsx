const ROWS = [
  ['Granularity', 'technique', 'atomic threat vector'],
  ['Context', 'generic', 'surface and terrain'],
  ['Impact', 'implicit', 'severity · impact · leverage · viability'],
  ['Chaining', 'none', 'threat → threat attack paths'],
  ['Intel link', 'manual', 'actors, sightings, references'],
  ['Detection', 'separate', 'objective → signals → rules'],
] as const;

/** Heatmap vs graph: the dimensions a technique heatmap cannot express. */
export function CoverageTable() {
  return (
    <div>
      {/* Narrow screens: heatmap → graph per dimension, stacked. */}
      <dl className="m-0 md:hidden">
        {ROWS.map(([dimension, heatmap, graph]) => (
          <div key={dimension} className="border-t border-[var(--landing-border)] py-3">
            <dt className="font-semibold text-[var(--landing-ink)]">{dimension}</dt>
            <dd className="m-0 mt-1 text-sm">
              <span className="text-[var(--landing-subtle)]">{heatmap}</span>
              <span className="mx-2 text-[var(--landing-accent)]" aria-hidden>
                →
              </span>
              <span className="sr-only"> in a heatmap, and in the opentide graph: </span>
              <span className="font-medium text-[var(--landing-ink)]">{graph}</span>
            </dd>
          </div>
        ))}
      </dl>
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">ATT&amp;CK heatmap compared with the opentide graph</caption>
        <thead>
          <tr className="font-mono text-xs text-[var(--landing-subtle)]">
            <th scope="col" className="pb-3 pr-4 font-normal">
              dimension
            </th>
            <th scope="col" className="pb-3 pr-4 font-normal">
              att&amp;ck heatmap
            </th>
            <th scope="col" className="pb-3 font-normal text-[var(--landing-accent)]">
              opentide graph
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([dimension, heatmap, graph]) => (
            <tr key={dimension} className="border-t border-[var(--landing-border)]">
              <th scope="row" className="py-3 pr-4 font-semibold text-[var(--landing-ink)]">
                {dimension}
              </th>
              <td className="py-3 pr-4 text-[var(--landing-subtle)]">{heatmap}</td>
              <td className="py-3 font-medium text-[var(--landing-ink)]">{graph}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
