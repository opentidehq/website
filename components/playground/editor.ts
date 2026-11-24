/**
 * CodeMirror for the playground: one EditorView per file, all open in the language server at once
 * so the Problems panel covers the workspace. Colour comes from the engine's own `highlight()`
 * (the captures its HighlightSpec defines, with KQL and SPL injected into rule queries); before
 * the engine has loaded, the Lezer YAML grammar stands in.
 */
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { yaml } from '@codemirror/lang-yaml';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language';
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { lintGutter, lintKeymap } from '@codemirror/lint';
import {
  formatKeymap,
  hoverTooltips,
  jumpToDefinition,
  jumpToDefinitionKeymap,
  LSPClient,
  LSPPlugin,
  renameKeymap,
  serverCompletion,
  serverDiagnostics,
  signatureHelp,
  Workspace,
  type WorkspaceFile,
} from '@codemirror/lsp-client';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, RangeSetBuilder, StateEffect, StateField, type Extension, type Text } from '@codemirror/state';
import {
  Decoration,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { Engine, HighlightToken } from '@/components/playground/engine';
import type { PlaygroundFile } from '@/lib/playground/workspace';

/* ------------------------------------------------------------------------------------------------
 * Theme: deep-tide navy in both site themes, like every code panel on the site.
 * --------------------------------------------------------------------------------------------- */

export const editorTheme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: 'var(--pg-code-bg)', color: 'var(--pg-ink)', fontSize: '13px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
    '.cm-content': { caretColor: 'var(--pg-caret)', padding: '10px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--pg-caret)', borderLeftWidth: '2px' },
    '&.cm-focused': { outline: 'none' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection':
      { backgroundColor: 'rgb(126 200 227 / 0.22) !important' },
    '.cm-activeLine': { backgroundColor: 'rgb(255 255 255 / 0.035)' },
    '.cm-gutters': { backgroundColor: 'var(--pg-code-bg)', color: 'rgb(143 168 212 / 0.45)', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--pg-caret)' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px', minWidth: '44px' },
    '.cm-foldGutter .cm-gutterElement': { color: 'rgb(143 168 212 / 0.5)', paddingRight: '4px' },
    '.cm-matchingBracket': { backgroundColor: 'rgb(255 204 0 / 0.18)', outline: '1px solid rgb(255 204 0 / 0.35)' },
    '.cm-selectionMatch': { backgroundColor: 'rgb(126 200 227 / 0.12)' },
    '.cm-searchMatch': { backgroundColor: 'rgb(255 204 0 / 0.25)' },
    '.cm-tooltip': {
      backgroundColor: '#03112b',
      color: 'var(--pg-ink)',
      border: '1px solid rgb(126 200 227 / 0.22)',
      borderRadius: '10px',
      boxShadow: '0 18px 40px -12px rgb(0 0 0 / 0.7)',
      overflow: 'hidden',
    },
    '.cm-tooltip-hover': { maxWidth: '460px' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', maxHeight: '18em' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px', lineHeight: '1.5' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'rgb(255 204 0 / 0.16)', color: '#fff' },
    '.cm-completionDetail': { color: 'var(--pg-dim)', fontStyle: 'normal', marginLeft: '1em', fontSize: '11px' },
    '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--pg-yellow)' },
    '.cm-completionInfo': { padding: '8px 12px', maxWidth: '360px' },
    '.cm-completionIcon': { opacity: '0.7' },
    '.cm-lsp-documentation': { padding: '8px 12px', fontSize: '12.5px', lineHeight: '1.55', fontFamily: 'var(--font-sans)' },
    '.cm-lsp-documentation p': { margin: '4px 0' },
    '.cm-lsp-documentation code': {
      fontFamily: 'var(--font-mono)',
      fontSize: '11.5px',
      backgroundColor: 'rgb(126 200 227 / 0.1)',
      color: 'var(--pg-foam)',
      padding: '1px 4px',
      borderRadius: '4px',
    },
    '.cm-lsp-documentation strong': { color: '#fff' },
    '.cm-lsp-documentation a': { color: 'var(--pg-yellow)', textDecoration: 'underline', textUnderlineOffset: '2px' },
    '.cm-lsp-signature-tooltip': { padding: '6px 10px', fontFamily: 'var(--font-mono)' },
    '.cm-lsp-active-parameter': { color: 'var(--pg-yellow)', fontWeight: '600' },
    '.cm-diagnostic': { padding: '6px 10px', fontSize: '12.5px', borderLeftWidth: '3px' },
    '.cm-diagnostic-error': { borderLeftColor: '#ff6b6b' },
    '.cm-diagnostic-warning': { borderLeftColor: 'var(--pg-yellow)' },
    '.cm-diagnostic-info': { borderLeftColor: 'var(--pg-foam)' },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy #ff6b6b',
      textUnderlineOffset: '3px',
      textDecorationSkipInk: 'none',
    },
    '.cm-lintRange-warning': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy rgb(255 204 0 / 0.85)',
      textUnderlineOffset: '3px',
      textDecorationSkipInk: 'none',
    },
    '.cm-lintRange-info': {
      backgroundImage: 'none',
      textDecoration: 'underline dotted rgb(126 200 227 / 0.7)',
      textUnderlineOffset: '3px',
    },
    '.cm-lint-marker': { width: '0.8em', height: '0.8em' },
    '.cm-gutter-lint': { width: '1.1em' },
    '.cm-panels': { backgroundColor: '#03112b', color: 'var(--pg-ink)' },
    '.cm-panels.cm-panels-top': { borderBottom: '1px solid rgb(126 200 227 / 0.15)' },
    '.cm-textfield': { backgroundColor: 'rgb(255 255 255 / 0.06)', border: '1px solid rgb(126 200 227 / 0.25)', color: 'inherit', borderRadius: '6px' },
    '.cm-button': { backgroundImage: 'none', backgroundColor: 'rgb(255 255 255 / 0.08)', border: '1px solid rgb(126 200 227 / 0.25)', color: 'inherit', borderRadius: '6px' },
    '.cm-inlay': {
      marginLeft: '1.25em',
      padding: '0 7px',
      borderRadius: '999px',
      fontSize: '11px',
      color: 'var(--pg-foam)',
      backgroundColor: 'rgb(126 200 227 / 0.1)',
      border: '1px solid rgb(126 200 227 / 0.18)',
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    '.cm-inlay:hover': { color: 'var(--pg-yellow)', borderColor: 'rgb(255 204 0 / 0.4)' },
  },
  { dark: true },
);

/** Lezer stand-in, used until the engine's tokens arrive and for TOML, which the engine does not highlight. */
const fallbackStyle = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: 'var(--pg-foam)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--pg-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--pg-number)' },
  { tag: [t.comment, t.lineComment], color: 'var(--pg-comment)', fontStyle: 'italic' },
  { tag: [t.heading, t.className, t.typeName, t.labelName], color: 'var(--pg-yellow)' },
  { tag: [t.keyword, t.operator, t.punctuation, t.separator, t.bracket], color: 'var(--pg-dim)' },
  { tag: [t.variableName], color: 'var(--pg-ink)' },
]);

/* ------------------------------------------------------------------------------------------------
 * Engine highlighting: highlight() tokens as mark decorations, one class per capture.
 * --------------------------------------------------------------------------------------------- */

const setTokens = StateEffect.define<DecorationSet>();
const markCache = new Map<string, Decoration>();
const markFor = (capture: string) => {
  let mark = markCache.get(capture);
  if (!mark) {
    mark = Decoration.mark({ class: `ot-${capture.replace(/[^a-z0-9]+/gi, '-')}` });
    markCache.set(capture, mark);
  }
  return mark;
};

function lineOffset(doc: Text, line: number, character: number) {
  if (line + 1 > doc.lines) return doc.length;
  const l = doc.line(line + 1);
  return Math.min(l.from + character, l.to);
}

function tokensToDecorations(doc: Text, tokens: HighlightToken[]): DecorationSet {
  const ranges = tokens
    .map((token) => ({
      from: lineOffset(doc, token.range.start.line, token.range.start.character),
      to: lineOffset(doc, token.range.end.line, token.range.end.character),
      capture: token.capture,
    }))
    .filter((r) => r.to > r.from)
    .sort((a, b) => a.from - b.from || b.to - a.to);
  const builder = new RangeSetBuilder<Decoration>();
  let last = -1;
  for (const r of ranges) {
    if (r.from < last) continue;
    builder.add(r.from, r.to, markFor(r.capture));
    last = r.to;
  }
  return builder.finish();
}

const engineTokens = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    for (const effect of tr.effects) if (effect.is(setTokens)) return effect.value;
    return tr.docChanged ? value.map(tr.changes) : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** Ask the engine for tokens after each pause in typing; drop answers to text that has moved on. */
function engineHighlighting(engine: Engine, language: string, onFirst: () => void): Extension {
  return [
    engineTokens,
    ViewPlugin.fromClass(
      class {
        timer = 0;
        seq = 0;
        first = true;
        constructor(readonly view: EditorView) {
          this.request(0);
        }
        update(update: ViewUpdate) {
          if (update.docChanged) this.request(90);
        }
        request(delay: number) {
          window.clearTimeout(this.timer);
          this.timer = window.setTimeout(() => {
            const seq = ++this.seq;
            const doc = this.view.state.doc;
            void engine.highlight(language, doc.toString()).then((tokens) => {
              if (seq !== this.seq || this.view.state.doc !== doc) return;
              this.view.dispatch({ effects: setTokens.of(tokensToDecorations(doc, tokens)) });
              if (this.first) {
                this.first = false;
                onFirst();
              }
            });
          }, delay);
        }
        destroy() {
          window.clearTimeout(this.timer);
          this.seq++;
        }
      },
    ),
  ];
}

/* ------------------------------------------------------------------------------------------------
 * Inlay hints: what a UUID points at, from `textDocument/inlayHint`. Click one to go there.
 * --------------------------------------------------------------------------------------------- */

type InlayHint = {
  position: { line: number; character: number };
  label: string | { value: string; location?: { uri: string } }[];
};

class InlayWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly target: string | null,
  ) {
    super();
  }
  eq(other: InlayWidget) {
    return other.text === this.text && other.target === this.target;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-inlay';
    span.textContent = `→ ${this.text}`;
    if (this.target) span.dataset.target = this.target;
    span.title = this.target ? 'Open the object it links to' : '';
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

const setInlays = StateEffect.define<DecorationSet>();
const inlayField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    for (const effect of tr.effects) if (effect.is(setInlays)) return effect.value;
    return tr.docChanged ? value.map(tr.changes) : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function inlayHints(onOpen: (uri: string) => void): Extension {
  return [
    inlayField,
    ViewPlugin.fromClass(
      class {
        timer = 0;
        seq = 0;
        constructor(readonly view: EditorView) {
          this.schedule(200);
        }
        update(update: ViewUpdate) {
          if (update.docChanged) this.schedule(700);
        }
        schedule(delay: number) {
          window.clearTimeout(this.timer);
          this.timer = window.setTimeout(() => void this.fetch(), delay);
        }
        async fetch() {
          const plugin = LSPPlugin.get(this.view);
          if (!plugin) return;
          const seq = ++this.seq;
          plugin.client.sync();
          const doc = this.view.state.doc;
          try {
            const hints = await plugin.client.request<unknown, InlayHint[] | null>('textDocument/inlayHint', {
              textDocument: { uri: plugin.uri },
              range: { start: { line: 0, character: 0 }, end: { line: doc.lines, character: 0 } },
            });
            if (seq !== this.seq || this.view.state.doc !== doc) return;
            const builder = new RangeSetBuilder<Decoration>();
            const sorted = (hints ?? [])
              .map((h) => ({ pos: lineOffset(doc, h.position.line, h.position.character), hint: h }))
              .sort((a, b) => a.pos - b.pos);
            for (const { pos, hint } of sorted) {
              const parts = typeof hint.label === 'string' ? [{ value: hint.label }] : hint.label;
              const text = parts.map((p) => p.value).join('');
              const target = parts.find((p) => 'location' in p && p.location)?.location?.uri ?? null;
              builder.add(pos, pos, Decoration.widget({ widget: new InlayWidget(text, target), side: 1 }));
            }
            this.view.dispatch({ effects: setInlays.of(builder.finish()) });
          } catch {
            /* a hint is a nicety: no answer, no hint */
          }
        }
        destroy() {
          window.clearTimeout(this.timer);
          this.seq++;
        }
      },
      {
        eventHandlers: {
          mousedown(event) {
            const target = (event.target as HTMLElement).closest<HTMLElement>('.cm-inlay')?.dataset.target;
            if (!target) return false;
            event.preventDefault();
            onOpen(target);
            return true;
          },
        },
      },
    ),
  ];
}

/** Cmd/Ctrl-click jumps to the definition, as in VS Code. */
const clickToDefinition = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.metaKey || event.ctrlKey) || event.button !== 0) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;
    view.dispatch({ selection: { anchor: pos } });
    event.preventDefault();
    return jumpToDefinition(view);
  },
});

/* ------------------------------------------------------------------------------------------------
 * The LSP workspace: every file has a view; the client opens them all.
 * --------------------------------------------------------------------------------------------- */

class PlaygroundWorkspaceFile implements WorkspaceFile {
  constructor(
    public uri: string,
    public languageId: string,
    public version: number,
    public doc: Text,
    public view: EditorView,
  ) {}
  getView() {
    return this.view;
  }
}

export class PlaygroundWorkspace extends Workspace {
  files: PlaygroundWorkspaceFile[] = [];
  private versions: Record<string, number> = {};
  /** Set by the page: bring a file's tab to the front and return its view. */
  static display: (uri: string) => EditorView | null = () => null;

  private nextVersion(uri: string) {
    return (this.versions[uri] = (this.versions[uri] ?? -1) + 1);
  }
  syncFiles() {
    const out = [];
    for (const file of this.files) {
      const plugin = LSPPlugin.get(file.view);
      if (!plugin) continue;
      const changes = plugin.unsyncedChanges;
      if (!changes.empty) {
        out.push({ changes, file, prevDoc: file.doc });
        file.doc = file.view.state.doc;
        file.version = this.nextVersion(file.uri);
        plugin.clear();
      }
    }
    return out;
  }
  openFile(uri: string, languageId: string, view: EditorView) {
    const existing = this.getFile(uri) as PlaygroundWorkspaceFile | null;
    if (existing) {
      existing.view = view;
      return;
    }
    const file = new PlaygroundWorkspaceFile(uri, languageId, this.nextVersion(uri), view.state.doc, view);
    this.files.push(file);
    this.client.didOpen(file);
  }
  closeFile(uri: string) {
    const file = this.getFile(uri);
    if (!file) return;
    this.files = this.files.filter((f) => f !== file);
    this.client.didClose(uri);
  }
  async displayFile(uri: string) {
    return PlaygroundWorkspace.display(uri);
  }
}

/** Strip what Markdown from the server has no business carrying: scripts, handlers, frames. */
export function sanitizeHTML(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed, form').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on') || (/^(href|src)$/.test(attr.name) && /^\s*javascript:/i.test(attr.value))) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return doc.body.firstElementChild?.innerHTML ?? '';
}

export function createClient(rootUri: string, workspace: { documents: { uri: string; text: string }[]; visibility?: string }, onDiagnostics: (uri: string, diagnostics: LspDiagnostic[]) => void) {
  return new LSPClient({
    rootUri,
    timeout: 15_000,
    initializationOptions: { workspace },
    workspace: (client) => new PlaygroundWorkspace(client),
    sanitizeHTML,
    notificationHandlers: {
      'textDocument/publishDiagnostics': (_client, params: { uri: string; diagnostics: LspDiagnostic[] }) => {
        onDiagnostics(params.uri, params.diagnostics);
        return false;
      },
      'window/logMessage': () => true,
    },
    extensions: [
      serverCompletion(),
      hoverTooltips({ hoverTime: 260 }),
      signatureHelp(),
      serverDiagnostics(),
      keymap.of([...formatKeymap, ...renameKeymap, ...jumpToDefinitionKeymap]),
    ],
  });
}

export type LspDiagnostic = {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  severity?: number;
  code?: string | number;
  message: string;
  source?: string;
};

/* ------------------------------------------------------------------------------------------------
 * One editor per file.
 * --------------------------------------------------------------------------------------------- */

export type FileEditor = {
  view: EditorView;
  /** Attach the engine once it has loaded: LSP features and engine highlighting. */
  attach(client: LSPClient, engine: Engine, uri: string): void;
};

export function createFileEditor(
  file: PlaygroundFile,
  parent: HTMLElement,
  hooks: { onChange: (text: string) => void; onCursor: (line: number, col: number) => void; onOpen: (uri: string) => void },
): FileEditor {
  const lsp = new Compartment();
  const fallback = new Compartment();
  const isYaml = file.language === 'opentide-yaml';

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: file.text,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter({ openText: '▾', closedText: '▸' }),
        lintGutter(),
        history(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ activateOnTyping: true, icons: true }),
        highlightActiveLine(),
        highlightSelectionMatches(),
        EditorState.tabSize.of(2),
        isYaml ? yaml() : StreamLanguage.define(toml),
        fallback.of(syntaxHighlighting(fallbackStyle)),
        lsp.of([]),
        clickToDefinition,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) hooks.onChange(update.state.doc.toString());
          if (update.selectionSet || update.docChanged || update.focusChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            hooks.onCursor(line.number, head - line.from + 1);
          }
        }),
      ],
    }),
  });

  return {
    view,
    attach(client, engine, uri) {
      if (!isYaml) return;
      view.dispatch({
        effects: lsp.reconfigure([
          client.plugin(uri, file.language),
          engineHighlighting(engine, file.language, () => view.dispatch({ effects: fallback.reconfigure([]) })),
          inlayHints(hooks.onOpen),
        ]),
      });
    },
  };
}
