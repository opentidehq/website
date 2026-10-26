import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from './release-projects.ts';
import {
  compareVersions,
  formatIsoDate,
  groupBySeries,
  kindLabel,
  loadProjectReleases,
  parseChangelog,
  parseReleaseNotes,
  publicLinks,
  releaseAnchor,
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
  assert.deepEqual(
    releases[0]?.sections.map((section) => section.title),
    ['What changes', 'Fixes'],
  );
  assert.equal(releases[0]?.sections[0]?.items.length, 1);
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
  assert.match(six.notes.join('\n'), /setup ci/);
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
  assert.deepEqual(added?.sections[0]?.items, [
    'A star bullet.',
    'A plus bullet.',
    'A parent',
    'a nested child',
  ]);
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
