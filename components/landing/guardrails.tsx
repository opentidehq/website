import { Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

const code = (text: string) => <code className="font-mono text-[0.85em] text-[var(--landing-ink)]">{text}</code>;

const AGENTS: ReactNode[] = [
  'Search, read and summarise objects and coverage',
  'Draft objects from templates',
  <>Run {code('validation_report')} and surface concrete errors</>,
  'Fix dangling references and vocabulary violations',
  <>Preview deploys with {code('dry_run=true')}</>,
];

const HUMANS: ReactNode[] = [
  'Real, non-dry-run deploys to production',
  <>Bulk promotion to {code('PRODUCTION')}</>,
  <>Credentials and deployment plans in {code('.opentide/configurations/')}</>,
  'Trusting a query check that did not run against the tenant',
  'Regenerating or hand-editing UUIDs',
];

type Status = 'ok' | 'gated' | 'off';

const TOOLS: { tools: string; note?: string; status: string; tone: Status }[] = [
  { tools: 'search · get_chaining · coverage', status: 'supported', tone: 'ok' },
  { tools: 'validate_rule · validation_report', status: 'supported', tone: 'ok' },
  { tools: 'deploy_rule', note: 'returns action: dry-run', status: 'dry-run by default', tone: 'gated' },
  { tools: 'validate_query', note: 'then checks the tenant', status: 'only with live: true', tone: 'gated' },
  { tools: 'run_query', note: 'stub: true · rows: null', status: 'not implemented', tone: 'off' },
  { tools: 'crowdstrike · harfanglab', note: 'query checks', status: 'supported: false', tone: 'off' },
];

const TONE: Record<Status, string> = {
  ok: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  gated: 'bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)]',
  off: 'bg-red-600/10 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

function List({ title, items, icon }: { title: string; items: ReactNode[]; icon: 'agent' | 'human' }) {
  return (
    <div>
      <p className="text-lg font-semibold tracking-[-0.01em] text-[var(--landing-ink)]">{title}</p>
      <ul className="mt-4 list-none space-y-3 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--landing-muted)]">
            {icon === 'agent' ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            ) : (
              <Lock className="mt-0.5 size-4 shrink-0 text-[var(--landing-ink)]" aria-hidden />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Where the line sits between agents and people, and what the MCP tools actually return. */
export function Guardrails() {
  return (
    <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <h3 className="text-2xl font-bold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
          What agents may do, and what stays human.
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <List title="Let agents" items={AGENTS} icon="agent" />
          <List title="Keep a human in the loop" items={HUMANS} icon="human" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
          Agents build on what the gates return.
        </h3>
        <table className="mt-8 w-full border-collapse text-left text-sm">
          <caption className="sr-only">opentide MCP tools and how each one behaves</caption>
          <thead>
            <tr className="font-mono text-xs text-[var(--landing-subtle)]">
              <th scope="col" className="pb-3 pr-4 font-normal">
                mcp tool
              </th>
              <th scope="col" className="pb-3 font-normal">
                status
              </th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((row) => (
              <tr key={row.tools} className="border-t border-[var(--landing-border)] align-top">
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="font-mono text-[13px] text-[var(--landing-ink)]">{row.tools}</span>
                  {row.note && (
                    <span className="mt-0.5 block font-mono text-[11px] text-[var(--landing-subtle)]">{row.note}</span>
                  )}
                </th>
                <td className="py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] sm:whitespace-nowrap ${TONE[row.tone]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-base font-semibold text-[var(--landing-ink)]">
          Strict gates keep agent output{' '}
          <span className="text-[var(--landing-accent)]">threat-aligned and shippable.</span>
        </p>
      </div>
    </div>
  );
}
