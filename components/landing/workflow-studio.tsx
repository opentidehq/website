'use client';

import { Bot, ChevronRight, Files, Terminal } from 'lucide-react';
import { parseDiffFromFile } from '@pierre/diffs';
import { File, FileDiff } from '@pierre/diffs/react';
import { FileTree, useFileTree, useFileTreeSelector } from '@pierre/trees/react';
import { useEffect, useMemo, useState } from 'react';
import {
  CREDENTIAL_DUMP_PREVIOUS,
  DEMO_FILES,
  DEMO_PATHS,
  DEMO_REPO,
  type DemoPath,
} from '@/lib/landing/demo-registry';

type Phase = 'edit' | 'validate' | 'generate' | 'deploy';
type BottomTab = 'terminal' | 'agent';

const phases: Phase[] = ['edit', 'validate', 'generate', 'deploy'];

const phaseFile: Record<Phase, DemoPath> = {
  edit: 'objects/rules/credential-dump.yaml',
  validate: 'objects/rules/credential-dump.yaml',
  generate: '.opentide/schemas/rule.1.0.schema.json',
  deploy: 'objects/rules/credential-dump.yaml',
};

const phaseScripts: Record<
  Phase,
  { cmd: string; out: string[]; agent: { thought: string; tool: string; result: string }[] }
> = {
  edit: {
    cmd: 'opentide validate objects/rules/credential-dump.yaml',
    out: ['✓ schema rule::1.0', '✓ chains_to valid', '0 errors'],
    agent: [
      {
        thought: 'Extend LSASS rule for ScreenConnect chain — resolve objective UUID first.',
        tool: 'search_objects(type="objective", name~"credential")',
        result: '1 match · a1b2c3d4-…',
      },
      {
        thought: 'Draft rule::1.0 with chains_to and sentinel KQL.',
        tool: 'write_file(objects/rules/credential-dump.yaml)',
        result: 'saved · awaiting validate',
      },
    ],
  },
  validate: {
    cmd: 'opentide validate --strict',
    out: ['✓ 192 objects', '✓ sentinel queries honest', '✓ 0 blocking errors'],
    agent: [
      {
        thought: 'Strict validation across registry before merge.',
        tool: 'validate(strict=true)',
        result: '192 objects · 0 blocking',
      },
    ],
  },
  generate: {
    cmd: 'opentide generate',
    out: ['→ schemas refreshed', '→ templates updated'],
    agent: [
      {
        thought: 'Regenerate JSON Schema after rule::1.0 model bump.',
        tool: 'generate(schemas=true, templates=true)',
        result: 'artifacts written to .opentide/',
      },
    ],
  },
  deploy: {
    cmd: 'opentide deploy --platform sentinel --dry-run',
    out: ['✓ would deploy 38 rules', '0 blocked'],
    agent: [
      {
        thought: 'Human approved — dry-run deploy to Sentinel workspace.',
        tool: 'deploy(dry_run=true, platform="sentinel")',
        result: '38 rules staged · 0 blocked',
      },
    ],
  },
};

const codeOptions = {
  theme: { dark: 'pierre-dark', light: 'pierre-dark' } as const,
  disableFileHeader: true,
  overflow: 'scroll' as const,
};

function EditorPane({ phase, path }: { phase: Phase; path: DemoPath }) {
  const contents = DEMO_FILES[path];
  const file = useMemo(
    () => ({ name: path.split('/').pop() ?? path, contents, cacheKey: `${path}-${phase}` }),
    [path, contents, phase],
  );

  if (phase === 'deploy' && path === 'objects/rules/credential-dump.yaml') {
    const fileDiff = parseDiffFromFile(
      {
        name: 'credential-dump.yaml',
        contents: CREDENTIAL_DUMP_PREVIOUS,
        cacheKey: 'cred-old',
      },
      {
        name: 'credential-dump.yaml',
        contents,
        cacheKey: 'cred-new',
      },
    );
    return <FileDiff fileDiff={fileDiff} options={codeOptions} disableWorkerPool className="h-full min-h-0" />;
  }

  return <File file={file} options={codeOptions} disableWorkerPool className="h-full min-h-0" />;
}

export function WorkflowStudio() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [typedCmd, setTypedCmd] = useState('');
  const [showOut, setShowOut] = useState(false);
  const [visibleAgent, setVisibleAgent] = useState(0);

  const phase = phases[phaseIdx];
  const script = phaseScripts[phase];
  const autoPath = phaseFile[phase];

  const { model } = useFileTree({
    paths: [...DEMO_PATHS],
    initialExpansion: 'open',
    initialExpandedPaths: ['objects', 'objects/rules', 'objects/objectives', 'objects/threats', '.opentide'],
    initialSelectedPaths: [autoPath],
  });

  const selectedPaths = useFileTreeSelector(model, (m) => m.getSelectedPaths(), (a, b) =>
    a.length === b.length && a.every((p, i) => p === b[i]),
  );

  const activePath = (selectedPaths[0] as DemoPath | undefined) ?? autoPath;
  const activeFile = DEMO_FILES[activePath] ? activePath : autoPath;

  useEffect(() => {
    model.getItem(autoPath)?.select();
    model.focusPath(autoPath);
  }, [autoPath, model]);

  useEffect(() => {
    setTypedCmd('');
    setShowOut(false);
    setVisibleAgent(0);
    setBottomTab('agent');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTypedCmd(script.cmd);
      setShowOut(true);
      setVisibleAgent(script.agent.length);
      return;
    }

    let ci = 0;
    let ai = 0;
    const typeTimer = window.setInterval(() => {
      ci += 1;
      setTypedCmd(script.cmd.slice(0, ci));
      if (ci >= script.cmd.length) window.clearInterval(typeTimer);
    }, 22);

    const outTimer = window.setTimeout(() => setShowOut(true), 900);

    const agentTimer = window.setInterval(() => {
      ai += 1;
      setVisibleAgent(ai);
      if (ai >= script.agent.length) window.clearInterval(agentTimer);
    }, 750);

    return () => {
      window.clearInterval(typeTimer);
      window.clearTimeout(outTimer);
      window.clearInterval(agentTimer);
    };
  }, [phase, script]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => setPhaseIdx((i) => (i + 1) % phases.length), 7000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
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

        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--landing-surface)] shadow-[0_12px_48px_-16px_rgba(0,0,0,0.85)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[var(--landing-bg)]/80 px-3 py-2">
            <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
            <span className="ml-2 truncate font-mono text-[11px] text-[var(--landing-muted)]">
              {DEMO_REPO} — {activeFile}
            </span>
          </div>

          <div className="grid min-h-[min(68vh,560px)] grid-rows-[1fr_auto]">
            <div className="grid min-h-0 lg:grid-cols-[44px_200px_1fr_minmax(220px,0.42fr)]">
              {/* Activity bar */}
              <div className="hidden flex-col items-center gap-3 border-r border-white/[0.06] bg-[var(--landing-bg)] py-3 lg:flex">
                <Files className="size-4 text-[var(--eu-yellow)]" aria-hidden />
                <Bot className="size-4 text-[var(--landing-subtle)]" aria-hidden />
                <Terminal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
              </div>

              {/* Explorer */}
              <div className="hidden min-h-0 border-r border-white/[0.06] bg-[var(--landing-bg)]/50 lg:block">
                <p className="border-b border-white/[0.06] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-subtle)]">
                  Explorer
                </p>
                <FileTree model={model} className="h-[calc(100%-2rem)] min-h-[280px] text-xs" />
              </div>

              {/* Editor */}
              <div className="flex min-h-[280px] min-w-0 flex-col border-r border-white/[0.06] bg-[var(--landing-bg)]">
                <div className="flex items-center gap-1 border-b border-white/[0.06] px-2">
                  <span className="border-b border-[var(--eu-yellow)] px-2 py-1.5 font-mono text-[10px] text-[var(--landing-ink)]">
                    {activeFile.split('/').pop()}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-1">
                  <EditorPane phase={phase} path={activeFile} />
                </div>
              </div>

              {/* Agent — Cursor-style side panel */}
              <div className="flex min-h-[200px] flex-col bg-[var(--landing-surface-deep)] lg:min-h-0">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                  <Bot className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
                  <span className="font-mono text-[10px] text-[var(--landing-muted)]">opentide-mcp</span>
                  <span className="ml-auto rounded bg-[var(--eu-yellow)]/10 px-1.5 py-0.5 font-mono text-[9px] text-[var(--eu-yellow)]">
                    {phase}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-auto p-3">
                  {script.agent.slice(0, visibleAgent).map((step, i) => (
                    <div
                      key={`${phase}-${i}`}
                      className="rounded-lg border border-white/[0.06] bg-[var(--landing-bg)]/60 p-2.5"
                    >
                      <p className="font-mono text-[10px] leading-relaxed text-[var(--landing-subtle)]">
                        <span className="text-[var(--eu-yellow)]">reasoning · </span>
                        {step.thought}
                      </p>
                      <p className="mt-1.5 flex items-start gap-1 font-mono text-[10px] text-[var(--landing-ink)]">
                        <ChevronRight className="mt-0.5 size-3 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
                        {step.tool}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-emerald-400/85">{step.result}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom panel — terminal */}
            <div className="border-t border-white/[0.06] bg-[var(--landing-bg)]">
              <div className="flex gap-4 border-b border-white/[0.06] px-3">
                {(['terminal', 'agent'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBottomTab(tab)}
                    className={`py-1.5 font-mono text-[10px] capitalize ${
                      bottomTab === tab
                        ? 'border-b border-[var(--eu-yellow)] text-[var(--landing-ink)]'
                        : 'text-[var(--landing-subtle)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="max-h-[108px] overflow-auto px-3 py-2 font-mono text-[10px] leading-relaxed sm:text-[11px]">
                {bottomTab === 'terminal' ? (
                  <>
                    <p>
                      <span className="text-[var(--eu-yellow)]">❯</span>{' '}
                      <span className="text-[var(--landing-muted)]">$ </span>
                      <span className="text-[var(--landing-ink)]">{typedCmd}</span>
                      {!showOut && (
                        <span className="ml-0.5 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)] align-middle" />
                      )}
                    </p>
                    {showOut && (
                      <div className="mt-1 space-y-0.5">
                        {script.out.map((line) => (
                          <p key={line} className="text-emerald-500/90">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[var(--landing-subtle)]">
                    Agent trace mirrored in the side panel — structured MCP tool output for {phase}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
