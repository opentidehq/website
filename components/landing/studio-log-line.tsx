/**
 * Renderer for opentide console output.
 *
 * The CLI writes structlog records through a Rich renderer: a dim timestamp, a padded
 * level, the snake_case event name, then one indented `key: value` line per field.
 * Sections arrive as `== Title ==` panels. CI logs wrap all of that in GitHub Actions
 * group headers. This component reproduces that shape line by line.
 *
 * See vendor/opentide/src/opentide/core/logging/{render,console}.py
 */

const LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;

const LEVEL_CLASS: Record<string, string> = {
  DEBUG: 'text-[var(--landing-dim)]',
  INFO: 'text-sky-700 dark:text-sky-300',
  WARNING: 'text-amber-700 dark:text-amber-300',
  ERROR: 'text-red-600 dark:text-red-400',
  CRITICAL: 'text-red-700 dark:text-red-300',
};

const STRUCTLOG = new RegExp(`^(\\d{2}:\\d{2}:\\d{2})\\s+(${LEVELS.join('|')})\\s+(\\S+)$`);

/** Highlights an `opentide …` invocation the way the CLI's own help output colours it. */
export function CommandTokens({ command }: { command: string }) {
  const tokens = command.split(/(\s+)/);
  const firstIdx = tokens.findIndex((t) => t.trim().length > 0);

  return (
    <>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        if (i === firstIdx) {
          return (
            <span key={i} className="font-medium text-sky-700 dark:text-sky-300">
              {tok}
            </span>
          );
        }
        if (tok.startsWith('-')) {
          return (
            <span key={i} className="text-violet-700 dark:text-violet-300">
              {tok}
            </span>
          );
        }
        if (/[/.=]/.test(tok)) {
          return (
            <span key={i} className="text-amber-800 dark:text-amber-300">
              {tok}
            </span>
          );
        }
        return (
          <span key={i} className="text-[var(--landing-ink)]">
            {tok}
          </span>
        );
      })}
    </>
  );
}

export function LogLine({ line, className }: { line: string; className?: string }) {
  const cls = (extra: string) => `font-mono text-[10px] leading-relaxed ${extra} ${className ?? ''}`;

  // GitHub Actions step header
  if (line.startsWith('::group::')) {
    return (
      <p
        className={cls(
          'mt-2 first:mt-0 font-medium uppercase tracking-wider text-[var(--landing-subtle)]',
        )}
      >
        {line.slice('::group::'.length)}
      </p>
    );
  }

  // Shell invocation
  if (line.startsWith('$ ')) {
    return (
      <p className={cls('')}>
        <span className="text-[var(--landing-accent)]">$</span>{' '}
        <CommandTokens command={line.slice(2)} />
      </p>
    );
  }

  // opentide section panel
  if (line.startsWith('== ') && line.endsWith(' ==')) {
    return (
      <p
        className={cls(
          'mt-1.5 border-l-2 border-fuchsia-500/60 pl-2 font-medium text-fuchsia-700 dark:text-fuchsia-300',
        )}
      >
        {line.slice(3, -3)}
      </p>
    );
  }

  // Indented structlog field: `key: value`, hung under the event name like the CLI does
  if (line.startsWith('  ')) {
    const trimmed = line.trim();
    const sep = trimmed.indexOf(': ');
    if (sep > 0) {
      return (
        <p className={cls('pl-[11ch] -indent-[1ch] text-[var(--landing-muted)]')}>
          <span className="italic text-[var(--landing-dim)]">{trimmed.slice(0, sep + 1)}</span>{' '}
          {trimmed.slice(sep + 2)}
        </p>
      );
    }
    return <p className={cls('pl-[11ch] text-[var(--landing-muted)]')}>{trimmed}</p>;
  }

  // `HH:MM:SS  LEVEL     event_name`
  const record = STRUCTLOG.exec(line);
  if (record) {
    const [, time, level, event] = record;
    return (
      <p className={cls('text-[var(--landing-ink)]')}>
        <span className="whitespace-pre text-[var(--landing-dim)]">{time}  </span>
        <span className={`whitespace-pre font-medium ${LEVEL_CLASS[level] ?? ''}`}>
          {level.padEnd(9)}
        </span>
        {event}
      </p>
    );
  }

  return <p className={cls('text-[var(--landing-muted)]')}>{line}</p>;
}
