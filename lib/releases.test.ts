import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { kindLabel, parseReleaseNotes, publicLinks, releaseAnchor } from './releases.ts';

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
- [GitHub Release](https://github.com/OpenTideHQ/opentide/releases/tag/v1.2.0)
- [CHANGELOG](https://github.com/OpenTideHQ/opentide/blob/development/CHANGELOG.md)

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
