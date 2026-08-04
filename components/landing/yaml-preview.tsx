'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { FIELD_DOCS } from '@/components/landing/yaml-preview-field-docs';

type Token = { text: string; className: string; field?: string };

function valueClass(v: string): string {
  const t = v.trim();
  if (!t) return 'text-[var(--landing-muted)]';
  if (t.startsWith('"') || t.startsWith("'") || t.startsWith('|')) {
    return 'text-emerald-700 dark:text-emerald-400/90';
  }
  if (t === 'true' || t === 'false') {
    return 'text-amber-600 dark:text-amber-400';
  }
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(t) || t.includes('::')) {
    return 'text-violet-600 dark:text-violet-400';
  }
  if (/^-?\d+(\.\d+)?$/.test(t) || /^PT\d/.test(t)) {
    return 'text-violet-600 dark:text-violet-400';
  }
  return 'text-[var(--landing-muted)]';
}

function tokenizeYaml(yaml: string): Token[][] {
  return yaml.split('\n').map((line) => {
    if (line.trim().startsWith('#') || line.trim() === '') {
      return [{ text: line, className: 'text-[var(--landing-dim)] italic' }];
    }

    const tokens: Token[] = [];
    const indent = line.match(/^(\s*)/)?.[1] ?? '';
    if (indent) tokens.push({ text: indent, className: '' });

    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      const inner = trimmed.slice(2);
      tokens.push({ text: '- ', className: 'text-[var(--landing-dim)]' });
      if (inner.includes(':')) {
        const ci = inner.indexOf(':');
        const k = inner.slice(0, ci);
        const v = inner.slice(ci + 1);
        tokens.push({
          text: `${k}:`,
          className: 'text-sky-700 dark:text-sky-400 font-medium',
          field: k,
        });
        if (v) tokens.push({ text: v, className: valueClass(v) });
      } else {
        tokens.push({ text: inner, className: valueClass(inner) });
      }
      return tokens;
    }

    const colonIdx = line.indexOf(':', indent.length);
    if (colonIdx >= 0) {
      const keyPart = line.slice(indent.length, colonIdx + 1);
      const valPart = line.slice(colonIdx + 1);
      const keyPath = keyPart.replace(':', '').trim();

      tokens.push({
        text: keyPart,
        className: 'text-sky-700 dark:text-sky-400 font-medium',
        field: keyPath,
      });
      if (valPart) {
        tokens.push({ text: valPart, className: valueClass(valPart) });
      }
      return tokens;
    }

    return [{ text: line, className: 'text-[var(--landing-muted)]' }];
  });
}

type Tip = { text: string; x: number; y: number; place: 'above' | 'below' | 'right' };

/**
 * Portaled outside `.landing`, so avoid --landing-* vars (they would be
 * undefined → washed-out / transparent look). Prefer horizontal placement.
 */
const emptySubscribe = () => () => {};

function FloatingTip({ tip }: { tip: Tip | null }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted || !tip) return null;

  const place =
    tip.place === 'right'
      ? 'translate(10px, -50%)'
      : tip.place === 'below'
        ? 'translate(-50%, 10px)'
        : 'translate(-50%, calc(-100% - 10px))';

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[80] max-w-[min(320px,calc(100vw-24px))] rounded-md bg-zinc-900 px-3 py-1.5 font-sans text-[12px] leading-snug whitespace-normal text-zinc-50 shadow-xl dark:bg-zinc-100 dark:text-zinc-900"
      style={{ left: tip.x, top: tip.y, transform: place }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}

function tipPlacement(rect: DOMRect): Tip['place'] {
  if (rect.top < 72) return 'below';
  if (rect.right > window.innerWidth - 280) return 'above';
  return 'right';
}

export function YamlPreview({
  yaml,
  path,
  className,
}: {
  yaml: string;
  path: string;
  className?: string;
}) {
  const lines = useMemo(() => tokenizeYaml(yaml), [yaml]);
  const [tip, setTip] = useState<Tip | null>(null);

  const showTip = (el: HTMLElement, text: string) => {
    const r = el.getBoundingClientRect();
    const place = tipPlacement(r);
    const x = place === 'right' ? r.right : r.left + r.width / 2;
    const y = place === 'right' ? r.top + r.height / 2 : place === 'below' ? r.bottom : r.top;
    setTip({ text, x, y, place });
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-[var(--landing-bg)] ${className ?? ''}`}
    >
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <span className="truncate font-mono text-[10px] text-[var(--landing-dim)]">{path}</span>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-dim)]">
          YAML
        </span>
      </div>
      <pre className="landing-code-scroll min-h-0 flex-1 overflow-auto px-3 pb-3 font-mono text-[10px] leading-[1.75] sm:text-[11px]">
        {lines.map((lineTokens, li) => (
          <div key={li} className="min-h-[1.75em]">
            {lineTokens.map((tok, ti) => {
              if (!tok.field) {
                return (
                  <span key={ti} className={tok.className}>
                    {tok.text}
                  </span>
                );
              }
              const doc = FIELD_DOCS[tok.field];
              if (!doc) {
                return (
                  <span key={ti} className={tok.className}>
                    {tok.text}
                  </span>
                );
              }
              return (
                <span
                  key={ti}
                  className={`${tok.className} cursor-help border-b border-dotted border-sky-600/40 dark:border-sky-400/40`}
                  tabIndex={0}
                  onMouseEnter={(e) => showTip(e.currentTarget, doc)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={(e) => showTip(e.currentTarget, doc)}
                  onBlur={() => setTip(null)}
                >
                  {tok.text}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
      <FloatingTip tip={tip} />
    </div>
  );
}
