'use client';

import { Bot, Brain, ChevronRight, Terminal } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type Phase = 'edit' | 'validate' | 'generate' | 'deploy';

const phases: Phase[] = ['edit', 'validate', 'generate', 'deploy'];

const scripts: Record<
  Phase,
  {
    file: string;
    ideLines: { n: number; parts: { t: string; c?: string }[] }[];
    cmd: string;
    out: string[];
    agent: { thought: string; tool: string; result: string }[];
  }
> = {
  edit: {
    file: 'objects/rules/credential-dump.yaml',
    ideLines: [
      { n: 1, parts: [{ t: 'name: ', c: 'text-zinc-500' }, { t: '"Suspicious LSASS access"', c: 'text-amber-200/90' }] },
      { n: 2, parts: [{ t: 'metadata:', c: 'text-[var(--eu-yellow)]' }] },
      { n: 3, parts: [{ t: '  schema: ', c: 'text-zinc-500' }, { t: 'rule::1.0', c: 'text-sky-300/80' }] },
      { n: 4, parts: [{ t: '  version: ', c: 'text-zinc-500' }, { t: '1.2.0', c: 'text-emerald-400/90' }] },
      { n: 5, parts: [{ t: 'chains_to:', c: 'text-[var(--eu-yellow)]' }] },
      { n: 6, parts: [{ t: '  objective: a1b2c3d4-…', c: 'text-zinc-400' }] },
      { n: 7, parts: [{ t: 'platforms:', c: 'text-[var(--eu-yellow)]' }] },
      { n: 8, parts: [{ t: '  sentinel:', c: 'text-zinc-400' }] },
    ],
    cmd: 'opentide validate objects/rules/credential-dump.yaml',
    out: ['✓ schema rule::1.0', '✓ chains_to reference valid', '0 errors'],
    agent: [
      {
        thought: 'User asked to extend LSASS rule for ScreenConnect chain. Need objective UUID from credential-access.',
        tool: 'search_objects(type="objective", name~"credential")',
        result: '→ 1 match · uuid a1b2c3d4-…',
      },
      {
        thought: 'Draft rule::1.0 with chains_to and sentinel KQL stub.',
        tool: 'write_file(objects/rules/credential-dump.yaml)',
        result: '→ 8 lines written · awaiting validate',
      },
    ],
  },
  validate: {
    file: 'detection-repo/',
    ideLines: [
      { n: 1, parts: [{ t: '# opentide validate --strict', c: 'text-zinc-600' }] },
      { n: 2, parts: [{ t: 'objects/rules/     ', c: 'text-zinc-500' }, { t: '142 files', c: 'text-zinc-300' }] },
      { n: 3, parts: [{ t: 'objects/objectives/', c: 'text-zinc-500' }, { t: '38 files', c: 'text-zinc-300' }] },
      { n: 4, parts: [{ t: 'objects/threats/   ', c: 'text-zinc-500' }, { t: '12 files', c: 'text-zinc-300' }] },
    ],
    cmd: 'opentide validate --strict',
    out: ['✓ 192 objects', '✓ sentinel queries honest', '✓ 0 blocking errors'],
    agent: [
      {
        thought: 'Pre-deploy gate: run strict validation across full repo before CI merge.',
        tool: 'validate(strict=true, repo=".")',
        result: '→ 192 objects · 0 blocking · 3 warnings (TLP)',
      },
    ],
  },
  generate: {
    file: '.opentide/schemas/',
    ideLines: [
      { n: 1, parts: [{ t: 'rule.1.0.schema.json', c: 'text-sky-300/80' }] },
      { n: 2, parts: [{ t: 'objective.1.0.schema.json', c: 'text-sky-300/80' }] },
      { n: 3, parts: [{ t: 'opentide.schema.json', c: 'text-[var(--eu-yellow)]' }] },
      { n: 4, parts: [{ t: 'templates/rule.1.0.template.yaml', c: 'text-zinc-400' }] },
    ],
    cmd: 'opentide generate',
    out: ['→ 3 schemas', '→ 3 templates', '→ IDE router updated'],
    agent: [
      {
        thought: 'Regenerate JSON Schema from Pydantic models after rule::1.0 bump.',
        tool: 'generate(schemas=true, templates=true)',
        result: '→ schemas + templates refreshed',
      },
    ],
  },
  deploy: {
    file: 'objects/rules/credential-dump.yaml',
    ideLines: [
      { n: 1, parts: [{ t: 'platforms:', c: 'text-[var(--eu-yellow)]' }] },
      { n: 2, parts: [{ t: '  sentinel:', c: 'text-zinc-400' }] },
      { n: 3, parts: [{ t: '    enabled: ', c: 'text-zinc-500' }, { t: 'true', c: 'text-emerald-400/90' }] },
      { n: 4, parts: [{ t: '    query: |', c: 'text-zinc-500' }] },
      { n: 5, parts: [{ t: '      DeviceProcessEvents…', c: 'text-zinc-600' }] },
    ],
    cmd: 'opentide deploy --platform sentinel --dry-run',
    out: ['✓ would deploy 38 rules', '0 blocked · 0 syntax fakes'],
    agent: [
      {
        thought: 'Human approved. Dry-run deploy to Sentinel workspace before production push.',
        tool: 'deploy(dry_run=true, platform="sentinel")',
        result: '→ 38 rules staged · 0 blocked',
      },
    ],
  },
};

const tree = [
  { name: 'objects/', open: true },
  { name: '  rules/', open: true },
  { name: '    credential-dump.yaml', active: true },
  { name: '  objectives/', open: false },
  { name: '  threats/', open: false },
  { name: '.opentide/', open: false },
];

function WindowChrome({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: typeof Terminal;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--landing-surface)] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
        {Icon && <Icon className="ml-1 size-3 text-[var(--landing-subtle)]" aria-hidden />}
        <span className="truncate font-mono text-[10px] text-[var(--landing-subtle)]">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function WorkflowStudio() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [typedCmd, setTypedCmd] = useState('');
  const [showOut, setShowOut] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursorLine, setCursorLine] = useState(0);
  const [visibleAgent, setVisibleAgent] = useState(0);

  const phase = phases[phaseIdx];
  const script = scripts[phase];

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTypedCmd('');
    setShowOut(false);
    setVisibleLines(0);
    setCursorLine(0);
    setVisibleAgent(0);

    if (reduced) {
      setTypedCmd(script.cmd);
      setShowOut(true);
      setVisibleLines(script.ideLines.length);
      setVisibleAgent(script.agent.length);
      return;
    }

    let line = 0;
    const lineTimer = window.setInterval(() => {
      line += 1;
      setVisibleLines(line);
      setCursorLine(Math.min(line, script.ideLines.length));
      if (line >= script.ideLines.length) window.clearInterval(lineTimer);
    }, 340);

    let ai = 0;
    const agentTimer = window.setInterval(() => {
      ai += 1;
      setVisibleAgent(ai);
      if (ai >= script.agent.length) window.clearInterval(agentTimer);
    }, 900);

    let ci = 0;
    const cmdTimer = window.setTimeout(() => {
      const typeTimer = window.setInterval(() => {
        ci += 1;
        setTypedCmd(script.cmd.slice(0, ci));
        if (ci >= script.cmd.length) {
          window.clearInterval(typeTimer);
          window.setTimeout(() => setShowOut(true), 350);
        }
      }, 28);
    }, 700);

    return () => {
      window.clearInterval(lineTimer);
      window.clearInterval(agentTimer);
      window.clearTimeout(cmdTimer);
    };
  }, [phase, script]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setPhaseIdx((i) => (i + 1) % phases.length);
    }, 5800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {phases.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhaseIdx(i)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] capitalize transition ${
              phaseIdx === i
                ? 'bg-[var(--eu-yellow)]/15 text-[var(--eu-yellow)] ring-1 ring-[var(--eu-yellow)]/30'
                : 'text-[var(--landing-subtle)] hover:bg-white/[0.04]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="flex flex-col gap-3">
          <WindowChrome title={script.file} className="min-h-[320px] flex-1">
            <div className="flex min-h-[280px] flex-1 text-[11px] sm:text-xs">
              <div className="w-[34%] shrink-0 border-r border-white/[0.06] bg-[var(--landing-bg)]/60 p-2 font-mono text-[10px] text-[var(--landing-subtle)]">
                {tree.map((item) => (
                  <div
                    key={item.name}
                    className={`truncate py-0.5 ${'active' in item && item.active ? 'text-[var(--eu-yellow)]' : ''}`}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-hidden p-3 font-mono leading-relaxed">
                {script.ideLines.slice(0, visibleLines).map((line, i) => (
                  <div
                    key={`${phase}-${line.n}`}
                    className={`flex gap-2 transition-opacity duration-300 ${i === cursorLine - 1 ? 'bg-white/[0.03]' : ''}`}
                  >
                    <span className="w-4 shrink-0 select-none text-right text-zinc-700">{line.n}</span>
                    <span>
                      {line.parts.map((p, j) => (
                        <span key={j} className={p.c ?? 'text-zinc-300'}>
                          {p.t}
                        </span>
                      ))}
                      {i === cursorLine - 1 && visibleLines < script.ideLines.length && (
                        <span className="ml-0.5 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)]" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-3 py-1.5 font-mono text-[9px] text-[var(--landing-subtle)]">
              UTF-8 · YAML · opentide schema assist
            </div>
          </WindowChrome>

          <WindowChrome title="zsh · detection-repo" icon={Terminal} className="max-h-[140px]">
            <div className="flex flex-col p-3 font-mono text-[10px] leading-relaxed sm:text-[11px]">
              <p className="text-[var(--landing-subtle)]">
                <span className="text-[var(--eu-yellow)]">❯</span>{' '}
                <span className="text-[var(--landing-muted)]">$ </span>
                <span className="text-[var(--landing-ink)]">{typedCmd}</span>
                {!showOut && (
                  <span className="ml-0.5 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)] align-middle" />
                )}
              </p>
              <div
                className={`mt-2 space-y-0.5 transition-all duration-500 ${showOut ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
              >
                {script.out.map((line) => (
                  <p key={line} className="text-emerald-500/90">
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-3 py-1 font-mono text-[9px] text-[var(--landing-subtle)]">
              exit 0 · 1.2s · CI-ready
            </div>
          </WindowChrome>
        </div>

        <WindowChrome title="opentide-mcp · agent trace" icon={Bot} className="min-h-[420px]">
          <div className="flex flex-1 flex-col gap-2 overflow-auto p-3">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--eu-yellow)]/20 bg-[var(--eu-yellow)]/5 px-3 py-2">
              <Brain className="size-3.5 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
              <p className="font-mono text-[10px] text-[var(--landing-muted)]">
                Phase: <span className="text-[var(--eu-yellow)]">{phase}</span> · structured tool output
              </p>
            </div>
            {script.agent.slice(0, visibleAgent).map((step, i) => (
              <div
                key={`${phase}-agent-${i}`}
                className="space-y-2 rounded-lg border border-white/[0.06] bg-[var(--landing-bg)]/50 p-3 transition-all duration-500"
              >
                <p className="font-mono text-[10px] leading-relaxed text-[var(--landing-subtle)]">
                  <span className="text-[var(--eu-yellow)]">reasoning</span> {step.thought}
                </p>
                <p className="flex items-start gap-1.5 font-mono text-[10px] text-[var(--landing-ink)]">
                  <ChevronRight className="mt-0.5 size-3 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
                  {step.tool}
                </p>
                <p className="font-mono text-[10px] text-emerald-400/85">{step.result}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] px-3 py-1.5 font-mono text-[9px] text-[var(--landing-subtle)]">
            MCP · no hallucinated pass/fail
          </div>
        </WindowChrome>
      </div>
    </div>
  );
}
