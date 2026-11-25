// What the hourly sync tries, and what it reports, when an upstream tree may be broken.
//
// The sync takes each source (opentide, specifications) at its new tip only if the site
// accepts it (`pnpm check:upstream`). It tries both new tips first, then each new tip with the
// other source kept at its last good commit, so a broken specifications tree cannot hold back
// a good opentide one, nor the reverse. The pure planning lives here so it can be tested
// without git or a build.

export const SOURCES = /** @type {const} */ (['opentide', 'specifications']);

/** @typedef {{ opentide: string, specifications: string }} Pins */
/** @typedef {Pins & { label: string }} Candidate */

const short = (sha) => (sha ? sha.slice(0, 7) : 'none');

/** `opentide@1234567 + specifications@89abcde`, for logs and reports. */
export function describePins(pins) {
  return SOURCES.map((source) => `${source}@${short(pins[source])}`).join(' + ');
}

/**
 * The candidates to check, most preferred first. The first that passes is taken.
 *
 * - Both sources new, then each new source alone with the other at its last good commit.
 * - `localChanges`: the site has changes of its own to publish (changelogs, or a sync script
 *   that now writes different pages): last, both sources at their last good commits.
 *
 * @param {{ old: Pins, next: Pins, localChanges?: boolean }} input
 * @returns {Candidate[]}
 */
export function planCandidates({ old, next, localChanges = false }) {
  const changed = SOURCES.filter((source) => next[source] && next[source] !== old[source]);
  /** @type {Candidate[]} */
  const candidates = [];
  if (changed.length > 0) {
    candidates.push({ ...pick(old, next, changed), label: changed.map((source) => `new ${source}`).join(', ') });
  }
  if (changed.length > 1) {
    for (const source of changed) candidates.push({ ...pick(old, next, [source]), label: `new ${source} only` });
  }
  if (localChanges) candidates.push({ ...old, label: 'last good sources' });
  return candidates;
}

/** `old`, with the given sources taken from `next`. */
function pick(old, next, sources) {
  return {
    opentide: sources.includes('opentide') ? next.opentide : old.opentide,
    specifications: sources.includes('specifications') ? next.specifications : old.specifications,
  };
}

/**
 * The sources whose new tip was not taken, each with why: the report of the candidate that
 * tried it alone, else of the first candidate that tried it.
 *
 * @param {{ old: Pins, next: Pins, accepted: Pins | null, attempts: { candidate: Candidate, report: { ok: boolean, failed: string | null, tail: string } }[] }} input
 */
export function heldBack({ old, next, accepted, attempts }) {
  const taken = accepted ?? old;
  return SOURCES.filter((source) => next[source] && next[source] !== old[source] && taken[source] !== next[source]).map(
    (source) => {
      const tried = attempts.filter(({ candidate, report }) => candidate[source] === next[source] && !report.ok);
      const alone =
        tried.find(({ candidate }) => SOURCES.every((other) => other === source || candidate[other] === old[other])) ??
        tried[0];
      return {
        source,
        old: old[source],
        next: next[source],
        failed: alone?.report.failed ?? 'not checked',
        tail: alone?.report.tail ?? '',
        candidate: alone ? describePins(alone.candidate) : null,
      };
    },
  );
}

/**
 * The failure report for the job: one `::error` line per held-back source (the alert issue
 * quotes them), and a Markdown section for the step summary.
 *
 * @param {ReturnType<typeof heldBack>} held
 * @param {{ accepted: Pins | null, old: Pins }} pins
 */
export function renderHeldBack(held, { accepted, old }) {
  const kept = accepted ?? old;
  const annotations = held.map(
    (entry) =>
      `::error title=${entry.source} held back::${entry.source}@${short(entry.next)} fails \`${entry.failed}\` on the site; the site keeps ${entry.source}@${short(kept[entry.source])}.`,
  );
  const summary = [
    '## Upstream held back',
    '',
    `The site published ${describePins(kept)}. These new upstream trees fail \`pnpm check:upstream\` and were not taken:`,
    '',
    ...held.flatMap((entry) => [
      `### ${entry.source}@${short(entry.next)}: \`${entry.failed}\` failed`,
      '',
      entry.candidate ? `Checked as ${entry.candidate}.` : '',
      '',
      '```',
      entry.tail.replaceAll('```', "'''") || '(no output)',
      '```',
      '',
    ]),
  ].join('\n');
  return { annotations, summary };
}
