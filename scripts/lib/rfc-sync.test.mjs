import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rewriteHref } from './docs-sync.mjs';
import {
  buildRfcFolderMeta,
  ensureRfcDiscovery,
  escapeMdxProse,
  mergeRfcCatalog,
  parseReadmeIndex,
  parseRfcFile,
  rfcDescription,
  renderRfcDocument,
  renderRfcIndex,
  withRfcNav,
} from './rfc-sync.mjs';

const PROPOSAL = `# RFC 0006: Sharing on the production merge

- **RFC:** 0006
- **Title:** Sharing on the production merge
- **Author:** Ada
- **Status:** accepted
- **Created:** 2026-09-28
- **Accepted:** 2026-09-28 — normative text in [specs/sharing.md](../specs/sharing.md)
- **Supersedes:** question 8 of [RFC 0005](0005-sharing-system.md)

## Summary

Ship an optional sharing stage on the default branch.

The stage stays off until setup selects it.

## Motivation

Deployment already has this mechanic.
`;

function bannerFrom(mdx) {
  const marker = '<RfcBanner entry=';
  const at = mdx.indexOf(marker);
  assert.notEqual(at, -1);
  const brace = mdx.indexOf('{', at);
  const end = mdx.indexOf(' />', brace);
  const expression = mdx.slice(brace, end).trim();
  const literal = expression.slice(1, -1);
  return JSON.parse(JSON.parse(literal));
}

test('parseRfcFile keeps every metadata field except the ones shown in the title', () => {
  const model = parseRfcFile('0006-sharing-ci.md', PROPOSAL, rewriteHref);
  assert.equal(model.status, 'accepted');
  assert.equal(model.number, '0006');
  assert.equal(model.shortTitle, 'Sharing on the production merge');
  assert.equal(model.description, 'Ship an optional sharing stage on the default branch.');
  assert.equal(model.summary.includes('optional sharing stage'), true);
  assert.equal(model.body.includes('- **Status:**'), false);
  assert.equal(model.body.includes('## Motivation'), true);
  const labels = model.banner.fields.map((field) => field.label);
  assert.deepEqual(labels, ['Author', 'Created', 'Accepted', 'Supersedes']);
  const accepted = model.banner.fields.find((field) => field.label === 'Accepted');
  assert.equal(
    accepted.parts.find((part) => part.kind === 'link').href,
    '/docs/specifications/specs/sharing/',
  );
});

test('renderRfcDocument escapes prose braces and leaves fenced code alone', () => {
  const source = `# RFC 0007: Elastic

- **RFC:** 0007
- **Title:** Elastic
- **Status:** accepted
- **Created:** 2026-09-25

## Summary

Call \`/s/{space_id}/api\` and mention <project> plus paths/{id} in prose.

\`\`\`json
{"space": "{space_id}"}
\`\`\`
`;
  const mdx = renderRfcDocument(parseRfcFile('0007-elastic.md', source, rewriteHref));
  assert.equal(mdx.includes('&lt;project>'), true);
  assert.equal(mdx.includes('{"space": "{space_id}"}'), true);
  assert.equal(mdx.includes('`/s/{space_id}/api`'), true);
  assert.equal(mdx.includes('paths/\\{id\\}'), true);
  const banner = bannerFrom(mdx);
  assert.equal(banner.status, 'accepted');
  assert.equal(banner.number, '0007');
});

test('template pages stay instructional and are not proposals', () => {
  const source = `# RFC 0000: Template

- **Status:** draft | accepted | rejected | superseded

## Summary

One paragraph overview.
`;
  const model = parseRfcFile('0000-template.md', source, rewriteHref);
  assert.equal(model.status, 'template');
  assert.equal(model.title, 'RFC template');
  assert.equal(model.banner.fields.length, 0);
  assert.equal(model.banner.note.includes('not a live RFC'), true);
  const mdx = renderRfcDocument(model);
  assert.equal(mdx.includes('- **Status:**'), true);
  assert.equal(mdx.includes('status: template'), true);
});

test('readme index keeps reserved numbers that have no file', () => {
  const readme = `# RFCs

Proposals live here.

## Index

| RFC | Title | Status |
|-----|-------|--------|
| [0003](0003-per-key-vocabulary-versioning.md) | Per-key vocabulary versioning | proposed |
| [0004](https://github.com/OpenTideHQ/specifications/issues/8) | Sysdig Falco deployer | reserved |

## Numbering

Use four digits.
`;
  const model = parseRfcFile(
    '0003-per-key-vocabulary-versioning.md',
    `# RFC 0003: Per-key vocabulary versioning\n\n- **Title:** Per-key vocabulary versioning\n- **Status:** proposed\n- **Created:** 2026-06-26\n\n## Summary\n\nPer-key versions.\n`,
    rewriteHref,
  );
  const entries = mergeRfcCatalog([model], parseReadmeIndex(readme));
  assert.equal(entries.length, 2);
  assert.equal(entries[0].number, '0003');
  assert.equal(entries[0].external, false);
  assert.equal(entries[1].number, '0004');
  assert.equal(entries[1].status, 'reserved');
  assert.equal(entries[1].external, true);
  assert.equal(entries[1].href, 'https://github.com/OpenTideHQ/specifications/issues/8');
  assert.equal(entries[1].slug, null);

  const index = renderRfcIndex(readme, entries);
  assert.equal(index.includes('<RfcIndex'), true);
  assert.equal(index.includes('| RFC |'), false);
  assert.equal(index.includes('## Numbering'), true);
  assert.equal(index.startsWith('---\ntitle: RFC index\n'), true);

  const meta = buildRfcFolderMeta(entries, '0000-template');
  assert.deepEqual(meta.pages, [
    'index',
    '---Proposed---',
    '0003-per-key-vocabulary-versioning',
    '---Template---',
    '0000-template',
  ]);
});

test('file status wins when the readme is stale', () => {
  const model = parseRfcFile(
    '0002-vocabulary-versioning.md',
    `# RFC 0002: Vocabulary\n\n- **Title:** Vocabulary\n- **Status:** accepted\n\n## Summary\n\nNow accepted.\n`,
    rewriteHref,
  );
  const entries = mergeRfcCatalog(
    [model],
    [{ number: '0002', href: '0002-vocabulary-versioning.md', title: 'Vocabulary', status: 'proposed' }],
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].status, 'accepted');
});

test('rfcDescription stops before an unmatched bracket', () => {
  const summary =
    'Add a first-class sharing subsystem to opentide: pluggable connectors, one workspace file sharing.toml in which every destination is a block under its integration (`[[misp]]`, later `[[opencti]]`) carrying its own selection and TLP ceiling, and a CLI family `opentide share` that publishes Tide objects.';
  const description = rfcDescription(summary);
  assert.equal(description.includes('[[misp]]'), false);
  assert.equal(
    description,
    'Add a first-class sharing subsystem to opentide: pluggable connectors, one workspace file sharing.toml in which every destination is a block under its integration…',
  );
});

test('escapeMdxProse leaves inline code and fences untouched', () => {
  const source = 'Use `{field}` and <Tag> here.\n\n<!-- keep -->\n\n```toml\n<!-- keep -->\nname = "{field}"\n```\n';
  const escaped = escapeMdxProse(source);
  assert.equal(escaped.includes('`{field}`'), true);
  assert.equal(escaped.includes('name = "{field}"'), true);
  assert.equal(escaped.includes('&lt;Tag>'), true);
  const [prose, fence] = escaped.split('```toml\n');
  assert.equal(prose.includes('<!--'), false);
  assert.equal(fence.includes('<!-- keep -->'), true);
});

test('ensureRfcDiscovery and withRfcNav are idempotent', () => {
  const once = ensureRfcDiscovery('# Specifications\n\nSee the specs.\n');
  const twice = ensureRfcDiscovery(once);
  assert.equal(once, twice);
  assert.equal(once.includes('](rfcs/README.md)'), true);
  const meta = withRfcNav({ title: 'Specifications', pages: ['index'] });
  assert.deepEqual(withRfcNav(meta).pages, meta.pages);
  assert.equal(meta.pages.at(-1), 'rfcs');
});
