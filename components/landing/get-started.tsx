import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CodePanel, tok } from '@/components/landing/code-panel';

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
  {
    note: 'the same strict gate your CI runs',
    cmd: 'opentide validate --strict',
    ok: 'Validation passed, but no detection objects were found under ~/detection-repo',
  },
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
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
      <CodePanel caption="a new detection repo" aside="python 3.10–3.14">
        {STEPS.map((step, i) => (
          <span key={step.cmd}>
            {i > 0 && '\n'}
            {tok.dim(`# ${step.note}`)}
            {'\n'}
            {tok.dim('$ ')}
            {step.cmd}
            {step.ok && (
              <>
                {'\n'}
                {tok.ok('OK')} {step.ok}
              </>
            )}
            {'\n'}
          </span>
        ))}
      </CodePanel>

      <div className="flex min-w-0 flex-col">
        <div className="rounded-2xl border border-[var(--landing-border)] p-5">
          <p className="font-mono text-xs text-[var(--landing-subtle)]">what you get</p>
          <ul className="mt-3 list-none space-y-1.5 p-0 font-mono text-[12.5px]">
            {TREE.map(([path, note]) => (
              <li key={path} className="flex flex-wrap gap-x-3">
                <span className="text-[var(--landing-ink)] [overflow-wrap:anywhere]">{path}</span>
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
