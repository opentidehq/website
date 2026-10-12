'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type SectionTab = {
  /** Also the URL hash that opens this tab, e.g. `#platforms`. */
  id: string;
  label: string;
  title: ReactNode;
  lead?: ReactNode;
  content: ReactNode;
};

/**
 * Tabs for blocks that belong to one chapter but need not be read in a row. Every panel
 * is rendered (inactive ones `hidden`), so the content stays in the HTML; arrow keys, Home
 * and End move between tabs, and a matching URL hash opens a tab and scrolls to it.
 */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const base = useId();

  useEffect(() => {
    const fromHash = () => {
      const i = tabs.findIndex((t) => `#${t.id}` === window.location.hash);
      if (i < 0) return;
      setActive(i);
      requestAnimationFrame(() => root.current?.scrollIntoView({ block: 'start' }));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [tabs]);

  const select = (i: number) => {
    setActive(i);
    buttons.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    select(next);
  };

  return (
    <div ref={root} className="mt-10 scroll-mt-20">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--landing-border)] p-1"
      >
        {tabs.map((tab, i) => {
          const on = i === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                on
                  ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                  : 'text-[var(--landing-muted)] hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={i !== active}
          tabIndex={0}
          className="mt-8 focus-visible:outline-none"
        >
          <h3 className="max-w-3xl text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">{tab.title}</h3>
          {tab.lead && (
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">{tab.lead}</p>
          )}
          {tab.content}
        </div>
      ))}
    </div>
  );
}
