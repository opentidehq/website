#!/usr/bin/env node
/**
 * Run the landing page's demo objects through the real engine.
 *
 * The workflow studio shows threats, objectives, rules and platform configs as if a
 * detection repo held them. This writes them into a scratch folder made
 * by `opentide setup`, then runs the gates the site describes:
 *
 *   opentide validate --strict
 *   opentide lint --strict
 *   opentide deploy --dry-run --strategy PREVIEW --all   (with placeholder credentials)
 *
 * Needs `opentide` on PATH (pip install opentide) and Node with --experimental-strip-types,
 * because the demo data lives in TypeScript modules: `pnpm verify:demos`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(join(root, rel)).href);

const { DEMO_FILES, INLINE_EDIT, VISIBILITY_PATH, VISIBILITY_TOML } = await load('lib/landing/demo-registry.ts');

const failures = [];

// opentide reads TF_BUILD, GITHUB_ACTIONS and CI to pick a CI flavour and then diffs against
// the CI's remote branches. The scratch folders have no git history, so run the engine without
// those markers and pass --all to the deploy so it reads every rule file, not a git diff.
const CI_MARKERS = new Set(['TF_BUILD', 'GITHUB_ACTIONS', 'CI', 'GITLAB_CI']);
const localEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !CI_MARKERS.has(name)));

function opentide(cwd, args, env) {
  const label = `opentide ${args.join(' ')}`;
  try {
    const out = execFileSync('opentide', args, {
      cwd,
      env: { ...localEnv, COLUMNS: '120', ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const last = out.trim().split('\n').at(-1) ?? '';
    console.log(`  ✓ ${label}  →  ${last}`);
  } catch (error) {
    failures.push(label);
    console.log(`  ✗ ${label}`);
    console.log(String(error.stdout ?? '') + String(error.stderr ?? ''));
  }
}

function scratchRepo(name) {
  const dir = mkdtempSync(join(tmpdir(), `opentide-demo-${name}-`));
  const args = ['setup', '--yes', '--path', dir, '--platform', 'sentinel', '--platform', 'splunk', '--ci', 'none'];
  try {
    execFileSync('opentide', args, { env: localEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    console.error(`opentide ${args.join(' ')} failed:`);
    console.error(String(error.stdout ?? '') + String(error.stderr ?? ''));
    throw error;
  }
  return dir;
}

function write(dir, path, body) {
  const out = join(dir, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body.endsWith('\n') ? body : `${body}\n`);
}

/** `$NAME` references in platform configs, set to placeholders so config loading succeeds. */
function placeholderCredentials(files) {
  const env = {};
  for (const body of files) {
    for (const [, name] of body.matchAll(/"\$([A-Z][A-Z0-9_]*)"/g)) env[name] = 'placeholder';
  }
  return env;
}

const dirs = [];
try {
  console.log('workflow studio');
  const studio = scratchRepo('studio');
  dirs.push(studio);
  for (const [path, body] of Object.entries(DEMO_FILES)) write(studio, path, body);
  write(studio, VISIBILITY_PATH, VISIBILITY_TOML);
  const env = placeholderCredentials(Object.values(DEMO_FILES));
  opentide(studio, ['validate', '--strict']);
  opentide(studio, ['lint', '--strict']);
  opentide(studio, ['deploy', '--dry-run', '--strategy', 'PREVIEW', '--all'], env);
  write(studio, INLINE_EDIT.path, INLINE_EDIT.tuned);
  console.log('  after the inline edit:');
  opentide(studio, ['validate', '--strict']);
} finally {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} demo check(s) failed. The landing page shows objects the engine rejects.`);
  process.exit(1);
}
console.log('\nEvery landing demo object passes the gates the site describes.');
