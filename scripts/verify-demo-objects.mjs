#!/usr/bin/env node
/**
 * Run the landing page's demo objects through the real engine.
 *
 * The workflow studio and the object graph show threats, objectives, rules and platform
 * configs as if a detection repo held them. This writes each demo into a scratch repo made
 * by `opentide setup`, then runs the gates the site describes:
 *
 *   opentide validate --strict
 *   opentide lint --strict
 *   opentide deploy --dry-run --plan STAGING   (studio only, with placeholder credentials)
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

const { DEMO_FILES, INLINE_EDIT } = await load('lib/landing/demo-registry.ts');
const { GRAPH_NODES, GRAPH_YAML } = await load('lib/landing/graph-demo.ts');

const failures = [];

function opentide(cwd, args, env) {
  const label = `opentide ${args.join(' ')}`;
  try {
    const out = execFileSync('opentide', args, {
      cwd,
      env: { ...process.env, COLUMNS: '120', ...env },
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
  execFileSync('opentide', ['setup', '--yes', '--path', dir, '--platform', 'sentinel', '--platform', 'splunk', '--ci', 'none'], {
    stdio: 'ignore',
  });
  // The STAGING plan selects rules that changed in git, so the scratch repo needs a checkout.
  execFileSync('git', ['init', '-q'], { cwd: dir });
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
  const env = placeholderCredentials(Object.values(DEMO_FILES));
  opentide(studio, ['validate', '--strict']);
  opentide(studio, ['lint', '--strict']);
  opentide(studio, ['deploy', '--dry-run', '--plan', 'STAGING'], env);
  write(studio, INLINE_EDIT.path, INLINE_EDIT.tuned);
  console.log('  after the inline edit:');
  opentide(studio, ['validate', '--strict']);

  console.log('object graph');
  const graph = scratchRepo('graph');
  dirs.push(graph);
  for (const [id, node] of Object.entries(GRAPH_NODES)) {
    if (node.path && id in GRAPH_YAML) write(graph, node.path, GRAPH_YAML[id]);
  }
  opentide(graph, ['validate', '--strict']);
  opentide(graph, ['lint', '--strict']);
} finally {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} demo check(s) failed. The landing page shows objects the engine rejects.`);
  process.exit(1);
}
console.log('\nEvery landing demo object passes the gates the site describes.');
