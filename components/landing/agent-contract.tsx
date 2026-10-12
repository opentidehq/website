const NEEDS = [
  {
    need: 'A contract it can read',
    before: 'JSON Schemas generated in-tree; no separate spec',
    now: 'Normative specs, generated JSON Schema, 36 versioned vocabularies',
  },
  {
    need: 'Feedback it can act on',
    before: 'Scripts and logs to interpret',
    now: '--json results, exit codes, file:line findings',
  },
  {
    need: 'Tools it can call',
    before: 'None: shell out to scripts',
    now: 'MCP: search, chaining, coverage, validation, dry-run deploy',
  },
  {
    need: 'Knowledge it can load',
    before: 'One AGENTS.md in a separate repo',
    now: 'Agent skills and AGENTS.md, installed by opentide setup skills',
  },
  {
    need: 'Gates it cannot skip',
    before: 'CI glue rewritten per instance',
    now: 'setup ci: strict validate and lint, live query checks, staging first',
  },
] as const;

const RULES = [
  { title: 'One JSON document on stdout', body: '"ok": true or false, a status, a message. Nothing else.' },
  { title: 'Diagnostics on stderr', body: 'Logs never prefix or corrupt the document.' },
  { title: 'Exit codes gate CI', body: '0 success · 1 error · 2 usage. No parsing needed.' },
  { title: 'Explicit by design', body: 'An unsupported check fails with a reason CI can gate on.' },
] as const;

/** What an agent needs from a detection engine, then and now. */
export function AgentNeeds() {
  return (
    <div className="mt-12">
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
      <p className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)] text-balance">
        A submodule gave agents scripts to run.{' '}
        <span className="text-[var(--landing-accent)]">A package gives them a spec to follow.</span>
      </p>
    </div>
  );
}

/** The CLI is the agent's API: one JSON document, diagnostics on stderr, exit codes CI can gate on. */
export function CliContract() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
      <figure className="m-0 overflow-hidden rounded-2xl bg-[#000b1f] text-[13px] text-[#e8f0ff] ring-1 ring-[var(--landing-border)]">
        <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] text-[#8fa8d4]">
          <span>zsh · detection-repo</span>
          <span>--json</span>
        </figcaption>
        <pre className="landing-code-scroll m-0 overflow-x-auto px-4 py-4 font-mono leading-relaxed">
          <code>
            <span className="text-[#8fa8d4]">$ </span>opentide <span className="text-[#7ec8e3]">--json</span> validate
            query <span className="text-[#7ec8e3]">--platform</span> crowdstrike{'\n'}
            {'{\n'}
            {'  '}
            <span className="text-[#7ec8e3]">&quot;platform&quot;</span>: &quot;crowdstrike&quot;,{'\n'}
            {'  '}
            <span className="text-[#7ec8e3]">&quot;valid&quot;</span>: null,{'\n'}
            {'  '}
            <span className="rounded bg-[#ffcc00]/15 px-1 text-[#ffe566]">&quot;supported&quot;: false</span>,{'\n'}
            {'  '}
            <span className="text-[#7ec8e3]">&quot;ok&quot;</span>: false,{'\n'}
            {'  '}
            <span className="text-[#7ec8e3]">&quot;status&quot;</span>: &quot;failed&quot;,{'\n'}
            {'  '}
            <span className="text-[#7ec8e3]">&quot;message&quot;</span>: &quot;query validation not supported for
            crowdstrike&quot;{'\n'}
            {'}\n'}
            <span className="text-[#8fa8d4]">$ </span>echo $?{'\n'}1
          </code>
        </pre>
      </figure>

      <dl className="m-0 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        {RULES.map((rule) => (
          <div key={rule.title} className="border-l-2 border-[var(--landing-accent)] pl-4">
            <dt className="font-semibold text-[var(--landing-ink)]">{rule.title}</dt>
            <dd className="m-0 mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">{rule.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
