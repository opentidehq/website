#!/usr/bin/env node
/**
 * `pnpm check:upstream`: every check the site runs on an upstream tree, in one place.
 *
 * The hourly "Sync docs and deploy" job runs it on each candidate it considers (new opentide,
 * new specifications, or both), and takes only a candidate that passes. The source
 * repositories' PR guards run the same script on a checkout of this repository whose
 * `vendor/opentide` or `vendor/specifications` is replaced by the PR's tree, so the guard and
 * the sync can never disagree on what "the site accepts this tree" means.
 *
 * It reads `vendor/opentide` and `vendor/specifications` as they are on disk (or
 * OPENTIDE_DOCS_PATH and SPECIFICATIONS_PATH), whatever the gitlinks this checkout commits:
 *
 *   1. sync:content   copy the trees into content/docs (the MDX safety check runs here)
 *   2. test           the unit suite, less the one test that compares content/docs with the
 *                     gitlinks committed at HEAD, which a candidate tree differs from on purpose
 *   3. types:check    fumadocs-mdx's frontmatter schema, Next's route types, tsc
 *   4. next build     every page compiled and exported to out/ (not `pnpm build`: its prebuild
 *                     fetches PyPI, the engine and changelogs, none of which come from the tree)
 *   5. check:docs     content/docs matches the trees on disk (`--worktree`), all pages .mdx
 *   6. verify:docs    the exported pages exist and carry their content
 *
 * Lint is not in the list: ESLint covers the site's own code, which its PR CI checks, and
 * ignores vendor/ and content/.
 *
 * Usage: pnpm check:upstream [--report <file.json>]
 * Exits 0 when every check passes, 1 at the first that fails. With --report, writes
 * `{ ok, failed, steps: [{ name, ok, seconds }], tail }`, where `tail` is the end of the failed
 * check's output, for the sync job's failure report.
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The test that compares content/docs with HEAD's gitlinks (scripts/lib/docs-sync.test.mjs). */
export const GITLINK_TEST = 'workspace committed docs match vendor gitlinks';

/** The checks, in order. Each is a command run from the repository root. */
export const CHECKS = [
  { name: 'sync:content', command: ['pnpm', 'sync:content'] },
  { name: 'test', command: ['pnpm', 'test'], env: { NODE_OPTIONS: `--test-skip-pattern="${GITLINK_TEST}"` } },
  { name: 'types:check', command: ['pnpm', 'types:check'] },
  { name: 'next build', command: ['pnpm', 'exec', 'next', 'build'] },
  { name: 'check:docs', command: ['pnpm', 'check:docs', '--worktree'] },
  { name: 'verify:docs', command: ['pnpm', 'verify:docs'] },
];

const TAIL_LINES = 40;

/** Run one check, streaming its output and keeping the last lines. */
function run(check) {
  return new Promise((resolve) => {
    const [cmd, ...args] = check.command;
    const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ...check.env };
    // sync:content must read the trees; every other check reads what it wrote.
    delete env.SKIP_SYNC;
    const child = spawn(cmd, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = [];
    const keep = (chunk, stream) => {
      stream.write(chunk);
      tail = [...tail, ...chunk.toString().split(/\r?\n/)].slice(-TAIL_LINES * 2);
    };
    child.stdout.on('data', (chunk) => keep(chunk, process.stdout));
    child.stderr.on('data', (chunk) => keep(chunk, process.stderr));
    child.on('error', (error) => resolve({ ok: false, tail: [String(error)] }));
    child.on('close', (code) => resolve({ ok: code === 0, tail }));
  });
}

async function main() {
  const reportAt = process.argv.indexOf('--report');
  const reportPath = reportAt === -1 ? null : process.argv[reportAt + 1];
  const steps = [];
  let failed = null;
  let tail = '';
  for (const check of CHECKS) {
    console.log(`\ncheck:upstream: ${check.name} (${check.command.join(' ')})`);
    const started = Date.now();
    const result = await run(check);
    steps.push({ name: check.name, ok: result.ok, seconds: Math.round((Date.now() - started) / 1000) });
    if (!result.ok) {
      failed = check.name;
      tail = result.tail
        .filter((line) => line.trim() !== '' && !/^\s+at /.test(line))
        .slice(-TAIL_LINES)
        .join('\n');
      break;
    }
  }
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify({ ok: failed === null, failed, steps, tail }, null, 2)}\n`);
  console.log('');
  for (const step of steps) console.log(`check:upstream: ${step.ok ? 'ok    ' : 'FAILED'} ${step.name} (${step.seconds}s)`);
  if (failed) {
    console.error(`check:upstream: ${failed} failed; the site would not accept this tree.`);
    process.exit(1);
  }
  console.log('check:upstream: the site accepts this tree.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
