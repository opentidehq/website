'use client';

import {
  Files,
  Bot,
  Terminal,
  FileText,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Loader,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgentTracePanel, StudioTerminal, type AgentEvent } from '@/components/landing/agent-trace-panel';
import { StudioEditor, StudioEditorIdle, type EditorHighlight } from '@/components/landing/studio-editor';
import { StudioExplorer } from '@/components/landing/studio-explorer';
import { StudioReviewTab } from '@/components/landing/studio-review-tab';
import {
  DEMO_BRANCH,
  DEMO_FILES,
  DEMO_PATHS,
  DEMO_REPO,
  INLINE_EDIT,
  REVIEW_JOBS,
  REVIEW_MR,
  RULE_PATH,
  SCENARIO_PROMPT,
  type DemoPath,
} from '@/lib/landing/demo-registry';
import { TIMING } from '@/lib/landing/studio-timing';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { useScrollStage } from '@/lib/hooks/use-scroll-stage';

const STEPS = ['prompt', 'threat', 'objective', 'rule', 'inline', 'ci'] as const;

type Step = (typeof STEPS)[number];
type Phase = 'work' | 'run' | 'dwell';

const REVIEW_TAB = 'review' as const;
type TabId = DemoPath | typeof REVIEW_TAB;

const THREAT_FILE = 'objects/threats/gateway-exploitation.yaml' satisfies DemoPath;
const OBJECTIVE_FILE = 'objects/objectives/credential-access.yaml' satisfies DemoPath;
const SENTINEL_TOML = '.opentide/configurations/platforms/sentinel.toml' satisfies DemoPath;
const SPLUNK_TOML = '.opentide/configurations/platforms/splunk.toml' satisfies DemoPath;

type StepFocus = {
  /** Files that become open tabs at this step, in order. */
  opens: readonly DemoPath[];
  /** Tab the animation drives at this step; null = idle editor. */
  active: TabId | null;
  /** Typewriter the active file; false = show it whole. */
  type: boolean;
  /** Explorer highlight. */
  select: readonly DemoPath[];
  /** Inline ⌘K edit beat on the active file. */
  inlineEdit?: boolean;
  /** Merge request review tab instead of an editor buffer. */
  review?: boolean;
};

const stepFocus: Record<Step, StepFocus> = {
  prompt: {
    opens: [],
    active: null,
    type: false,
    select: [],
  },
  threat: {
    opens: [THREAT_FILE],
    active: THREAT_FILE,
    type: true,
    select: [THREAT_FILE],
  },
  objective: {
    opens: [OBJECTIVE_FILE],
    active: OBJECTIVE_FILE,
    type: true,
    select: [THREAT_FILE, OBJECTIVE_FILE],
  },
  rule: {
    opens: [RULE_PATH],
    active: RULE_PATH,
    type: true,
    select: [OBJECTIVE_FILE, RULE_PATH],
  },
  inline: {
    opens: [],
    active: RULE_PATH,
    type: false,
    select: [RULE_PATH],
    inlineEdit: true,
  },
  ci: {
    opens: [SENTINEL_TOML, SPLUNK_TOML],
    active: REVIEW_TAB,
    type: false,
    select: [THREAT_FILE, OBJECTIVE_FILE, RULE_PATH, SENTINEL_TOML, SPLUNK_TOML],
    review: true,
  },
};

const stepLabel: Record<Step, string> = {
  prompt: 'Read the brief',
  threat: 'Draft threat',
  objective: 'Define objective',
  rule: 'Author rule',
  inline: 'Tune inline',
  ci: 'Review & ship',
};

const stepScripts: Record<Step, { events: AgentEvent[]; cmd: string; out: string[] }> = {
  prompt: {
    events: [
      { kind: 'prompt', text: SCENARIO_PROMPT },
      {
        kind: 'reasoning',
        text: 'Check what this repo can actually ship to before authoring — the platform configs decide which query languages the rule needs.',
      },
      {
        kind: 'mcp',
        tool: 'read_file',
        input: '.opentide/configurations/platforms/*.toml',
        output: 'sentinel enabled · splunk enabled · staging + production tenants',
      },
      {
        kind: 'skill',
        skill: 'detection-engineering',
        action: 'Plan the threat → objective → rule chain from the advisory',
        detail: 'normative UUIDs · Sentinel KQL + Splunk SPL',
      },
      {
        kind: 'response',
        text: 'Both platforms are enabled with a STAGING tenant, so this becomes one rule carrying a Sentinel and a Splunk block. Starting with the threat vector — everything else chains back to it.',
      },
    ],
    cmd: '',
    out: [],
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
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: THREAT_FILE,
        output: 'threat::1.0 · uuid …010 · fields complete',
      },
      {
        kind: 'cli',
        command: `opentide validate --file ${THREAT_FILE}`,
        output: 'all_content_successfully_passed_validation',
      },
      {
        kind: 'response',
        text: 'Threat vector is in and valid. CVE-2024-1709 scores High severity on Edge Gateway terrain; the objective can now reference uuid …010.',
      },
    ],
    cmd: `opentide validate --file ${THREAT_FILE}`,
    out: [
      '09:12:38  INFO     validates_all_opentide_objects_via_model_validate',
      '09:12:40  INFO     step_completed',
      '  detail: Successfully verified 1 OpenTide object',
      '09:12:40  INFO     all_content_successfully_passed_validation',
    ],
  },
  objective: {
    events: [
      {
        kind: 'reasoning',
        text: 'Follow-on risk is LSASS credential access — one objective, synergetic signals, linked to threat …010.',
      },
      {
        kind: 'skill',
        skill: 'opentide-detection-rule',
        action: 'Compose objective::1.0 with signal + detection_model contract',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: OBJECTIVE_FILE,
        output: 'objective links threat …010 · 1 signal',
      },
      {
        kind: 'cli',
        command: `opentide validate --file ${OBJECTIVE_FILE}`,
        output: 'all_content_successfully_passed_validation',
      },
      {
        kind: 'response',
        text: 'Objective states what proof we need — corroborating LSASS handle access after the gateway foothold — and declares the telemetry it depends on. Queries come next, not before.',
      },
    ],
    cmd: `opentide validate --file ${OBJECTIVE_FILE}`,
    out: [
      '09:19:04  INFO     validates_all_opentide_objects_via_model_validate',
      '09:19:06  INFO     step_completed',
      '  detail: Successfully verified 2 OpenTide objects',
      '09:19:06  INFO     all_content_successfully_passed_validation',
    ],
  },
  rule: {
    events: [
      {
        kind: 'skill',
        skill: 'microsoft-sentinel',
        action: 'Draft KQL: DeviceProcessEvents → ProcessAccess → lsass.exe',
      },
      {
        kind: 'reasoning',
        text: 'One rule, two estates: Sentinel runs PT1H/PT2H with entity mappings; Splunk ES runs a 15m correlation search raising a notable plus risk objects.',
      },
      {
        kind: 'skill',
        skill: 'splunk-es',
        action: 'Translate the same signal to SPL over Sysmon EventCode 10',
        detail: 'throttle by host + SourceImage · risk on host and user',
      },
      {
        kind: 'mcp',
        tool: 'write_file',
        input: RULE_PATH,
        output: 'rule::1.0 · detection_model → objective …001',
      },
      {
        kind: 'cli',
        command: `opentide validate --file ${RULE_PATH}`,
        output: 'all_content_successfully_passed_validation',
      },
      {
        kind: 'response',
        text: 'Both platform blocks come from the same objective, so the KQL and the SPL stay accountable to one detection intent. Status stays STAGING until a human promotes it.',
      },
    ],
    cmd: `opentide validate --file ${RULE_PATH}`,
    out: [
      '09:26:41  INFO     validates_all_opentide_objects_via_model_validate',
      '09:26:44  INFO     step_completed',
      '  detail: Successfully verified 3 OpenTide objects',
      '09:26:44  INFO     all_content_successfully_passed_validation',
    ],
  },
  inline: {
    events: [
      { kind: 'prompt', text: INLINE_EDIT.ask },
      {
        kind: 'reasoning',
        text: 'WmiPrvSE opens LSASS handles on every inventory sweep. Exclude the accessor by name and drop the scan command line rather than weakening the signal.',
      },
      {
        kind: 'mcp',
        tool: 'apply_edit',
        input: 'objects/rules/lsass-memory-access.yaml · configurations.sentinel.query',
        output: '1 hunk applied · +2 −1',
      },
      {
        kind: 'cli',
        command: 'opentide validate query --platform sentinel',
        output: 'the_query_is_a_valid_sentinel_kql',
      },
      {
        kind: 'response',
        text: 'Exclusions now live in a BenignAccessors set with the inventory-scan command line filtered out. Splunk keeps its own exclusion list, and the tuned KQL still parses against the staging workspace.',
      },
    ],
    cmd: 'opentide validate query --platform sentinel',
    out: [
      '== Query Validation - Microsoft Sentinel ==',
      '09:31:19  INFO     sending_query_to_azure_monitor_workspace',
      '  detail: LSASS memory access (…8003-000000000001)',
      '09:31:22  INFO     the_query_is_a_valid_sentinel_kql',
      '  detail: LSASS memory access (…8003-000000000001)',
    ],
  },
  ci: {
    events: [
      {
        kind: 'reasoning',
        text: 'Local checks are green. Push the branch and let CI re-run the same gates on a clean runner before anything reaches a tenant.',
      },
      {
        kind: 'mcp',
        tool: 'open_merge_request',
        input: `${DEMO_BRANCH} → main`,
        output: `${REVIEW_MR.id} opened · 5 files · pipeline queued`,
      },
      {
        kind: 'mcp',
        tool: 'pipeline_status',
        input: `mr=${REVIEW_MR.id}`,
        output: 'Validate 48s · Generate 33s · Deploy Staging 1m12s',
      },
      {
        kind: 'response',
        text: 'CI enforced the same contract end to end: strict validation, KQL and SPL query checks, then a dry-run and a staged deploy to both platforms. Production promotion still waits on a protected approval.',
      },
    ],
    cmd: '',
    out: [],
  },
};

const INLINE_APPLY_AT =
  stepScripts.inline.events.findIndex((e) => e.kind === 'mcp' && e.tool === 'apply_edit') + 1;

const INLINE_SPAN = diffSpan(DEMO_FILES[RULE_PATH], INLINE_EDIT.tuned);

/** Line range that differs between two revisions, 1-based and inclusive. */
function diffSpan(before: string, after: string) {
  const a = before.split('\n');
  const b = after.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA -= 1;
    endB -= 1;
  }
  return {
    base: { from: start + 1, to: Math.max(start + 1, endA + 1) },
    tuned: { from: start + 1, to: Math.max(start + 1, endB + 1) },
  };
}

/** The `write_file` call is the moment the buffer stops being a draft — everything hinges on it. */
function splitScriptEvents(events: AgentEvent[]) {
  const writeIdx = events.findIndex(
    (e) => e.kind === 'mcp' && (e.tool === 'write_file' || e.tool === 'deploy'),
  );
  if (writeIdx >= 0) {
    return {
      prelude: events.slice(0, writeIdx),
      hinge: 1,
      postlude: events.slice(writeIdx + 1),
    };
  }
  const hingeIndex = Math.max(0, Math.ceil(events.length * 0.5) - 1);
  return {
    prelude: events.slice(0, hingeIndex + 1),
    hinge: 0,
    postlude: events.slice(hingeIndex + 1),
  };
}

const NEVER = Number.POSITIVE_INFINITY;
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Every cue in a step's work phase, resolved to a millisecond offset up front.
 *
 * Laying the step out as one timeline is what keeps the causality honest: the agent
 * reasons before it writes, the engineer submits the ⌘K request before the agent edits
 * the buffer, and the CLI only runs once there is something to validate.
 */
type Timeline = {
  /** Offset at which each agent-trace card appears. */
  eventAt: number[];
  /** Window over which the active file is typed out. */
  typeFrom: number;
  typeTo: number;
  /** Window over which the ⌘K request is typed, and the offset at which it is submitted. */
  askTo: number;
  submitAt: number;
  duration: number;
};

function buildTimeline(step: Step): Timeline {
  const script = stepScripts[step];
  const focus = stepFocus[step];
  const eventAt: number[] = [];
  let t = 0;

  const stream = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      eventAt.push(t);
      t += TIMING.event;
    }
  };

  // Inline tuning: the engineer writes the request and submits it; only then does the agent act.
  if (focus.inlineEdit) {
    const askTo = INLINE_EDIT.ask.length * TIMING.promptTick;
    const submitAt = askTo + TIMING.promptSubmit;
    t = submitAt;
    stream(script.events.length);
    return { eventAt, typeFrom: NEVER, typeTo: NEVER, askTo, submitAt, duration: t + TIMING.settle };
  }

  // Read-only steps (the brief, the review): the trace is the whole story.
  if (!focus.type) {
    stream(script.events.length);
    return {
      eventAt,
      typeFrom: NEVER,
      typeTo: NEVER,
      askTo: NEVER,
      submitAt: NEVER,
      duration: t + TIMING.settle,
    };
  }

  // Authoring steps: reason, then write the file, then confirm the write and validate it.
  const { prelude, hinge, postlude } = splitScriptEvents(script.events);
  stream(prelude.length);
  t += TIMING.beforeWrite;
  const typeFrom = t;
  t += TIMING.typeTicks * TIMING.typeTick;
  const typeTo = t;
  stream(hinge + postlude.length);
  return {
    eventAt,
    typeFrom,
    typeTo,
    askTo: NEVER,
    submitAt: NEVER,
    duration: t + TIMING.settle,
  };
}

function ScenarioChrome({
  stepIdx,
  phasePart,
  phase,
  label,
  paused,
  onTogglePause,
  onSelectStep,
}: {
  stepIdx: number;
  phasePart: number;
  phase: Phase;
  /** What the studio is doing right now, mirrored from the window chrome. */
  label: string;
  paused: boolean;
  onTogglePause: () => void;
  onSelectStep: (i: number) => void;
}) {
  const step = STEPS[stepIdx];
  const segmentProgress = (i: number) => {
    if (i < stepIdx) return 1;
    if (i > stepIdx) return 0;
    if (phase === 'work') return phasePart * 0.67;
    if (phase === 'run') return 0.67 + phasePart * 0.33;
    return 1;
  };

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
              · {label}
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
      >
        {STEPS.map((s, i) => {
          const pct = segmentProgress(i);
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelectStep(i)}
              aria-current={active ? 'step' : undefined}
              title={`${String(i + 1).padStart(2, '0')} · ${stepLabel[s]}`}
              className="group min-w-0 cursor-pointer text-left"
            >
              <span
                className={`mb-1.5 block truncate font-mono text-[9px] tracking-wide transition-colors ${
                  active
                    ? 'text-[var(--landing-accent)]'
                    : done
                      ? 'text-[var(--landing-muted)] group-hover:text-[var(--landing-ink)]'
                      : 'text-[var(--landing-dim)] group-hover:text-[var(--landing-muted)]'
                }`}
              >
                <span className="sm:hidden">{String(i + 1).padStart(2, '0')}</span>
                <span className="hidden sm:inline">{stepLabel[s]}</span>
              </span>
              <span
                className="block h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_10%,transparent)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--landing-ink)_18%,transparent)]"
                aria-hidden
              >
                <span
                  className={`block h-full rounded-full bg-[var(--landing-accent)] ${
                    active && !paused ? 'transition-[width] duration-100 ease-linear' : ''
                  }`}
                  style={{ width: `${pct * 100}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type InlineState = 'typing' | 'working' | 'applied';

/**
 * ⌘K prompt box rendered inline in the buffer during the tuning step.
 * Fully driven by the step timeline so the buffer can never change before submit.
 */
function InlineEditWidget({
  ask,
  typed,
  state,
}: {
  ask: string;
  typed: number;
  state: InlineState;
}) {
  return (
    <div className="ml-8 max-w-[28rem] rounded-lg border border-[var(--landing-accent)] bg-[var(--landing-surface-raised)] px-2.5 py-2 shadow-[0_10px_30px_-16px_var(--landing-btn-shadow)]">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3 text-[var(--landing-accent)]" aria-hidden />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-accent)]">
          Edit selection
        </span>
        <span className="ml-auto rounded bg-[color-mix(in_srgb,var(--landing-ink)_8%,transparent)] px-1 py-0.5 font-mono text-[8px] text-[var(--landing-subtle)]">
          ⌘K
        </span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[var(--landing-ink)]">
        {ask.slice(0, typed)}
        {state === 'typing' && (
          <span
            className="ml-px inline-block h-[0.95em] w-[6px] animate-pulse bg-[var(--landing-accent)] align-middle"
            aria-hidden
          />
        )}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px]">
        {state === 'typing' && (
          <span className="text-[var(--landing-dim)]">
            <kbd className="font-mono">⏎</kbd> submit ·{' '}
            <kbd className="font-mono">esc</kbd> cancel
          </span>
        )}
        {state === 'working' && (
          <>
            <Loader className="size-2.5 animate-spin text-[var(--landing-accent)]" aria-hidden />
            <span className="text-[var(--landing-muted)]">opentide-mcp · apply_edit…</span>
          </>
        )}
        {state === 'applied' && (
          <span className="text-emerald-700 dark:text-emerald-400">
            ✓ applied · 1 hunk · re-validating
          </span>
        )}
      </p>
    </div>
  );
}

export function WorkflowStudio() {
  const reduced = usePrefersReducedMotion();
  const { trackRef, stageRef, onScreen } = useScrollStage({ enabled: !reduced });

  const [cursor, setCursor] = useState({ idx: 0, jumped: false });
  const [phase, setPhase] = useState<Phase>(reduced ? 'dwell' : 'work');
  const [paused, setPaused] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [askTyped, setAskTyped] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [phasePart, setPhasePart] = useState(0);
  const [tabOverride, setTabOverride] = useState<TabId | null>(null);

  /** The scenario idles while it is off screen so it never plays to nobody. */
  const halted = paused || !onScreen;

  const stepIdx = cursor.idx;
  const step = STEPS[stepIdx];
  const script = stepScripts[step];
  const focus = stepFocus[step];
  const usesRunPhase = Boolean(focus.review || script.cmd);
  const timeline = useMemo(() => buildTimeline(step), [step]);

  /** Everything the step produced is on screen once the work phase is over. */
  const shownEvents = phase === 'work' ? visibleEvents : script.events.length;

  const inlineIdx = STEPS.indexOf('inline');
  const ruleTuned = Boolean(
    stepIdx > inlineIdx || (focus.inlineEdit && shownEvents >= INLINE_APPLY_AT),
  );
  const fileText = useCallback(
    (path: DemoPath) => (path === RULE_PATH && ruleTuned ? INLINE_EDIT.tuned : DEMO_FILES[path]),
    [ruleTuned],
  );
  const fullText =
    focus.type && focus.active != null && focus.active !== REVIEW_TAB
      ? fileText(focus.active)
      : '';

  const [seen, setSeen] = useState(cursor);
  if (seen !== cursor) {
    setSeen(cursor);
    const complete = cursor.jumped || reduced;
    setTypedChars(complete || !focus.type ? fullText.length : 0);
    setVisibleEvents(complete ? script.events.length : 0);
    setAskTyped(complete ? INLINE_EDIT.ask.length : 0);
    setSubmitted(complete);
    setPhasePart(complete ? 1 : 0);
    setPhase(complete ? 'dwell' : 'work');
    setTabOverride(null);
  }

  const haltedRef = useRef(halted);
  useEffect(() => {
    haltedRef.current = halted;
  }, [halted]);

  useEffect(() => {
    if (phase !== 'work') return;

    const finishWork = () => {
      setPhasePart(1);
      setPhase(usesRunPhase ? 'run' : 'dwell');
    };

    if (reduced) {
      const frame = window.requestAnimationFrame(() => {
        setTypedChars(fullText.length);
        setVisibleEvents(script.events.length);
        setAskTyped(INLINE_EDIT.ask.length);
        setSubmitted(true);
        finishWork();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    // Chunky typing reads as a machine writing the file rather than a person at a keyboard.
    const chunk = Math.max(1, Math.ceil(fullText.length / TIMING.typeTicks));
    const shown = { events: -1, chars: -1, ask: -1, submitted: !submitted, part: -1 };

    let raf = 0;
    let elapsed = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (!haltedRef.current) elapsed += delta;

      let events = 0;
      while (events < timeline.eventAt.length && elapsed >= timeline.eventAt[events]) events += 1;
      if (events !== shown.events) {
        shown.events = events;
        setVisibleEvents(events);
      }

      if (fullText.length > 0) {
        const ratio = clamp01((elapsed - timeline.typeFrom) / (timeline.typeTo - timeline.typeFrom));
        const chars = Math.min(fullText.length, Math.ceil((ratio * fullText.length) / chunk) * chunk);
        if (chars !== shown.chars) {
          shown.chars = chars;
          setTypedChars(chars);
        }
      }

      if (Number.isFinite(timeline.askTo)) {
        const ask = Math.round(clamp01(elapsed / timeline.askTo) * INLINE_EDIT.ask.length);
        if (ask !== shown.ask) {
          shown.ask = ask;
          setAskTyped(ask);
        }
        const isSubmitted = elapsed >= timeline.submitAt;
        if (isSubmitted !== shown.submitted) {
          shown.submitted = isSubmitted;
          setSubmitted(isSubmitted);
        }
      }

      const part = Math.round(clamp01(elapsed / timeline.duration) * 200) / 200;
      if (part !== shown.part) {
        shown.part = part;
        setPhasePart(part);
      }

      if (elapsed >= timeline.duration) {
        finishWork();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIdx, reduced, timeline, fullText, script.events.length, usesRunPhase]);

  const onRunComplete = useCallback(() => {
    setPhase('dwell');
    setPhasePart(1);
  }, []);

  const onRunProgress = useCallback((r: number) => setPhasePart(r), []);

  useEffect(() => {
    if (halted || phase !== 'dwell') return;
    const dwell = reduced
      ? TIMING.dwellReduced
      : cursor.jumped
        ? TIMING.dwellJumped
        : TIMING.dwell;
    const id = window.setTimeout(() => {
      setCursor((c) => ({ idx: c.idx >= STEPS.length - 1 ? 0 : c.idx + 1, jumped: false }));
    }, dwell);
    return () => window.clearTimeout(id);
  }, [phase, cursor, halted, reduced]);

  const openTabs = useMemo(() => {
    const seen = new Set<TabId>();
    const acc: TabId[] = [];
    for (let i = 0; i <= stepIdx; i++) {
      const s = stepFocus[STEPS[i]];
      for (const p of s.opens) {
        if (seen.has(p)) continue;
        seen.add(p);
        acc.push(p);
      }
      if (s.review && !seen.has(REVIEW_TAB)) {
        seen.add(REVIEW_TAB);
        acc.push(REVIEW_TAB);
      }
    }
    return acc;
  }, [stepIdx]);

  const filePaths = useMemo(
    () => openTabs.filter((t): t is DemoPath => t !== REVIEW_TAB),
    [openTabs],
  );

  /** Folders stay open for every file that has become a tab. */
  const expandedDirs = useMemo(() => {
    const dirs = new Set<string>(['objects', 'objects/threats', 'objects/objectives', 'objects/rules']);
    for (const path of filePaths) {
      const parts = path.split('/');
      parts.pop();
      let acc = '';
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        dirs.add(acc);
      }
    }
    return [...dirs];
  }, [filePaths]);

  const activeTab: TabId | null = tabOverride ?? focus.active;
  const isReviewTab = activeTab === REVIEW_TAB;
  const activePath: DemoPath | null =
    activeTab == null || activeTab === REVIEW_TAB ? null : activeTab;
  const drivenTab = activeTab != null && activeTab === focus.active;
  const showIdle = activeTab == null && !focus.review;

  const typing = Boolean(
    focus.type && phase === 'work' && typedChars > 0 && typedChars < fullText.length,
  );

  const inlineActive = Boolean(focus.inlineEdit && activePath === RULE_PATH);
  const inlineApplied = Boolean(focus.inlineEdit && ruleTuned);
  const inlineState: InlineState = inlineApplied ? 'applied' : submitted ? 'working' : 'typing';

  const phaseLabel =
    phase === 'work'
      ? focus.inlineEdit
        ? inlineState === 'typing'
          ? 'Composing request'
          : inlineState === 'working'
            ? 'Applying edit'
            : 'Edit applied'
        : typing
          ? 'Writing file'
          : showIdle
            ? 'Reading brief'
            : 'Agent working'
      : phase === 'run'
        ? focus.review
          ? 'Pipeline running'
          : 'Running CLI'
        : 'Next stage';

  // Selection stays highlighted while the request is composed; it only reads as a change once applied.
  const highlight: EditorHighlight | undefined = inlineActive
    ? inlineApplied
      ? { ...INLINE_SPAN.tuned, tone: 'change' }
      : { ...INLINE_SPAN.base, tone: 'select' }
    : undefined;

  const editorText =
    activePath == null
      ? ''
      : drivenTab && focus.type && phase === 'work'
        ? fullText.slice(0, typedChars)
        : fileText(activePath);

  const reviewFiles = useMemo(
    () =>
      DEMO_PATHS.map((path) => ({
        path,
        added: (path === RULE_PATH ? INLINE_EDIT.tuned : DEMO_FILES[path])
          .trimEnd()
          .split('\n').length,
      })),
    [],
  );

  const runArmed = phase === 'run' || phase === 'dwell';

  return (
    <div ref={trackRef} className="landing-studio-track">
      <div ref={stageRef} className="landing-studio">
        <ScenarioChrome
          stepIdx={stepIdx}
          phasePart={phasePart}
          phase={phase}
          label={phaseLabel}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onSelectStep={(i) => setCursor({ idx: i, jumped: true })}
        />

        <div className="landing-studio-frame overflow-hidden border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_20px_60px_-28px_var(--landing-btn-shadow)]">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--landing-border-subtle)] bg-[var(--landing-surface-raised)] px-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
            <span className="ml-2 truncate font-mono text-[11px] text-[var(--landing-subtle)]">
              {isReviewTab
                ? `${DEMO_REPO} · ${REVIEW_MR.id}`
                : activePath
                  ? `${DEMO_REPO} / ${activePath}`
                  : `${DEMO_REPO} · brief`}
            </span>
            {stepIdx >= STEPS.indexOf('threat') && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--landing-ink)_7%,transparent)] px-2 py-0.5 font-mono text-[9px] text-[var(--landing-muted)] md:inline-flex">
                <GitBranch className="size-2.5" aria-hidden />
                {DEMO_BRANCH}
              </span>
            )}
            <span className="ml-auto shrink-0 font-mono text-[9px] text-[var(--landing-dim)]">
              {paused ? 'Paused' : `${phaseLabel}…`}
            </span>
          </div>

          <div className="landing-studio-body grid grid-cols-1 lg:grid-cols-[40px_200px_minmax(0,1fr)_minmax(250px,0.42fr)]">
            <div className="hidden flex-col items-center gap-3 border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface-raised)] py-3 lg:flex">
              <Files className="size-4 text-[var(--landing-accent)]" aria-hidden />
              <FileText className="size-4 text-[var(--landing-dim)]" aria-hidden />
              <Bot className="size-4 text-[var(--landing-accent)]" aria-hidden />
              <Terminal className="size-4 text-[var(--landing-subtle)]" aria-hidden />
            </div>

            <div className="pointer-events-none hidden min-h-0 overflow-hidden border-r border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] lg:block">
              <StudioExplorer
                paths={DEMO_PATHS}
                open={activePath ?? ''}
                selected={focus.select}
                expanded={expandedDirs}
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[var(--landing-border-subtle)] bg-[var(--landing-bg)]">
              <div
                className="landing-code-scroll flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto bg-[var(--landing-surface)] px-1.5"
                role="tablist"
                aria-label="Open editors"
              >
                {openTabs.length === 0 ? (
                  <span className="px-2 font-mono text-[10px] text-[var(--landing-dim)]">No file open</span>
                ) : (
                  openTabs.map((tab) => {
                    const active = tab === activeTab;
                    const review = tab === REVIEW_TAB;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTabOverride(tab)}
                        className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2 py-1.5 font-mono text-[10px] transition-colors ${
                          active
                            ? 'border-[var(--landing-accent)] text-[var(--landing-ink)]'
                            : 'border-transparent text-[var(--landing-dim)] hover:text-[var(--landing-muted)]'
                        }`}
                      >
                        {review ? (
                          <GitPullRequest
                            className={`size-3 ${active ? 'text-[var(--landing-accent)]' : ''}`}
                            aria-hidden
                          />
                        ) : (
                          <FileCode2
                            className={`size-3 ${active ? 'text-[var(--landing-accent)]' : ''}`}
                            aria-hidden
                          />
                        )}
                        {review ? `${REVIEW_MR.id} review` : tab.split('/').pop()}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {focus.review && (
                  <div className={isReviewTab ? 'h-full' : 'hidden'}>
                    <StudioReviewTab
                      key={`${step}-review`}
                      mr={REVIEW_MR}
                      jobs={REVIEW_JOBS}
                      files={reviewFiles}
                      armed={runArmed}
                      paused={halted}
                      instant={reduced || phase === 'dwell'}
                      onProgress={phase === 'run' ? onRunProgress : undefined}
                      onComplete={phase === 'run' ? onRunComplete : undefined}
                    />
                  </div>
                )}
                {showIdle ? (
                  <StudioEditorIdle message="Brief in the agent trace — objects appear as the agent authors them." />
                ) : activePath ? (
                  <StudioEditor
                    path={activePath}
                    contents={editorText}
                    showCursor={!halted && typing && drivenTab}
                    highlight={highlight}
                    widget={
                      inlineActive ? (
                        <InlineEditWidget
                          key={`${step}-widget`}
                          ask={INLINE_EDIT.ask}
                          typed={phase === 'work' ? askTyped : INLINE_EDIT.ask.length}
                          state={inlineState}
                        />
                      ) : undefined
                    }
                    widgetLine={inlineActive ? highlight?.to : undefined}
                    follow={
                      inlineActive
                        ? INLINE_SPAN.base.from
                        : drivenTab && focus.type
                          ? 'bottom'
                          : 'top'
                    }
                  />
                ) : null}
              </div>

              {!focus.review &&
                (script.cmd ? (
                  <StudioTerminal
                    key={`${step}-term`}
                    cmd={script.cmd}
                    out={script.out}
                    armed={runArmed}
                    paused={halted}
                    instant={reduced || phase === 'dwell'}
                    onProgress={phase === 'run' ? onRunProgress : undefined}
                    onComplete={phase === 'run' ? onRunComplete : undefined}
                  />
                ) : (
                  <div className="flex h-10 shrink-0 items-center border-t border-[var(--landing-border-subtle)] bg-[var(--landing-surface-deep)] px-3">
                    <span className="font-mono text-[10px] text-[var(--landing-dim)]">
                      <span className="text-[var(--landing-accent)]">$</span> reading repository
                      configuration…
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden border-t border-[var(--landing-border-subtle)] max-lg:min-h-[220px] lg:border-t-0">
              <AgentTracePanel
                key={`${step}-trace`}
                label={stepLabel[step]}
                events={script.events}
                visibleCount={shownEvents}
                animate={!reduced && phase === 'work'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
