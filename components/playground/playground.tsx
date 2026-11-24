'use client';

import type { LSPClient } from '@codemirror/lsp-client';
import { ChevronDown, CircleAlert, CircleX, Cpu, FileCode2, FileCog, Folder, Info, RotateCcw, TerminalSquare, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DeployPanel, type LogLine } from '@/components/playground/deploy-panel';
import { createClient, createFileEditor, PlaygroundWorkspace, type FileEditor, type LspDiagnostic } from '@/components/playground/editor';
import { startEngine, type Engine, type EngineStatus } from '@/components/playground/engine';
import { compileRule } from '@/lib/playground/compile';
import {
  INITIAL_PATH,
  initialFiles,
  pathOf,
  platformFiles,
  ROOT_URI,
  uriOf,
  VISIBILITY_PATH,
  type PlaygroundFile,
} from '@/lib/playground/workspace';

type Problem = { path: string; line: number; col: number; severity: 1 | 2 | 3 | 4; code?: string; message: string };

const SEVERITY_ICON: Record<number, ReactNode> = {
  1: <CircleX className="size-3.5 shrink-0 text-[#ff6b6b]" aria-label="error" />,
  2: <TriangleAlert className="size-3.5 shrink-0 text-[var(--landing-accent)]" aria-label="warning" />,
  3: <Info className="size-3.5 shrink-0 text-[var(--landing-subtle)]" aria-label="information" />,
  4: <Info className="size-3.5 shrink-0 text-[var(--landing-subtle)]" aria-label="hint" />,
};

/** Guided edits on the demo rule: each one shows the engine or the deploy answering. */
const TRIES: { id: string; label: string; find: string | RegExp; replace: string }[] = [
  { id: 'typo', label: 'Break the KQL', find: '| where FileName =~', replace: '| wher FileName =~' },
  { id: 'vocab', label: 'Misspell a severity', find: /^severity: High$/m, replace: 'severity: Hihg' },
  { id: 'ref', label: 'Point at a missing objective', find: /^detection_model: .+$/m, replace: 'detection_model: 00000000-0000-4000-8002-0000000000ff' },
  { id: 'prod', label: 'Promote to PRODUCTION', find: /status: STAGING/g, replace: 'status: PRODUCTION' },
];

function fileIcon(path: string) {
  return path.endsWith('.toml') ? (
    <FileCog className="size-3.5 shrink-0 text-[var(--landing-subtle)]" aria-hidden />
  ) : (
    <FileCode2 className="size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
  );
}

const baseName = (path: string) => path.split('/').pop() ?? path;

/** The explorer tree: directories in order of first appearance, files under them. */
function tree(paths: string[]) {
  const dirs = new Map<string, string[]>();
  for (const path of paths) {
    const dir = path.split('/').slice(0, -1).join('/');
    dirs.set(dir, [...(dirs.get(dir) ?? []), path]);
  }
  return [...dirs.entries()].sort(([a], [b]) => (a.startsWith('.') === b.startsWith('.') ? a.localeCompare(b) : a.startsWith('.') ? 1 : -1));
}

export function Playground() {
  const [files] = useState<PlaygroundFile[]>(initialFiles);
  const original = useMemo(() => Object.fromEntries(files.map((f) => [f.path, f.text])), [files]);
  const [texts, setTexts] = useState<Record<string, string>>(original);
  const [active, setActive] = useState<string>(INITIAL_PATH);
  const [tabs, setTabs] = useState<string[]>([INITIAL_PATH, 'objects/objectives/credential-access-via-lsass.yaml']);
  const [status, setStatus] = useState<EngineStatus>({ state: 'idle' });
  const [diagnostics, setDiagnostics] = useState<Record<string, LspDiagnostic[]>>({});
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [panel, setPanel] = useState<'problems' | 'output'>('problems');
  const [log, setLog] = useState<LogLine[]>([]);
  const [lastRule, setLastRule] = useState<string>(INITIAL_PATH);

  const hosts = useRef<Record<string, HTMLDivElement | null>>({});
  const editors = useRef<Record<string, FileEditor>>({});
  const clientRef = useRef<LSPClient | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const [engineLoaded, setEngineLoaded] = useState(false);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
    // The status bar follows the file in front.
    const state = editors.current[active]?.view.state;
    if (state) {
      const head = state.selection.main.head;
      const line = state.doc.lineAt(head);
      setCursor({ line: line.number, col: head - line.from + 1 });
    }
  }, [active]);

  const open = useCallback((path: string) => {
    if (!files.some((f) => f.path === path)) return;
    setTabs((t) => (t.includes(path) ? t : [...t, path]));
    setActive(path);
    if (/^objects\/rules\//.test(path)) setLastRule(path);
  }, [files]);

  // Editors: one per file, created once; the engine attaches to them when it is ready.
  useEffect(() => {
    const created: Record<string, FileEditor> = {};
    const pendingText: Record<string, string> = {};
    let flush = 0;
    for (const file of files) {
      const host = hosts.current[file.path];
      if (!host) continue;
      created[file.path] = createFileEditor(file, host, {
        onChange: (text) => {
          pendingText[file.path] = text;
          window.clearTimeout(flush);
          flush = window.setTimeout(() => {
            const batch = { ...pendingText };
            for (const k of Object.keys(pendingText)) delete pendingText[k];
            setTexts((t) => ({ ...t, ...batch }));
          }, 160);
        },
        onCursor: (line, col) => {
          if (activeRef.current === file.path) setCursor({ line, col });
        },
        onOpen: (uri) => open(pathOf(uri)),
      });
    }
    editors.current = created;

    PlaygroundWorkspace.display = (uri) => {
      const path = pathOf(uri);
      if (!created[path]) return null;
      open(path);
      return created[path].view;
    };

    let engine: Engine | null = null;
    let disposed = false;
    void startEngine((s) => !disposed && setStatus(s)).then((e) => {
      if (disposed) {
        e?.dispose();
        return;
      }
      engine = e;
      engineRef.current = e;
      setEngineLoaded(Boolean(e));
    });

    return () => {
      disposed = true;
      window.clearTimeout(flush);
      for (const editor of Object.values(created)) editor.view.destroy();
      clientRef.current?.disconnect();
      clientRef.current = null;
      engine?.dispose();
      engineRef.current = null;
      setEngineLoaded(false);
    };
  }, [files, open]);

  // Once the engine is ready: connect the LSP client with the whole workspace and attach editors.
  useEffect(() => {
    if (status.state !== 'ready' || !engineLoaded || clientRef.current) return;
    let cancelled = false;
    const attach = (engine: Engine) => {
      if (cancelled) return;
      const documents = files.map((f) => ({ uri: uriOf(f.path), text: editors.current[f.path]?.view.state.doc.toString() ?? f.text }));
      const visibility = editors.current[VISIBILITY_PATH]?.view.state.doc.toString();
      const client = createClient(ROOT_URI, { documents, visibility }, (uri, list) =>
        setDiagnostics((d) => ({ ...d, [pathOf(uri)]: list })),
      );
      client.connect(engine.transport);
      clientRef.current = client;
      for (const file of files) editors.current[file.path]?.attach(client, engine, uriOf(file.path));
    };
    if (engineRef.current) attach(engineRef.current);
    return () => {
      cancelled = true;
    };
  }, [status.state, engineLoaded, files]);

  // TOML files are configuration, not documents the client opens: tell the engine when they change.
  const tomlTexts = useMemo(() => files.filter((f) => f.language === 'toml').map((f) => texts[f.path]).join('\u0000'), [files, texts]);
  const firstToml = useRef(true);
  useEffect(() => {
    if (firstToml.current) {
      firstToml.current = false;
      return;
    }
    const client = clientRef.current;
    if (!client?.connected) return;
    const tomls = files.filter((f) => f.language === 'toml');
    client.notification('opentide/didChangeWorkspace', {
      documents: tomls.filter((f) => f.path !== VISIBILITY_PATH).map((f) => ({ uri: uriOf(f.path), text: texts[f.path] })),
      visibility: texts[VISIBILITY_PATH],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tomlTexts]);

  const problems = useMemo<Problem[]>(
    () =>
      Object.entries(diagnostics)
        .flatMap(([path, list]) =>
          list.map((d) => ({
            path,
            line: d.range.start.line + 1,
            col: d.range.start.character + 1,
            severity: (d.severity ?? 1) as Problem['severity'],
            code: d.code === undefined ? undefined : String(d.code),
            message: d.message,
          })),
        )
        .sort((a, b) => a.severity - b.severity || a.path.localeCompare(b.path) || a.line - b.line),
    [diagnostics],
  );
  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
    for (const p of problems) c[Math.min(p.severity, 3)]++;
    return c;
  }, [problems]);
  const perFile = useMemo(() => {
    const m: Record<string, { e: number; w: number }> = {};
    for (const p of problems) {
      m[p.path] ??= { e: 0, w: 0 };
      if (p.severity === 1) m[p.path].e++;
      else if (p.severity === 2) m[p.path].w++;
    }
    return m;
  }, [problems]);

  const rulePath = /^objects\/rules\//.test(active) ? active : lastRule;
  const compiled = useMemo(() => compileRule(texts[rulePath] ?? '', platformFiles(files.map((f) => ({ ...f, text: texts[f.path] })))), [texts, rulePath, files]);

  /** The rule as the editors hold it now, not as last debounced: Deploy may follow an edit at once. */
  const compileNow = () => {
    clientRef.current?.sync();
    const live = (path: string) => editors.current[path]?.view.state.doc.toString() ?? texts[path];
    return compileRule(live(rulePath) ?? '', platformFiles(files.map((f) => ({ ...f, text: live(f.path) }))));
  };

  const reveal = (p: Problem) => {
    open(p.path);
    const view = editors.current[p.path]?.view;
    if (!view) return;
    const line = view.state.doc.line(Math.min(p.line, view.state.doc.lines));
    const pos = Math.min(line.from + p.col - 1, line.to);
    requestAnimationFrame(() => {
      view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
      view.focus();
    });
  };

  const tryEdit = (t: (typeof TRIES)[number]) => {
    const path = INITIAL_PATH;
    open(path);
    const view = editors.current[path]?.view;
    if (!view) return;
    const doc = view.state.doc.toString();
    const regex = typeof t.find === 'string' ? new RegExp(t.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : new RegExp(t.find.source, t.find.flags.includes('g') ? t.find.flags : `${t.find.flags}g`);
    const changes: { from: number; to: number; insert: string }[] = [];
    for (const m of doc.matchAll(regex)) changes.push({ from: m.index!, to: m.index! + m[0].length, insert: t.replace });
    if (!changes.length) return;
    requestAnimationFrame(() => {
      view.dispatch({ changes, selection: { anchor: changes[0].from + t.replace.length }, scrollIntoView: true, userEvent: 'input.try' });
      view.focus();
    });
  };

  const resetAll = () => {
    for (const file of files) {
      const view = editors.current[file.path]?.view;
      if (view && view.state.doc.toString() !== file.text) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: file.text } });
      }
    }
  };

  const closeTab = (path: string) => {
    setTabs((t) => {
      const next = t.filter((p) => p !== path);
      if (path === active && next.length) setActive(next[Math.max(0, t.indexOf(path) - 1)]);
      return next.length ? next : t;
    });
  };

  const dirty = (path: string) => texts[path] !== original[path];
  const anyDirty = files.some((f) => dirty(f.path));
  const activeFile = files.find((f) => f.path === active);

  return (
    <div className="landing-playground flex flex-col lg:h-full">
      <div className="flex flex-col bg-[var(--landing-surface)] lg:min-h-0 lg:flex-1">
        {/* Title bar: the repository, the guided edits, the engine */}
        <div className="flex min-w-0 items-center gap-3 overflow-hidden border-y border-[var(--landing-border)] bg-[var(--landing-panel)] px-3 py-1.5">
          <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-[var(--landing-subtle)]">
            <Folder className="size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
            <span className="hidden text-[var(--landing-ink)] sm:inline">detection-repo</span>
            <span className="hidden xl:inline">· feat/lsass-credential-access</span>
          </span>
          <span aria-hidden className="hidden h-4 w-px bg-[var(--landing-border)] md:block" />
          <div className="landing-playground-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
            <span className="shrink-0 font-mono text-[11px] text-[var(--landing-subtle)]">try</span>
            {TRIES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => tryEdit(t)}
                className="shrink-0 rounded-full border border-[var(--landing-border)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--landing-muted)] transition hover:border-[var(--landing-accent)] hover:text-[var(--landing-accent)]"
              >
                {t.label}
              </button>
            ))}
            {anyDirty && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
              >
                <RotateCcw className="size-3" aria-hidden />
                Reset
              </button>
            )}
          </div>
          <span className="shrink-0">
            <EngineBadge status={status} />
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:grid-cols-[210px_minmax(0,1fr)_360px] xl:grid-cols-[230px_minmax(0,1fr)_390px]">
          {/* Explorer */}
          <nav aria-label="Files" className="landing-playground-scroll hidden min-h-0 overflow-y-auto border-r border-[var(--landing-border)] bg-[var(--landing-panel)] py-2 lg:block">
            <p className="px-3 pb-1 pt-1 font-mono text-[10.5px] text-[var(--landing-subtle)]">explorer</p>
            {tree(files.map((f) => f.path)).map(([dir, paths]) => (
              <div key={dir} className="mt-1">
                <p className="flex items-center gap-1 truncate px-3 py-1 font-mono text-[11px] text-[var(--landing-subtle)]" title={dir}>
                  <ChevronDown className="size-3 shrink-0" aria-hidden />
                  {dir}
                </p>
                <ul>
                  {paths.map((path) => (
                    <li key={path}>
                      <button
                        type="button"
                        onClick={() => open(path)}
                        aria-current={path === active ? 'true' : undefined}
                        className="flex w-full items-center gap-2 py-1 pl-7 pr-3 text-left text-[12.5px] text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] aria-[current]:bg-[color-mix(in_srgb,var(--landing-accent)_11%,transparent)] aria-[current]:text-[var(--landing-ink)]"
                      >
                        {fileIcon(path)}
                        <span className="min-w-0 flex-1 truncate">{baseName(path)}</span>
                        <FileBadge counts={perFile[path]} dirty={dirty(path)} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Editor column */}
          <div className="flex min-h-0 min-w-0 flex-col">
            {/* Tabs */}
            <div className="flex items-stretch border-b border-[var(--landing-border)] bg-[var(--landing-panel)]">
              <div role="tablist" aria-label="Open files" className="landing-playground-scroll flex min-w-0 flex-1 overflow-x-auto">
                {tabs.map((path) => (
                  <div
                    key={path}
                    role="tab"
                    aria-selected={path === active}
                    className="group relative flex shrink-0 items-center border-r border-[var(--landing-border)] text-[12.5px] text-[var(--landing-subtle)] aria-selected:bg-[var(--pg-code-bg)] aria-selected:text-[var(--pg-ink)]"
                  >
                    {path === active && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--pg-yellow)]" />}
                    <button type="button" onClick={() => open(path)} className="flex items-center gap-2 py-2 pl-3 pr-1.5">
                      {fileIcon(path)}
                      {baseName(path)}
                      {dirty(path) && <span className="size-1.5 rounded-full bg-current opacity-70" aria-label="modified" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeTab(path)}
                      aria-label={`Close ${baseName(path)}`}
                      className="mr-1.5 rounded p-0.5 opacity-0 transition hover:bg-white/10 group-hover:opacity-100 group-aria-selected:opacity-60"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              {/* Below lg the explorer is a menu. */}
              <label className="relative flex items-center border-l border-[var(--landing-border)] px-2 lg:hidden">
                <span className="sr-only">Open a file</span>
                <select
                  value={active}
                  onChange={(e) => open(e.target.value)}
                  className="max-w-[9rem] cursor-pointer appearance-none bg-transparent pr-5 font-mono text-[11px] text-[var(--landing-muted)] outline-none"
                >
                  {files.map((f) => (
                    <option key={f.path} value={f.path}>
                      {f.path}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 size-3 text-[var(--landing-subtle)]" aria-hidden />
              </label>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 truncate bg-[var(--pg-code-bg)] px-4 pt-2 font-mono text-[11px] text-[var(--pg-dim)]">
              {active.split('/').map((part, i, all) => (
                <span key={i} className={i === all.length - 1 ? 'text-[var(--pg-ink)]' : ''}>
                  {part}
                  {i < all.length - 1 && <span className="px-1 opacity-50">›</span>}
                </span>
              ))}
            </div>

            {/* Editors: one per file, only the active one shown */}
            <div className="relative h-[58svh] min-h-[360px] bg-[var(--pg-code-bg)] lg:h-auto lg:min-h-0 lg:flex-1">
              {files.map((f) => (
                <div
                  key={f.path}
                  ref={(el) => {
                    hosts.current[f.path] = el;
                  }}
                  className="absolute inset-0"
                  hidden={f.path !== active}
                />
              ))}
              {status.state === 'loading' && <LoadingVeil status={status} />}
            </div>

            {/* Bottom panel */}
            <div className="flex h-[200px] min-h-0 flex-col border-t border-[var(--landing-border)] bg-[var(--landing-panel)] lg:h-[190px]">
              <div role="tablist" aria-label="Panels" className="flex items-center gap-1 border-b border-[var(--landing-border)] px-2">
                <PanelTab selected={panel === 'problems'} onClick={() => setPanel('problems')}>
                  problems
                  <span className="rounded-full bg-[var(--landing-hover)] px-1.5 text-[10px]">{problems.length}</span>
                </PanelTab>
                <PanelTab selected={panel === 'output'} onClick={() => setPanel('output')}>
                  output
                  {log.length > 0 && <span className="size-1.5 rounded-full bg-[var(--landing-accent)]" />}
                </PanelTab>
              </div>
              <div className="landing-playground-scroll min-h-0 flex-1 overflow-y-auto">
                {panel === 'problems' ? (
                  problems.length ? (
                    <ul className="py-1">
                      {problems.map((p, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => reveal(p)}
                            className="flex w-full items-start gap-2 px-3 py-1 text-left text-xs transition hover:bg-[var(--landing-hover)]"
                          >
                            <span className="mt-px">{SEVERITY_ICON[p.severity]}</span>
                            <span className="min-w-0 flex-1">
                              <span className="text-[var(--landing-ink)]">{p.message}</span>{' '}
                              {p.code && <span className="font-mono text-[10.5px] text-[var(--landing-subtle)]">{p.code}</span>}
                            </span>
                            <span className="shrink-0 font-mono text-[10.5px] text-[var(--landing-subtle)]">
                              {baseName(p.path)}:{p.line}:{p.col}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-3 text-xs text-[var(--landing-subtle)]">
                      {status.state === 'ready'
                        ? 'No problems in the workspace. Try one of the edits above, or type your own.'
                        : status.state === 'missing' || status.state === 'failed'
                          ? 'opentide could not be loaded, so nothing is checked.'
                          : 'Problems appear once opentide has loaded.'}
                    </p>
                  )
                ) : log.length ? (
                  <pre className="m-0 whitespace-pre-wrap break-all px-3 py-2 font-mono text-[11.5px] leading-relaxed">
                    {log.map((l, i) => (
                      <div key={i} className={LOG_TONE[l.kind]}>
                        {l.kind === 'cmd' ? <span className="text-[var(--landing-accent)]">$ </span> : null}
                        {l.text}
                      </div>
                    ))}
                  </pre>
                ) : (
                  <p className="px-3 py-3 text-xs text-[var(--landing-subtle)]">Deploy writes its log here.</p>
                )}
              </div>
            </div>
          </div>

          {/* Deploy */}
          <aside aria-label="Deploy" className="min-h-0 border-t border-[var(--landing-border)] bg-[var(--landing-surface)] lg:border-l lg:border-t-0">
            <DeployPanel
              compiled={compiled}
              compileNow={compileNow}
              rulePath={rulePath}
              errors={problems.filter((p) => p.severity === 1)}
              warnings={counts[2]}
              engineReady={status.state === 'ready'}
              onShowProblems={() => setPanel('problems')}
              onLog={(lines) => {
                if (lines === 'clear') setLog([]);
                else {
                  setLog((l) => [...l, ...lines]);
                  setPanel('output');
                }
              }}
            />
          </aside>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 overflow-hidden border-t border-[var(--landing-border)] bg-[var(--landing-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--landing-subtle)]">
          <button type="button" onClick={() => setPanel('problems')} className="flex shrink-0 items-center gap-2 hover:text-[var(--landing-ink)]">
            <span className="flex items-center gap-1">
              <CircleX className="size-3" aria-hidden />
              {counts[1]}
            </span>
            <span className="flex items-center gap-1">
              <CircleAlert className="size-3" aria-hidden />
              {counts[2]}
            </span>
          </button>
          <span className="hidden shrink-0 sm:inline">
            {status.state === 'ready' ? `opentide ${status.version} · WebAssembly · started in ${status.ms} ms` : 'opentide · WebAssembly'}
          </span>
          <span className="ml-auto hidden shrink-0 xl:inline">Ctrl Space complete · F12 or ⌘/Ctrl click definition · F2 rename · Shift Alt F format</span>
          <span className="shrink-0 max-xl:ml-auto">
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span className="shrink-0">{activeFile?.language === 'toml' ? 'TOML' : 'Tide YAML'}</span>
        </div>
      </div>
    </div>
  );

}

const LOG_TONE: Record<LogLine['kind'], string> = {
  cmd: 'text-[var(--landing-ink)]',
  ok: 'text-[var(--landing-accent)]',
  info: 'text-[var(--landing-muted)]',
  warn: 'text-[var(--landing-ink)] opacity-90',
  err: 'text-[var(--landing-ink)] font-semibold',
  dim: 'text-[var(--landing-subtle)]',
  http: 'text-[var(--landing-subtle)]',
};

function PanelTab({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-2 py-2 font-mono text-[11px] text-[var(--landing-subtle)] transition hover:text-[var(--landing-ink)] aria-selected:text-[var(--landing-ink)]"
    >
      {children}
      {selected && <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--landing-accent)]" />}
    </button>
  );
}

function FileBadge({ counts, dirty }: { counts?: { e: number; w: number }; dirty: boolean }) {
  if (counts?.e) return <span className="rounded-full bg-[#ff6b6b]/15 px-1.5 font-mono text-[10px] text-[#e5484d] dark:text-[#ff8a8a]">{counts.e}</span>;
  if (counts?.w)
    return (
      <span className="rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-1.5 font-mono text-[10px] text-[var(--landing-accent)]">
        {counts.w}
      </span>
    );
  if (dirty) return <span className="size-1.5 rounded-full bg-[var(--landing-subtle)]" aria-label="modified" />;
  return null;
}

function EngineBadge({ status }: { status: EngineStatus }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px]';
  if (status.state === 'ready') {
    return (
      <span className={`${base} bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)]`}>
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
        opentide {status.version}<span className="hidden sm:inline"> · in your browser</span>
      </span>
    );
  }
  if (status.state === 'loading') {
    return (
      <span className={`${base} text-[var(--landing-subtle)]`}>
        <Cpu className="size-3" aria-hidden />
        {status.compiling ? 'compiling opentide…' : `loading opentide ${Math.round((status.received / Math.max(status.total, 1)) * 100)}%`}
      </span>
    );
  }
  if (status.state === 'missing' || status.state === 'failed') {
    return (
      <span className={`${base} border border-dashed border-[var(--landing-border)] text-[var(--landing-subtle)]`} title={status.state === 'failed' ? status.reason : undefined}>
        opentide unavailable
      </span>
    );
  }
  return <span className={`${base} text-[var(--landing-subtle)]`}>starting…</span>;
}

function LoadingVeil({ status }: { status: Extract<EngineStatus, { state: 'loading' }> }) {
  const pct = Math.round((status.received / Math.max(status.total, 1)) * 100);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end p-3">
      <div className="landing-playground-in w-64 rounded-xl border border-white/10 bg-[var(--pg-code-raised)]/95 p-3 text-[var(--pg-ink)] shadow-xl backdrop-blur">
        <p className="flex items-center justify-between font-mono text-[11px]">
          <span>{status.compiling ? 'Compiling opentide' : 'Loading opentide'}</span>
          <span className="text-[var(--pg-dim)]">{status.compiling ? '' : `${pct}%`}</span>
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--pg-yellow)] transition-[width] duration-150" style={{ width: `${status.compiling ? 100 : pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-[var(--pg-dim)]">
          {(status.total / 1_048_576).toFixed(1)} MB of WebAssembly, opentide {status.version}. You can type already.
        </p>
      </div>
    </div>
  );
}
