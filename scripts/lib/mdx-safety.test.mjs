import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { syncContent } from './docs-sync.mjs';
import { assertSafePublishedMdx, publishedMdxViolations } from './mdx-safety.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(ROOT, 'content', 'docs');
const temps = [];

function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function listMdx(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) listMdx(path, acc);
    else if (entry.name.endsWith('.mdx')) acc.push(path);
  }
  return acc;
}

test('published docs only use allowed components and static props', () => {
  const pages = listMdx(DOCS);
  assert.ok(pages.length > 20);
  const failures = [];
  for (const page of pages) {
    const violations = publishedMdxViolations(readFileSync(page, 'utf8'), relative(DOCS, page));
    if (violations.length) failures.push(violations[0]);
  }
  assert.deepEqual(failures, []);
});

test('fenced shell and inline code stay publishable', () => {
  const source = [
    '---',
    'title: Install',
    '---',
    '',
    'Use `{field}` in prose.',
    '',
    '```bash',
    'export OPENTIDE_REPO_ROOT=/path',
    'import sys',
    '```',
    '',
    '<Callout type="info">',
    'Install the CLI.',
    '</Callout>',
    '',
    "<Tabs items={['CLI', 'SDK']}>",
    '',
    '<Tab value="CLI">',
    'cli',
    '</Tab>',
    '',
    '</Tabs>',
    '',
  ].join('\n');
  assert.deepEqual(publishedMdxViolations(source, 'usage/install.mdx'), []);
  assert.doesNotThrow(() => assertSafePublishedMdx(source, 'usage/install.mdx'));
});

test('a brace expression that reaches node builtins is refused', () => {
  const source = [
    '<Callout>',
    "{globalThis.process.getBuiltinModule('node:child_process').execFileSync('node', ['-e', 'process.stdout.write(1)'])}",
    '</Callout>',
    '',
  ].join('\n');
  const violations = publishedMdxViolations(source, 'usage/index.mdx');
  assert.equal(violations.length, 1);
  assert.match(violations[0], /expression is not a static literal/);
  assert.throws(() => assertSafePublishedMdx(source, 'usage/index.mdx'), /would execute/);
});

test('a column-1 import is refused', () => {
  const source = "import * as cp from 'node:child_process'\n\ncp\n";
  const violations = publishedMdxViolations(source, 'usage/index.mdx');
  assert.equal(violations.some((item) => item.includes('import/export')), true);
});

test('unknown tags and prop calls are refused', () => {
  assert.match(
    publishedMdxViolations('<script src="https://evil.example/a.js"></script>\n', 'page.mdx')[0],
    /JSX component <script>/,
  );
  assert.match(
    publishedMdxViolations("<Tabs items={['ok'].concat(['x'])}>\n</Tabs>\n", 'page.mdx')[0],
    /prop expression is not a static literal/,
  );
});

test('syncContent rejects a documentation page that would run during the build', () => {
  const root = tempDir('mdx-safety-sync-');
  const opentideDocs = join(root, 'opentide-docs');
  const specifications = join(root, 'specifications');
  mkdirSync(join(opentideDocs, 'usage'), { recursive: true });
  mkdirSync(join(specifications, 'specs'), { recursive: true });
  writeFileSync(join(opentideDocs, 'usage', 'meta.json'), '{"title":"Usage","pages":["index"]}\n');
  writeFileSync(
    join(opentideDocs, 'usage', 'index.md'),
    [
      '---',
      'title: Usage',
      'description: Start.',
      '---',
      '',
      "import * as cp from 'node:child_process'",
      '',
      '{cp.execFileSync(\'node\', [\'-e\', \'process.stdout.write(1)\'])}',
      '',
    ].join('\n'),
  );

  assert.throws(
    () =>
      syncContent({
        root,
        outDir: join(root, 'content', 'docs'),
        env: {
          OPENTIDE_DOCS_PATH: opentideDocs,
          SPECIFICATIONS_PATH: specifications,
        },
      }),
    /import\/export statements are not allowed/,
  );
});
