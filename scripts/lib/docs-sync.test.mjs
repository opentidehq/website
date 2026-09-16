import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import {
  assertNoMarkdownPages,
  buildSpecificationsIndex,
  checkPublishedDocsFreshness,
  extractTitleAndDescription,
  gitHeadForPath,
  gitLinkSha,
  main,
  postProcessMarkdown,
  promoteCommittedMarkdownToMdx,
  publishedDestName,
  rewriteBrandName,
  rewriteHref,
  rewritePublishedLinks,
  rewriteSiteLinks,
  unpublishedSpecsUrl,
  SPECS_BLOB,
  stripLeadingH1,
  stripRedundantSummary,
  syncContent,
  transformSpecFrontmatter,
  yamlValue,
} from './docs-sync.mjs';
import { assertNoEscapedMdx, assertTabsRendered, verifyBuiltDocs } from './verify-built-docs.mjs';

const temps = [];

function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

function gitInit(dir) {
  mkdirSync(dir, { recursive: true });
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'docs-sync@test']);
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'docs-sync']);
  execFileSync('git', ['-C', dir, 'config', 'commit.gpgsign', 'false']);
}

function gitCommit(dir, message, paths = ['-A']) {
  execFileSync('git', ['-C', dir, 'add', ...paths]);
  execFileSync('git', ['-C', dir, 'commit', '-m', message], { stdio: 'ignore' });
  return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function gitCommitAll(dir, message) {
  return gitCommit(dir, message, ['-A']);
}

function writeGitlinks(root, { opentide, specifications }) {
  const indexInfo = [
    `160000 commit ${opentide}\tvendor/opentide`,
    `160000 commit ${specifications}\tvendor/specifications`,
  ].join('\n');
  execFileSync('git', ['-C', root, 'update-index', '--add', '--index-info'], {
    input: `${indexInfo}\n`,
  });
}

after(() => {
  for (const dir of temps) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeTree(root, files) {
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, body);
  }
}

function seedVendorDocs(opentideDocs, specificationsRoot) {
  writeTree(opentideDocs, {
    'usage/meta.json': `${JSON.stringify({ title: 'Usage', pages: ['index', 'installation'] }, null, 2)}\n`,
    'usage/index.md': `---
title: Usage
description: Start here.
---

<Cards>
  <Card title="How opentide works" href="./how-it-works.md" description="Lifecycle." />
</Cards>
`,
    'usage/installation.md': `---
title: Installation
description: Install opentide from PyPI.
---

<Callout type="info">
One install gets the CLI.
</Callout>

<Tabs items={['venv + pip', 'uv']}>

<Tab value="venv + pip">

\`\`\`bash
pip install opentide
\`\`\`

</Tab>

<Tab value="uv">

\`\`\`bash
uv pip install opentide
\`\`\`

</Tab>

</Tabs>

See [configuration](./configuration.md#credentials).
`,
    'usage/quickstart.md': `---
title: Quickstart
description: Five minutes.
---

<Steps>

<Step>

### Install and point at your repo

Do the thing.

</Step>

</Steps>
`,
    'usage/how-it-works.md': `---
title: How it works
description: Lifecycle.
---

Body.
`,
    'cli/meta.json': '{}\n',
    'mcp/meta.json': '{}\n',
    'sdk/meta.json': '{}\n',
  });

  writeTree(specificationsRoot, {
    'site/index.md': `---
title: Specifications
description: Normative specs.
---

# Specifications

See [SPECS](./SPECS.md).
`,
    'SPECS.md': `---
title: Spec index
description: Index of specs.
---

# Spec index
`,
    'GOVERNANCE.md': '# Governance\n\nThe process.\n',
    'conformance.md': '# Conformance\n\nRules.\n',
    'specs/versioning.md': `---
spec: versioning
version: "1.0"
---

# Versioning

## Summary

How versions work.

## Details

See [fixtures](../fixtures/example.json).
`,
    'specs/vocabularies/format.md': `---
title: Vocabulary format
description: Vocabulary files.
---

See [RFC 0003](../../rfcs/0003-per-key-vocabulary-versioning.md) and [pins](../schemas/pins/threat.toml).
`,
  });
}

test('publishedDestName converts markdown to mdx once', () => {
  assert.equal(publishedDestName('installation.md'), 'installation.mdx');
  assert.equal(publishedDestName('installation.mdx'), 'installation.mdx');
  assert.equal(publishedDestName('meta.json'), 'meta.json');
});

test('yamlValue quotes strings that would break YAML', () => {
  assert.equal(yamlValue('plain'), 'plain');
  assert.equal(yamlValue('say: hello'), '"say: hello"');
});

test('extractTitleAndDescription prefers the summary paragraph', () => {
  const parsed = extractTitleAndDescription('# Title\n\n## Summary\n\nFirst sentence.\n\nMore.\n\n## Next\n');
  assert.equal(parsed.title, 'Title');
  assert.equal(parsed.description, 'First sentence.');
});

test('stripLeadingH1 removes a body heading that duplicates frontmatter', () => {
  const out = stripLeadingH1('---\ntitle: Hello\n---\n\n# Hello\n\nBody.\n');
  assert.equal(out.includes('# Hello'), false);
  assert.equal(out.includes('Body.'), true);
});

test('stripRedundantSummary drops a duplicated lead paragraph', () => {
  const out = stripRedundantSummary(
    '---\ntitle: Versioning\ndescription: How versions work.\n---\n\n## Summary\n\nHow versions work.\n\nKeep me.\n\n## Details\n\nNope.\n',
  );
  assert.equal(out.includes('## Summary'), false);
  assert.equal(out.includes('Keep me.'), true);
});

test('rewritePublishedLinks sends fixture paths to GitHub', () => {
  const out = rewritePublishedLinks('See [x](../fixtures/example.json).');
  assert.equal(out.includes('https://github.com/OpenTideHQ/specifications/blob/main/fixtures/example.json'), true);
});

test('rewritePublishedLinks sends nested RFC and schema paths to GitHub', () => {
  const out = rewritePublishedLinks(
    'See [RFC 0003](../../rfcs/0003-per-key-vocabulary-versioning.md) and [pins](../schemas/pins/).',
  );
  assert.equal(out.includes(`${SPECS_BLOB}/rfcs/0003-per-key-vocabulary-versioning.md`), true);
  assert.equal(out.includes(`${SPECS_BLOB}/schemas/pins/`), true);
  assert.equal(out.includes('../../rfcs/'), false);
  assert.equal(out.includes('../schemas/'), false);
});

test('rewritePublishedLinks does not send published specs/vocabularies pages to GitHub', () => {
  const published = rewritePublishedLinks(
    'See [format](vocabularies/format.md) and [catalog](./vocabularies/catalog.md).',
  );
  assert.equal(published.includes(`${SPECS_BLOB}/vocabularies/`), false);
  assert.equal(published.includes('](vocabularies/format.md)'), true);
  assert.equal(published.includes('](./vocabularies/catalog.md)'), true);

  const repoRoot = rewritePublishedLinks(
    'See [tlp](../vocabularies/tlp.vocab.toml) and [also](../../vocabularies/tlp.vocab.toml).',
  );
  assert.equal(repoRoot.includes(`${SPECS_BLOB}/vocabularies/tlp.vocab.toml`), true);
  assert.equal(repoRoot.includes('../vocabularies/'), false);
});

test('rewriteBrandName lowercases the product name but keeps OpenTideHQ', () => {
  const camel = 'Open' + 'Tide';
  const out = rewriteBrandName(`Use ${camel} with ${camel}HQ and \`from opentide import ${camel}\`.`);
  assert.equal(out.includes('Use opentide with'), true);
  assert.equal(out.includes(camel + 'HQ'), true);
  assert.equal(out.includes('from opentide import ' + camel), true);
});

test('rewriteHref turns file-relative markdown into /docs URLs', () => {
  assert.equal(rewriteHref('./how-it-works.md', 'usage'), '/docs/usage/how-it-works/');
  assert.equal(rewriteHref('./configuration.md#credentials', 'usage'), '/docs/usage/configuration/#credentials');
  assert.equal(rewriteHref('../mcp/configuration.md', 'usage'), '/docs/mcp/configuration/');
  assert.equal(rewriteHref('https://example.com/foo.md', 'usage'), 'https://example.com/foo.md');
});

test('rewriteHref sends unpublished specification trees to GitHub instead of /docs', () => {
  assert.equal(
    rewriteHref('../../rfcs/0003-per-key-vocabulary-versioning.md', 'specifications/specs/vocabularies'),
    `${SPECS_BLOB}/rfcs/0003-per-key-vocabulary-versioning.md`,
  );
  assert.equal(
    rewriteHref('../schemas/inflight.shard.1.0.schema.json', 'specifications/specs'),
    `${SPECS_BLOB}/schemas/inflight.shard.1.0.schema.json`,
  );
  assert.equal(
    rewriteHref('./AGENTS.md', 'specifications'),
    `${SPECS_BLOB}/AGENTS.md`,
  );
  assert.equal(
    rewriteHref('./vocabularies/format.md', 'specifications/specs'),
    '/docs/specifications/specs/vocabularies/format/',
  );
});

test('unpublishedSpecsUrl ignores published specification pages', () => {
  assert.equal(unpublishedSpecsUrl('specifications/specs/vocabularies/format.md'), null);
  assert.equal(unpublishedSpecsUrl('specifications/GOVERNANCE.md'), null);
  assert.equal(
    unpublishedSpecsUrl('specifications/rfcs/0003-per-key-vocabulary-versioning.md'),
    `${SPECS_BLOB}/rfcs/0003-per-key-vocabulary-versioning.md`,
  );
});

test('rewriteSiteLinks rewrites Card hrefs and markdown links', () => {
  const src = '<Card href="./how-it-works.md" />\n\n[Install](./installation.md)\n';
  const out = rewriteSiteLinks(src, 'usage/index.mdx');
  assert.equal(out.includes('href="/docs/usage/how-it-works/"'), true);
  assert.equal(out.includes('](/docs/usage/installation/)'), true);
});

test('postProcessMarkdown does not publish unpublished RFC paths under /docs', () => {
  const out = postProcessMarkdown(
    'See [RFC 0003](../../rfcs/0003-per-key-vocabulary-versioning.md) and [pins](../schemas/pins/).',
    'specifications/specs/vocabularies/format.mdx',
  );
  assert.equal(out.includes('/docs/specifications/rfcs/'), false);
  assert.equal(out.includes(`${SPECS_BLOB}/rfcs/0003-per-key-vocabulary-versioning.md`), true);
  assert.equal(out.includes(`${SPECS_BLOB}/schemas/pins/`), true);
});

test('postProcessMarkdown keeps published vocabulary spec links on /docs', () => {
  const out = postProcessMarkdown(
    'See [format](vocabularies/format.md) and [tlp](../vocabularies/tlp.vocab.toml).',
    'specifications/specs/metaschema-keywords.mdx',
  );
  assert.equal(out.includes('](/docs/specifications/specs/vocabularies/format/)'), true);
  assert.equal(out.includes(`${SPECS_BLOB}/vocabularies/format.md`), false);
  assert.equal(out.includes(`${SPECS_BLOB}/vocabularies/tlp.vocab.toml`), true);
});

test('transformSpecFrontmatter injects title from the body h1', () => {
  const out = transformSpecFrontmatter('# Versioning\n\n## Summary\n\nHow versions work.\n', 'specifications/specs/versioning.mdx');
  assert.equal(out.startsWith('---\n'), true);
  assert.equal(out.includes('title: Versioning'), true);
  assert.equal(out.includes('description: How versions work.'), true);
});

test('SKIP_SYNC leaves an existing tree untouched', () => {
  const root = tempDir('docs-sync-skip-');
  const outDir = join(root, 'content', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'keep.mdx'), 'stay');
  const result = main({ root, outDir, env: { SKIP_SYNC: '1' } });
  assert.equal(result.skipped, true);
  assert.equal(readFileSync(join(outDir, 'keep.mdx'), 'utf8'), 'stay');
});

test('syncContent emits mdx, stamps SHAs, and rewrites Card hrefs', () => {
  const root = tempDir('docs-sync-run-');
  const opentideRepo = join(root, 'vendor-src', 'opentide');
  const specificationsRepo = join(root, 'vendor-src', 'specifications');
  gitInit(opentideRepo);
  gitInit(specificationsRepo);
  seedVendorDocs(join(opentideRepo, 'docs'), specificationsRepo);
  const opentideSha = gitCommitAll(opentideRepo, 'docs');
  const specificationsSha = gitCommitAll(specificationsRepo, 'specs');

  const outDir = join(root, 'content', 'docs');
  const result = syncContent({
    root,
    outDir,
    env: {
      OPENTIDE_DOCS_PATH: join(opentideRepo, 'docs'),
      SPECIFICATIONS_PATH: specificationsRepo,
    },
  });

  assert.equal(result.skipped, false);
  assert.equal(result.stamp.opentide, opentideSha);
  assert.equal(result.stamp.specifications, specificationsSha);
  assert.equal(result.stamp.format, 'mdx');

  const installation = readFileSync(join(outDir, 'usage', 'installation.mdx'), 'utf8');
  assert.equal(installation.includes('<Tabs items={'), true);
  assert.equal(installation.includes('](/docs/usage/configuration/#credentials)'), true);
  assert.equal(existsSyncMarkdown(outDir), false);

  const usageIndex = readFileSync(join(outDir, 'usage', 'index.mdx'), 'utf8');
  assert.equal(usageIndex.includes('href="/docs/usage/how-it-works/"'), true);

  const specIndex = readFileSync(join(outDir, 'specifications', 'index.mdx'), 'utf8');
  assert.equal(specIndex.includes('](/docs/specifications/SPECS/)'), true);

  const format = readFileSync(join(outDir, 'specifications', 'specs', 'vocabularies', 'format.mdx'), 'utf8');
  assert.equal(format.includes('/docs/specifications/rfcs/'), false);
  assert.equal(format.includes(`${SPECS_BLOB}/rfcs/0003-per-key-vocabulary-versioning.md`), true);
  assert.equal(format.includes(`${SPECS_BLOB}/schemas/pins/threat.toml`), true);

  assert.equal(gitHeadForPath(join(opentideRepo, 'docs')).sha, opentideSha);
});

function existsSyncMarkdown(outDir) {
  try {
    assertNoMarkdownPages(outDir);
    return false;
  } catch {
    return true;
  }
}

test('syncContent throws when source trees are missing', () => {
  const root = tempDir('docs-sync-missing-');
  assert.throws(
    () => syncContent({ root, outDir: join(root, 'content', 'docs'), env: {} }),
    /Could not resolve OPENTIDE_DOCS_PATH/,
  );
});

test('checkPublishedDocsFreshness fails when the stamp does not match gitlinks', () => {
  const root = tempDir('docs-sync-fresh-');
  const fakeVendor = tempDir('docs-sync-vendor-');
  gitInit(root);
  gitInit(fakeVendor);
  writeFileSync(join(fakeVendor, 'README'), 'x');
  const sha = gitCommitAll(fakeVendor, 'init');
  writeFileSync(join(root, 'README'), 'site');
  execFileSync('git', ['-C', root, 'add', 'README']);
  writeGitlinks(root, { opentide: sha, specifications: sha });
  execFileSync('git', ['-C', root, 'commit', '-m', 'gitlinks'], { stdio: 'ignore' });

  const outDir = join(root, 'content', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'usage.mdx'), '---\ntitle: x\n---\n');
  writeFileSync(
    join(outDir, '.sync-stamp.json'),
    `${JSON.stringify({ format: 'mdx', opentide: '0'.repeat(40), specifications: sha }, null, 2)}\n`,
  );

  assert.equal(gitLinkSha(root, 'vendor/opentide'), sha);
  assert.throws(
    () => checkPublishedDocsFreshness({ root, outDir }),
    /vendor\/opentide is/,
  );
});

test('checkPublishedDocsFreshness passes when stamp matches gitlinks', () => {
  const root = tempDir('docs-sync-fresh-ok-');
  const fakeVendor = tempDir('docs-sync-vendor-ok-');
  gitInit(root);
  gitInit(fakeVendor);
  writeFileSync(join(fakeVendor, 'README'), 'x');
  const sha = gitCommitAll(fakeVendor, 'init');
  writeFileSync(join(root, 'README'), 'site');
  execFileSync('git', ['-C', root, 'add', 'README']);
  writeGitlinks(root, { opentide: sha, specifications: sha });
  execFileSync('git', ['-C', root, 'commit', '-m', 'gitlinks'], { stdio: 'ignore' });

  const outDir = join(root, 'content', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'usage.mdx'), '---\ntitle: x\n---\n');
  writeFileSync(
    join(outDir, '.sync-stamp.json'),
    `${JSON.stringify({ format: 'mdx', opentide: sha, specifications: sha }, null, 2)}\n`,
  );

  const result = checkPublishedDocsFreshness({ root, outDir });
  assert.equal(result.stamp.opentide, sha);
});

test('checkPublishedDocsFreshness fails when leftover .md pages exist', () => {
  const root = tempDir('docs-sync-md-');
  const fakeVendor = tempDir('docs-sync-vendor-md-');
  gitInit(root);
  gitInit(fakeVendor);
  writeFileSync(join(fakeVendor, 'README'), 'x');
  const sha = gitCommitAll(fakeVendor, 'init');
  writeFileSync(join(root, 'README'), 'site');
  execFileSync('git', ['-C', root, 'add', 'README']);
  writeGitlinks(root, { opentide: sha, specifications: sha });
  execFileSync('git', ['-C', root, 'commit', '-m', 'gitlinks'], { stdio: 'ignore' });

  const outDir = join(root, 'content', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'usage.md'), '# leftover');
  writeFileSync(
    join(outDir, '.sync-stamp.json'),
    `${JSON.stringify({ format: 'mdx', opentide: sha, specifications: sha }, null, 2)}\n`,
  );

  assert.throws(
    () => checkPublishedDocsFreshness({ root, outDir }),
    /still include \.md pages/,
  );
});

test('promoteCommittedMarkdownToMdx converts a committed tree in place', () => {
  const root = tempDir('docs-sync-promote-');
  const fakeVendor = tempDir('docs-sync-vendor-promote-');
  gitInit(root);
  gitInit(fakeVendor);
  writeFileSync(join(fakeVendor, 'README'), 'x');
  const sha = gitCommitAll(fakeVendor, 'init');
  writeFileSync(join(root, 'README'), 'site');
  execFileSync('git', ['-C', root, 'add', 'README']);
  writeGitlinks(root, { opentide: sha, specifications: sha });
  execFileSync('git', ['-C', root, 'commit', '-m', 'gitlinks'], { stdio: 'ignore' });

  const outDir = join(root, 'content', 'docs');
  mkdirSync(join(outDir, 'usage'), { recursive: true });
  writeFileSync(
    join(outDir, 'usage', 'index.md'),
    '---\ntitle: Usage\n---\n\n<Card href="./how-it-works.md" />\n',
  );
  const result = promoteCommittedMarkdownToMdx({ root, outDir });
  assert.equal(result.converted, 1);
  assert.equal(result.stamp.opentide, sha);
  const body = readFileSync(join(outDir, 'usage', 'index.mdx'), 'utf8');
  assert.equal(body.includes('href="/docs/usage/how-it-works/"'), true);
  assert.throws(() => readFileSync(join(outDir, 'usage', 'index.md')));
});

test('verifyBuiltDocs rejects escaped Tabs and missing tablist markup', () => {
  const outDir = tempDir('docs-sync-verify-');
  mkdirSync(join(outDir, 'docs/usage/installation'), { recursive: true });
  mkdirSync(join(outDir, 'docs/usage/quickstart'), { recursive: true });
  writeFileSync(
    join(outDir, 'docs/usage/installation/index.html'),
    '<p>&lt;Tabs items={["venv + pip"]}&gt;</p><p>One install gets the CLI</p><p>venv + pip</p><p>uv</p>',
  );
  writeFileSync(join(outDir, 'docs/usage/index.html'), '<p>How opentide works</p>');
  writeFileSync(join(outDir, 'docs/usage/quickstart/index.html'), '<p>Install and point at your repo</p>');
  assert.throws(() => verifyBuiltDocs(outDir), /escaped MDX tags/);
});

test('verifyBuiltDocs accepts rendered tablist markup', () => {
  const outDir = tempDir('docs-sync-verify-ok-');
  mkdirSync(join(outDir, 'docs/usage/installation'), { recursive: true });
  mkdirSync(join(outDir, 'docs/usage/quickstart'), { recursive: true });
  writeFileSync(
    join(outDir, 'docs/usage/installation/index.html'),
    '<div style="--callout-color: blue"><p>One install gets the CLI</p></div><div role="tablist"><button role="tab">venv + pip</button><button role="tab">uv</button></div>',
  );
  writeFileSync(
    join(outDir, 'docs/usage/index.html'),
    '<a data-card="true" href="/docs/usage/how-it-works/">How opentide works</a>',
  );
  writeFileSync(
    join(outDir, 'docs/usage/quickstart/index.html'),
    '<div class="fd-steps"><h3>Install and point at your repo</h3></div>',
  );
  const result = verifyBuiltDocs(outDir);
  assert.equal(result.installation.includes('role="tablist"'), true);
  assertNoEscapedMdx(result.installation, 'fixture');
  assertTabsRendered(result.installation, 'fixture', ['venv + pip', 'uv']);
});

test('generated specifications index sends AGENTS.md to GitHub', () => {
  const out = postProcessMarkdown(buildSpecificationsIndex(), 'specifications/index.mdx');
  assert.equal(out.includes('/docs/specifications/AGENTS/'), false);
  assert.equal(out.includes(`${SPECS_BLOB}/AGENTS.md`), true);
});

test('verifyBuiltDocs rejects unpublished RFC /docs links on the format spec', () => {
  const outDir = tempDir('docs-sync-verify-rfc-');
  mkdirSync(join(outDir, 'docs/usage/installation'), { recursive: true });
  mkdirSync(join(outDir, 'docs/usage/quickstart'), { recursive: true });
  mkdirSync(join(outDir, 'docs/specifications/specs/vocabularies/format'), { recursive: true });
  writeFileSync(
    join(outDir, 'docs/usage/installation/index.html'),
    '<div style="--callout-color: blue"><p>One install gets the CLI</p></div><div role="tablist"><button role="tab">venv + pip</button><button role="tab">uv</button></div>',
  );
  writeFileSync(
    join(outDir, 'docs/usage/index.html'),
    '<a data-card="true" href="/docs/usage/how-it-works/">How opentide works</a>',
  );
  writeFileSync(
    join(outDir, 'docs/usage/quickstart/index.html'),
    '<div class="fd-steps"><h3>Install and point at your repo</h3></div>',
  );
  writeFileSync(
    join(outDir, 'docs/specifications/specs/vocabularies/format/index.html'),
    '<a href="/docs/specifications/rfcs/0003-per-key-vocabulary-versioning/">RFC 0003</a>',
  );
  assert.throws(() => verifyBuiltDocs(outDir), /unpublished RFC pages/);
});

test('postProcessMarkdown is idempotent for site links', () => {
  const once = postProcessMarkdown(
    '---\ntitle: Usage\n---\n\n[Install](./installation.md)\n',
    'usage/index.mdx',
  );
  const twice = postProcessMarkdown(once, 'usage/index.mdx');
  assert.equal(once, twice);
});

test('transformSpecFrontmatter keeps an existing title', () => {
  const src = '---\ntitle: Kept\ndescription: Lead.\n---\n\n# Kept\n\nBody.\n';
  const out = transformSpecFrontmatter(src, 'specifications/SPECS.mdx');
  assert.equal(out.includes('title: Kept'), true);
  assert.equal(out.includes('# Kept'), false);
});

test('checkPublishedDocsFreshness fails when the stamp file is missing', () => {
  const root = tempDir('docs-sync-stamp-missing-');
  gitInit(root);
  writeFileSync(join(root, 'README'), 'site');
  gitCommitAll(root, 'init');
  const outDir = join(root, 'content', 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'usage.mdx'), '---\ntitle: x\n---\n');
  assert.throws(
    () => checkPublishedDocsFreshness({ root, outDir }),
    /sync-stamp\.json is missing/,
  );
});

test('workspace committed docs match vendor gitlinks and are mdx', () => {
  checkPublishedDocsFreshness();
});

test('verifyBuiltDocs fails when a required page is missing', () => {
  const outDir = tempDir('docs-sync-verify-missing-');
  assert.throws(() => verifyBuiltDocs(outDir), /Missing built page/);
});

test('incomplete OPENTIDE_DOCS_PATH is rejected', () => {
  const root = tempDir('docs-sync-incomplete-');
  const docs = join(root, 'docs');
  mkdirSync(docs, { recursive: true });
  assert.throws(
    () =>
      syncContent({
        root,
        outDir: join(root, 'content', 'docs'),
        env: { OPENTIDE_DOCS_PATH: docs },
      }),
    /incomplete documentation tree/,
  );
});

test('syncContent falls back to a generated specifications index', () => {
  const root = tempDir('docs-sync-stub-index-');
  const opentideRepo = join(root, 'vendor-src', 'opentide');
  const specificationsRepo = join(root, 'vendor-src', 'specifications');
  gitInit(opentideRepo);
  gitInit(specificationsRepo);
  writeTree(join(opentideRepo, 'docs'), {
    'usage/meta.json': '{}\n',
    'usage/index.md': '---\ntitle: Usage\n---\n\nHi.\n',
    'cli/meta.json': '{}\n',
    'mcp/meta.json': '{}\n',
    'sdk/meta.json': '{}\n',
  });
  writeTree(specificationsRepo, {
    'specs/versioning.md': '# Versioning\n\n## Summary\n\nHow versions work.\n',
  });
  gitCommitAll(opentideRepo, 'docs');
  gitCommitAll(specificationsRepo, 'specs');

  const outDir = join(root, 'content', 'docs');
  syncContent({
    root,
    outDir,
    env: {
      OPENTIDE_DOCS_PATH: join(opentideRepo, 'docs'),
      SPECIFICATIONS_PATH: specificationsRepo,
    },
  });
  const index = readFileSync(join(outDir, 'specifications', 'index.mdx'), 'utf8');
  assert.equal(index.includes('Normative specifications define the contract'), true);
  assert.equal(index.includes('](/docs/specifications/SPECS/)'), true);
  assert.equal(index.includes('/docs/specifications/AGENTS/'), false);
  assert.equal(index.includes(`${SPECS_BLOB}/AGENTS.md`), true);
});
