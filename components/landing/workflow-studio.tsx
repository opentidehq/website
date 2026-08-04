'use client';

import { Files, Bot, Terminal, FileText, Pause, Play } from 'lucide-react';
import { File } from '@pierre/diffs/react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AgentTracePanel,
  EVENT_MS,
  StudioTerminal,
  type AgentEvent,
} from '@/components/landing/agent-trace-panel';
import { StudioExplorer } from '@/components/landing/studio-explorer';
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
/** work = type file + stream agent events together; then terminal; then dwell. */
type Phase = 'work' | 'terminal' | 'dwell';

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
    expand: [
      'objects',
      'objects/rules',
      '.opentide',
      '.opentide/configurations',
      '.opentide/configurations/platforms',
    ],
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

/** Split events so prelude plays during typing; write lands at 100%; postlude after. */
function splitScriptEvents(events: AgentEvent[]) {
  const writeIdx = events.findIndex(
    (e) => e.kind === 'mcp' && (e.tool === 'write_file' || e.tool === 'deploy'),
  );
  if (writeIdx >= 0) {
    return {
      prelude: events.slice(0, writeIdx),
      hinge: 1,
      postlude: events.slice(writeIdx + 1),
      hingeIndex: writeIdx,
    };
  }
  // No write/deploy — stream ~half during typing, rest after
  const hingeIndex = Math.max(1, Math.ceil(events.length * 0.55)) - 1;
  return {
    prelude: events.slice(0, hingeIndex + 1),
    hinge: 0,
    postlude: events.slice(hingeIndex + 1),
    hingeIndex,
  };
}

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
    const root = scrollRef.current;
    if (!root) return;
    const el =
      root.querySelector<HTMLElement>('[data-diffs-scroll], .cm-scroller, pre, .overflow-auto') ??
      root;
    el.scrollTop = el.scrollHeight;
  }, [contents.length]);

  return (
    <div ref={scrollRef} className="landing-code-scroll relative h-full min-h-0 overflow-auto">
      <File
        key={`${path}-${themeType}`}
        file={file}
        options={options}
        disableWorkerPool
        className="min-h-0"
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

function ScenarioChrome({
  stepIdx,
  phasePart,
  phase,
  typing,
  paused,
  onTogglePause,
}: {
  stepIdx: number;
  phasePart: number;
  phase: Phase;
  typing: boolean;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const step = STEPS[stepIdx];
  const segmentProgress = (i: number) => {
    if (i < stepIdx) return 1;
    if (i > stepIdx) return 0;
    if (phase === 'work') return phasePart * 0.67;
    if (phase === 'terminal') return 0.67 + phasePart * 0.33;
    return 1;
  };

  const phaseLabel =
    phase === 'work'
      ? typing
        ? 'Writing file'
        : 'Agent working'
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
  const [phase, setPhase] = useState<Phase>(reduced ? 'dwell' : 'work');
  const [paused, setPaused] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [phasePart, setPhasePart] = useState(0);
  const step = STEPS[stepIdx];
  const script = stepScripts[step];
  const focus = stepFocus[step];
  const fullText = DEMO_FILES[focus.open];
  const split = useMemo(() => splitScriptEvents(script.events), [script.events]);

  // Reset when step changes (adjust-during-render)
  const [seenStep, setSeenStep] = useState(stepIdx);
  if (seenStep !== stepIdx) {
    setSeenStep(stepIdx);
    setTypedChars(0);
    setVisibleEvents(0);
    setPhasePart(0);
    setPhase(reduced ? 'dwell' : 'work');
  }

  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Unified work clock: typewriter + agent events stay in lockstep
  useEffect(() => {
    if (phase !== 'work') return;

    if (reduced) {
      const frame = window.requestAnimationFrame(() => {
        setTypedChars(fullText.length);
        setVisibleEvents(script.events.length);
        setPhasePart(1);
        setPhase('terminal');
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const chunk = Math.max(2, Math.ceil(fullText.length / 90));
    const preludeLen = split.prelude.length;
    const hingeTotal = preludeLen + split.hinge; // events unlocked by end of typing
    let chars = typedChars;
    let events = visibleEvents;
    let postTimer = 0;

    const finishWork = () => {
      setPhasePart(1);
      setPhase('terminal');
    };

    const dripPostlude = () => {
      postTimer = window.setInterval(() => {
        if (pausedRef.current) return;
        events += 1;
        setVisibleEvents(events);
        const postDone = events - hingeTotal;
        const postTotal = Math.max(1, split.postlude.length);
        setPhasePart(0.72 + 0.28 * Math.min(1, postDone / postTotal));
        if (events >= script.events.length) {
          window.clearInterval(postTimer);
          window.setTimeout(() => {
            if (!pausedRef.current) finishWork();
          }, 220);
        }
      }, EVENT_MS);
    };

    // Already finished typing — only drip remaining events
    if (chars >= fullText.length) {
      setTypedChars(fullText.length);
      if (events < hingeTotal) {
        events = hingeTotal;
        setVisibleEvents(hingeTotal);
      }
      if (events >= script.events.length) {
        finishWork();
        return;
      }
      dripPostlude();
      return () => window.clearInterval(postTimer);
    }

    const typeTimer = window.setInterval(() => {
      if (pausedRef.current) return;
      chars = Math.min(fullText.length, chars + chunk);
      setTypedChars(chars);
      const typeRatio = chars / fullText.length;

      // Unlock prelude proportionally while typing; hinge event at completion
      const targetDuringType =
        chars >= fullText.length
          ? hingeTotal
          : Math.max(
              events,
              Math.min(preludeLen, Math.floor(typeRatio * Math.max(preludeLen, 1) + 0.001)),
            );
      // Always show at least the first event once typing starts
      const nextEvents =
        chars > 0 ? Math.max(targetDuringType, preludeLen > 0 ? Math.min(1, preludeLen) : 0) : 0;
      if (nextEvents > events) {
        events = nextEvents;
        setVisibleEvents(events);
      }

      setPhasePart(typeRatio * 0.72);

      if (chars >= fullText.length) {
        window.clearInterval(typeTimer);
        events = hingeTotal;
        setVisibleEvents(hingeTotal);
        setPhasePart(0.72);
        if (split.postlude.length === 0) {
          window.setTimeout(() => {
            if (!pausedRef.current) finishWork();
          }, 280);
        } else {
          dripPostlude();
        }
      }
    }, 28);

    return () => {
      window.clearInterval(typeTimer);
      window.clearInterval(postTimer);
    };
    // Resume from current counters when unpausing — omit to avoid restart loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fullText, reduced, stepIdx, paused, script.events, split]);

  const onTerminalComplete = useCallback(() => {
    setPhase('dwell');
    setPhasePart(1);
  }, []);

  const onTermProgress = useCallback((r: number) => setPhasePart(r), []);

  useEffect(() => {
    if (paused || phase !== 'dwell') return;
    const dwell = reduced ? 400 : 900;
    const id = window.setTimeout(() => {
      setStepIdx((i) => (i >= STEPS.length - 1 ? 0 : i + 1));
    }, dwell);
    return () => window.clearTimeout(id);
  }, [phase, stepIdx, paused, reduced]);

  // Instant-fill when entering dwell via reduced motion mid-step
  useEffect(() => {
    if (phase !== 'dwell' && phase !== 'terminal') return;
    if (typedChars < fullText.length) setTypedChars(fullText.length);
    if (visibleEvents < script.events.length) setVisibleEvents(script.events.length);
  }, [phase, fullText.length, script.events.length, typedChars, visibleEvents]);

  const typing = phase === 'work' && typedChars < fullText.length;
  const phaseLabel =
    phase === 'work'
      ? typing
        ? 'Writing file…'
        : 'Agent working…'
      : phase === 'terminal'
        ? 'Running CLI…'
        : 'Next stage…';

  return (
    <div className="space-y-4">
      <ScenarioChrome
        stepIdx={stepIdx}
        phasePart={phasePart}
        phase={phase}
        typing={typing}
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

        <div className="grid h-[min(58vh,560px)] grid-cols-1 lg:grid-cols-[40px_210px_minmax(0,1fr)_minmax(240px,0.42fr)]">
          <div className="hidden flex-col items-center gap-3 border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface-raised)] py-3 lg:flex">
            <Files className="size-4 text-[var(--landing-accent)]" aria-hidden />
            <FileText className="size-4 text-[var(--landing-dim)]" aria-hidden />
            <Bot className="size-4 text-[var(--landing-accent)]" aria-hidden />
            <Terminal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
          </div>

          <div className="pointer-events-none hidden min-h-0 overflow-hidden border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] lg:block">
            <StudioExplorer
              paths={DEMO_PATHS}
              open={focus.open}
              selected={focus.select}
              expanded={focus.expand}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[var(--landing-border-subtle)] bg-[var(--landing-bg)]">
            <div className="flex h-9 shrink-0 items-center bg-[var(--landing-surface)] px-2">
              <span className="inline-block border-b-2 border-[var(--landing-accent)] px-2 pb-2 pt-1.5 font-mono text-[10px] text-[var(--landing-ink)]">
                {focus.open.split('/').pop()}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-1">
              <EditorPane
                path={focus.open}
                themeType={themeType}
                chars={typedChars}
                showCursor={!paused && typing}
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

          <div className="flex min-h-0 flex-col overflow-hidden border-t border-[var(--landing-border-subtle)] max-lg:min-h-[220px] lg:border-t-0">
            <AgentTracePanel
              key={`${step}-trace`}
              label={stepLabel[step]}
              events={script.events}
              visibleCount={
                phase === 'terminal' || phase === 'dwell' ? script.events.length : visibleEvents
              }
              animate={!reduced && phase === 'work'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
