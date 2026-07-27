'use client';

import { Files, Bot, Terminal, FileText } from 'lucide-react';
import { File } from '@pierre/diffs/react';
import { FileTree, useFileTree, useFileTreeSelector } from '@pierre/trees/react';
import { useEffect, useMemo, useState } from 'react';
import { AgentTracePanel, type AgentEvent } from '@/components/landing/agent-trace-panel';
import { DEMO_FILES, DEMO_PATHS, DEMO_REPO, type DemoPath } from '@/lib/landing/demo-registry';

const STEPS = [
  'intel',
  'threat',
  'objective',
  'rule',
  'validate',
  'generate',
  'deploy',
] as const;

type Step = (typeof STEPS)[number];

const stepFile: Record<Step, DemoPath> = {
  intel: 'intel/advisories/cve-2024-1709.md',
  threat: 'objects/threats/gateway-exploitation.yaml',
  objective: 'objects/objectives/credential-access.yaml',
  rule: 'objects/rules/lsass-memory-access.yaml',
  validate: 'objects/rules/lsass-memory-access.yaml',
  generate: '.opentide/schemas/rule.1.0.schema.json',
  deploy: 'objects/rules/lsass-memory-access.yaml',
};

const stepLabel: Record<Step, string> = {
  intel: 'Ingest intel',
  threat: 'Draft threat',
  objective: 'Define objective',
  rule: 'Author rule',
  validate: 'Validate repo',
  generate: 'Generate schemas',
  deploy: 'Deploy dry-run',
};

const stepScripts: Record<
  Step,
  { events: AgentEvent[]; cmd: string; out: string[] }
> = {
  intel: {
    events: [
      {
        kind: 'prompt',
        text: 'Turn CISA AA24-073A into deployable Sentinel detections: strict validation, dry-run deploy.',
      },
      {
        kind: 'skill',
        skill: 'detection-engineering',
        action: 'Load TVM → DOM → MDR sequencing from advisory',
        detail: 'SKILL.md · OpenTideHQ/skills',
      },
      {
        kind: 'mcp',
        tool: 'read_file',
        input: 'intel/advisories/cve-2024-1709.md',
        output: 'parsed CVE-2024-1709 · T1190 · T1003.001',
      },
    ],
    cmd: 'opentide document --intel intel/advisories/cve-2024-1709.md',
    out: ['→ extracted T1190, T1003.001 · ready for object drafting'],
  },
  threat: {
    events: [
      {
        kind: 'reasoning',
        text: 'ScreenConnect auth bypass maps to gateway exploitation: edge terrain, High severity, ATT&CK T1190.',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/threats/gateway-exploitation.yaml',
        output: 'threat::1.0 · uuid …010 · schema valid',
      },
      {
        kind: 'cli',
        command: 'opentide validate --file objects/threats/gateway-exploitation.yaml',
        output: '✓ threat::1.0 · 0 errors',
      },
    ],
    cmd: 'opentide validate --file objects/threats/gateway-exploitation.yaml',
    out: ['✓ schema threat::1.0', '✓ att&ck techniques', '0 errors'],
  },
  objective: {
    events: [
      {
        kind: 'skill',
        skill: 'opentide-detection-rule',
        action: 'Link objective to threat UUID · define LSASS signal',
        detail: 'normative MDR object contract',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/objectives/credential-access.yaml',
        output: 'objective links threat …010 · 1 signal',
      },
    ],
    cmd: 'opentide validate --file objects/objectives/credential-access.yaml',
    out: ['✓ objective::1.0', '✓ cross-object threat reference', '0 errors'],
  },
  rule: {
    events: [
      {
        kind: 'skill',
        skill: 'microsoft-sentinel',
        action: 'KQL for DeviceProcessEvents → LSASS access',
        detail: 'honest query validation enabled',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/rules/lsass-memory-access.yaml',
        output: 'rule links objective …001 · sentinel + defender',
      },
    ],
    cmd: 'opentide validate --file objects/rules/lsass-memory-access.yaml',
    out: ['✓ rule::1.0', '✓ detection_model reference', '0 errors'],
  },
  validate: {
    events: [
      {
        kind: 'reasoning',
        text: 'Strict validation across registry: schema, UUID v4, cross-object refs, honest Sentinel KQL.',
      },
      {
        kind: 'mcp',
        tool: 'validate',
        input: 'strict=true',
        output: '8 objects · 0 blocking · sentinel KQL passed',
      },
      {
        kind: 'cli',
        command: 'opentide validate --strict',
        output: '✓ uuid-format · cross-object · id-uniqueness',
      },
    ],
    cmd: 'opentide validate --strict',
    out: ['✓ schema · uuid-format · id-uniqueness', '✓ cross-object references', '0 blocking errors'],
  },
  generate: {
    events: [
      {
        kind: 'skill',
        skill: 'github-actions',
        action: 'Align CI workflow with setup ci discovery',
        detail: 'validate query jobs per platform TOML',
      },
      {
        kind: 'mcp',
        tool: 'generate',
        output: 'schemas · templates · docs refreshed',
      },
    ],
    cmd: 'opentide generate',
    out: ['→ .opentide/schemas/rule.1.0.schema.json', '→ .opentide/templates/rule.1.0.template.yaml'],
  },
  deploy: {
    events: [
      {
        kind: 'reasoning',
        text: 'Human approved: dry-run deploy LSASS rule to Sentinel staging. No fake syntax checks.',
      },
      {
        kind: 'mcp',
        tool: 'deploy',
        input: 'dry_run=true, platform=sentinel',
        output: '1 rule would deploy · staging plan ready',
      },
      {
        kind: 'cli',
        command: 'opentide deploy --platform sentinel --dry-run',
        output: '✓ LSASS memory access → Sentinel · 0 blocked',
      },
    ],
    cmd: 'opentide deploy --platform sentinel --dry-run',
    out: ['✓ dry-run: 1 rule would deploy to Sentinel', '0 blocked'],
  },
};

const codeOptions = {
  theme: { dark: 'pierre-dark', light: 'pierre-dark' } as const,
  disableFileHeader: true,
  overflow: 'scroll' as const,
};

function EditorPane({ path }: { path: DemoPath }) {
  const contents = DEMO_FILES[path];
  const file = useMemo(
    () => ({ name: path.split('/').pop() ?? path, contents, cacheKey: path }),
    [path, contents],
  );
  return <File file={file} options={codeOptions} disableWorkerPool className="h-full min-h-0" />;
}

function MarkdownPane({ path }: { path: DemoPath }) {
  const text = DEMO_FILES[path];
  return (
    <pre className="h-full overflow-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-300">
      {text}
    </pre>
  );
}

export function WorkflowStudio() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const script = stepScripts[step];
  const autoPath = stepFile[step];

  const { model } = useFileTree({
    paths: [...DEMO_PATHS],
    initialExpansion: 'open',
    initialExpandedPaths: [
      'intel',
      'intel/advisories',
      'objects',
      'objects/threats',
      'objects/objectives',
      'objects/rules',
      '.opentide',
    ],
    initialSelectedPaths: [autoPath],
  });

  const selectedPaths = useFileTreeSelector(model, (m) => m.getSelectedPaths(), (a, b) =>
    a.length === b.length && a.every((p, i) => p === b[i]),
  );

  const activePath = (selectedPaths[0] as DemoPath | undefined) ?? autoPath;
  const activeFile = DEMO_FILES[activePath] ? activePath : autoPath;
  const isMarkdown = activeFile.endsWith('.md');

  useEffect(() => {
    model.getItem(autoPath)?.select();
    model.focusPath(autoPath);
  }, [autoPath, model]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => setStepIdx((i) => (i + 1) % STEPS.length), 9000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStepIdx(i)}
              className={`rounded-full px-2.5 py-1 font-mono text-[9px] transition ${
                stepIdx === i
                  ? 'bg-[var(--eu-yellow)]/15 text-[var(--eu-yellow)] ring-1 ring-[var(--eu-yellow)]/30'
                  : stepIdx > i
                    ? 'text-[var(--landing-muted)]'
                    : 'text-[var(--landing-subtle)] hover:bg-white/[0.04]'
              }`}
            >
              {stepLabel[s]}
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-[var(--landing-subtle)]" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_12px_48px_-16px_rgba(0,0,0,0.85)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-black/80 px-3 py-2">
          <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-2 truncate font-mono text-[11px] text-[var(--landing-muted)]">
            {DEMO_REPO} / {activeFile}
          </span>
        </div>

        <div className="grid min-h-[min(52vh,500px)] max-h-[min(56vh,540px)] lg:grid-cols-[40px_200px_1fr_minmax(260px,0.46fr)]">
          <div className="hidden flex-col items-center gap-3 border-r border-white/[0.06] bg-black py-3 lg:flex">
              <FileText className="size-4 text-zinc-400" aria-hidden />
              <Files className="size-4 text-[var(--eu-yellow)]" aria-hidden />
              <Bot className="size-4 text-[var(--landing-accent)]" aria-hidden />
              <Terminal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
            </div>

            <div className="hidden min-h-0 border-r border-white/[0.06] bg-black/50 lg:block">
              <p className="border-b border-white/[0.06] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-subtle)]">
                Explorer
              </p>
              <FileTree model={model} className="h-[calc(100%-2rem)] min-h-0 text-xs" />
            </div>

            <div className="flex min-h-[200px] min-w-0 flex-col border-r border-white/[0.06] bg-black">
              <div className="border-b border-white/[0.06] px-2 py-1.5">
                <span className="inline-block border-b border-[var(--eu-yellow)] px-2 font-mono text-[10px] text-[var(--landing-ink)]">
                  {activeFile.split('/').pop()}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-1">
                {isMarkdown ? <MarkdownPane path={activeFile} /> : <EditorPane path={activeFile} />}
              </div>
            </div>

            <AgentTracePanel
              key={step}
              label={stepLabel[step]}
              events={script.events}
              terminalCmd={script.cmd}
              terminalOut={script.out}
            />
        </div>
      </div>
    </div>
  );
}
