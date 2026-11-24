'use client';

import type { LSPClient } from '@codemirror/lsp-client';
import {
  Bug,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleX,
  Command,
  Cpu,
  Crosshair,
  GitBranch,
  Info,
  Link2,
  RotateCcw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SpellCheck,
  Target,
  TriangleAlert,
  Unlink,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DeployPanel, type LogLine } from '@/components/playground/deploy-panel';
import { createClient, createFileEditor, PlaygroundWorkspace, type FileEditor, type LspDiagnostic } from '@/components/playground/editor';
import { startEngine, type Engine, type EngineStatus } from '@/components/playground/engine';
import { compileRule } from '@/lib/playground/compile';
import { isApplied, SCENARIOS, toggleScenario, type Scenario } from '@/lib/playground/scenarios';
import { decodeShare, encodeShare } from '@/lib/playground/share';
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

type Kind = 'threat' | 'objective' | 'rule' | 'config';

/** The explorer groups files by what they are, not by folder. */
const KINDS: { kind: Kind; label: string; icon: LucideIcon; match: RegExp }[] = [
  { kind: 'threat', label: 'Threats', icon: Crosshair, match: /^objects\/threats\// },
  { kind: 'objective', label: 'Objectives', icon: Target, match: /^objects\/objectives\// },
  { kind: 'rule', label: 'Rules', icon: ShieldCheck, match: /^objects\/rules\// },
  { kind: 'config', label: 'Configuration', icon: SlidersHorizontal, match: /^\.opentide\// },
];

const kindOf = (path: string) => KINDS.find((k) => k.match.test(path)) ?? KINDS[3];

function FileIcon({ path, className = '' }: { path: string; className?: string }) {
  const { icon: Icon } = kindOf(path);
  return <Icon className={`size-3.5 shrink-0 ${className}`} aria-hidden />;
}

const baseName = (path: string) => path.split('/').pop() ?? path;

/** A Tide object's `name:`, or the file name for anything else. */
function displayName(path: string, text: string | undefined) {
  if (path.endsWith('visibility.toml')) return 'Visibility';
  if (path.endsWith('.toml')) return /^name\s*=\s*"([^"]+)"/m.exec(text ?? '')?.[1] ?? baseName(path);
  return /^name:\s*(.+)$/m.exec(text ?? '')?.[1]?.trim() || baseName(path);
}

const SCENARIO_ICON: Record<string, LucideIcon> = { kql: Bug, vocab: SpellCheck, ref: Unlink, prod: Rocket };

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
    let disposed = false;
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

    // A shared link carries edited files in its fragment: put them in the editors.
    void decodeShare(window.location.hash).then((shared) => {
      if (!shared || disposed) return;
      for (const [path, text] of Object.entries(shared)) {
        const view = created[path]?.view;
        if (view) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
      }
    });

    PlaygroundWorkspace.display = (uri) => {
      const path = pathOf(uri);
      if (!created[path]) return null;
      open(path);
      return created[path].view;
    };

    let engine: Engine | null = null;
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

  /** Apply a scenario to the demo rule, or undo it when it is in effect. */
  const toggle = (scenario: Scenario) => {
    const path = INITIAL_PATH;
    open(path);
    const view = editors.current[path]?.view;
    if (!view) return;
    const changes = toggleScenario(scenario, view.state.doc.toString());
    if (!changes.length) {
      flash(`“${scenario.label}” needs the demo text: reset the rule first`);
      return;
    }
    requestAnimationFrame(() => {
      view.dispatch({ changes, selection: { anchor: changes[0].from + changes[0].insert.length }, scrollIntoView: true, userEvent: 'input.scenario' });
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
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  };

  const closeTab = (path: string) => {
    if (tabs.length === 1) return;
    const next = tabs.filter((p) => p !== path);
    setTabs(next);
    if (path === active) setActive(next[Math.max(0, tabs.indexOf(path) - 1)]);
  };

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);
  const flash = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  /** Put the files that differ from the demo in the URL fragment and copy the link. */
  const share = async () => {
    const changed: Record<string, string> = {};
    for (const file of files) {
      const text = editors.current[file.path]?.view.state.doc.toString() ?? texts[file.path];
      if (text !== file.text) changed[file.path] = text;
    }
    const hash = Object.keys(changed).length ? await encodeShare(changed) : '';
    history.replaceState(null, '', `${window.location.pathname}${hash}`);
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash(hash ? 'Link copied: it carries your edits' : 'Link copied: no edits yet, it opens the demo');
    } catch {
      flash('The link is in the address bar');
    }
  };

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dirty = (path: string) => texts[path] !== original[path];
  const anyDirty = files.some((f) => dirty(f.path));
  const ruleText = texts[INITIAL_PATH] ?? '';
  const activeFile = files.find((f) => f.path === active);

  const paletteItems: PaletteItem[] = [
    ...files.map((f) => ({
      id: `file:${f.path}`,
      group: 'Files',
      label: displayName(f.path, texts[f.path]),
      detail: f.path,
      icon: kindOf(f.path).icon,
      run: () => open(f.path),
    })),
    ...SCENARIOS.map((sc) => ({
      id: `scenario:${sc.id}`,
      group: 'Scenarios',
      label: `${isApplied(sc, ruleText) ? 'Undo: ' : ''}${sc.label}`,
      detail: sc.shows,
      icon: SCENARIO_ICON[sc.id] ?? Bug,
      run: () => toggle(sc),
    })),
    { id: 'share', group: 'Workspace', label: 'Copy a share link', detail: 'your edits, in the URL fragment', icon: Link2, run: () => void share() },
    { id: 'reset', group: 'Workspace', label: 'Reset every file', detail: 'back to the demo repository', icon: RotateCcw, run: resetAll },
  ];

  return (
    <div className="landing-playground relative flex flex-col lg:h-full">
      <div className="flex flex-col bg-[var(--landing-surface)] lg:min-h-0 lg:flex-1">
        {/* Toolbar: the repository, the scenarios, sharing, opentide */}
        <div className="flex min-w-0 items-center gap-2 border-y border-[var(--landing-border)] bg-[var(--landing-panel)] px-2.5 py-1.5">
          <span className="hidden shrink-0 items-center gap-2 pl-1 pr-1 font-mono text-xs text-[var(--landing-subtle)] md:flex">
            <GitBranch className="size-3.5 text-[var(--landing-accent)]" aria-hidden />
            <span className="text-[var(--landing-ink)]">detection-repo</span>
            <span className="hidden 2xl:inline">feat/lsass-credential-access</span>
          </span>
          <span aria-hidden className="hidden h-5 w-px bg-[var(--landing-border)] md:block" />
          <div role="group" aria-label="Scenarios" className="landing-playground-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {SCENARIOS.map((sc) => {
              const on = isApplied(sc, ruleText);
              const Icon = SCENARIO_ICON[sc.id] ?? Bug;
              return (
                <button
                  key={sc.id}
                  type="button"
                  aria-pressed={on}
                  title={on ? `Undo: ${sc.label}` : `Shows ${sc.shows}`}
                  onClick={() => toggle(sc)}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)] aria-pressed:bg-[color-mix(in_srgb,var(--landing-accent)_13%,transparent)] aria-pressed:text-[var(--landing-accent)]"
                >
                  {on ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5 opacity-70 group-hover:opacity-100" aria-hidden />}
                  {sc.label}
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {anyDirty && (
              <ToolButton label="Reset every file" onClick={resetAll}>
                <RotateCcw className="size-3.5" aria-hidden />
              </ToolButton>
            )}
            <ToolButton label="Copy a share link" onClick={() => void share()}>
              <Link2 className="size-3.5" aria-hidden />
              <span className="hidden xl:inline">Share</span>
            </ToolButton>
            <ToolButton label="Go to file or command (Ctrl/⌘ P)" onClick={() => setPaletteOpen(true)}>
              <Search className="size-3.5" aria-hidden />
              <kbd className="hidden items-center gap-0.5 font-mono text-[10.5px] text-[var(--landing-subtle)] xl:inline-flex">
                <Command className="size-2.5" aria-hidden />P
              </kbd>
            </ToolButton>
            <span className="ml-1 hidden sm:block">
              <EngineBadge status={status} />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:grid-cols-[236px_minmax(0,1fr)_360px] xl:grid-cols-[256px_minmax(0,1fr)_400px]">
          {/* Explorer: the workspace by object kind */}
          <nav aria-label="Workspace" className="landing-playground-scroll hidden min-h-0 overflow-y-auto border-r border-[var(--landing-border)] bg-[var(--landing-panel)] pb-3 lg:block">
            {KINDS.map((k) => {
              const paths = files.map((f) => f.path).filter((path) => kindOf(path).kind === k.kind);
              if (!paths.length) return null;
              return (
                <section key={k.kind} className="pt-3">
                  <h2 className="flex items-center justify-between px-4 pb-1 font-mono text-[10.5px] text-[var(--landing-subtle)]">
                    <span>{k.label.toLowerCase()}</span>
                    <span>{paths.length}</span>
                  </h2>
                  <ul className="px-1.5">
                    {paths.map((path) => (
                      <li key={path}>
                        <button
                          type="button"
                          onClick={() => open(path)}
                          aria-current={path === active ? 'true' : undefined}
                          title={path}
                          className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-[var(--landing-hover)] aria-[current]:bg-[color-mix(in_srgb,var(--landing-accent)_11%,transparent)]"
                        >
                          <FileIcon path={path} className="mt-[3px] text-[var(--landing-subtle)] group-aria-[current]:text-[var(--landing-accent)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] leading-5 text-[var(--landing-muted)] group-aria-[current]:font-medium group-aria-[current]:text-[var(--landing-ink)]">
                              {displayName(path, texts[path])}
                            </span>
                            <span className="block truncate font-mono text-[10.5px] leading-4 text-[var(--landing-subtle)]">{baseName(path)}</span>
                          </span>
                          <span className="mt-1">
                            <FileBadge counts={perFile[path]} dirty={dirty(path)} />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </nav>

          {/* Editor column */}
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="flex items-stretch border-b border-[var(--landing-border)] bg-[var(--landing-panel)]">
              <div role="tablist" aria-label="Open files" className="landing-playground-scroll flex min-w-0 flex-1 overflow-x-auto">
                {tabs.map((path) => {
                  const selected = path === active;
                  return (
                    <div
                      key={path}
                      data-selected={selected ? '' : undefined}
                      className="group relative flex shrink-0 items-center border-r border-[var(--landing-border)] text-[12.5px] text-[var(--landing-subtle)] transition-colors hover:text-[var(--landing-ink)] data-[selected]:bg-[var(--pg-code-bg)] data-[selected]:text-[var(--pg-ink)]"
                    >
                      {selected && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--pg-yellow)]" />}
                      <button type="button" role="tab" aria-selected={selected} onClick={() => open(path)} className="flex items-center gap-2 py-2.5 pl-3.5 pr-1.5">
                        <FileIcon path={path} className={selected ? 'text-[var(--pg-yellow)]' : ''} />
                        {baseName(path)}
                        {dirty(path) && <span className="size-1.5 rounded-full bg-current opacity-70" aria-label="modified" />}
                      </button>
                      {tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => closeTab(path)}
                          aria-label={`Close ${baseName(path)}`}
                          className="mr-2 rounded p-0.5 opacity-0 transition hover:bg-white/10 focus-visible:opacity-100 group-hover:opacity-100 group-data-[selected]:opacity-60"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      )}
                    </div>
                  );
                })}
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
                      {displayName(f.path, texts[f.path])}
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
            <div className={`flex min-h-0 flex-col border-t border-[var(--landing-border)] bg-[var(--landing-panel)] ${panelOpen ? 'h-[200px] lg:h-[196px]' : ''}`}>
              <div role="tablist" aria-label="Panels" className="flex items-center gap-1 px-2">
                <PanelTab
                  selected={panelOpen && panel === 'problems'}
                  onClick={() => {
                    setPanel('problems');
                    setPanelOpen(true);
                  }}
                >
                  problems
                  <ProblemCount errors={counts[1]} warnings={counts[2]} />
                </PanelTab>
                <PanelTab
                  selected={panelOpen && panel === 'output'}
                  onClick={() => {
                    setPanel('output');
                    setPanelOpen(true);
                  }}
                >
                  output
                  {log.length > 0 && <span className="size-1.5 rounded-full bg-[var(--landing-accent)]" />}
                </PanelTab>
                <button
                  type="button"
                  onClick={() => setPanelOpen((o) => !o)}
                  aria-expanded={panelOpen}
                  aria-label={panelOpen ? 'Collapse the panel' : 'Expand the panel'}
                  className="ml-auto rounded-md p-1 text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
                >
                  {panelOpen ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronUp className="size-3.5" aria-hidden />}
                </button>
              </div>
              {panelOpen && (
                <div className="landing-playground-scroll min-h-0 flex-1 overflow-y-auto border-t border-[var(--landing-border)]">
                  {panel === 'problems' ? (
                    problems.length ? (
                      <ul className="py-1">
                        {problems.map((p, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => reveal(p)}
                              className="flex w-full items-start gap-2.5 px-3 py-1.5 text-left text-xs transition hover:bg-[var(--landing-hover)]"
                            >
                              <span className="mt-px">{SEVERITY_ICON[p.severity]}</span>
                              <span className="min-w-0 flex-1 text-[var(--landing-ink)]">{p.message}</span>
                              {p.code && <span className="hidden shrink-0 font-mono text-[10.5px] text-[var(--landing-subtle)] md:inline">{p.code}</span>}
                              <span className="shrink-0 rounded bg-[var(--landing-hover)] px-1.5 font-mono text-[10.5px] text-[var(--landing-subtle)]">
                                {baseName(p.path)}:{p.line}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex h-full items-center gap-3 px-4 text-xs text-[var(--landing-subtle)]">
                        {status.state === 'ready' ? (
                          <>
                            <Check className="size-4 text-[var(--landing-accent)]" aria-hidden />
                            <span>
                              No problems in the workspace. Pick a scenario above, or type your own mistake.
                            </span>
                          </>
                        ) : status.state === 'missing' || status.state === 'failed' ? (
                          'opentide could not be loaded, so nothing is checked.'
                        ) : (
                          'Problems appear once opentide has loaded.'
                        )}
                      </div>
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
                    <p className="px-4 py-3 text-xs text-[var(--landing-subtle)]">Deploy writes its log here.</p>
                  )}
                </div>
              )}
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
              onShowProblems={() => {
                setPanel('problems');
                setPanelOpen(true);
              }}
              onLog={(lines) => {
                if (lines === 'clear') setLog([]);
                else {
                  setLog((l) => [...l, ...lines]);
                  setPanel('output');
                  setPanelOpen(true);
                }
              }}
            />
          </aside>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 overflow-hidden border-t border-[var(--landing-border)] bg-[var(--landing-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--landing-subtle)]">
          <button
            type="button"
            onClick={() => {
              setPanel('problems');
              setPanelOpen(true);
            }}
            className="flex shrink-0 items-center gap-2.5 hover:text-[var(--landing-ink)]"
          >
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
          <span className="ml-auto hidden shrink-0 2xl:inline">Ctrl Space complete · F12 or ⌘/Ctrl click definition · F2 rename · Shift Alt F format</span>
          <span className="shrink-0 max-2xl:ml-auto">
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span className="shrink-0">{activeFile?.language === 'toml' ? 'TOML' : 'Tide YAML'}</span>
        </div>
      </div>

      {paletteOpen && <Palette items={paletteItems} onClose={() => setPaletteOpen(false)} />}
      {toast && (
        <div role="status" className="landing-playground-in pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
          <p className="rounded-full bg-[var(--landing-ink)] px-4 py-2 text-[13px] font-medium text-[var(--landing-bg)] shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  );
}

type PaletteItem = { id: string; group: string; label: string; detail: string; icon: LucideIcon; run: () => void };

/** Letters of the query in order, anywhere in the text. */
function fuzzy(query: string, text: string) {
  let at = 0;
  const t = text.toLowerCase();
  for (const c of query.toLowerCase().replace(/\s+/g, '')) {
    at = t.indexOf(c, at);
    if (at < 0) return false;
    at++;
  }
  return true;
}

/** Go to a file or run a command: Ctrl/⌘ P or K. */
function Palette({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = items.filter((item) => fuzzy(query, `${item.label} ${item.detail}`));
  const current = Math.min(index, Math.max(shown.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const run = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to file or command"
        onMouseDown={(e) => e.stopPropagation()}
        className="landing-playground-in w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-panel)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--landing-border)] px-4">
          <Search className="size-4 text-[var(--landing-subtle)]" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((current + 1) % Math.max(shown.length, 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((current - 1 + shown.length) % Math.max(shown.length, 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(shown[current]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Go to a file, or run a scenario…"
            aria-controls="playground-palette"
            className="h-12 flex-1 bg-transparent text-[15px] text-[var(--landing-ink)] outline-none placeholder:text-[var(--landing-subtle)]"
          />
          <kbd className="rounded border border-[var(--landing-border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--landing-subtle)]">esc</kbd>
        </div>
        <ul id="playground-palette" ref={listRef} role="listbox" className="landing-playground-scroll max-h-[50vh] overflow-y-auto p-1.5">
          {shown.map((item, i) => {
            const Icon = item.icon;
            const header = i === 0 || shown[i - 1].group !== item.group;
            return (
              <li key={item.id} role="presentation">
                {header && <p className="px-3 pb-1 pt-2.5 font-mono text-[10.5px] text-[var(--landing-subtle)]">{item.group.toLowerCase()}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === current}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left aria-selected:bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)]"
                >
                  <Icon className="size-4 shrink-0 text-[var(--landing-subtle)]" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--landing-ink)]">{item.label}</span>
                  <span className="hidden max-w-[45%] truncate font-mono text-[11px] text-[var(--landing-subtle)] sm:block">{item.detail}</span>
                </button>
              </li>
            );
          })}
          {!shown.length && <li className="px-3 py-6 text-center text-sm text-[var(--landing-subtle)]">Nothing matches “{query}”.</li>}
        </ul>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
    >
      {children}
    </button>
  );
}

function ProblemCount({ errors, warnings }: { errors: number; warnings: number }) {
  if (!errors && !warnings) return <span className="rounded-full bg-[var(--landing-hover)] px-1.5 text-[10px]">0</span>;
  return (
    <span className="flex items-center gap-1">
      {errors > 0 && <span className="rounded-full bg-[#ff6b6b]/15 px-1.5 text-[10px] text-[#e5484d] dark:text-[#ff8a8a]">{errors}</span>}
      {warnings > 0 && (
        <span className="rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-1.5 text-[10px] text-[var(--landing-accent)]">{warnings}</span>
      )}
    </span>
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
