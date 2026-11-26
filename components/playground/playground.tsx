'use client';

import type { LSPClient } from '@codemirror/lsp-client';
import {
  Bug,
  Check,
  ChevronUp,
  CircleAlert,
  CircleX,
  Command,
  Cpu,
  Crosshair,
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
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DeployPanel } from '@/components/playground/deploy-panel';
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

const KIND_ORDER: Kind[] = ['rule', 'objective', 'threat', 'config'];

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
  const [status, setStatus] = useState<EngineStatus>({ state: 'idle' });
  const [diagnostics, setDiagnostics] = useState<Record<string, LspDiagnostic[]>>({});
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [lastRule, setLastRule] = useState<string>(INITIAL_PATH);

  const hosts = useRef<Record<string, HTMLDivElement | null>>({});
  const editors = useRef<Record<string, FileEditor>>({});
  const clientRef = useRef<LSPClient | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const [engineLoaded, setEngineLoaded] = useState(false);
  useEffect(() => {
    // Horizontally only: the page itself must not move.
    const pill = document.querySelector<HTMLElement>(`[data-pill-path="${CSS.escape(active)}"]`);
    const strip = pill?.parentElement;
    if (pill && strip && (pill.offsetLeft < strip.scrollLeft || pill.offsetLeft + pill.offsetWidth > strip.scrollLeft + strip.clientWidth)) {
      strip.scrollTo({ left: pill.offsetLeft - 8, behavior: 'smooth' });
    }
  }, [active]);

  const open = useCallback((path: string) => {
    if (!files.some((f) => f.path === path)) return;
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
        onCursor: () => {},
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
      group: 'Try',
      label: `${isApplied(sc, ruleText) ? 'Undo: ' : ''}${sc.label}`,
      detail: sc.shows,
      icon: SCENARIO_ICON[sc.id] ?? Bug,
      run: () => toggle(sc),
    })),
    { id: 'share', group: 'Workspace', label: 'Copy a share link', detail: 'your edits, in the URL fragment', icon: Link2, run: () => void share() },
    { id: 'reset', group: 'Workspace', label: 'Reset every file', detail: 'back to the demo repository', icon: RotateCcw, run: resetAll },
  ];

  const activeProblems = problems.filter((p) => p.path === active);
  // The pills read in the order a rule is built from: the rule, its objective, the threats, then configuration.
  const orderedFiles = [...files].sort((a, b) => KIND_ORDER.indexOf(kindOf(a.path).kind) - KIND_ORDER.indexOf(kindOf(b.path).kind));
  const showProblems = () => setProblemsOpen(true);

  return (
    <div className="landing-playground relative lg:h-full">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-6 pt-4 md:px-6 lg:h-full lg:pb-6">
        {/* Try: the scenarios, and sharing — on the page, no frame */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div role="group" aria-label="Try" className="landing-playground-scroll -mx-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 py-0.5">
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
                  className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--landing-hover)] px-3.5 py-2 text-[13px] font-medium text-[var(--landing-muted)] transition hover:text-[var(--landing-ink)] aria-pressed:bg-[var(--landing-accent)] aria-pressed:text-[var(--brand-accent-foreground)]"
                >
                  {on ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5 opacity-70 transition group-hover:opacity-100" aria-hidden />}
                  {sc.label}
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {anyDirty && (
              <ToolButton label="Reset every file" onClick={resetAll}>
                <RotateCcw className="size-4" aria-hidden />
              </ToolButton>
            )}
            <ToolButton label="Copy a share link" onClick={() => void share()}>
              <Link2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Share</span>
            </ToolButton>
            <ToolButton label="Go to a file or command (Ctrl/⌘ K)" onClick={() => setPaletteOpen(true)}>
              <Search className="size-4" aria-hidden />
              <kbd className="hidden items-center font-mono text-[11px] text-[var(--landing-subtle)] sm:inline-flex">
                <Command className="size-3" aria-hidden />K
              </kbd>
            </ToolButton>
          </div>
        </div>

        <div className="grid gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
          {/* The editor: one navy card, the files across its top, problems at its foot */}
          <section
            aria-label="Editor"
            className="flex h-[70svh] min-h-[460px] min-w-0 flex-col overflow-hidden rounded-3xl bg-[var(--pg-code-bg)] text-[var(--pg-ink)] shadow-[0_40px_90px_-45px_rgb(0_20_137/0.55)] ring-1 ring-black/5 dark:shadow-[0_40px_90px_-45px_rgb(0_0_0/0.95)] dark:ring-white/10 lg:h-auto lg:min-h-0"
          >
            <div className="flex items-center gap-3 px-3 pt-3">
              <div role="tablist" aria-label="Files" className="landing-playground-scroll relative flex min-w-0 flex-1 gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]">
                {orderedFiles.map((f) => {
                  const selected = f.path === active;
                  const counts = perFile[f.path];
                  const config = kindOf(f.path).kind === 'config';
                  return (
                    <button
                      key={f.path}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      title={f.path}
                      onClick={() => open(f.path)}
                      aria-label={config ? shortLabel(f.path, texts[f.path]) : undefined}
                      data-pill-path={f.path}
                      className="group relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] text-[var(--pg-dim)] transition hover:bg-white/[0.06] hover:text-[var(--pg-ink)] aria-selected:bg-white/[0.09] aria-selected:text-white"
                    >
                      <FileIcon path={f.path} className={selected ? 'text-[var(--pg-yellow)]' : 'opacity-70'} />
                      {(!config || selected) && <span className="max-w-[10rem] truncate">{shortLabel(f.path, texts[f.path])}</span>}
                      {counts?.e ? (
                        <span className="size-1.5 rounded-full bg-[var(--pg-error)]" aria-label={`${counts.e} errors`} />
                      ) : counts?.w ? (
                        <span className="size-1.5 rounded-full bg-[var(--pg-yellow)]" aria-label={`${counts.w} warnings`} />
                      ) : dirty(f.path) ? (
                        <span className="size-1.5 rounded-full bg-[var(--pg-dim)]" aria-label="modified" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <EngineStatusLabel status={status} />
            </div>
            <p className="truncate px-6 pb-1 pt-2 font-mono text-[11px] text-[var(--pg-dim)] opacity-80">{active}</p>

            {/* Editors: one per file, only the active one shown */}
            <div className="relative min-h-0 flex-1">
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

            {/* Problems: a slim bar that opens into the list */}
            {problemsOpen && problems.length > 0 && (
              <ul className="landing-playground-scroll max-h-[38%] shrink-0 overflow-y-auto border-t border-white/[0.07] px-2 py-1.5">
                {problems.map((p, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => reveal(p)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition hover:bg-white/[0.06]"
                    >
                      <span className="mt-px">{SEVERITY_ICON[p.severity]}</span>
                      <span className="min-w-0 flex-1 text-[var(--pg-ink)]">{p.message}</span>
                      <span className="shrink-0 font-mono text-[10.5px] text-[var(--pg-dim)]">
                        {baseName(p.path)}:{p.line}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex shrink-0 items-center gap-4 border-t border-white/[0.07] px-5 py-2.5 text-[12px] text-[var(--pg-dim)]">
              <button
                type="button"
                onClick={() => setProblemsOpen((o) => !o)}
                disabled={!problems.length}
                aria-expanded={problemsOpen && problems.length > 0}
                className="inline-flex items-center gap-2 transition enabled:hover:text-white disabled:cursor-default"
              >
                {status.state !== 'ready' ? (
                  <span>{status.state === 'missing' || status.state === 'failed' ? 'opentide could not be loaded' : 'Checks start once opentide loads'}</span>
                ) : problems.length ? (
                  <>
                    {counts[1] > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-[var(--pg-ink)]">
                        <CircleX className="size-3.5 text-[var(--pg-error)]" aria-hidden />
                        {counts[1]} error{counts[1] === 1 ? '' : 's'}
                      </span>
                    )}
                    {counts[2] > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-[var(--pg-ink)]">
                        <CircleAlert className="size-3.5 text-[var(--pg-yellow)]" aria-hidden />
                        {counts[2]} warning{counts[2] === 1 ? '' : 's'}
                      </span>
                    )}
                    {counts[3] > 0 && <span>{counts[3]} note{counts[3] === 1 ? '' : 's'}</span>}
                    <ChevronUp className={`size-3.5 transition-transform ${problemsOpen ? '' : 'rotate-180'}`} aria-hidden />
                    {activeProblems.length === 0 && <span className="hidden sm:inline">· in other files</span>}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-[var(--pg-yellow)]" aria-hidden />
                    No problems
                  </span>
                )}
              </button>
              <span className="ml-auto hidden truncate xl:inline">Ctrl Space to complete · F12 or ⌘/Ctrl click to follow a link · F2 to rename</span>
            </div>
          </section>

          {/* Deploy: on the page, beside the editor */}
          <aside aria-label="Deploy" className="flex min-h-0 flex-col lg:pt-2.5">
            <DeployPanel
              compiled={compiled}
              compileNow={compileNow}
              rulePath={rulePath}
              errors={problems.filter((p) => p.severity === 1)}
              warnings={counts[2]}
              engineReady={status.state === 'ready'}
              onShowProblems={showProblems}
            />
          </aside>
        </div>
      </div>

      {paletteOpen && <Palette items={paletteItems} onClose={() => setPaletteOpen(false)} />}
      {toast && (
        <div role="status" className="landing-playground-in pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
          <p className="rounded-full bg-[var(--landing-ink)] px-4 py-2 text-[13px] font-medium text-[var(--landing-bg)] shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  );
}

/** The pill label: an object's name, or the platform a platform file configures. */
function shortLabel(path: string, text: string | undefined) {
  const name = displayName(path, text);
  return name.replace(/^Microsoft /, '').replace(/ Enterprise Security$/, '');
}

/** opentide's state, quietly, in the editor's corner. */
function EngineStatusLabel({ status }: { status: EngineStatus }) {
  const base = 'hidden shrink-0 items-center gap-2 pr-2 font-mono text-[11px] text-[var(--pg-dim)] sm:inline-flex';
  if (status.state === 'ready') {
    return (
      <span className={base} title={`started in ${status.ms} ms, in your browser`}>
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--pg-yellow)] opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-[var(--pg-yellow)]" />
        </span>
        opentide {status.version}
      </span>
    );
  }
  if (status.state === 'loading') {
    return (
      <span className={base}>
        <Cpu className="size-3" aria-hidden />
        {status.compiling ? 'starting…' : `${Math.round((status.received / Math.max(status.total, 1)) * 100)}%`}
      </span>
    );
  }
  if (status.state === 'missing' || status.state === 'failed') {
    return (
      <span className={base} title={status.state === 'failed' ? status.reason : undefined}>
        opentide unavailable
      </span>
    );
  }
  return <span className={base}>starting…</span>;
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
      className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-[var(--landing-muted)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]"
    >
      {children}
    </button>
  );
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
