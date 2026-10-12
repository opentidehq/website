const NEEDS = [
  {
    need: 'A contract it can read',
    answer: 'Normative specs, generated JSON Schema and 36 versioned vocabularies.',
    artefact: 'objective::1.0',
  },
  {
    need: 'Feedback it can act on',
    answer: '--json results, exit codes and file:line findings.',
    artefact: 'exit 0 · 1 · 2',
  },
  {
    need: 'Tools it can call',
    answer: 'MCP search, chaining, coverage, validation and dry-run deploys.',
    artefact: 'opentide mcp start',
  },
  {
    need: 'Knowledge it can load',
    answer: 'Skills and an agent entry point, AGENTS.md or CLAUDE.md, installed for it.',
    artefact: 'opentide setup skills',
  },
  {
    need: 'Gates it cannot skip',
    answer: 'Strict validate and lint, live query checks, staging first.',
    artefact: 'opentide setup ci',
  },
] as const;

/** What an agent needs from detection tooling, and what opentide gives it, as one strip. */
export function AgentNeedsStrip() {
  return (
    <ol
      data-reveal-group
      className="landing-panel m-0 grid list-none grid-cols-1 gap-px overflow-hidden bg-[var(--landing-border)] p-0 sm:grid-cols-2 lg:grid-cols-5"
    >
      {NEEDS.map((row, i) => (
        <li key={row.need} className="flex flex-col bg-[var(--landing-panel)] p-6 sm:last:col-span-2 lg:last:col-span-1">
          <span className="font-mono text-xs text-[var(--landing-accent)]">{String(i + 1).padStart(2, '0')}</span>
          <p className="mt-3 font-semibold leading-snug text-[var(--landing-ink)]">{row.need}</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--landing-muted)]">{row.answer}</p>
          <code className="mt-5 self-start rounded-md bg-[color-mix(in_srgb,var(--landing-ink)_5%,transparent)] px-2 py-1 font-mono text-xs text-[var(--landing-ink)]">
            {row.artefact}
          </code>
        </li>
      ))}
    </ol>
  );
}
