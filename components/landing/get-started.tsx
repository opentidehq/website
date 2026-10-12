import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** Commands and the result line each one prints, as run against opentide 0.12 in an empty folder. */
const STEPS = [
  { note: 'the engine, with the MCP server extra', cmd: "pip install 'opentide[mcp]'", ok: null },
  {
    note: 'a detection repo: Sentinel, GitHub CI',
    cmd: 'opentide setup --yes --platform sentinel --ci github',
    ok: 'Setup complete',
  },
  { note: 'wire your agent: writes .mcp.json', cmd: 'opentide setup mcp --claude-code --yes', ok: 'MCP configuration generated' },
  {
    note: 'give it the authoring skill',
    cmd: 'opentide setup skills --claude-code --yes --install opentide-detection-rule',
    ok: 'Agent skills installed',
  },
  { note: 'the same strict gate your CI runs', cmd: 'opentide validate --strict', ok: 'Validation passed' },
] as const;

const TREE: [string, string][] = [
  ['detection-repo/', ''],
  ['├── objects/', 'threats/ objectives/ rules/'],
  ['├── .opentide/configurations/platforms/', 'sentinel.toml'],
  ['├── .github/workflows/opentide.yml', 'validate · lint · deploy'],
  ['├── .mcp.json', 'runs opentide mcp start'],
  ['├── CLAUDE.md', "the agent's entry point"],
  ['└── .claude/skills/', 'opentide-detection-rule/'],
];

/** From an empty folder to a validated detection repo with an agent wired in. */
export function GetStarted() {
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
      <figure className="m-0 overflow-hidden rounded-2xl bg-[#000b1f] text-[#e8f0ff] ring-1 ring-[var(--landing-border)]">
        <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] text-[#8fa8d4]">
          <span>a new detection repo</span>
          <span>python 3.10 – 3.14</span>
        </figcaption>
        <pre className="landing-code-scroll m-0 overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.7]">
          <code>
            {STEPS.map((step, i) => (
              <span key={step.cmd}>
                {i > 0 && '\n'}
                <span className="text-[#8fa8d4]"># {step.note}</span>
                {'\n'}
                <span className="text-[#8fa8d4]">$ </span>
                {step.cmd}
                {step.ok && (
                  <>
                    {'\n'}
                    <span className="text-emerald-300">OK</span> {step.ok}
                  </>
                )}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      </figure>

      <div className="flex flex-col">
        <div className="rounded-2xl border border-[var(--landing-border)] p-5">
          <p className="font-mono text-xs text-[var(--landing-subtle)]">what you get</p>
          <ul className="mt-3 list-none space-y-1.5 p-0 font-mono text-[12.5px]">
            {TREE.map(([path, note]) => (
              <li key={path} className="flex flex-wrap gap-x-3">
                <span className="text-[var(--landing-ink)]">{path}</span>
                {note && <span className="text-[var(--landing-subtle)]">{note}</span>}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">
          Generated pipelines install the exact opentide version you ran setup with, so upgrades
          arrive as a diff you review. Coming from CoreTide or InitTide? The migration guide replaces
          the submodule with the package, step by step.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/docs/usage/quickstart/" className="landing-btn-primary group">
            Quickstart
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link href="/docs/usage/migration/" className="landing-btn-secondary">
            Migrate from CoreTide
          </Link>
        </div>
      </div>
    </div>
  );
}
