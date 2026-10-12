import { AGENT_NEEDS as NEEDS } from '@/lib/landing/agent-needs';

/** What an agent needs from detection tooling, then and now. */
export function AgentNeeds() {
  return (
    <div>
      {/* Narrow screens: one stacked row per need, so the answer column never scrolls away. */}
      <ol className="m-0 list-none p-0 md:hidden">
        {NEEDS.map((row, i) => (
          <li key={row.need} className="border-t border-[var(--landing-border)] py-5">
            <p className="font-semibold text-[var(--landing-ink)]">
              <span className="mr-3 font-mono text-xs font-normal text-[var(--landing-accent)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              {row.need}
            </p>
            <p className="mt-2 text-sm text-[var(--landing-subtle)]">
              <span className="font-mono text-xs">submodule era · </span>
              {row.before}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--landing-ink)]">
              <span className="font-mono text-xs font-normal text-[var(--landing-accent)]">opentide · </span>
              {row.now}
            </p>
          </li>
        ))}
      </ol>
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">What an agent needs, in the submodule era and with the opentide package</caption>
        <thead>
          <tr className="font-mono text-xs text-[var(--landing-subtle)]">
            <th scope="col" className="w-[30%] pb-3 pr-6 font-normal">
              what an agent needs
            </th>
            <th scope="col" className="w-[30%] pb-3 pr-6 font-normal">
              submodule era
            </th>
            <th scope="col" className="pb-3 font-normal text-[var(--landing-accent)]">
              opentide package
            </th>
          </tr>
        </thead>
        <tbody>
          {NEEDS.map((row, i) => (
            <tr key={row.need} className="border-t border-[var(--landing-border)] align-top">
              <th scope="row" className="py-4 pr-6 font-semibold text-[var(--landing-ink)]">
                <span className="mr-3 font-mono text-xs font-normal text-[var(--landing-accent)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {row.need}
              </th>
              <td className="py-4 pr-6 text-[var(--landing-subtle)]">{row.before}</td>
              <td className="py-4 font-medium text-[var(--landing-ink)]">{row.now}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-8 text-xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
        A submodule gave agents scripts to run.{' '}
        <span className="text-[var(--landing-accent)]">A package gives them a spec to follow.</span>
      </p>
    </div>
  );
}
