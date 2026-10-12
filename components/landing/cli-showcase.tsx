'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { UUID } from '@/lib/landing/demo-registry';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Line = { kind: 'in' | 'out' | 'note'; text: string; mark?: boolean };
type Scenario = { id: string; label: string; lines: Line[]; /** Promises this run shows. */ lights: number[] };
type Door = {
  id: string;
  name: string;
  audience: string;
  prompt: string;
  promises: { title: string; body: string }[];
  scenarios: Scenario[];
};

const RULE = UUID.ruleLsass;
const OBJECTIVE = UUID.objectiveCredential;
const THREAT = UUID.threatGateway;

const i = (text: string): Line => ({ kind: 'in', text });
const o = (text: string, mark?: boolean): Line => ({ kind: 'out', text, mark });
const n = (text: string): Line => ({ kind: 'note', text });

/**
 * Runs captured from opentide 0.12.1 against the demo repository this page shows: the same
 * threat, objective and rule. Absolute paths are cut to the repository, the Rich panel border
 * is dropped and its lines re-wrapped, and long payloads are cut to `…`.
 */
const DOORS: Door[] = [
  {
    id: 'cli',
    name: 'CLI',
    audience: 'For humans and CI pipelines.',
    prompt: '$ ',
    promises: [
      { title: 'Every link resolves', body: 'A rule names a real objective, an objective names real threats, or validation fails.' },
      { title: 'Every value is in the taxonomy', body: 'Vocabulary fields take versioned values only: severity::1.0, surface::1.0, att&ck::1.1.' },
      { title: 'One JSON document on stdout', body: '--json returns ok and a status, and every issue with its code, file, line and field.' },
      { title: 'Exit codes gate CI', body: '0 success · 1 error · 2 usage. No parsing needed.' },
    ],
    scenarios: [
      {
        id: 'validate',
        label: 'validate',
        lights: [0, 1, 3],
        lines: [i('opentide validate --strict'), o('OK Validation passed'), i('echo $?'), o('0')],
      },
      {
        id: 'link',
        label: 'a broken link',
        lights: [0, 3],
        lines: [
          n('# the rule names an objective that does not exist'),
          i('opentide validate --strict'),
          o('Validation issues'),
          o('## objects/rules/lsass-memory-access.yaml'),
          o('  [error] objects/rules/lsass-memory-access.yaml:23: detection_model:', true),
          o("          Unknown objective or signal reference '00000000-0000-4000-8002-000000000002'", true),
          o('  [error] objects/rules/lsass-memory-access.yaml:23: detection_model:'),
          o("          Value '00000000-0000-4000-8002-000000000002' is not a valid 'objective' vocabulary entry"),
          o('FATAL: Validation failed'),
          i('echo $?'),
          o('1'),
        ],
      },
      {
        id: 'json',
        label: 'the --json report',
        lights: [2, 0],
        lines: [
          i('opentide --json validate --file lsass-memory-access.yaml'),
          o('{'),
          o('  "checks": { … },'),
          o('  "report": {'),
          o('    "ok": false,'),
          o('    "issues": [{'),
          o('      "code": "invalid_ref",', true),
          o('      "severity": "error",'),
          o(`      "object_uuid": "${RULE}",`),
          o('      "object_type": "rule",'),
          o('      "file_path": "…/objects/rules/lsass-memory-access.yaml",', true),
          o('      "yaml_line": 22,', true),
          o('      "field_path": ["detection_model"],', true),
          o(`      "message": "Unknown objective or signal reference '00000000-0000-4000-8002-000000000002'",`),
          o('      "suggestion": null, "context": {}'),
          o('    }, { "code": "vocab_unknown", … }],'),
          o('    "warnings": [], "stats": { "objects_checked": 1, … }'),
          o('  },'),
          o('  "workspace": "…/detection-repo",'),
          o('  "ok": false,'),
          o('  "status": "failed",'),
          o('  "message": "Validation failed"'),
          o('}'),
        ],
      },
      {
        id: 'taxonomy',
        label: 'a taxonomy check',
        lights: [1, 3],
        lines: [
          n('# severity takes a severity::1.0 value'),
          i('opentide validate --file gateway-exploitation-cve-2026-0300.yaml'),
          o('Validation issues'),
          o('## objects/threats/gateway-exploitation-cve-2026-0300.yaml'),
          o('  [error] objects/threats/gateway-exploitation-cve-2026-0300.yaml:22: threat.severity:', true),
          o("          Value 'Critical' is not a valid 'severity::1.0' vocabulary entry", true),
          o('FATAL: Validation failed'),
        ],
      },
      {
        id: 'deploy',
        label: 'deploy plan',
        lights: [2],
        lines: [
          i('opentide --json deploy --platform sentinel --dry-run --plan STAGING'),
          o('{'),
          o('  "deployed": ["sentinel"],'),
          o('  "dry_run": true,'),
          o(`  "plan": { "sentinel": ["${RULE}"] },`, true),
          o('  "payloads": { "sentinel": [{ "uuid": …, "name": …, "api_request": … }] },'),
          o('  "ok": true,'),
          o('  "status": "completed",'),
          o('  "message": "Deployment completed"'),
          o('}'),
        ],
      },
    ],
  },
  {
    id: 'sdk',
    name: 'SDK',
    audience: 'For Python tools and tests.',
    prompt: '>>> ',
    promises: [
      { title: 'Typed models', body: 'DetectionRule, DetectionObjective and ThreatVector, the models the JSON Schema is generated from.' },
      { title: 'A lazy registry', body: 'initialise() loads the index; objects parse on first access.' },
      { title: 'The whole graph', body: 'detection_model, threats and signals are attributes you follow.' },
      { title: 'Small, plain results', body: 'deploy() returns a DeploymentResult: platform, uuids, dry_run and a message.' },
    ],
    scenarios: [
      {
        id: 'chain',
        label: 'walk the chain',
        lights: [1, 2],
        lines: [
          i('from opentide import OpenTide'),
          i('OpenTide.initialise()'),
          i(`rule = OpenTide.Rules["${RULE}"]`),
          i('objective = OpenTide.Objectives[rule.detection_model]'),
          i('threat = OpenTide.Threats[objective.objective.threats[0]]'),
          i('print(rule.name, "→", objective.name, "→", threat.name)'),
          o('LSASS memory access → Credential access via LSASS → Gateway exploitation (CVE-2026-0300)', true),
        ],
      },
      {
        id: 'signal',
        label: 'read a signal',
        lights: [0, 2],
        lines: [
          i('signal = objective.objective.signals[0]'),
          i('signal.name, signal.data.logsources'),
          o("('LSASS process access', ['Endpoint process events'])", true),
        ],
      },
      {
        id: 'deploy',
        label: 'dry-run deploy',
        lights: [3],
        lines: [
          i('rule.deploy("sentinel", dry_run=True)'),
          o(`DeploymentResult(platform='sentinel', uuids=['${RULE}'],`),
          o("                 dry_run=True, message='dry-run')", true),
        ],
      },
    ],
  },
  {
    id: 'mcp',
    name: 'MCP',
    audience: 'For AI agents in the editor.',
    prompt: '› ',
    promises: [
      { title: 'Search the graph', body: 'search, get_chaining and coverage read the same index as the CLI.' },
      { title: 'The report CI gates on', body: 'validation_report returns the issues validate --strict fails on.' },
      { title: 'Dry-run by default', body: 'deploy_rule simulates unless you pass dry_run=false.' },
      { title: 'Live only on request', body: 'validate_query touches a tenant only with live: true.' },
    ],
    scenarios: [
      {
        id: 'search',
        label: 'search',
        lights: [0],
        lines: [
          i('search(query="lsass", type="rule")'),
          o(`→ [{ "uuid": "${RULE}", "type": "rule",`),
          o('     "title": "LSASS memory access", "status": "STAGING" }]', true),
        ],
      },
      {
        id: 'chaining',
        label: 'get_chaining',
        lights: [0],
        lines: [
          i(`get_chaining(uuid="${RULE}")`),
          o(`→ { "uuid": "${RULE}", "found": true, "type": "rule",`),
          o('    "graph": { … }, "chaining_index": { … },'),
          o(`    "lineage": { "threats": ["${THREAT}"],`, true),
          o(`                 "objectives": ["${OBJECTIVE}"],`, true),
          o(`                 "rules": ["${RULE}"] } }`),
        ],
      },
      {
        id: 'report',
        label: 'validation_report',
        lights: [1],
        lines: [
          i(`validation_report(uuid="${RULE}")`),
          o('→ { "ok": true, "issues": [], "warnings": [], "stats": { "objects_checked": 1, … } }', true),
        ],
      },
      {
        id: 'deploy',
        label: 'deploy_rule',
        lights: [2],
        lines: [
          i(`deploy_rule(uuid="${RULE}", platform="sentinel")`),
          o(`→ { "action": "dry-run", "tenant": null, "rule_id": "${RULE}",`, true),
          o('    "status": "STAGING", "dry_run": true, "platform": "sentinel", "message": "dry-run" }'),
        ],
      },
      {
        id: 'query',
        label: 'validate_query',
        lights: [3],
        lines: [
          i('validate_query(query="", platform="sentinel")'),
          o('→ { "valid": null, "supported": true, "status": "failed",'),
          o('    "message": "Query validation checks the tenant. Pass live: true.", "query_preview": "" }', true),
        ],
      },
    ],
  },
];

const TYPE_MS = 22;
const RUN_MS = 300;
const LINE_MS = 70;
const HOLD_MS = 2800;

/** Token colours for one line: flags, keys, strings and literals, OK and FATAL. */
function Highlight({ line, prompt }: { line: Line; prompt: string }): ReactNode {
  if (line.kind === 'note') return <span className="text-[var(--landing-code-dim)]">{line.text}</span>;
  if (line.kind === 'in') {
    const parts = line.text.split(/(--[\w-]+|"(?:[^"\\]|\\.)*"|\b(?:from|import|print|True|False)\b)/g);
    return (
      <>
        <span className="select-none text-[var(--landing-code-dim)]">{prompt}</span>
        {parts.map((part, k) =>
          part.startsWith('--') || /^(from|import|print|True|False)$/.test(part) ? (
            <span key={k} className="text-[var(--landing-code-key)]">
              {part}
            </span>
          ) : part.startsWith('"') ? (
            <span key={k} className="text-[var(--landing-code-str)]">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  }
  const status = line.text.match(/^(OK|FATAL:)( .*)$/);
  if (status) {
    return (
      <>
        <span className={status[1] === 'OK' ? 'text-emerald-300' : 'text-rose-300'}>{status[1]}</span>
        {status[2]}
      </>
    );
  }
  return (
    <>
      {tokens(line.text).map((token, k) =>
        token.kind ? (
          <span key={k} className={TOKEN_CLASS[token.kind]}>
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </>
  );
}

const TOKEN = /(?<key>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<err>\[error\])|(?<lit>\b(?:true|false|null|True|False)\b)/g;

type TokenKind = 'key' | 'str' | 'err' | 'lit';

const TOKEN_CLASS: Record<TokenKind, string> = {
  key: 'text-[var(--landing-code-key)]',
  str: 'text-[var(--landing-code-str)]',
  err: 'text-rose-300',
  lit: 'text-[var(--landing-code-key)]',
};

function tokens(text: string) {
  const out: { text: string; kind?: TokenKind }[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at) });
    const g = m.groups ?? {};
    out.push({ text: m[0], kind: g.key ? 'key' : g.str ? 'str' : g.err ? 'err' : 'lit' });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/**
 * The three ways in, played as short runs: a command is typed, its reply streams back, and
 * the promise it demonstrates lights up beside it. Autoplay walks every run of every door;
 * picking a door or a run takes over.
 */
export function CliShowcase() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen } = useOnScreen<HTMLDivElement>();
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const screen = useRef<HTMLPreElement>(null);
  const [door, setDoor] = useState(0);
  const [run, setRun] = useState(0);
  const [pos, setPos] = useState({ line: 0, char: 0 });
  const [auto, setAuto] = useState(true);

  const d = DOORS[door];
  const scenario = d.scenarios[run];
  const lines = scenario.lines;
  const finished = reduced || pos.line >= lines.length;
  const typing = onScreen && !reduced;

  useEffect(() => {
    if (!typing) return;
    let id = 0;
    if (pos.line >= lines.length) {
      if (!auto) return;
      id = window.setTimeout(() => {
        const nextRun = run + 1 < d.scenarios.length ? run + 1 : 0;
        const nextDoor = nextRun === 0 ? (door + 1) % DOORS.length : door;
        setDoor(nextDoor);
        setRun(nextRun);
        setPos({ line: 0, char: 0 });
      }, HOLD_MS);
    } else {
      const cur = lines[pos.line];
      if (cur.kind === 'in' && pos.char < cur.text.length) {
        // Long lines type in chunks, so no line takes much more than a second.
        const step = Math.max(1, Math.ceil(cur.text.length / 48));
        id = window.setTimeout(() => setPos({ line: pos.line, char: Math.min(cur.text.length, pos.char + step) }), TYPE_MS);
      } else {
        id = window.setTimeout(() => setPos({ line: pos.line + 1, char: 0 }), cur.kind === 'in' ? RUN_MS : LINE_MS);
      }
    }
    return () => window.clearTimeout(id);
  }, [typing, pos, lines, auto, run, door, d.scenarios.length]);

  const choose = (nextDoor: number, nextRun: number) => {
    setDoor(nextDoor);
    setRun(nextRun);
    setPos({ line: 0, char: 0 });
    setAuto(false);
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = DOORS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (door === last ? 0 : door + 1)
      : e.key === 'ArrowLeft' ? (door === 0 ? last : door - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    choose(next, 0);
    tabs.current[next]?.focus();
  };

  // Like a terminal: the newest line stays in view. Scrolls the panel only, never the page.
  useEffect(() => {
    const el = screen.current;
    if (el) el.scrollTop = finished && reduced ? 0 : el.scrollHeight;
  }, [pos, door, run, finished, reduced]);

  const lit = finished ? scenario.lights : [];

  return (
    <div ref={ref} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <figure className="m-0 flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] shadow-[0_24px_60px_-30px_var(--landing-btn-shadow)] ring-1 ring-[var(--landing-border)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pl-2 pr-3">
          <div role="tablist" aria-label="Ways into opentide" onKeyDown={onTabKey} className="flex">
            {DOORS.map((item, k) => {
              const on = k === door;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabs.current[k] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${item.id}`}
                  aria-selected={on}
                  aria-controls={`${base}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(k, 0)}
                  className={`-mb-px border-b-2 px-3.5 py-3 font-mono text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--landing-code-key)] ${
                    on
                      ? 'border-[var(--landing-code-str)] text-[var(--landing-code-ink)]'
                      : 'border-transparent text-[var(--landing-code-dim)] hover:text-[var(--landing-code-ink)]'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={() => setAuto((v) => !v)}
              aria-pressed={!auto}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-[var(--landing-code-dim)] transition hover:bg-white/10 hover:text-[var(--landing-code-ink)]"
            >
              {auto ? <Pause className="size-3 fill-current" aria-hidden /> : <Play className="size-3 fill-current" aria-hidden />}
              {auto ? 'Pause' : 'Play all'}
            </button>
          )}
        </div>

        <div className="landing-code-scroll flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2.5">
          {d.scenarios.map((item, k) => {
            const on = k === run;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(door, k)}
                aria-pressed={on}
                className={`relative shrink-0 overflow-hidden rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  on ? 'bg-white/12 text-[var(--landing-code-ink)]' : 'text-[var(--landing-code-dim)] hover:text-[var(--landing-code-ink)]'
                }`}
              >
                {item.label}
                {on && auto && !reduced && finished && (
                  <span
                    aria-hidden
                    className="landing-progress absolute inset-x-0 bottom-0 block h-px bg-[var(--landing-code-str)]"
                    style={{ animationDuration: `${HOLD_MS}ms` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <pre
          ref={screen}
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${d.id}`}
          tabIndex={0}
          className="landing-code-scroll m-0 h-[26rem] overflow-auto py-4 font-mono text-[12.5px] leading-[1.75] focus-visible:outline-none sm:text-[13px]"
        >
          <code>
            {lines.map((line, k) => {
              if (!finished && k > pos.line) return null;
              const partial = !finished && k === pos.line;
              if (partial && line.kind !== 'in') return null;
              const shown = partial ? { ...line, text: line.text.slice(0, pos.char) } : line;
              return (
                <span
                  key={`${d.id}-${scenario.id}-${k}`}
                  className={`block whitespace-pre px-5 ${line.mark && !partial ? 'bg-[#ffcc00]/[0.1]' : ''}`}
                >
                  <Highlight line={shown} prompt={d.prompt} />
                  {partial && <span className="landing-caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--landing-code-ink)]" />}
                </span>
              );
            })}
            {finished && !reduced && (
              <span className="block px-5">
                <span className="select-none text-[var(--landing-code-dim)]">{d.prompt}</span>
                <span className="landing-caret inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--landing-code-ink)] opacity-70" />
              </span>
            )}
          </code>
        </pre>
      </figure>

      <div className="flex flex-col">
        <div key={d.id} className={reduced ? '' : 'landing-fade-slide'}>
          <p className="text-4xl font-bold tracking-[-0.04em] text-[var(--landing-ink)]">{d.name}</p>
          <p className="mt-1 text-lg text-[var(--landing-muted)]">{d.audience}</p>
        </div>
        <dl className="m-0 mt-6 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
          {d.promises.map((promise, k) => {
            const on = lit.includes(k);
            return (
              <div
                key={`${d.id}-${promise.title}`}
                className={`flex gap-3 rounded-xl px-4 py-3 transition-colors duration-300 ${
                  on ? 'bg-[color-mix(in_srgb,var(--landing-accent)_7%,transparent)]' : ''
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-[0.45rem] size-2 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ${
                    on
                      ? 'bg-[var(--landing-accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--landing-accent)_18%,transparent)]'
                      : 'bg-[color-mix(in_srgb,var(--landing-ink)_18%,transparent)]'
                  }`}
                />
                <div>
                  <dt className={`font-semibold transition-colors ${on ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-ink)]'}`}>
                    {promise.title}
                  </dt>
                  <dd className="m-0 mt-0.5 text-sm leading-relaxed text-[var(--landing-muted)]">{promise.body}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
