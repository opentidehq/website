'use client';

import { useId, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Mode = 'sub' | 'pkg';
type When = 'always' | 'sub' | 'pkg';

const ROWS: {
  id: string;
  depth: number;
  name: string;
  kind: 'dir' | 'file';
  when: When;
  note?: string;
}[] = [
  { id: 'root', depth: 0, name: 'detection-repo/', kind: 'dir', when: 'always' },
  { id: 'core', depth: 1, name: 'CoreTide/', kind: 'dir', when: 'sub', note: 'submodule @ 8f3a1c2' },
  { id: 'engines', depth: 2, name: 'Engines/', kind: 'dir', when: 'sub' },
  { id: 'orch', depth: 2, name: 'Orchestration/', kind: 'dir', when: 'sub' },
  { id: 'validate', depth: 3, name: 'validate.py', kind: 'file', when: 'sub' },
  { id: 'objects', depth: 1, name: 'objects/', kind: 'dir', when: 'always' },
  { id: 'threats', depth: 2, name: 'threats/', kind: 'dir', when: 'always' },
  { id: 'objectives', depth: 2, name: 'objectives/', kind: 'dir', when: 'always' },
  { id: 'rules', depth: 2, name: 'rules/', kind: 'dir', when: 'always' },
  { id: 'req', depth: 1, name: 'requirements.txt', kind: 'file', when: 'pkg', note: 'opentide' },
];

function visibleIn(when: When, mode: Mode) {
  return when === 'always' || when === mode;
}

export function ThenNow() {
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<Mode>('sub');
  const labelId = useId();
  const duration = reduced ? '0ms' : '320ms';

  return (
    <div className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--landing-border)] px-4 py-3">
        <p id={labelId} className="font-mono text-xs text-[var(--landing-subtle)]">
          detection-repo
        </p>
        <div
          role="group"
          aria-labelledby={labelId}
          className="flex rounded-lg border border-[var(--landing-border)] p-0.5"
        >
          {(
            [
              ['sub', 'Submodule'],
              ['pkg', 'Package'],
            ] as const
          ).map(([value, label]) => {
            const on = mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => setMode(value)}
                className={`rounded-md px-3 py-1 font-mono text-[11px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                  on
                    ? 'bg-[var(--landing-accent)] font-semibold text-[var(--brand-accent-foreground)]'
                    : 'text-[var(--landing-muted)] hover:text-[var(--landing-ink)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="landing-code-scroll overflow-x-auto px-4 py-4" aria-live="polite">
        <ul className="m-0 list-none p-0 font-mono text-[12px] leading-7 sm:text-[13px]">
          {ROWS.map((row) => {
            const show = visibleIn(row.when, mode);
            const arriving = row.when === mode;
            return (
              <li
                key={row.id}
                className="grid overflow-hidden"
                aria-hidden={!show}
                style={{
                  gridTemplateRows: show ? '1fr' : '0fr',
                  opacity: show ? 1 : 0,
                  transition: `grid-template-rows ${duration} cubic-bezier(0.22, 1, 0.36, 1), opacity ${duration} ease`,
                }}
              >
                <div className="flex min-h-0 min-w-0 items-baseline justify-between gap-4 overflow-hidden">
                  <span
                    className={`min-w-0 truncate ${
                      row.kind === 'dir' ? 'text-[var(--landing-ink)]' : 'text-[var(--landing-muted)]'
                    }`}
                    style={{ paddingLeft: row.depth * 16 }}
                  >
                    {row.name}
                  </span>
                  {row.note ? (
                    <span
                      className={`shrink-0 text-[11px] ${
                        arriving ? 'text-[var(--landing-accent)]' : 'text-[var(--landing-dim)]'
                      }`}
                    >
                      {row.note}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)] px-4 py-3">
        {mode === 'sub' ? (
          <p className="overflow-x-auto font-mono text-[11px] leading-relaxed text-[var(--landing-muted)] sm:text-xs">
            <span className="text-[var(--landing-dim)]"># imports walked git to find the engine</span>
            <br />
            {`sys.path.append(str(git.Repo(".", search_parent_directories=True).working_dir))`}
          </p>
        ) : (
          <ul className="m-0 list-none space-y-1 p-0 font-mono text-[11px] leading-relaxed sm:text-xs">
            <li className="text-[var(--landing-ink)]">
              <span className="text-[var(--landing-accent)]" aria-hidden>
                $
              </span>{' '}
              pip install opentide
            </li>
            <li className="text-[var(--landing-ink)]">
              <span className="text-[var(--landing-accent)]" aria-hidden>
                $
              </span>{' '}
              opentide validate --strict
            </li>
            <li className="text-[var(--landing-muted)]">from opentide import OpenTide</li>
          </ul>
        )}
      </div>
    </div>
  );
}
