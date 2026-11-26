'use client';

import { Check, ChevronDown, Copy, Loader2, Play, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Tag } from '@/components/landing/ui';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { INTEGRATIONS } from '@/lib/landing/integrations';
import type { CompiledRule, DeployTarget } from '@/lib/playground/compile';
import { simulateHits } from '@/lib/playground/simulate';

type StepId = 'validate' | 'compile' | 'plan' | 'apply' | 'run';
type StepState = 'pending' | 'active' | 'done' | 'failed' | 'skipped';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'validate', label: 'Validate' },
  { id: 'compile', label: 'Compile' },
  { id: 'plan', label: 'Plan' },
  { id: 'apply', label: 'Apply' },
  { id: 'run', label: 'First run' },
];

/** What is deployed on each simulated platform, so a second deploy can say "updated" or "unchanged". */
type Deployed = Record<string, { artefact: string; at: number; target: DeployTarget }>;

/** One line under a step: what it found, in a sentence or a request. */
type Note = { text: string; tone?: 'mono' | 'warn' };

export function integrationOf(key: string) {
  return INTEGRATIONS.find((i) => i.key === key);
}

export function PlatformLogo({ platform, size = 20 }: { platform: string; size?: number }) {
  const integration = integrationOf(platform);
  if (!integration) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-md bg-[var(--landing-hover)] font-mono text-[10px] text-[var(--landing-subtle)]"
        aria-hidden
      >
        {platform.slice(0, 2)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={integration.src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain ${integration.kind === 'mono' ? 'opacity-90 dark:invert' : ''} ${integration.kind === 'raster' ? 'rounded' : ''}`}
      aria-hidden
    />
  );
}

/** The tab label: the product, without the vendor (`Sentinel`, `Splunk`, `Defender for Endpoint`). */
function shortName(key: string) {
  const name = integrationOf(key)?.name ?? key;
  return name.replace(/^(Microsoft|Google|Elastic|CrowdStrike)\s+/, '').replace(/\s+(Enterprise Security|Security|Cloud)$/, '') || name;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function httpFor(target: DeployTarget, tenant: string, verb: 'create' | 'update' | 'disable' | 'delete', uuid: string) {
  const id = uuid || 'rule';
  switch (target.key) {
    case 'sentinel':
      return verb === 'delete'
        ? `DELETE …/workspaces/${tenant}/providers/Microsoft.SecurityInsights/alertRules/${id} → 200`
        : `PUT …/workspaces/${tenant}/providers/Microsoft.SecurityInsights/alertRules/${id} → ${verb === 'create' ? '201 Created' : '200 OK'}`;
    case 'splunk':
      return verb === 'create'
        ? `POST /servicesNS/nobody/SplunkEnterpriseSecuritySuite/saved/searches (${tenant}) → 201 Created`
        : `${verb === 'delete' ? 'DELETE' : 'POST'} /servicesNS/nobody/SplunkEnterpriseSecuritySuite/saved/searches/${encodeURIComponent(target.title).slice(0, 28)}… (${tenant}) → 200 OK`;
    default:
      return `${verb === 'delete' ? 'DELETE' : verb === 'create' ? 'POST' : 'PUT'} ${target.key} API (${tenant}) → ${verb === 'create' ? '201 Created' : '200 OK'}`;
  }
}


/**
 * The deploy side of the playground: the platforms the rule's `configurations` reach, each opening
 * onto what it would receive and, once deployed, what it raised; then a timeline that only appears
 * once Deploy is pressed. Everything here is simulated and says so.
 */
export function DeployPanel({
  compiled,
  compileNow,
  rulePath,
  errors,
  warnings,
  engineReady,
  onShowProblems,
}: {
  compiled: CompiledRule | null;
  /** Compile from the editors as they are at the moment Deploy is pressed. */
  compileNow: () => CompiledRule;
  rulePath: string | null;
  /** opentide's errors across the workspace, with the file each is in. */
  errors: { path: string; message: string; line: number }[];
  warnings: number;
  engineReady: boolean;
  onShowProblems: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [steps, setSteps] = useState<Record<StepId, StepState> | null>(null);
  const [notes, setNotes] = useState<Partial<Record<StepId, Note[]>>>({});
  const [running, setRunning] = useState(false);
  const [deployed, setDeployed] = useState<Deployed>({});
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const cancelled = useRef(false);
  // Read after the validate pause: diagnostics for an edit made just before Deploy land meanwhile.
  const latest = useRef({ errors, warnings, engineReady });
  useEffect(() => {
    latest.current = { errors, warnings, engineReady };
  });
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const targets = compiled?.targets ?? [];
  const pace = (ms: number) => (reduced ? Promise.resolve() : wait(ms));

  async function run() {
    if (running) return;
    const compiled = compileNow();
    const live = compiled.targets.filter((t) => t.action !== 'skip');
    cancelled.current = false;
    setRunning(true);
    setOutcome(null);
    const state: Record<StepId, StepState> = { validate: 'pending', compile: 'pending', plan: 'pending', apply: 'pending', run: 'pending' };
    const noted: Partial<Record<StepId, Note[]>> = {};
    const set = (id: StepId, value: StepState) => {
      state[id] = value;
      if (!cancelled.current) setSteps({ ...state });
    };
    const note = (id: StepId, ...lines: Note[]) => {
      noted[id] = [...(noted[id] ?? []), ...lines];
      if (!cancelled.current) setNotes({ ...noted });
    };
    setNotes({});
    const fail = (id: StepId, message: string) => {
      set(id, 'failed');
      setOutcome({ ok: false, message });
      setRunning(false);
    };

    // 1. Validate: opentide's own diagnostics across the workspace.
    set('validate', 'active');
    await wait(reduced ? 350 : 750);
    const { errors, warnings, engineReady } = latest.current;
    if (!engineReady) {
      set('validate', 'skipped');
      note('validate', { text: 'opentide is still loading, so this preview skips validation', tone: 'warn' });
    } else if (errors.length) {
      note('validate', ...errors.slice(0, 4).map((e) => ({ text: `${baseName(e.path)}:${e.line}  ${e.message}`, tone: 'mono' as const })));
      fail('validate', `${errors.length} error${errors.length === 1 ? '' : 's'}: deploy stops before anything reaches a platform.`);
      return;
    } else {
      set('validate', 'done');
      note('validate', { text: `no errors${warnings ? `, ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}` });
    }

    // 2. Compile.
    set('compile', 'active');
    await pace(550);
    if (compiled.error) return fail('compile', compiled.error);
    if (!live.length) return fail('compile', 'No enabled configurations block: there is nothing to deploy.');
    for (const t of live) {
      note('compile', { text: `${shortName(t.key)}: ${t.artefact.label}${t.modifiers.length ? ` · ${t.modifiers.join(', ')}` : ''}`, tone: 'mono' });
      for (const w of t.warnings) note('compile', { text: `${shortName(t.key)}: ${w}`, tone: 'warn' });
    }
    const blocking = live.flatMap((t) => t.warnings.filter((w) => /fails deploy|needs a cron/.test(w)).map((w) => `${shortName(t.key)}: ${w}`));
    if (blocking.length) return fail('compile', blocking[0]);
    set('compile', 'done');

    // 3. Plan.
    set('plan', 'active');
    await pace(450);
    const plan = live.map((t) => {
      const before = deployed[t.key];
      const verb: 'create' | 'update' | 'unchanged' | 'disable' | 'delete' =
        t.action === 'disable' ? 'disable' : t.action === 'delete' ? 'delete' : !before ? 'create' : before.artefact === t.artefact.text ? 'unchanged' : 'update';
      return { t, verb };
    });
    for (const { t, verb } of plan) {
      note('plan', {
        text: t.tenants.length ? `${verb} in ${shortName(t.key)} · ${t.tenants.join(', ')}` : `skip ${shortName(t.key)}: no tenant takes ${t.strategy}`,
      });
    }
    set('plan', 'done');

    // 4. Apply.
    set('apply', 'active');
    const next: Deployed = { ...deployed };
    for (const { t, verb } of plan) {
      if (!t.tenants.length) continue;
      for (const tenant of t.tenants) {
        await pace(380);
        note('apply', { text: verb === 'unchanged' ? `${tenant}: up to date` : httpFor(t, tenant, verb, compiled.uuid), tone: 'mono' });
      }
      if (verb === 'delete') delete next[t.key];
      else next[t.key] = { artefact: t.artefact.text, at: Date.now(), target: t };
    }
    setDeployed(next);
    set('apply', 'done');

    // 5. First run.
    set('run', 'active');
    await pace(700);
    const ran = plan.filter((p) => p.verb !== 'delete' && p.verb !== 'disable' && p.t.tenants.length);
    for (const { t } of ran) note('run', { text: `${shortName(t.key)}: 3 results over the last ${t.every || 'window'}` });
    set('run', ran.length ? 'done' : 'skipped');
    setOpen(ran[0]?.t.key ?? null);
    setOutcome({
      ok: true,
      message: ran.length ? `Live in ${ran.map((p) => shortName(p.t.key)).join(' and ')}.` : 'Nothing is live: no tenant takes this status.',
    });
    setRunning(false);
  }

  function reset() {
    setDeployed({});
    setOutcome(null);
    setSteps(null);
    setNotes({});
    setOpen(null);
  }

  const blocked = !compiled || Boolean(compiled.error && !compiled.targets.length);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="landing-playground-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            Deploy
            <Tag tone="dashed">simulated</Tag>
          </h2>
          {Object.keys(deployed).length > 0 && !running && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
            >
              <RotateCcw className="size-3" aria-hidden />
              Tear down
            </button>
          )}
        </div>

        {compiled?.error && !compiled.targets.length ? (
          <p className="mt-4 text-sm leading-relaxed text-[var(--landing-muted)]">{compiled.error}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-[var(--landing-muted)]">
              <span className="text-[var(--landing-ink)]">{compiled?.name}</span>
              {compiled && (
                <>
                  {' '}
                  is <span className="font-mono text-[12.5px] text-[var(--landing-accent)]">{compiled.status}</span>
                </>
              )}
            </p>

            <ul className="mt-4 border-t border-[var(--landing-border)]">
              {targets.map((t) => (
                <PlatformRow
                  key={t.key}
                  target={t}
                  deployed={deployed[t.key]}
                  uuid={compiled?.uuid ?? ''}
                  open={open === t.key}
                  onToggle={() => setOpen((o) => (o === t.key ? null : t.key))}
                />
              ))}
              {!targets.length && <li className="py-4 text-sm text-[var(--landing-muted)]">This rule has no configurations block.</li>}
            </ul>
          </>
        )}

        {steps && (
          <ol className="landing-playground-in mt-6">
            {STEPS.map((step, i) => (
              <StepRow key={step.id} label={step.label} state={steps[step.id]} notes={notes[step.id]} last={i === STEPS.length - 1} />
            ))}
          </ol>
        )}

        {outcome && (
          <div className="landing-playground-in mt-1 flex items-start gap-2.5 pb-2 text-sm">
            {outcome.ok ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-[var(--landing-muted)]" aria-hidden />
            )}
            <p className="min-w-0">
              {outcome.message}
              {!outcome.ok && errors.length > 0 && (
                <>
                  {' '}
                  <button type="button" onClick={onShowProblems} className="text-[var(--landing-accent)] underline underline-offset-2">
                    Show the problems
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || blocked}
          className="landing-btn-primary w-full justify-center rounded-2xl py-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {running ? 'Deploying…' : Object.keys(deployed).length ? 'Deploy again' : 'Deploy'}
        </button>
      </div>
    </div>
  );
}

const baseName = (path: string) => path.split('/').pop() ?? path;

function StepRow({ label, state, notes, last }: { label: string; state: StepState; notes?: Note[]; last: boolean }) {
  return (
    <li className="grid grid-cols-[20px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] transition-colors ${
            state === 'done'
              ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
              : state === 'active'
                ? 'text-[var(--landing-accent)] ring-1 ring-[var(--landing-accent)]'
                : state === 'failed'
                  ? 'text-[var(--landing-ink)] ring-[1.5px] ring-[var(--landing-ink)]'
                  : 'ring-1 ring-[var(--landing-border)]'
          }`}
        >
          {state === 'done' ? (
            <Check className="size-3" aria-hidden />
          ) : state === 'failed' ? (
            <X className="size-3" aria-hidden />
          ) : state === 'active' ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : null}
        </span>
        {!last && (
          <span
            data-active={state === 'active' ? '' : undefined}
            className={`landing-playground-rail my-1 w-px flex-1 ${state === 'done' ? 'bg-[var(--landing-accent)]' : 'bg-[var(--landing-border)]'}`}
          />
        )}
      </div>
      <div className={`min-w-0 pb-4 ${state === 'pending' ? 'opacity-45' : ''}`}>
        <p className="text-sm font-medium leading-5">
          {label}
          {state === 'skipped' && <span className="ml-2 text-xs font-normal text-[var(--landing-subtle)]">skipped</span>}
        </p>
        {notes?.map((n, i) => (
          <p
            key={i}
            className={`landing-playground-in mt-1 break-words ${
              n.tone === 'mono' ? 'font-mono text-[11px] text-[var(--landing-subtle)]' : 'text-xs text-[var(--landing-muted)]'
            } ${n.tone === 'warn' ? 'text-[var(--landing-ink)]' : ''}`}
          >
            {n.tone === 'warn' && <TriangleAlert className="mr-1 inline size-3 -translate-y-px text-[var(--landing-accent)]" aria-hidden />}
            {n.text}
          </p>
        ))}
      </div>
    </li>
  );
}

/**
 * One platform: where the rule lands and how, opening onto what it raised once deployed and the
 * payload it receives, compiled live from the editor.
 */
function PlatformRow({
  target,
  deployed,
  uuid,
  open,
  onToggle,
}: {
  target: DeployTarget;
  deployed?: Deployed[string];
  uuid: string;
  open: boolean;
  onToggle: () => void;
}) {
  const integration = integrationOf(target.key);
  const live = Boolean(deployed) && deployed?.target.action !== 'disable';
  const stale = deployed && deployed.artefact !== target.artefact.text;
  const state =
    target.action === 'skip'
      ? 'disabled'
      : live
        ? stale
          ? 'changed'
          : 'live'
        : !target.tenants.length
          ? 'no tenant'
          : target.strategy.toLowerCase();
  return (
    <li className="border-b border-[var(--landing-border)]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="group flex w-full items-center gap-3 py-3 text-left">
        <PlatformLogo platform={target.key} size={26} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">{integration?.name ?? target.key}</span>
          <span className="block truncate text-xs text-[var(--landing-subtle)]">
            {integration?.deploys ?? 'rule'}
            {target.tenants.length > 0 && <> · {target.tenants.join(', ')}</>}
          </span>
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] ${
            live ? 'bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] text-[var(--landing-accent)]' : 'text-[var(--landing-subtle)]'
          }`}
        >
          {live && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
          {state}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-[var(--landing-subtle)] transition-transform group-hover:text-[var(--landing-ink)] ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="landing-playground-in pb-4">
          <p className="text-[13px] leading-snug">
            <TitleWithModifier title={target.title} />
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--landing-subtle)]">
            <span>{target.severity}</span>
            {target.every && <span>every {target.every}</span>}
            {target.modifiers.length > 0 && <span>modified by {target.modifiers.join(', ')}</span>}
          </p>
          {target.warnings.map((w) => (
            <p key={w} className="mt-2 flex items-start gap-1.5 text-xs">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              {w}
            </p>
          ))}
          {live && deployed && <Raised entry={deployed} uuid={uuid} />}
          <Payload target={target} />
        </div>
      )}
    </li>
  );
}

/** What the deployed rule raised on its first run: alerts named from the rows, then the rows. */
function Raised({ entry, uuid }: { entry: Deployed[string]; uuid: string }) {
  const { target, at } = entry;
  const hits = useMemo(() => simulateHits(target.query, `${uuid}:${target.key}`, 3, at), [target.query, target.key, uuid, at]);
  const noun = target.key === 'sentinel' ? 'incidents' : target.key === 'splunk' ? 'notable events' : 'alerts';
  return (
    <div className="mt-4">
      <p className="text-xs text-[var(--landing-subtle)]">
        First run · {hits.rows.length} {noun}
      </p>
      <ul className="mt-2 grid gap-2">
        {hits.rows.map((row, i) => (
          <li key={i} className="landing-playground-in flex items-start gap-2.5" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[13px]">{fillTitle(target.title, row)}</span>
              <span className="block truncate font-mono text-[10.5px] text-[var(--landing-subtle)]">{Object.values(row).slice(0, 3).join(' · ')}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The payload the platform receives, highlighted, with a copy button. */
function Payload({ target }: { target: DeployTarget }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-[var(--pg-code-bg)]">
      <div className="flex items-center justify-between px-3 pt-2.5 font-mono text-[10.5px] text-[var(--pg-dim)]">
        <span className="truncate">{target.artefact.label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(target.artefact.text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="landing-playground-scroll m-0 max-h-80 overflow-auto px-3 pb-3 pt-2 font-mono text-[11px] leading-relaxed">
        <code>
          <Highlighted text={target.artefact.text} language={target.artefact.language} />
        </code>
      </pre>
    </div>
  );
}
function fillTitle(title: string, row: Record<string, string>) {
  return title.replace(/\{\{\s*(\w+)\s*\}\}|\$(\w+)\$/g, (m, a, b) => row[a ?? b] ?? m);
}


function TitleWithModifier({ title }: { title: string }) {
  const m = /^(\[[^\]]+\]\s*)(.*)$/.exec(title);
  if (!m) return <>{title}</>;
  return (
    <>
      <span className="rounded bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-1 text-[var(--landing-accent)]">{m[1].trim()}</span> {m[2]}
    </>
  );
}

/** JSON and `savedsearches.conf` coloured in the editor's palette. */
function Highlighted({ text, language }: { text: string; language: 'json' | 'conf' }) {
  const parts: ReactNode[] = [];
  if (language === 'conf') {
    text.split('\n').forEach((line, i) => {
      if (i) parts.push('\n');
      const stanza = /^\[.*\]$/.test(line);
      const eq = line.indexOf(' = ');
      if (stanza) parts.push(<span key={i} className="text-[var(--pg-yellow)]">{line}</span>);
      else if (eq > 0)
        parts.push(
          <span key={i}>
            <span className="text-[var(--pg-foam)]">{line.slice(0, eq)}</span>
            <span className="text-[var(--pg-dim)]"> = </span>
            <span className="text-[var(--pg-string)]">{line.slice(eq + 3)}</span>
          </span>,
        );
      else parts.push(<span key={i} className="text-[var(--pg-string)]">{line}</span>);
    });
    return <>{parts}</>;
  }
  const token = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
  let last = 0;
  for (const m of text.matchAll(token)) {
    if (m.index > last) parts.push(<span key={`p${last}`} className="text-[var(--pg-dim)]">{text.slice(last, m.index)}</span>);
    const [whole, str, colon, keyword, number] = m;
    if (str && colon) parts.push(<span key={m.index} className="text-[var(--pg-foam)]">{str}<span className="text-[var(--pg-dim)]">{colon}</span></span>);
    else if (str) parts.push(<span key={m.index} className="text-[var(--pg-string)]">{str}</span>);
    else if (keyword) parts.push(<span key={m.index} className="text-[var(--pg-number)]">{keyword}</span>);
    else if (number) parts.push(<span key={m.index} className="text-[var(--pg-number)]">{number}</span>);
    last = m.index + whole.length;
  }
  if (last < text.length) parts.push(<span key="end" className="text-[var(--pg-dim)]">{text.slice(last)}</span>);
  return <>{parts}</>;
}
