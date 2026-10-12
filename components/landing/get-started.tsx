'use client';

import Link from 'next/link';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CodePanel, tok } from '@/components/landing/code-panel';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

/**
 * Commands and the result line each one prints, as run against opentide 0.12 in an empty
 * folder, and the tree entries each one leaves behind.
 */
const STEPS = [
  { note: 'opentide, with the MCP server extra', cmd: "pip install 'opentide[mcp]'", ok: null, adds: [] },
  {
    note: 'a detection repo: Sentinel, GitHub CI',
    cmd: 'opentide setup --yes --platform sentinel --ci github',
    ok: 'Setup complete',
    adds: [0, 1, 2, 3],
  },
  {
    note: 'wire your agent: writes .mcp.json',
    cmd: 'opentide setup mcp --claude-code --yes',
    ok: 'MCP configuration generated',
    adds: [4],
  },
  {
    note: 'give it the authoring skill',
    cmd: 'opentide setup skills --claude-code --yes --install opentide-detection-rule',
    ok: 'Agent skills installed',
    adds: [5, 6],
  },
  {
    note: 'the same strict gate your CI runs',
    cmd: 'opentide validate --strict',
    ok: 'Validation passed, but no detection objects were found under ~/detection-repo',
    adds: [],
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

const TYPE_MS = 18;
const RUN_MS = 520;

/**
 * From an empty folder to a validated detection repo. The first render, and so the static HTML,
 * is the finished session; it replays once as it approaches the viewport.
 */
export function GetStarted() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen, seen } = useOnScreen<HTMLDivElement>({ rootMargin: '25% 0px' });
  // `step` commands are finished; `chars` of the next one are typed.
  const [step, setStep] = useState<number>(STEPS.length);
  const [chars, setChars] = useState(0);
  const [started, setStarted] = useState(false);
  if (seen && !started && !reduced) {
    setStarted(true);
    setStep(0);
  }

  const done = reduced || step >= STEPS.length;

  useEffect(() => {
    if (reduced || !onScreen || step >= STEPS.length) return;
    const cmd = STEPS[step].cmd;
    if (chars < cmd.length) {
      const stride = Math.max(1, Math.ceil(cmd.length / 34));
      const id = window.setTimeout(() => setChars((c) => Math.min(cmd.length, c + stride)), TYPE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setStep((s) => s + 1);
      setChars(0);
    }, RUN_MS);
    return () => window.clearTimeout(id);
  }, [reduced, onScreen, step, chars]);

  const finished = done ? STEPS.length : step;
  const grown = new Set<number>(STEPS.slice(0, finished).flatMap((s) => [...s.adds]));

  return (
    <div ref={ref} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
      <CodePanel
        caption="a new detection repo"
        className="shadow-[0_24px_60px_-30px_var(--landing-btn-shadow)]"
        aside={
          <>
            python 3.10–3.14
            {/* Stays mounted while it replays, so a keyboard press keeps focus where it was. */}
            {started && (
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setChars(0);
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-white/10 hover:text-[var(--landing-code-ink)]"
              >
                <RotateCcw className="size-3" aria-hidden />
                replay
              </button>
            )}
          </>
        }
      >
        <span className="block min-h-[22rem]">
          {STEPS.map((s, i) => {
            if (!done && i > step) return null;
            const current = !done && i === step;
            return (
              <span key={s.cmd} className="block">
                {i > 0 && '\n'}
                {tok.dim(`# ${s.note}`)}
                {'\n'}
                {tok.dim('$ ')}
                {current ? s.cmd.slice(0, chars) : s.cmd}
                {current && (
                  <span className="landing-caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--landing-code-ink)]" />
                )}
                {!current && s.ok && (
                  <>
                    {'\n'}
                    {tok.ok('OK')} {s.ok}
                  </>
                )}
              </span>
            );
          })}
        </span>
      </CodePanel>

      <div className="flex min-w-0 flex-col">
        <div className="landing-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs text-[var(--landing-subtle)]">what you get</p>
            <span
              className={`inline-flex items-center gap-1 font-mono text-[11px] transition-opacity duration-500 ${
                done ? 'text-[var(--landing-accent)] opacity-100' : 'opacity-0'
              }`}
            >
              <Check className="size-3" aria-hidden />
              validated
            </span>
          </div>
          <ul className="mt-4 list-none space-y-2 p-0 font-mono text-[13px]">
            {TREE.map(([path, note], i) => {
              const on = grown.has(i);
              return (
                <li
                  key={path}
                  className={`flex flex-wrap gap-x-3 transition-[opacity,translate] duration-500 ${
                    on ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-15'
                  }`}
                >
                  <span className="text-[var(--landing-ink)] [overflow-wrap:anywhere]">{path}</span>
                  {note && <span className="text-[var(--landing-subtle)]">{note}</span>}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-6 text-base leading-relaxed text-[var(--landing-muted)] text-pretty">
          Generated pipelines install the exact opentide version you ran setup with, so upgrades
          arrive as a diff you review.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/docs/usage/quickstart/" className="landing-btn-primary group">
            Quickstart
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link href="/docs/usage/tutorial/" className="landing-btn-secondary">
            Follow the tutorial
          </Link>
        </div>
      </div>
    </div>
  );
}
