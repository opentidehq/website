import type { ReleaseNote } from '@/lib/releases';

export type ReleaseVelocity = {
  /** Every dated release from the first public one through the latest. */
  count: number;
  first: { version: string; dateIso: string };
  latest: { version: string; dateIso: string };
  /** Calendar days from the first release to the latest, counting both ends. */
  days: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Release cadence for the landing page, derived from the synced release notes so the
 * numbers move with every docs sync instead of being hand-edited.
 */
export function releaseVelocity(releases: readonly ReleaseNote[]): ReleaseVelocity | null {
  const dated = releases.filter((r): r is ReleaseNote & { dateIso: string } => r.dateIso !== null);
  if (dated.length === 0) return null;

  let first = dated[0];
  let latest = dated[0];
  for (const r of dated) {
    if (r.dateIso < first.dateIso) first = r;
    if (r.dateIso > latest.dateIso) latest = r;
  }
  // Releases cut on the same day: the notes list the newest first.
  latest = dated.find((r) => r.dateIso === latest.dateIso) ?? latest;
  first = dated.findLast((r) => r.dateIso === first.dateIso) ?? first;

  const days = Math.round((Date.parse(latest.dateIso) - Date.parse(first.dateIso)) / DAY_MS) + 1;

  return {
    count: dated.length,
    first: { version: first.version, dateIso: first.dateIso },
    latest: { version: latest.version, dateIso: latest.dateIso },
    days,
  };
}

/** `2026-09-09` → `9 September 2026`, without depending on the build machine's locale. */
export function formatReleaseDay(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][m - 1];
  return `${d} ${month} ${y}`;
}
