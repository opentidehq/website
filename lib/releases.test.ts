import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PROJECTS, nameInSentence, releaseProject } from './release-projects.ts';
import {
  breakingEntry,
  categoryAnchor,
  categoryBlocks,
  changeCounts,
  classifyHeading,
  compareVersions,
  formatIsoDate,
  groupBySeries,
  kindLabel,
  loadProjectReleases,
  otherChangeCount,
  otherSections,
  parseChangelog,
  parseReleaseNotes,
  publicLinks,
  releaseAnchor,
  totalChanges,
  type ReleaseNote,
} from './releases.ts';

const fixture = `---
title: Releases
---

Intro that the product page does not repeat.

## 1.2.0 — 2 March 2026

Minor on 1.1.0. **Upgrade if deploys skipped a changed rule.**

**Install**

\`\`\`bash
pip install opentide==1.2.0
\`\`\`

Regenerate CI after you upgrade.

**What changes for authors and scripts**

- \`deploy\` includes rules in \`objects/rules/\` ([#12](https://example.com/12)).

**What this version fixes**

- Setup no longer prints a traceback.

**Links**

- [PyPI](https://pypi.org/project/opentide/1.2.0/)
- [GitHub Release](https://github.com/opentidehq/opentide/releases/tag/v1.2.0)
- [CHANGELOG](https://github.com/opentidehq/opentide/blob/development/CHANGELOG.md)

## 0.1.0 — 9 September 2026

First public beta. Not 1.0.

**Install**

\`\`\`bash
pip install opentide==0.1.0
\`\`\`

**What this version is**

- A version you can pin.

**Links**

- [Announcement](https://opentide.org/blog/the-engine-is-opentide/)
`;

test('parseReleaseNotes keeps newest first and classifies the upgrade', () => {
  const releases = parseReleaseNotes(fixture);
  assert.equal(releases.length, 2);
  assert.equal(releases[0]?.version, '1.2.0');
  assert.equal(releases[0]?.dateIso, '2026-03-02');
  assert.equal(releases[0]?.kind, 'minor');
  assert.equal(kindLabel('minor'), 'Minor');
  assert.equal(releases[0]?.installCommand, 'pip install opentide==1.2.0');
  assert.match(releases[0]?.summary ?? '', /Upgrade if deploys skipped/);
  assert.match(releases[0]?.notes.join(' ') ?? '', /Regenerate CI/);
  // A category comes before a heading that names none, whatever the order written.
  assert.deepEqual(
    releases[0]?.sections.map((section) => [section.title, section.category]),
    [
      ['Fixed', 'fixed'],
      ['What changes', null],
    ],
  );
  assert.deepEqual(releases[0]?.sections[0]?.items, ['Setup no longer prints a traceback.']);
  assert.deepEqual(releases[0]?.sections[0]?.subitems, [[]]);
  assert.deepEqual(
    publicLinks(releases[0]?.links ?? []).map((link) => link.label),
    ['PyPI', 'GitHub Release'],
  );
  assert.equal(releases[1]?.kind, 'beta');
  assert.equal(releaseAnchor('1.2.0'), 'v1-2-0');
});

test('published release notes parse into a version log', () => {
  const markdown = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../content/docs/usage/releases.mdx'),
    'utf8',
  );
  const releases = parseReleaseNotes(markdown);
  const firstHeading = /^## (\d+\.\d+\.\d+)/m.exec(markdown);
  assert.ok(firstHeading?.[1]);
  assert.equal(releases[0]?.version, firstHeading[1]);
  assert.equal(releases.at(-1)?.version, '0.1.0');
  assert.equal(releases[0]?.links.some((link) => link.label === 'PyPI'), true);

  const six = releases.find((release) => release.version === '0.6.0');
  assert.ok(six);
  assert.equal(six.kind, 'minor');
  // Regenerating CI is a note in older notes and an upgrade step in notes to the standard.
  assert.match([...six.notes, ...(six.upgrade?.items ?? [])].join('\n'), /setup ci/);
  assert.ok(six.sections.some((section) => section.items.length > 0));
});

const changelogProject = PROJECTS.find((project) => project.id === 'language-server')!;

const changelogFixture = `# Changelog

Intro the page does not repeat.

## [Unreleased]

- Not out yet.

## [0.5.0] - 2026-10-26

The Elastic release: **breaking** for nobody, but new.

A second paragraph is a note.

### Added

- ES|QL ([#88](https://github.com/opentidehq/language-server/pull/88)), with a bullet
  that wraps onto a second line.
- Crates on crates.io.

### Removed

- The Python wheel.

## [0.4.0] - 2026-10-23

Differential oracles.

### Fixed

- \`dedup\` requires a field.

[0.5.0]: https://github.com/opentidehq/language-server/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/opentidehq/language-server/releases/tag/v0.4.0
`;

test('a Keep a Changelog file parses into release notes', () => {
  const releases = parseChangelog(changelogFixture, changelogProject);
  assert.deepEqual(
    releases.map((release) => release.version),
    ['0.5.0', '0.4.0'],
  );
  const [latest, earlier] = releases;
  assert.equal(latest?.dateLabel, '26 October 2026');
  assert.equal(latest?.dateIso, '2026-10-26');
  assert.equal(latest?.kind, 'minor');
  assert.equal(latest?.breaking, true);
  assert.match(latest?.summary ?? '', /^The Elastic release/);
  assert.deepEqual(latest?.notes, ['A second paragraph is a note.']);
  assert.deepEqual(
    latest?.sections.map((section) => [section.title, section.items.length]),
    [
      ['Added', 2],
      ['Removed', 1],
    ],
  );
  assert.match(latest?.sections[0]?.items[0] ?? '', /wraps onto a second line\.$/);
  assert.equal(latest?.installCommand, 'cargo install opentide-lsp --version 0.5.0');
  assert.deepEqual(
    latest?.links.map((link) => link.label),
    ['crates.io', 'GitHub Release'],
  );
  // Before firstPublished: tagged after the fact, on no registry.
  assert.equal(earlier?.installCommand, null);
  assert.deepEqual(
    earlier?.links.map((link) => link.label),
    ['GitHub Release'],
  );
  assert.deepEqual(earlier?.sections[0]?.items, ['`dedup` requires a field.']);
});

test('a changelog heading that is not a version and date fails loudly', () => {
  assert.throws(() => parseChangelog('## [0.1.0]\n\nSummary.\n', changelogProject), /version and date/);
  assert.throws(() => parseChangelog('# Changelog\n', changelogProject), /did not include any versions/);
});

test('releases group by minor series, newest first', () => {
  const versions = ['0.17.2', '0.17.1', '0.16.0', '0.1.1', '0.1.0'];
  const groups = groupBySeries(versions.map((version) => ({ version }) as ReleaseNote));
  assert.deepEqual(
    groups.map((group) => [group.series, group.releases.length]),
    [
      ['0.17', 2],
      ['0.16', 1],
      ['0.1', 2],
    ],
  );
  assert.equal(formatIsoDate('2026-07-01'), '1 July 2026');
});

test('every project\'s committed release notes parse', async () => {
  for (const project of PROJECTS) {
    const releases = await loadProjectReleases(project.id);
    assert.ok(releases.length > 0, project.id);
    assert.ok(releases.every((release) => release.summary.length > 0), project.id);
  }
});

test('a changelog parses the shapes Keep a Changelog allows', () => {
  const markdown = `# Changelog

\`\`\`bash
## not a heading inside a fence
\`\`\`

## Unreleased

- Coming.

## [0.6.0] - 2026-11-01

### Added

* A star bullet.
+ A plus bullet.
- A parent
  - a nested child

## [0.7.0] - 2026-11-05 [YANKED]

A non-breaking cleanup that went wrong.

## [0.5.1] - 2026-10-30

No breaking changes here.

### Breaking

- Settings renamed.
`;
  const releases = parseChangelog(markdown, changelogProject);
  // Sorted newest first whatever the file order.
  assert.deepEqual(
    releases.map((release) => release.version),
    ['0.7.0', '0.6.0', '0.5.1'],
  );
  const [yanked, added, fixed] = releases;
  assert.equal(yanked?.installCommand, null);
  assert.match(yanked?.notes[0] ?? '', /yanked/);
  assert.equal(yanked?.breaking, false);
  assert.equal(added?.summary, '');
  assert.deepEqual(added?.sections[0]?.items, ['A star bullet.', 'A plus bullet.', 'A parent']);
  assert.deepEqual(added?.sections[0]?.subitems, [[], [], ['a nested child']]);
  // A Breaking section marks it, whatever the summary says.
  assert.equal(fixed?.breaking, true);
});

test('a changelog date that is not a real day fails loudly', () => {
  assert.throws(
    () => parseChangelog('## [0.6.0] - 2026-13-45\n\nSummary.\n', changelogProject),
    /version and date/,
  );
});

test('versions order by SemVer, a prerelease before its release', () => {
  const versions = ['0.10.0', '1.0.0', '1.0.0-rc.2', '0.9.1', '1.0.0-rc.10'];
  assert.deepEqual(versions.toSorted(compareVersions), ['0.9.1', '0.10.0', '1.0.0-rc.2', '1.0.0-rc.10', '1.0.0']);
});

const nestedFixture = `# Changelog

Stable releases use even minor versions and pre-releases odd ones.

## [Unreleased]

## [0.2.0] - 2026-11-20

The first stable release.

### Fixed

- A fix.

## [0.1.0] - 2026-11-04

The first pre-release.

### Added

#### Runtime and core

- Per-platform packages that
  bundle opentide.

#### Graph and search

- Graph panel: how objects connect.
  - Modes: Focus, Catalogue, and Threat
    chains.
  - Search and export.
- "Find Detection…": a quick search.

### Fixed

#### Problems

- A squiggle per finding.

### Security

- No telemetry.
`;

test('a changelog with #### subsections and nested lists keeps both', () => {
  const [, first] = parseChangelog(nestedFixture, changelogProject);
  assert.ok(first);
  // A #### heading under a category is a group of that category.
  assert.deepEqual(
    first.sections.map((section) => [section.category, section.group, section.items.length]),
    [
      ['added', 'Runtime and core', 1],
      ['added', 'Graph and search', 2],
      ['fixed', 'Problems', 1],
      ['security', null, 1],
    ],
  );
  assert.deepEqual(
    categoryBlocks(first).map((block) => [block.label, block.count, block.groups.length]),
    [
      ['Added', 3, 2],
      ['Fixed', 1, 1],
      ['Security', 1, 1],
    ],
  );
  assert.deepEqual(first?.sections[0]?.items, ['Per-platform packages that bundle opentide.']);
  const graph = first?.sections[1];
  assert.deepEqual(graph?.items, ['Graph panel: how objects connect.', '"Find Detection…": a quick search.']);
  // A nested item's wrapped line continues the nested item, not its parent.
  assert.deepEqual(graph?.subitems, [['Modes: Focus, Catalogue, and Threat chains.', 'Search and export.'], []]);
  // No heading is left in the text.
  assert.ok(first?.sections.every((section) => section.paragraphs.length === 0));
});

const extension = releaseProject('vscode-extension');

test('an odd minor of the extension is a pre-release, an even one stable', () => {
  const [stable, pre] = parseChangelog(nestedFixture, extension);
  assert.equal(stable?.kind, 'minor');
  assert.equal(pre?.kind, 'prerelease');
  assert.equal(kindLabel('prerelease'), 'Pre-release');
  // A pinned version installs on either channel.
  assert.equal(pre?.installCommand, 'code --install-extension opentidehq.opentide@0.1.0');
  assert.deepEqual(pre?.links, [
    { label: 'Visual Studio Marketplace', href: 'https://marketplace.visualstudio.com/items?itemName=opentidehq.opentide' },
    { label: 'Open VSX', href: 'https://open-vsx.org/extension/opentidehq/opentide/0.1.0' },
    { label: 'GitHub Release', href: 'https://github.com/opentidehq/vscode-extension/releases/tag/v0.1.0' },
  ]);
  // Projects without a channel rule keep the kind their version gives.
  const [lsp] = parseChangelog('## [0.5.0] - 2026-10-26\n\nSummary.\n', changelogProject);
  assert.equal(lsp?.kind, 'minor');
});

test('a SemVer prerelease is a pre-release in any project', () => {
  const [rc] = parseChangelog('## [1.0.0-rc.1] - 2026-11-01\n\nRelease candidate.\n', changelogProject);
  assert.equal(rc?.kind, 'prerelease');
});

test('project names read inside a sentence', () => {
  assert.deepEqual(
    PROJECTS.map((project) => nameInSentence(project)),
    ['opentide', 'language server', 'VS Code extension', 'explorer'],
  );
});

test('headings name a category, the upgrade steps, or something else', () => {
  const cases: [string, ReturnType<typeof classifyHeading>][] = [
    ['Added', { kind: 'category', category: 'added', title: 'Added', exact: true }],
    ['FIXED', { kind: 'category', category: 'fixed', title: 'Fixed', exact: true }],
    ['What this version fixes', { kind: 'category', category: 'fixed', title: 'Fixed', exact: true }],
    ['Bug fixes:', { kind: 'category', category: 'fixed', title: 'Fixed', exact: true }],
    ['Security: regenerate GitHub CI', { kind: 'category', category: 'security', title: 'Security', exact: false }],
    ['⚠ Breaking changes', { kind: 'category', category: 'breaking', title: 'Breaking', exact: true }],
    // A heading that starts with Breaking is still Breaking, as it was before the standard.
    ['Breaking for scripts', { kind: 'category', category: 'breaking', title: 'Breaking', exact: false }],
    ['Deprecations', { kind: 'category', category: 'deprecated', title: 'Deprecated', exact: true }],
    ['Upgrade', { kind: 'upgrade', title: 'Upgrade', exact: true }],
    ['Upgrading', { kind: 'upgrade', title: 'Upgrade', exact: true }],
    ['What changes for authors and scripts', { kind: 'other', title: 'What changes' }],
    ['Tests', { kind: 'other', title: 'Tests' }],
  ];
  for (const [heading, kind] of cases) assert.deepEqual(classifyHeading(heading), kind, heading);
});

const standardFixture = `# Changelog

## [0.11.0] - 2026-11-20

Editors get the workspace index, and placeholder queries are not reported.

### Fixed

- **A deleted folder leaves the index** ([#9](https://example.com/9)).

### Highlights

- Not a category: it stays, after them.

### Upgrade

1. Re-run \`setup\`.
2. If you pin the grammar, include \`source.opentide.esql\`.

### Changed

- **Breaking: the ES|QL scope is \`source.opentide.esql\`.** It was \`source.esql\`.
- **Grammars ship in one zip.**

### Added

- **\`opentide/catalog\` serves the index.**
  - \`refs\` on each object
  - \`opentide/catalogChanged\`

### Breaking

- **\`--plan\` is removed.** Use \`--strategy\`.
`;

test('a changelog to the standard: categories in order, upgrade steps apart, breaking marked', () => {
  const [release] = parseChangelog(standardFixture, changelogProject);
  assert.ok(release);
  assert.deepEqual(
    release.sections.map((section) => section.title),
    ['Breaking', 'Added', 'Changed', 'Fixed', 'Highlights'],
  );
  assert.deepEqual(release.upgrade?.items, [
    'Re-run `setup`.',
    'If you pin the grammar, include `source.opentide.esql`.',
  ]);
  assert.equal(release.breaking, true);
  // The Breaking list's entry, and the entry marked breaking under Changed.
  assert.deepEqual(
    changeCounts(release).map(({ category, count }) => [category, count]),
    [
      ['breaking', 2],
      ['added', 1],
      ['changed', 2],
      ['fixed', 1],
    ],
  );
  assert.equal(otherChangeCount(release), 1);
  assert.deepEqual(
    otherSections(release).map((section) => section.title),
    ['Highlights'],
  );
  // The upgrade steps, then every entry: 2 + 1 + 1 + 2 + 1 + 1.
  assert.equal(totalChanges(release), 8);
  assert.deepEqual(release.sections[1]?.subitems, [['`refs` on each object', '`opentide/catalogChanged`']]);
  assert.equal(categoryAnchor('0.11.0', 'fixed'), 'v0-11-0-fixed');
  assert.equal(categoryAnchor('0.11.0', 'upgrade'), 'v0-11-0-upgrade');
});

test('an entry marked breaking keeps its lead and loses the mark', () => {
  assert.deepEqual(breakingEntry('**Breaking: the scope is `x`.** It was `y`.'), {
    breaking: true,
    text: '**the scope is `x`.** It was `y`.',
  });
  assert.deepEqual(breakingEntry('**Breaking:** `--plan` is removed.'), { breaking: true, text: '`--plan` is removed.' });
  assert.deepEqual(breakingEntry('**Breaking** — `--plan` is removed.'), { breaking: true, text: '`--plan` is removed.' });
  // A lead that only starts with the word is not a mark, with or without a hyphen.
  for (const entry of [
    '**Breaking changes are listed first.**',
    '**Breaking** changes are flagged by diff.',
    '**Breaking-change detection** for schemas.',
  ]) {
    assert.deepEqual(breakingEntry(entry), { breaking: false, text: entry }, entry);
  }
  assert.deepEqual(breakingEntry('**Breaking - the scope.** It was y.'), { breaking: true, text: '**the scope.** It was y.' });
  assert.deepEqual(breakingEntry('A plain entry.'), { breaking: false, text: 'A plain entry.' });
});

const standardNotes = `---
title: Releases
---

## 2.0.0 — 20 November 2026

\`validate\` catches what a deploy would reject.

**Install**

\`\`\`bash
pip install opentide==2.0.0
\`\`\`

**Upgrade**

- Run \`opentide setup ci <provider> --yes\`.

**Breaking**

- **CoreTIDE layouts are retired.**
  - \`global.toml\` fails every command.
  - A platform file is named by its file name.

**Added**

- **\`opentide serve\` answers from one warm process** ([#750](https://example.com/750)).

**Fixed**

- **\`deploy\` works with no commit yet.**

See the [CHANGELOG](https://github.com/opentidehq/opentide/blob/development/CHANGELOG.md#200--2026-11-20) for every change.

**Links**

- [PyPI](https://pypi.org/project/opentide/2.0.0/)
- [CHANGELOG](https://github.com/opentidehq/opentide/blob/development/CHANGELOG.md)
`;

test('engine notes to the standard: upgrade steps, nested lists and the changelog pointer', () => {
  const [release] = parseReleaseNotes(standardNotes);
  assert.ok(release);
  assert.equal(release.summary, '`validate` catches what a deploy would reject.');
  assert.deepEqual(release.notes, []);
  assert.deepEqual(release.upgrade?.items, ['Run `opentide setup ci <provider> --yes`.']);
  assert.deepEqual(
    release.sections.map((section) => [section.category, section.items.length]),
    [
      ['breaking', 1],
      ['added', 1],
      ['fixed', 1],
    ],
  );
  // A nested list belongs to its item; it is not a run of items of its own.
  assert.deepEqual(release.sections[0]?.subitems, [
    ['`global.toml` fails every command.', 'A platform file is named by its file name.'],
  ]);
  assert.equal(release.breaking, true);
  // The pointer is a link to that version's record, not prose in the Fixed list.
  assert.deepEqual(release.sections[2]?.paragraphs, []);
  assert.deepEqual(
    publicLinks(release.links).map((link) => link.label),
    ['PyPI', 'Full changelog'],
  );
  assert.equal(
    release.links.find((link) => link.label === 'Full changelog')?.href,
    'https://github.com/opentidehq/opentide/blob/development/CHANGELOG.md#200--2026-11-20',
  );
});

test('a release with no summary still fails, whatever follows it', () => {
  assert.throws(
    () => parseReleaseNotes('## 1.0.0 — 1 March 2026\n\n**Install**\n\nA note.\n'),
    /missing a summary/,
  );
});

test('#### headings with no ### above them are headings of their own', () => {
  const [release] = parseChangelog('## [1.0.0] - 2026-11-20\n\nSummary.\n\n#### Added\n\n- a\n\n#### Fixed\n\n- b\n', changelogProject);
  assert.deepEqual(
    release?.sections.map((section) => [section.category, section.group, section.items]),
    [
      ['added', null, ['a']],
      ['fixed', null, ['b']],
    ],
  );
});

test('#### groups under Upgrade lead their steps', () => {
  const [release] = parseChangelog(
    '## [1.0.0] - 2026-11-20\n\nSummary.\n\n### Upgrade\n\n#### From 0.9\n\n- Run `a`.\n\n#### From 0.8\n\n- Run `b`.\n',
    changelogProject,
  );
  assert.deepEqual(release?.upgrade?.items, ['**From 0.9:** Run `a`.', '**From 0.8:** Run `b`.']);
});

test('a numbered line starts an item only where CommonMark starts one', () => {
  const [release] = parseChangelog(
    [
      '## [1.0.0] - 2026-11-20',
      '',
      'Summary.',
      '',
      '### Fixed',
      '',
      'The import handles the version',
      '2. It also does more.',
      '',
      '### Upgrade',
      '',
      '1. Run `a`',
      '   and wait.',
      '2. Run `b`.',
      '',
      '### Added',
      '',
      '- An entry wrapped after',
      '  3. a number.',
      '',
    ].join('\n'),
    changelogProject,
  );
  assert.ok(release);
  // A wrapped line that begins "2. " stays in its sentence.
  assert.deepEqual(release.sections.find((section) => section.category === 'fixed')?.paragraphs, [
    'The import handles the version 2. It also does more.',
  ]);
  // The next item of a numbered list, after a continued item.
  assert.deepEqual(release.upgrade?.items, ['Run `a` and wait.', 'Run `b`.']);
  // A number inside a wrapped bullet continues the bullet.
  assert.deepEqual(release.sections.find((section) => section.category === 'added')?.items, [
    'An entry wrapped after 3. a number.',
  ]);
});

test('an entry marked breaking elsewhere counts as breaking, with no list to link to', () => {
  const [release] = parseChangelog(
    '## [1.0.0] - 2026-11-20\n\nSummary.\n\n### Changed\n\n- **Breaking:** `--plan` is removed.\n- **A plain change.**\n',
    changelogProject,
  );
  assert.ok(release);
  assert.equal(release.breaking, true);
  assert.deepEqual(
    changeCounts(release).map(({ category, count, listed }) => [category, count, listed]),
    [
      ['breaking', 1, false],
      ['changed', 2, true],
    ],
  );
  assert.deepEqual(
    categoryBlocks(release).map(({ category, count }) => [category, count]),
    [['changed', 2]],
  );
});

test('a CHANGELOG pointer as the first paragraph is a link, not the summary', () => {
  const [release] = parseChangelog(
    '## [1.0.0] - 2026-11-20\n\nSee the [CHANGELOG](https://example.com/c#100) for every change.\n\nThe summary.\n\n### Added\n\n- **a**\n',
    changelogProject,
  );
  assert.equal(release?.summary, 'The summary.');
  assert.deepEqual(release?.notes, []);
  assert.equal(release?.links.find((link) => link.label === 'Full changelog')?.href, 'https://example.com/c#100');
});

test('a bold summary that starts like a part is still the summary', () => {
  const [release] = parseReleaseNotes(
    '## 1.0.0 — 1 March 2026\n\n**Security release: upgrade now.**\n\n**Security**\n\n- **A fix.**\n',
  );
  assert.equal(release?.summary, '**Security release: upgrade now.**');
  assert.deepEqual(
    release?.sections.map((section) => [section.category, section.items]),
    [['security', ['**A fix.**']]],
  );
});
