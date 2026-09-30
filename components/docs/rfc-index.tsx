'use client';

import { useMemo, useState } from 'react';
import { RfcStatus } from '@/components/docs/rfc-status';
import { RFC_STATUS_ORDER, parseIndexEntries, rfcStatusLabel, safeHref, type RfcIndexEntry } from '@/lib/rfc';
import { cn } from '@/lib/utils';

function groupEntries(entries: RfcIndexEntry[]) {
  const rank = (status: string) => {
    const index = (RFC_STATUS_ORDER as readonly string[]).indexOf(status);
    return index === -1 ? RFC_STATUS_ORDER.length : index;
  };
  const sorted = [...entries].sort(
    (a, b) => rank(a.status) - rank(b.status) || b.number.localeCompare(a.number),
  );
  const groups: { status: string; entries: RfcIndexEntry[] }[] = [];
  for (const entry of sorted) {
    const current = groups[groups.length - 1];
    if (!current || current.status !== entry.status) {
      groups.push({ status: entry.status, entries: [entry] });
    } else {
      current.entries.push(entry);
    }
  }
  return groups;
}

export function RfcIndex({ entries }: { entries: string }) {
  const catalog = useMemo(() => parseIndexEntries(entries) ?? [], [entries]);
  const groups = useMemo(() => groupEntries(catalog), [catalog]);
  const [active, setActive] = useState<string>('all');
  const visible = active === 'all' ? groups : groups.filter((group) => group.status === active);

  if (!catalog.length) return null;

  return (
    <div data-rfc-index className="not-prose my-6">
      <div role="toolbar" aria-label="Filter RFCs by status" className="mb-4 flex flex-wrap gap-2">
        <FilterButton pressed={active === 'all'} onClick={() => setActive('all')} count={catalog.length}>
          All
        </FilterButton>
        {groups.map((group) => (
          <FilterButton
            key={group.status}
            pressed={active === group.status}
            onClick={() => setActive(group.status)}
            count={group.entries.length}
          >
            {rfcStatusLabel(group.status)}
          </FilterButton>
        ))}
      </div>
      <div className="space-y-6">
      {visible.map((group) => (
        <section key={group.status} aria-labelledby={`rfc-group-${group.status}`}>
          <h3 id={`rfc-group-${group.status}`} className="mb-2 text-sm font-medium text-fd-foreground">
            {rfcStatusLabel(group.status)}
          </h3>
          <ul className="divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border">
            {group.entries.map((entry) => {
              const href = safeHref(entry.href);
              if (!href) return null;
              return (
                <li key={entry.number}>
                  <a
                    href={href}
                    className="group flex flex-col gap-2 px-3 py-3 no-underline transition-colors duration-150 hover:bg-fd-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand-accent)] motion-reduce:transition-none sm:flex-row sm:items-start sm:gap-3"
                    {...(entry.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    <span className="font-mono text-xs text-[#3a3a42] sm:mt-1 sm:w-12 sm:shrink-0 dark:text-[#d4d4d8]">
                      {entry.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-fd-foreground transition-colors duration-150 group-hover:text-[var(--brand-accent)] motion-reduce:transition-none">
                        {entry.title}
                      </span>
                      {entry.summary ? (
                        <span className="mt-1 block line-clamp-2 text-sm text-[#3a3a42] dark:text-[#d4d4d8]">
                          {entry.summary}
                        </span>
                      ) : null}
                      {entry.external ? (
                        <span className="mt-1 block text-xs text-[#3a3a42] dark:text-[#d4d4d8]">
                          Opens the tracking issue on GitHub
                        </span>
                      ) : null}
                    </span>
                    <RfcStatus status={entry.status} compact />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      </div>
    </div>
  );
}

function FilterButton({
  pressed,
  onClick,
  count,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  count: number;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]',
        pressed
          ? 'border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)] text-[var(--brand-accent)]'
          : 'border-fd-border text-fd-foreground hover:bg-fd-accent',
      )}
    >
      {children}
      <span className="tabular-nums text-[#3a3a42] dark:text-[#d4d4d8]">{count}</span>
    </button>
  );
}
