'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';

function highlightLine(line: string, lang: 'yaml' | 'toml' | 'text'): ReactNode[] {
  if (!line) return [<span key="empty"> </span>];

  if (lang === 'toml') {
    if (line.trim().startsWith('#')) {
      return [<span key="c" className="text-[var(--landing-dim)] italic">{line}</span>];
    }
    if (/^\s*\[[^\]]+\]\s*$/.test(line)) {
      return [<span key="s" className="text-violet-700 dark:text-violet-300">{line}</span>];
    }
    const eq = line.indexOf('=');
    if (eq > 0) {
      return [
        <span key="k" className="text-sky-700 dark:text-sky-400">
          {line.slice(0, eq)}
        </span>,
        <span key="eq" className="text-[var(--landing-dim)]">
          =
        </span>,
        <span key="v" className="text-emerald-700 dark:text-emerald-400">
          {line.slice(eq + 1)}
        </span>,
      ];
    }
    return [<span key="t">{line}</span>];
  }

  if (lang === 'yaml') {
    if (line.trim().startsWith('#')) {
      return [<span key="c" className="text-[var(--landing-dim)] italic">{line}</span>];
    }
    const indent = line.match(/^\s*/)?.[0] ?? '';
    const rest = line.slice(indent.length);
    if (rest.startsWith('- ')) {
      const inner = rest.slice(2);
      const ci = inner.indexOf(':');
      if (ci >= 0) {
        return [
          <span key="i">{indent}</span>,
          <span key="d" className="text-[var(--landing-dim)]">
            -{' '}
          </span>,
          <span key="k" className="font-medium text-sky-700 dark:text-sky-400">
            {inner.slice(0, ci + 1)}
          </span>,
          <span key="v" className="text-emerald-700 dark:text-emerald-400">
            {inner.slice(ci + 1)}
          </span>,
        ];
      }
      return [
        <span key="i">{indent}</span>,
        <span key="d" className="text-[var(--landing-dim)]">
          -{' '}
        </span>,
        <span key="v" className="text-emerald-700 dark:text-emerald-400">
          {inner}
        </span>,
      ];
    }
    const ci = rest.indexOf(':');
    if (ci >= 0) {
      return [
        <span key="i">{indent}</span>,
        <span key="k" className="font-medium text-sky-700 dark:text-sky-400">
          {rest.slice(0, ci + 1)}
        </span>,
        <span key="v" className="text-emerald-700 dark:text-emerald-400">
          {rest.slice(ci + 1)}
        </span>,
      ];
    }
  }

  return [<span key="t">{line || ' '}</span>];
}

function detectLang(path: string): 'yaml' | 'toml' | 'text' {
  if (path.endsWith('.toml')) return 'toml';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  return 'text';
}

export type EditorHighlight = {
  /** 1-based inclusive line range. */
  from: number;
  to: number;
  tone: 'select' | 'change';
};

/** Controlled demo editor — scrolls with typed content when it overflows. */
export function StudioEditor({
  path,
  contents,
  showCursor,
  highlight,
  widget,
  widgetLine,
  follow = 'bottom',
}: {
  path: string;
  contents: string;
  showCursor?: boolean;
  highlight?: EditorHighlight;
  /** Inline widget rendered directly under `widgetLine`, like a ⌘K prompt box. */
  widget?: ReactNode;
  widgetLine?: number;
  follow?: 'bottom' | 'top' | number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lang = useMemo(() => detectLang(path), [path]);
  const lines = useMemo(() => contents.split('\n'), [contents]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (typeof follow === 'number') {
      const target = el.querySelector<HTMLElement>(`[data-line="${follow}"]`);
      if (target) {
        el.scrollTop = Math.max(0, target.offsetTop - el.clientHeight / 2);
        return;
      }
    }
    el.scrollTop = follow === 'top' ? 0 : el.scrollHeight;
  }, [contents, follow]);

  return (
    <div
      ref={scrollRef}
      className="landing-code-scroll relative h-full min-h-0 overflow-y-auto overflow-x-auto overscroll-contain"
    >
      <pre className="min-w-max p-3 font-mono text-[11px] leading-[1.7]">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const isLast = i === lines.length - 1;
          const marked =
            highlight != null && lineNo >= highlight.from && lineNo <= highlight.to;
          const markClass = !marked
            ? ''
            : highlight!.tone === 'select'
              ? 'bg-[color-mix(in_srgb,var(--landing-accent)_20%,transparent)]'
              : 'bg-[color-mix(in_srgb,#10b981_20%,transparent)]';
          return (
            <div key={i}>
              <div data-line={lineNo} className={`flex ${markClass}`}>
                <span className="w-8 shrink-0 select-none pr-3 text-right text-[var(--landing-dim)] tabular-nums">
                  {lineNo}
                </span>
                <span className="whitespace-pre text-[var(--landing-ink)]">
                  {highlightLine(line, lang)}
                  {showCursor && isLast && (
                    <span
                      className="ml-px inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-pulse bg-[var(--landing-accent)] align-baseline"
                      aria-hidden
                    />
                  )}
                </span>
              </div>
              {widget != null && widgetLine === lineNo ? widget : null}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export function StudioEditorIdle({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-6 text-center">
      <p className="max-w-[18rem] font-mono text-[11px] leading-relaxed text-[var(--landing-dim)]">
        {message}
      </p>
    </div>
  );
}
