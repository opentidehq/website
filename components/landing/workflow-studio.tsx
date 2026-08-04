'use client';

import { Files, Bot, Terminal, FileText, Pause, Play } from 'lucide-react';
import { File } from '@pierre/diffs/react';
import { FileTree, useFileTree, useFileTreeSelector } from '@pierre/trees/react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  AgentTracePanel,
  StudioTerminal,
  type AgentEvent,
} from '@/components/landing/agent-trace-panel';
import { DEMO_FILES, DEMO_PATHS, DEMO_REPO, type DemoPath } from '@/lib/landing/demo-registry';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const STEPS = [
  'intel',
  'threat',
  'objective',
  'rule',
  'validate',
  'deploy',
] as const;

type Step = (typeof STEPS)[number];
type Phase = 'typing' | 'trace' | 'terminal' | 'dwell';

const stepFocus: Record<
  Step,
  { open: DemoPath; select: readonly DemoPath[]; expand: readonly string[] }
> = {
  intel: {
    open: 'intel/advisories/cve-2024-1709.md',
    select: ['intel/advisories/cve-2024-1709.md'],
    expand: ['intel', 'intel/advisories'],
  },
  threat: {
    open: 'objects/threats/gateway-exploitation.yaml',
    select: [
      'intel/advisories/cve-2024-1709.md',
      'objects/threats/gateway-exploitation.yaml',
    ],
    expand: ['intel', 'intel/advisories', 'objects', 'objects/threats'],
  },
  objective: {
    open: 'objects/objectives/credential-access.yaml',
    select: [
      'objects/threats/gateway-exploitation.yaml',
      'objects/objectives/credential-access.yaml',
    ],
    expand: ['objects', 'objects/threats', 'objects/objectives'],
  },
  rule: {
    open: 'objects/rules/lsass-memory-access.yaml',
    select: [
      'objects/objectives/credential-access.yaml',
      'objects/rules/lsass-memory-access.yaml',
    ],
    expand: ['objects', 'objects/objectives', 'objects/rules'],
  },
  validate: {
    open: 'objects/rules/lsass-memory-access.yaml',
    select: [
      'objects/threats/gateway-exploitation.yaml',
      'objects/objectives/credential-access.yaml',
      'objects/rules/lsass-memory-access.yaml',
    ],
    expand: ['objects', 'objects/threats', 'objects/objectives', 'objects/rules'],
  },
  deploy: {
    open: 'objects/rules/lsass-memory-access.yaml',
    select: [
      'objects/rules/lsass-memory-access.yaml',
      '.opentide/configurations/platforms/sentinel.toml',
    ],
    expand: ['objects', 'objects/rules', '.opentide', '.opentide/configurations', '.opentide/configurations/platforms'],
  },
};

const stepLabel: Record<Step, string> = {
  intel: 'Ingest intel',
  threat: 'Draft threat',
  objective: 'Define objective',
  rule: 'Author rule',
  validate: 'Validate repo',
  deploy: 'Deploy dry-run',
};

const stepScripts: Record<Step, { events: AgentEvent[]; cmd: string; out: string[] }> = {
  intel: {
    events: [
      {
        kind: 'prompt',
        text: 'Turn CISA AA24-073A into deployable Sentinel detections: strict validation, dry-run deploy.',
      },
      {
        kind: 'reasoning',
        text: 'Advisory cites ScreenConnect ≤ 23.9.7 auth bypass → unauth RCE on exposed gateways, then credential access inland.',
      },
      {
        kind: 'skill',
        skill: 'detection-engineering',
        action: 'Map advisory stages to TVM → DOM → MDR object sequence',
        detail: 'SKILL.md · OpenTideHQ/skills · prefer normative UUIDs over free text',
      },
      {
        kind: 'mcp',
        tool: 'read_file',
        input: 'intel/advisories/cve-2024-1709.md',
        output: 'CVE-2024-1709 · T1190 / T1133 · follow-on T1003.001',
      },
      {
        kind: 'mcp',
        tool: 'search_objects',
        input: 'query="ScreenConnect" OR technique=T1190',
        output: '0 existing threats · draft new gateway vector',
      },
      {
        kind: 'cli',
        command: 'opentide document --intel intel/advisories/cve-2024-1709.md',
        output: 'extracted techniques · ready for object drafting',
      },
    ],
    cmd: 'opentide document --intel intel/advisories/cve-2024-1709.md',
    out: [
      '→ parsed CISA AA24-073A (TLP:CLEAR)',
      '→ techniques: T1190, T1133, T1003.001',
      '→ next: author threat::1.0',
    ],
  },
  threat: {
    events: [
      {
        kind: 'reasoning',
        text: 'Frame as edge-gateway exploitation: High severity, High leverage, killchain=Exploitation, ATT&CK T1190+T1133.',
      },
      {
        kind: 'skill',
        skill: 'opentide-threat',
        action: 'Scaffold threat::1.0 with stable UUID and ATT&CK bindings',
        detail: 'reject free-text technique IDs · require uuid v4',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/threats/gateway-exploitation.yaml',
        output: 'threat::1.0 · uuid …010 · fields complete',
      },
      {
        kind: 'mcp',
        tool: 'validate',
        input: 'file=objects/threats/gateway-exploitation.yaml',
        output: 'schema ok · att&ck ok · 0 errors',
      },
      {
        kind: 'cli',
        command: 'opentide validate --file objects/threats/gateway-exploitation.yaml',
        output: '✓ threat::1.0 · 0 errors',
      },
    ],
    cmd: 'opentide validate --file objects/threats/gateway-exploitation.yaml',
    out: ['✓ schema threat::1.0', '✓ att&ck techniques [T1190, T1133]', '0 errors'],
  },
  objective: {
    events: [
      {
        kind: 'reasoning',
        text: 'Follow-on risk is LSASS credential access after foothold — one objective, synergetic signals, link to threat UUID …010.',
      },
      {
        kind: 'skill',
        skill: 'opentide-detection-rule',
        action: 'Compose objective::1.0 with signal + detection_model contract',
        detail: 'priority=High · type=Threat · entities host/process',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/objectives/credential-access.yaml',
        output: 'objective links threat …010 · 1 signal (LSASS process access)',
      },
      {
        kind: 'mcp',
        tool: 'validate',
        input: 'file=objects/objectives/credential-access.yaml strict=true',
        output: 'cross-object threat ref ok · signal uuid ok',
      },
      {
        kind: 'cli',
        command: 'opentide validate --file objects/objectives/credential-access.yaml',
        output: '✓ objective::1.0 · 0 errors',
      },
    ],
    cmd: 'opentide validate --file objects/objectives/credential-access.yaml',
    out: ['✓ objective::1.0', '✓ cross-object threat reference', '✓ signal uuid …001', '0 errors'],
  },
  rule: {
    events: [
      {
        kind: 'prompt',
        text: 'Author an LSASS memory-access rule for Sentinel + Defender that implements the credential-access objective.',
      },
      {
        kind: 'skill',
        skill: 'microsoft-sentinel',
        action: 'Draft KQL on DeviceProcessEvents → ProcessAccess → lsass.exe',
        detail: 'exclude csrss/services · dual-platform configurations block',
      },
      {
        kind: 'reasoning',
        text: 'One rule object, two configs: Sentinel scheduling PT1H/PT2H; Defender category CredentialAccess.',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: 'objects/rules/lsass-memory-access.yaml',
        output: 'rule::1.0 · detection_model → objective …001 · sentinel+defender',
      },
      {
        kind: 'mcp',
        tool: 'validate_query',
        input: 'platform=sentinel',
        output: 'KQL parse ok · DeviceProcessEvents bound',
      },
      {
        kind: 'cli',
        command: 'opentide validate --file objects/rules/lsass-memory-access.yaml',
        output: '✓ rule::1.0 · detection_model ok',
      },
    ],
    cmd: 'opentide validate --file objects/rules/lsass-memory-access.yaml',
    out: [
      '✓ rule::1.0',
      '✓ detection_model → objective …001',
      '✓ sentinel KQL',
      '0 errors',
    ],
  },
  validate: {
    events: [
      {
        kind: 'reasoning',
        text: 'Run registry-wide strict validation before any deploy: uuid v4, id uniqueness, cross-object refs, platform queries.',
      },
      {
        kind: 'mcp',
        tool: 'list_objects',
        input: 'scope=registry',
        output: '1 threat · 1 objective · 1 rule · 1 signal',
      },
      {
        kind: 'mcp',
        tool: 'validate',
        input: 'strict=true',
        output: '4 objects · 0 blocking · sentinel KQL passed',
      },
      {
        kind: 'mcp',
        tool: 'validate_query',
        input: 'platform=defender_for_endpoint',
        output: 'query ok · ActionType ProcessAccess',
      },
      {
        kind: 'cli',
        command: 'opentide validate --strict',
        output: '✓ uuid-format · cross-object · id-uniqueness',
      },
    ],
    cmd: 'opentide validate --strict',
    out: [
      '✓ schema · uuid-format · id-uniqueness',
      '✓ cross-object references',
      '✓ sentinel + defender queries',
      '0 blocking errors',
    ],
  },
  deploy: {
    events: [
      {
        kind: 'prompt',
        text: 'Dry-run deploy the LSASS rule to Sentinel staging — no production write.',
      },
      {
        kind: 'reasoning',
        text: 'Human gate passed. Read sentinel.toml workspace=soc-prod · dry_run_default=true.',
      },
      {
        kind: 'mcp',
        tool: 'read_file',
        input: '.opentide/configurations/platforms/sentinel.toml',
        output: 'enabled · workspace soc-prod · dry_run_default',
      },
      {
        kind: 'mcp',
        tool: 'deploy',
        input: 'dry_run=true, platform=sentinel, rule=…0001',
        output: '1 rule would deploy · staging plan ready',
      },
      {
        kind: 'cli',
        command: 'opentide deploy --platform sentinel --dry-run',
        output: '✓ LSASS memory access → Sentinel · 0 blocked',
      },
    ],
    cmd: 'opentide deploy --platform sentinel --dry-run',
    out: [
      'plan: 1 create · 0 update · 0 delete',
      '✓ dry-run: LSASS memory access → Sentinel (soc-prod)',
      '0 blocked',
    ],
  },
};

function EditorPane({
  path,
  themeType,
  chars,
  showCursor,
}: {
  path: DemoPath;
  themeType: 'light' | 'dark';
  chars?: number;
  showCursor?: boolean;
}) {
  const full = DEMO_FILES[path];
  const contents =
    chars == null ? full : full.slice(0, Math.min(Math.max(chars, 0), full.length));
  const file = useMemo(
    () => ({
      name: path.split('/').pop() ?? path,
      contents,
      cacheKey: `${path}-${themeType}-${contents.length}`,
    }),
    [path, contents, themeType],
  );
  const options = useMemo(
    () =>
      ({
        theme: { dark: 'pierre-dark', light: 'pierre-light' } as const,
        themeType,
        disableFileHeader: true,
        overflow: 'scroll' as const,
      }) as const,
    [themeType],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-diffs-scroll], .cm-scroller, pre, .overflow-auto');
    if (el) el.scrollTop = el.scrollHeight;
    else if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [contents.length]);

  return (
    <div ref={scrollRef} className="relative h-full min-h-0">
      <File
        key={`${path}-${themeType}`}
        file={file}
        options={options}
        disableWorkerPool
        className="h-full min-h-0"
      />
      {showCursor && chars != null && chars < full.length && (
        <span
          className="pointer-events-none absolute bottom-3 left-3 h-[1em] w-[7px] animate-pulse bg-[var(--landing-accent)]"
          aria-hidden
        />
      )}
    </div>
  );
}

function applyTreeFocus(
  model: {
    getSelectedPaths: () => readonly string[];
    getItem: (path: string) => {
      deselect: () => void;
      select: () => void;
      expand?: () => void;
    } | null;
    focusPath: (path: string) => void;
    scrollToPath?: (path: string, opts?: { focus?: boolean }) => void;
  },
  focus: (typeof stepFocus)[Step],
) {
  for (const selected of [...model.getSelectedPaths()]) {
    model.getItem(selected)?.deselect();
  }
  for (const dir of focus.expand) {
    model.getItem(dir)?.expand?.();
  }
  for (const path of focus.select) {
    model.getItem(path)?.select();
  }
  model.focusPath(focus.open);
  model.scrollToPath?.(focus.open, { focus: false });
}

function ScenarioChrome({
  stepIdx,
  phasePart,
  phase,
  paused,
  onTogglePause,
}: {
  stepIdx: number;
  phasePart: number;
  phase: Phase;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const step = STEPS[stepIdx];
  const segmentProgress = (i: number) => {
    if (i < stepIdx) return 1;
    if (i > stepIdx) return 0;
    if (phase === 'typing') return phasePart * 0.34;
    if (phase === 'trace') return 0.34 + phasePart * 0.33;
    if (phase === 'terminal') return 0.67 + phasePart * 0.33;
    return 1;
  };

  const phaseLabel =
    phase === 'typing'
      ? 'Writing file'
      : phase === 'trace'
        ? 'Agent working'
        : phase === 'terminal'
          ? 'Running CLI'
          : 'Next stage';

  return (
    <div className="space-y-3" aria-label="Scenario progress">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] tabular-nums text-[var(--landing-accent)]">
              {String(stepIdx + 1).padStart(2, '0')}
              <span className="text-[var(--landing-dim)]">/{String(STEPS.length).padStart(2, '0')}</span>
            </span>
            <p className="truncate text-sm font-semibold tracking-tight text-[var(--landing-ink)]">
              {stepLabel[step]}
            </p>
            <span className="hidden font-mono text-[10px] text-[var(--landing-dim)] sm:inline">
              · {phaseLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onTogglePause}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] px-3 py-1.5 font-mono text-[10px] font-medium text-[var(--landing-ink)] transition hover:bg-[color-mix(in_srgb,var(--landing-ink)_10%,transparent)]"
          aria-pressed={paused}
        >
          {paused ? (
            <>
              <Play className="size-3 fill-current" aria-hidden />
              Play
            </>
          ) : (
            <>
              <Pause className="size-3 fill-current" aria-hidden />
              Pause
            </>
          )}
        </button>
      </div>

      {/* Continuous segmented timeline — no wrapping pills/arrows */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
        role="list"
      >
        {STEPS.map((s, i) => {
          const pct = segmentProgress(i);
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <div key={s} role="listitem" className="min-w-0">
              <span
                className={`mb-1.5 block truncate font-mono text-[9px] tracking-wide ${
                  active
                    ? 'text-[var(--landing-accent)]'
                    : done
                      ? 'text-[var(--landing-muted)]'
                      : 'text-[var(--landing-dim)]'
                }`}
              >
                <span className="sm:hidden">{String(i + 1).padStart(2, '0')}</span>
                <span className="hidden sm:inline">{stepLabel[s]}</span>
              </span>
              <span
                className="block h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_10%,transparent)]"
                aria-hidden
              >
                <span
                  className={`block h-full rounded-full bg-[var(--landing-accent)] ${
                    active && !paused ? 'transition-[width] duration-100 ease-linear' : ''
                  }`}
                  style={{ width: `${pct * 100}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkflowStudio() {
  const reduced = usePrefersReducedMotion();
  const { resolvedTheme } = useTheme();
  const themeType = resolvedTheme === 'dark' ? 'dark' : 'light';
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduced ? 'dwell' : 'typing');
  const [paused, setPaused] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [phasePart, setPhasePart] = useState(0);
  const step = STEPS[stepIdx];
  const script = stepScripts[step];
  const focus = stepFocus[step];
  const fullText = DEMO_FILES[focus.open];

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
      '.opentide/configurations',
      '.opentide/configurations/platforms',
    ],
    initialSelectedPaths: [...focus.select],
  });

  // Keep selector subscribed so tree re-renders when focus changes
  useFileTreeSelector(
    model,
    (m) => m.getSelectedPaths(),
    (a, b) => a.length === b.length && a.every((p, i) => p === b[i]),
  );

  useEffect(() => {
    applyTreeFocus(model, focus);
  }, [model, focus, stepIdx]);

  // Reset typing when step changes (React-recommended adjust-during-render)
  const [seenStep, setSeenStep] = useState(stepIdx);
  if (seenStep !== stepIdx) {
    setSeenStep(stepIdx);
    setTypedChars(0);
    setPhasePart(0);
    setPhase(reduced ? 'dwell' : 'typing');
  }

  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Typewriter for editor
  useEffect(() => {
    if (phase !== 'typing') return;

    if (reduced) {
      const frame = window.requestAnimationFrame(() => {
        setTypedChars(fullText.length);
        setPhasePart(1);
        setPhase('trace');
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const chunk = Math.max(2, Math.ceil(fullText.length / 90));
    let n = typedChars;
    let advanceTimer = 0;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      n = Math.min(fullText.length, n + chunk);
      setTypedChars(n);
      setPhasePart(n / fullText.length);
      if (n >= fullText.length) {
        window.clearInterval(id);
        advanceTimer = window.setTimeout(() => {
          if (!pausedRef.current) setPhase('trace');
        }, 280);
      }
    }, 28);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(advanceTimer);
    };
    // Resume from typedChars when unpausing — omit from deps to avoid restart loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fullText, reduced, stepIdx, paused]);

  const onTraceComplete = useCallback(() => {
    setPhase('terminal');
    setPhasePart(0);
  }, []);

  const onTerminalComplete = useCallback(() => {
    setPhase('dwell');
    setPhasePart(1);
  }, []);

  const onTraceProgress = useCallback((r: number) => setPhasePart(r), []);
  const onTermProgress = useCallback((r: number) => setPhasePart(r), []);

  // Auto-advance and loop the scenario
  useEffect(() => {
    if (paused || phase !== 'dwell') return;
    const dwell = reduced ? 400 : 900;
    const id = window.setTimeout(() => {
      setStepIdx((i) => (i >= STEPS.length - 1 ? 0 : i + 1));
    }, dwell);
    return () => window.clearTimeout(id);
  }, [phase, stepIdx, paused, reduced]);

  const phaseLabel =
    phase === 'typing'
      ? 'Writing file…'
      : phase === 'trace'
        ? 'Agent working…'
        : phase === 'terminal'
          ? 'Running CLI…'
          : 'Next stage…';

  return (
    <div className="space-y-4">
      <ScenarioChrome
        stepIdx={stepIdx}
        phasePart={phasePart}
        phase={phase}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_20px_60px_-28px_var(--landing-btn-shadow)]">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--landing-border-subtle)] bg-[var(--landing-surface-raised)] px-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-2 truncate font-mono text-[11px] text-[var(--landing-subtle)]">
            {DEMO_REPO} / {focus.open}
          </span>
          <span className="ml-auto font-mono text-[9px] text-[var(--landing-dim)]">
            {paused ? 'Paused' : phaseLabel}
          </span>
        </div>

        <div className="grid h-[min(58vh,560px)] grid-cols-1 lg:grid-cols-[40px_200px_minmax(0,1fr)_minmax(240px,0.4fr)]">
          <div className="hidden flex-col items-center gap-3 border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface-raised)] py-3 lg:flex">
            <Files className="size-4 text-[var(--landing-accent)]" aria-hidden />
            <FileText className="size-4 text-[var(--landing-dim)]" aria-hidden />
            <Bot className="size-4 text-[var(--landing-accent)]" aria-hidden />
            <Terminal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
          </div>

          <div
            className="landing-studio-tree pointer-events-none hidden min-h-0 border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] opacity-90 lg:block"
            aria-hidden
            style={
              {
                colorScheme: themeType,
                ['--trees-fg-override']: 'var(--landing-ink)',
                ['--trees-fg-muted-override']: 'var(--landing-subtle)',
                ['--trees-bg-override']: 'transparent',
                ['--trees-bg-muted-override']: 'var(--landing-surface-raised)',
                ['--trees-accent-override']: 'var(--landing-accent)',
                ['--trees-border-color-override']: 'var(--landing-border-subtle)',
                ['--trees-selected-bg-override']:
                  'color-mix(in srgb, var(--landing-accent) 16%, transparent)',
                ['--trees-selected-fg-override']: 'var(--landing-ink)',
              } as CSSProperties
            }
          >
            <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-subtle)]">
              Explorer
            </p>
            <FileTree model={model} className="h-[calc(100%-2rem)] min-h-0 text-xs" />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col border-r border-[var(--landing-border-subtle)] bg-[var(--landing-bg)]">
            <div className="flex h-9 shrink-0 items-center bg-[var(--landing-surface)] px-2">
              <span className="inline-block border-b-2 border-[var(--landing-accent)] px-2 pb-2 pt-1.5 font-mono text-[10px] text-[var(--landing-ink)]">
                {focus.open.split('/').pop()}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-1">
              <EditorPane
                path={focus.open}
                themeType={themeType}
                chars={
                  phase === 'typing' || phase === 'trace'
                    ? typedChars
                    : DEMO_FILES[focus.open].length
                }
                showCursor={!paused && phase === 'typing' && typedChars < fullText.length}
              />
            </div>

            <StudioTerminal
              key={`${step}-term`}
              cmd={script.cmd}
              out={script.out}
              armed={phase === 'terminal' || phase === 'dwell'}
              paused={paused}
              instant={reduced || phase === 'dwell'}
              onProgress={phase === 'terminal' ? onTermProgress : undefined}
              onComplete={phase === 'terminal' ? onTerminalComplete : undefined}
            />
          </div>

          <div className="min-h-0 border-t border-[var(--landing-border-subtle)] lg:border-t-0">
            <AgentTracePanel
              key={`${step}-trace`}
              label={stepLabel[step]}
              events={script.events}
              armed={phase === 'trace' || phase === 'terminal' || phase === 'dwell'}
              paused={paused}
              instant={reduced || phase === 'terminal' || phase === 'dwell'}
              onProgress={phase === 'trace' ? onTraceProgress : undefined}
              onComplete={phase === 'trace' ? onTraceComplete : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
