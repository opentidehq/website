'use client';

import { Check, ChevronRight, Copy, Loader2, Play, RotateCcw, Rocket, TriangleAlert, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Tag } from '@/components/landing/ui';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { INTEGRATIONS } from '@/lib/landing/integrations';
import type { CompiledRule, DeployTarget } from '@/lib/playground/compile';
import { simulateHits } from '@/lib/playground/simulate';

export type LogLine = { kind: 'cmd' | 'ok' | 'info' | 'warn' | 'err' | 'dim' | 'http'; text: string };

type StepId = 'validate' | 'compile' | 'plan' | 'apply' | 'run';
type StepState = 'pending' | 'active' | 'done' | 'failed' | 'skipped';

const STEPS: { id: StepId; label: string; detail: string }[] = [
  { id: 'validate', label: 'Validate', detail: 'opentide validate --strict' },
  { id: 'compile', label: 'Compile', detail: 'each configurations block' },
  { id: 'plan', label: 'Plan', detail: 'diff against what is deployed' },
  { id: 'apply', label: 'Apply', detail: 'push to the tenants' },
  { id: 'run', label: 'First run', detail: 'the rule runs on schedule' },
];

/** What is deployed on each simulated platform, so a second deploy can say "updated" or "unchanged". */
type Deployed = Record<string, { artefact: string; at: number; target: DeployTarget }>;

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

export function DeployPanel({
  compiled: shown,
  compileNow,
  rulePath,
  errors,
  warnings,
  engineReady,
  onLog,
  onShowProblems,
}: {
  compiled: CompiledRule | null;
  /** Compile from the editors as they are at the moment Deploy is pressed. */
  compileNow: () => CompiledRule;
  rulePath: string | null;
  /** Engine errors across the workspace, with the file each is in. */
  errors: { path: string; message: string; line: number }[];
  warnings: number;
  engineReady: boolean;
  onLog: (lines: LogLine[] | 'clear') => void;
  onShowProblems: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [steps, setSteps] = useState<Record<StepId, StepState>>(() => idleSteps());
  const [running, setRunning] = useState(false);
  const [deployed, setDeployed] = useState<Deployed>({});
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string; at: number } | null>(null);
  const [view, setView] = useState<string | null>(null);
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

  const compiled = shown;
  const targets = compiled?.targets ?? [];
  const deployedKeys = Object.keys(deployed);
  const selected = view && deployed[view] ? view : deployedKeys[0] ?? null;

  const pace = (ms: number) => (reduced ? Promise.resolve() : wait(ms));

  async function run() {
    if (running) return;
    const compiled = compileNow();
    const live = compiled.targets.filter((t) => t.action !== 'skip');
    cancelled.current = false;
    setRunning(true);
    setOutcome(null);
    const state = idleSteps();
    const set = (id: StepId, value: StepState) => {
      state[id] = value;
      setSteps({ ...state });
    };
    const log = (lines: LogLine[]) => !cancelled.current && onLog(lines);
    onLog('clear');
    const strategies = [...new Set(live.map((t) => t.strategy))].join(',') || 'PREVIEW';
    log([{ kind: 'cmd', text: `opentide deploy ${rulePath ?? ''} --strategy ${strategies}` }]);
    const fail = (message: string) => {
      setOutcome({ ok: false, message, at: Date.now() });
      log([{ kind: 'err', text: `✗ ${message}` }]);
      setRunning(false);
    };

    // 1. Validate: the engine's own diagnostics across the workspace.
    set('validate', 'active');
    await (reduced ? wait(350) : wait(750));
    const { errors, warnings, engineReady } = latest.current;
    if (!engineReady) {
      set('validate', 'skipped');
      log([{ kind: 'warn', text: '! opentide still loading: validation skipped in this preview' }]);
    } else if (errors.length) {
      set('validate', 'failed');
      log([
        { kind: 'err', text: `✗ validate: ${errors.length} error${errors.length === 1 ? '' : 's'}` },
        ...errors.slice(0, 6).map((e) => ({ kind: 'dim' as const, text: `  ${e.path}:${e.line}  ${e.message}` })),
      ]);
      fail('Validation failed: deploy stops before anything reaches a platform.');
      return;
    } else {
      set('validate', 'done');
      log([{ kind: 'ok', text: `✓ validate: 0 errors${warnings ? `, ${warnings} warning${warnings === 1 ? '' : 's'}` : ''} (opentide, WebAssembly)` }]);
    }

    // 2. Compile.
    set('compile', 'active');
    await pace(600);
    if (compiled.error) {
      set('compile', 'failed');
      fail(compiled.error);
      return;
    }
    if (!live.length) {
      set('compile', 'failed');
      fail('No enabled configurations block: there is nothing to deploy.');
      return;
    }
    const blocking = live.flatMap((t) => t.warnings.filter((w) => /fails deploy|needs a cron/.test(w)).map((w) => `${t.key}: ${w}`));
    for (const t of live) {
      log([{ kind: 'info', text: `  ${t.key.padEnd(10)} ${t.artefact.label}${t.modifiers.length ? `  · modifiers: ${t.modifiers.join(', ')}` : ''}` }]);
      for (const w of t.warnings) log([{ kind: 'warn', text: `  ! ${t.key}: ${w}` }]);
    }
    if (blocking.length) {
      set('compile', 'failed');
      fail(blocking[0]);
      return;
    }
    set('compile', 'done');
    log([{ kind: 'ok', text: `✓ compiled ${live.length} block${live.length === 1 ? '' : 's'}` }]);

    // 3. Plan.
    set('plan', 'active');
    await pace(500);
    const plan = live.map((t) => {
      const before = deployed[t.key];
      const verb: 'create' | 'update' | 'unchanged' | 'disable' | 'delete' =
        t.action === 'disable' ? 'disable' : t.action === 'delete' ? 'delete' : !before ? 'create' : before.artefact === t.artefact.text ? 'unchanged' : 'update';
      return { t, verb };
    });
    for (const { t, verb } of plan) {
      if (!t.tenants.length) {
        log([{ kind: 'dim', text: `  · skip      ${integrationOf(t.key)?.name ?? t.key}: no tenant takes ${t.strategy}` }]);
        continue;
      }
      const sign = verb === 'create' ? '+' : verb === 'update' ? '~' : verb === 'unchanged' ? '=' : '-';
      log([{ kind: verb === 'unchanged' ? 'dim' : 'info', text: `  ${sign} ${verb.padEnd(9)} ${integrationOf(t.key)?.name ?? t.key} → ${t.tenants.join(', ') || 'no tenant'}` }]);
    }
    set('plan', 'done');

    // 4. Apply.
    set('apply', 'active');
    const next: Deployed = { ...deployed };
    for (const { t, verb } of plan) {
      if (!t.tenants.length) continue;
      for (const tenant of t.tenants) {
        await pace(420);
        if (verb === 'unchanged') {
          log([{ kind: 'dim', text: `  = ${tenant}: up to date` }]);
          continue;
        }
        log([{ kind: 'http', text: `  ${httpFor(t, tenant, verb, compiled.uuid)}` }]);
      }
      if (verb === 'delete') delete next[t.key];
      else next[t.key] = { artefact: t.artefact.text, at: Date.now(), target: t };
    }
    setDeployed(next);
    set('apply', 'done');
    const reached = plan.filter((p) => p.t.tenants.length).length;
    log([{ kind: 'ok', text: `✓ deployed to ${reached} platform${reached === 1 ? '' : 's'}` }]);

    // 5. First run.
    set('run', 'active');
    await pace(800);
    const ran = plan.filter((p) => p.verb !== 'delete' && p.verb !== 'disable' && p.t.tenants.length);
    for (const { t } of ran) {
      log([{ kind: 'info', text: `  ▸ ${integrationOf(t.key)?.name ?? t.key}: ran over the last ${t.every || 'window'}, 3 results (simulated)` }]);
    }
    set('run', ran.length ? 'done' : 'skipped');
    setView(ran[0]?.t.key ?? Object.keys(next)[0] ?? null);
    setOutcome({ ok: true, message: `${compiled.name} is live in ${ran.map((p) => integrationOf(p.t.key)?.name ?? p.t.key).join(' and ') || 'no platform'}.`, at: Date.now() });
    setRunning(false);
  }

  function reset() {
    setDeployed({});
    setOutcome(null);
    setSteps(idleSteps());
    setView(null);
    onLog('clear');
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--landing-border)] px-4 py-2.5">
        <p className="flex items-center gap-2 font-mono text-xs text-[var(--landing-subtle)]">
          <Rocket className="size-3.5 text-[var(--landing-accent)]" aria-hidden />
          deploy
          <Tag tone="dashed">simulated</Tag>
        </p>
        {deployedKeys.length > 0 && !running && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
          >
            <RotateCcw className="size-3" aria-hidden />
            tear down
          </button>
        )}
      </div>

      <div className="landing-playground-scroll min-h-0 flex-1 overflow-y-auto">
        {/* What will deploy */}
        <section className="px-4 pt-4">
          {compiled?.error && !compiled.targets.length ? (
            <p className="rounded-xl border border-dashed border-[var(--landing-border)] p-4 text-sm text-[var(--landing-muted)]">{compiled.error}</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-[15px] font-semibold tracking-tight">{compiled?.name ?? 'No rule'}</h3>
                {compiled && (
                  <span className="shrink-0 font-mono text-[11px] text-[var(--landing-subtle)]">
                    status <span className="text-[var(--landing-accent)]">{compiled.status}</span>
                  </span>
                )}
              </div>
              <ul className="mt-3 grid gap-2">
                {targets.map((t) => (
                  <TargetRow key={t.key} target={t} deployed={Boolean(deployed[t.key])} />
                ))}
                {!targets.length && <li className="text-sm text-[var(--landing-muted)]">This rule has no configurations block.</li>}
              </ul>
            </>
          )}
        </section>

        {/* Pipeline */}
        <section className="px-4 pt-5">
          <ol className="grid gap-0">
            {STEPS.map((step, i) => (
              <StepRow key={step.id} step={step} state={steps[step.id]} last={i === STEPS.length - 1} />
            ))}
          </ol>
        </section>

        {outcome && (
          <div
            className={`landing-playground-in mx-4 mt-3 flex items-start gap-2 rounded-xl p-3 text-sm ${
              outcome.ok
                ? 'bg-[color-mix(in_srgb,var(--landing-accent)_10%,transparent)] text-[var(--landing-ink)]'
                : 'border border-dashed border-[var(--landing-border)] text-[var(--landing-ink)]'
            }`}
          >
            {outcome.ok ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-[var(--landing-muted)]" aria-hidden />
            )}
            <div className="min-w-0">
              <p>{outcome.message}</p>
              {!outcome.ok && errors.length > 0 && (
                <button type="button" onClick={onShowProblems} className="mt-1 font-mono text-xs text-[var(--landing-accent)] underline underline-offset-2">
                  show {errors.length} problem{errors.length === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Simulated consoles */}
        {selected && deployed[selected] && (
          <section className="landing-playground-in px-4 pb-5 pt-5">
            {deployedKeys.length > 1 && (
              <div role="tablist" aria-label="Platforms" className="mb-3 flex gap-1 rounded-full bg-[var(--landing-hover)] p-1">
                {deployedKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={key === selected}
                    onClick={() => setView(key)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium text-[var(--landing-muted)] transition aria-selected:bg-[var(--landing-panel)] aria-selected:text-[var(--landing-ink)] aria-selected:shadow-sm"
                  >
                    <PlatformLogo platform={key} size={14} />
                    <span className="truncate">{shortName(key)}</span>
                  </button>
                ))}
              </div>
            )}
            <PlatformConsole entry={deployed[selected]} uuid={compiled?.uuid ?? ''} />
          </section>
        )}
      </div>

      <div className="border-t border-[var(--landing-border)] p-3">
        <button
          type="button"
          onClick={run}
          disabled={running || !compiled || Boolean(compiled.error && !compiled.targets.length)}
          className="landing-btn-primary w-full justify-center rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {running ? 'Deploying…' : deployedKeys.length ? 'Deploy again' : 'Deploy'}
        </button>
      </div>
    </div>
  );
}

function idleSteps(): Record<StepId, StepState> {
  return { validate: 'pending', compile: 'pending', plan: 'pending', apply: 'pending', run: 'pending' };
}

function TargetRow({ target, deployed }: { target: DeployTarget; deployed: boolean }) {
  const integration = integrationOf(target.key);
  const tone = target.action === 'skip' ? 'dashed' : target.action === 'create' ? 'accent' : 'outline';
  const label =
    target.action === 'skip' ? 'disabled' : target.action === 'disable' ? 'disable' : target.action === 'delete' ? 'delete' : target.strategy.toLowerCase();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-panel)] px-3 py-2.5">
      <PlatformLogo platform={target.key} size={22} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[13px] font-medium">
          {integration?.name ?? target.key}
          {deployed && <span className="size-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]" title="deployed" />}
        </p>
        <p className="truncate font-mono text-[11px] text-[var(--landing-subtle)]">
          {integration?.deploys ?? 'rule'} → {target.tenants.join(', ') || 'no tenant'}
        </p>
      </div>
      <Tag tone={tone}>{label}</Tag>
    </li>
  );
}

function StepRow({ step, state, last }: { step: (typeof STEPS)[number]; state: StepState; last: boolean }) {
  const icon =
    state === 'done' ? (
      <Check className="size-3" aria-hidden />
    ) : state === 'failed' ? (
      <X className="size-3" aria-hidden />
    ) : state === 'active' ? (
      <Loader2 className="size-3 animate-spin" aria-hidden />
    ) : state === 'skipped' ? (
      <ChevronRight className="size-3" aria-hidden />
    ) : null;
  return (
    <li className="grid grid-cols-[22px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px] transition-colors ${
            state === 'done'
              ? 'border-[var(--landing-accent)] bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
              : state === 'active'
                ? 'border-[var(--landing-accent)] text-[var(--landing-accent)]'
                : state === 'failed'
                  ? 'border-[var(--landing-ink)] bg-[var(--landing-ink)] text-[var(--landing-bg)]'
                  : 'border-[var(--landing-border)] text-[var(--landing-subtle)]'
          }`}
        >
          {icon}
        </span>
        {!last && (
          <span
            data-active={state === 'active' ? '' : undefined}
            className={`landing-playground-rail my-1 w-px flex-1 ${state === 'done' ? 'bg-[var(--landing-accent)]' : 'bg-[var(--landing-border)]'}`}
          />
        )}
      </div>
      <div className={`pb-3 ${state === 'pending' ? 'opacity-55' : ''}`}>
        <p className="text-[13px] font-medium leading-[22px]">{step.label}</p>
        <p className="font-mono text-[11px] text-[var(--landing-subtle)]">{state === 'skipped' ? 'skipped' : step.detail}</p>
      </div>
    </li>
  );
}

/** `{{DeviceName}}` (Sentinel) and `$host$` (Splunk) filled from a result row. */
function fillTitle(title: string, row: Record<string, string>) {
  return title.replace(/\{\{\s*(\w+)\s*\}\}|\$(\w+)\$/g, (m, a, b) => row[a ?? b] ?? m);
}

function PlatformConsole({ entry, uuid }: { entry: Deployed[string]; uuid: string }) {
  const { target, at } = entry;
  const integration = integrationOf(target.key);
  const hits = useMemo(() => simulateHits(target.query, `${uuid}:${target.key}`, 3, at), [target.query, target.key, uuid, at]);
  const disabled = target.action === 'disable';
  const alertNoun = target.key === 'sentinel' ? 'Incidents' : target.key === 'splunk' ? 'Notable events' : 'Alerts';

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-panel)] shadow-[0_18px_40px_-24px_rgb(0_0_0/0.45)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--landing-border)] px-3.5 py-2.5">
        <PlatformLogo platform={target.key} size={18} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{integration?.name ?? target.key}</p>
          <p className="truncate font-mono text-[10.5px] text-[var(--landing-subtle)]">{target.tenants.join(' · ')}</p>
        </div>
        <Tag tone="dashed">simulated</Tag>
      </div>

      <div className="px-3.5 py-3">
        <p className="font-mono text-[10.5px] text-[var(--landing-subtle)]">{integration?.deploys ?? 'rule'}</p>
        <p className="mt-1 text-[13.5px] font-medium leading-snug">
          <TitleWithModifier title={target.title} />
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Tag tone={disabled ? 'outline' : 'solid'}>{disabled ? 'disabled' : 'enabled'}</Tag>
          <Tag tone="outline">{target.severity}</Tag>
          {target.every && <Tag tone="outline">every {target.every}</Tag>}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {target.facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="font-mono text-[10.5px] text-[var(--landing-subtle)]">{f.label}</dt>
              <dd className="truncate text-xs" title={f.value}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        {target.modifiers.length > 0 && (
          <p className="mt-3 rounded-lg bg-[var(--landing-hover)] px-2.5 py-2 text-xs text-[var(--landing-muted)]">
            Modifier{target.modifiers.length === 1 ? '' : 's'} applied from the platform file: <span className="text-[var(--landing-ink)]">{target.modifiers.join(', ')}</span>
          </p>
        )}
      </div>

      {!disabled && (
        <>
          <div className="border-t border-[var(--landing-border)] px-3.5 py-3">
            <p className="flex items-center justify-between font-mono text-[10.5px] text-[var(--landing-subtle)]">
              <span>{alertNoun.toLowerCase()} · last run</span>
              <span>{hits.rows.length} new</span>
            </p>
            <ul className="mt-2 grid gap-1.5">
              {hits.rows.map((row, i) => (
                <li key={i} className="landing-playground-in flex items-start gap-2 text-xs" style={{ animationDelay: `${i * 90}ms` }}>
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{fillTitle(target.title, row)}</span>
                    <span className="block truncate font-mono text-[10.5px] text-[var(--landing-subtle)]">
                      {Object.values(row).slice(0, 3).join(' · ')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[var(--landing-border)]">
            <p className="px-3.5 pt-3 font-mono text-[10.5px] text-[var(--landing-subtle)]">results</p>
            <div className="landing-playground-scroll overflow-x-auto px-3.5 pb-3 pt-2">
              <table className="w-full border-collapse font-mono text-[10.5px]">
                <thead>
                  <tr>
                    {hits.columns.map((c) => (
                      <th key={c} className="whitespace-nowrap border-b border-[var(--landing-border)] py-1 pr-3 text-left font-medium text-[var(--landing-subtle)]">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hits.rows.map((row, i) => (
                    <tr key={i}>
                      {hits.columns.map((c) => (
                        <td key={c} className="whitespace-nowrap border-b border-[var(--landing-border-subtle)] py-1 pr-3 text-[var(--landing-muted)]">
                          {row[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Artefact label={target.artefact.label}>{target.artefact.text}</Artefact>
    </div>
  );
}

/** A `[STAGING] ` style prefix a modifier added, picked out. */
function TitleWithModifier({ title }: { title: string }) {
  const m = /^(\[[^\]]+\]\s*)(.*)$/.exec(title);
  if (!m) return <>{title}</>;
  return (
    <>
      <span className="rounded bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-1 text-[var(--landing-accent)]">{m[1].trim()}</span> {m[2]}
    </>
  );
}

function Artefact({ label, children }: { label: string; children: string }): ReactNode {
  const [copied, setCopied] = useState(false);
  return (
    <details className="group border-t border-[var(--landing-border)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 font-mono text-[11px] text-[var(--landing-subtle)] transition hover:text-[var(--landing-ink)] [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3 transition-transform group-open:rotate-90" aria-hidden />
        what deploy sends · {label}
      </summary>
      <div className="relative bg-[var(--pg-code-bg)]">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 font-mono text-[10.5px] text-[var(--pg-dim)] transition hover:text-white"
        >
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
          {copied ? 'copied' : 'copy'}
        </button>
        <pre className="landing-playground-scroll m-0 max-h-72 overflow-auto px-3.5 py-3 font-mono text-[11px] leading-relaxed text-[var(--pg-ink)]">
          <code>{children}</code>
        </pre>
      </div>
    </details>
  );
}
