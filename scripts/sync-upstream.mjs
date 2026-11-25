#!/usr/bin/env node
/**
 * The hourly sync's choice of upstream trees (.github/workflows/sync-docs.yml).
 *
 * Run after `vendor/opentide` and `vendor/specifications` are checked out at their new tips,
 * and after `pnpm sync:changelogs`. It checks candidates with `pnpm check:upstream`
 * (scripts/lib/upstream-sync.mjs says which, in what order), leaves the first that passes in
 * the working tree (vendor checkouts, content/docs, lib/generated/vocabularies.ts) for the job
 * to commit, and puts everything back to HEAD when none passes. A new tree that was not taken
 * is "held back": the job still publishes what passed, then fails with the report this script
 * writes, so the sync-docs-failure issue says what upstream must fix.
 *
 * Outputs (GITHUB_OUTPUT): `held_back` (true/false). Files, in RUNNER_TEMP (or the OS temp
 * directory): upstream-held-back.json, upstream-held-back.annotations, upstream-held-back.md.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectGitlinks, gitRevParse } from './lib/docs-sync.mjs';
import { SOURCES, describePins, heldBack, planCandidates, renderHeldBack } from './lib/upstream-sync.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMP = process.env.RUNNER_TEMP || tmpdir();
/** What the sync writes besides the vendor checkouts; reset to HEAD when nothing passes. */
const SYNCED = ['content/docs', 'content/releases', 'lib/generated/vocabularies.ts'];

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function checkout(pins) {
  for (const source of SOURCES) git('-C', `vendor/${source}`, 'checkout', '--quiet', '--detach', pins[source]);
}

/** Synced paths that differ from HEAD (staged, unstaged or untracked). */
function syncedChanges() {
  return git('status', '--porcelain', '--', ...SYNCED);
}

function runCheck(candidate) {
  const report = join(TEMP, 'check-upstream-report.json');
  rmSync(report, { force: true });
  console.log(`\n::group::check:upstream on ${describePins(candidate)} (${candidate.label})`);
  spawnSync(process.execPath, [join(ROOT, 'scripts', 'check-upstream.mjs'), '--report', report], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log('::endgroup::');
  if (!existsSync(report)) return { ok: false, failed: 'check:upstream', steps: [], tail: 'check:upstream wrote no report' };
  return JSON.parse(readFileSync(report, 'utf8'));
}

function main() {
  const old = collectGitlinks(ROOT);
  const next = {
    opentide: gitRevParse(join(ROOT, 'vendor', 'opentide')),
    specifications: gitRevParse(join(ROOT, 'vendor', 'specifications')),
  };
  for (const source of SOURCES) {
    if (!old[source] || !next[source]) throw new Error(`vendor/${source} is not checked out, or HEAD has no gitlink for it`);
  }
  console.log(`sync-upstream: last good ${describePins(old)}; upstream ${describePins(next)}`);

  const moved = SOURCES.some((source) => next[source] !== old[source]);
  let localChanges = syncedChanges() !== '';
  if (!moved) {
    // Same trees: publish only if the site's own sync now writes something different.
    checkout(old);
    execFileSync('pnpm', ['sync:content'], { cwd: ROOT, stdio: 'inherit' });
    localChanges = syncedChanges() !== '';
    if (!localChanges) {
      console.log('sync-upstream: up to date.');
      output('held_back', 'false');
      return;
    }
  }

  const attempts = [];
  let accepted = null;
  for (const candidate of planCandidates({ old, next, localChanges })) {
    checkout(candidate);
    const report = runCheck(candidate);
    attempts.push({ candidate, report });
    console.log(`sync-upstream: ${describePins(candidate)}: ${report.ok ? 'accepted' : `${report.failed} failed`}`);
    if (report.ok) {
      accepted = { opentide: candidate.opentide, specifications: candidate.specifications };
      break;
    }
  }

  if (!accepted) {
    console.log('sync-upstream: no candidate passed; keeping HEAD.');
    checkout(old);
    git('checkout', 'HEAD', '--', ...SYNCED);
    git('clean', '-fdq', '--', ...SYNCED);
  }

  const held = heldBack({ old, next, accepted, attempts });
  writeFileSync(join(TEMP, 'upstream-held-back.json'), `${JSON.stringify({ old, next, accepted, held, attempts }, null, 2)}\n`);
  if (held.length === 0 && accepted) {
    output('held_back', 'false');
    return;
  }
  let annotations;
  let summary;
  if (held.length > 0) {
    ({ annotations, summary } = renderHeldBack(held, { accepted, old }));
  } else {
    // Upstream did not move, yet the site's own synced changes fail on the last good trees:
    // nothing was published, and the site's code or changelogs are what to look at.
    const failed = attempts[0]?.report.failed ?? 'check:upstream';
    annotations = [`::error title=site changes held back::\`${failed}\` fails on the last good upstream trees (${describePins(old)}); nothing was published.`];
    summary = `## Site changes held back\n\n\`${failed}\` failed on ${describePins(old)}.\n\n\`\`\`\n${attempts[0]?.report.tail ?? ''}\n\`\`\`\n`;
  }
  writeFileSync(join(TEMP, 'upstream-held-back.annotations'), `${annotations.join('\n')}\n`);
  writeFileSync(join(TEMP, 'upstream-held-back.md'), summary);
  output('held_back', 'true');
}

main();
