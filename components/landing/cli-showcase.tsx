'use client';

import { Pause, Play } from 'lucide-react';
import { memo, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DOORS, type Line } from '@/lib/landing/showcase';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const TYPE_MS = 22;
const RUN_MS = 300;
const LINE_MS = 70;
const HOLD_MS = 2800;

/** Token colours for one line: flags, keys, strings and literals, and the CLI's own result lines. */
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
  const rich = richSegments(line.text);
  if (rich) {
    return (
      <>
        {rich.map(([text, cls], k) =>
          cls ? (
            <span key={k} className={cls}>
              {text}
            </span>
          ) : (
            text
          ),
        )}
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

const DIM = 'text-[var(--landing-code-dim)]';
const ERR = 'text-rose-300';
const OK = 'text-emerald-300';

type Segment = [text: string, className?: string];

/**
 * The CLI's human output, coloured as its terminal colours it: `✓` and `✗` results,
 * `error[code]:` headers, the source snippet's gutter and underline, `→` next steps and the
 * deploy plan. Anything else (JSON, Python reprs) falls through to `tokens`.
 */
function richSegments(text: string): Segment[] | null {
  let m: RegExpMatchArray | null;
  if ((m = text.match(/^(✓|✗)( .*)$/))) return [[m[1], m[1] === '✓' ? OK : ERR], [m[2]]];
  if ((m = text.match(/^(error\[[\w-]+\]:)( .*)$/))) return [[m[1], `font-semibold ${ERR}`], [m[2]]];
  if ((m = text.match(/^( *\d* )(│|╭─▶|╰─)(.*)$/))) {
    const head: Segment[] = [[m[1] + m[2], DIM]];
    const rest = m[3];
    const under = rest.match(/^( +)(━+)( .*)?$/);
    if (under) return [...head, [under[1]], [under[2], ERR], [under[3] ?? '', ERR]];
    const help = rest.match(/^( help:)( .*)$/);
    if (help) return [...head, [help[1], 'text-[var(--landing-code-key)]'], [help[2]]];
    return [...head, [rest]];
  }
  if ((m = text.match(/^(→)( opentide .*?)( · .*)?$/))) return [[m[1], DIM], [m[2], 'text-[var(--landing-code-key)]'], [m[3] ?? '', DIM]];
  if ((m = text.match(/^( +)([+~-] [a-z ]+?)(  .*)$/))) return [[m[1]], [m[2], OK], [m[3]]];
  if ((m = text.match(/^(Plan:|Deploy plan)( .*)$/))) return [[m[1], 'font-semibold'], [m[2], m[1] === 'Plan:' ? undefined : DIM]];
  if ((m = text.match(/^([a-z_]+)( · \d+ tenants?)$/))) return [[m[1], 'text-[var(--landing-code-key)]'], [m[2], DIM]];
  return null;
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

/** One printed line. Finished lines keep the same props, so only the line being typed re-renders. */
const Row = memo(function Row({
  line,
  prompt,
  typed,
}: {
  line: Line;
  prompt: string;
  /** Characters typed so far, while this is the line being typed. */
  typed?: number;
}) {
  const partial = typed !== undefined;
  const shown = partial ? { ...line, text: line.text.slice(0, typed) } : line;
  return (
    // min-h keeps a blank line, the gap the CLI prints before its summary, one line tall.
    <span className={`block min-h-[1.75em] whitespace-pre px-5 ${line.mark && !partial ? 'bg-[#ffcc00]/[0.1]' : ''}`}>
      <Highlight line={shown} prompt={prompt} />
      {partial && <Caret />}
    </span>
  );
});

function Caret({ dim }: { dim?: boolean }) {
  return (
    <span
      className={`landing-caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--landing-code-ink)] ${dim ? 'opacity-70' : ''}`}
    />
  );
}

/**
 * The three ways in, played as short runs: a command is typed, its reply streams back, and
 * the promise it demonstrates lights up beside it. Autoplay walks every run of every door;
 * picking a door or a run takes over.
 */
export function CliShowcase() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen, seen } = useOnScreen<HTMLDivElement>();
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const screen = useRef<HTMLPreElement>(null);
  const [door, setDoor] = useState(0);
  const [run, setRun] = useState(0);
  // The first render, and so the static HTML, is the whole first run. It replays from the top
  // once the panel comes into view (before the reveal shows it).
  const [pos, setPos] = useState({ line: Infinity, char: 0 });
  const [auto, setAuto] = useState(true);
  const [started, setStarted] = useState(false);
  if (seen && !started && !reduced) {
    setStarted(true);
    setPos({ line: 0, char: 0 });
  }

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

  // Like a terminal: the newest line stays in view. Scrolls the panel only, never the page, and
  // only when a line is added or the run changes, not on every typed character.
  const printed = Math.min(pos.line, lines.length);
  useEffect(() => {
    const el = screen.current;
    if (el) el.scrollTop = reduced || !started ? 0 : el.scrollHeight;
  }, [printed, door, run, reduced, started]);

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
                {on && auto && typing && finished && (
                  <span
                    key={`${door}-${run}`}
                    aria-hidden
                    className="landing-progress absolute inset-x-0 bottom-0 block h-px origin-left bg-[var(--landing-code-str)]"
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
          className="landing-code-scroll m-0 h-[26rem] overflow-auto py-4 font-mono text-[12.5px] leading-[1.75] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--landing-code-key)] sm:text-[13px]"
        >
          <code>
            {lines.map((line, k) => {
              if (!finished && k > pos.line) return null;
              const partial = !finished && k === pos.line;
              if (partial && line.kind !== 'in') return null;
              return <Row key={`${d.id}-${scenario.id}-${k}`} line={line} prompt={d.prompt} typed={partial ? pos.char : undefined} />;
            })}
            {finished && typing && (
              <span className="block px-5">
                <span className="select-none text-[var(--landing-code-dim)]">{d.prompt}</span>
                <Caret dim />
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
