import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getGithubUrl, toSourceMarkdownPath } from './docs-github-url.ts';

test('toSourceMarkdownPath maps published mdx back to upstream md', () => {
  assert.equal(toSourceMarkdownPath('usage/installation.mdx'), 'usage/installation.md');
  assert.equal(toSourceMarkdownPath('usage/installation.md'), 'usage/installation.md');
  assert.equal(toSourceMarkdownPath('specifications/SPECS.mdx'), 'specifications/SPECS.md');
});

test('getGithubUrl points opentide docs at the development docs tree', () => {
  assert.equal(
    getGithubUrl(['usage', 'installation'], 'usage/installation.mdx'),
    'https://github.com/OpenTideHQ/opentide/blob/development/docs/usage/installation.md',
  );
});

test('getGithubUrl points specification object pages at specs/*.md', () => {
  assert.equal(
    getGithubUrl(['specifications', 'specs', 'objects', 'rule-1.0'], 'specifications/specs/objects/rule-1.0.mdx'),
    'https://github.com/OpenTideHQ/specifications/blob/main/specs/objects/rule-1.0.md',
  );
});

test('getGithubUrl maps the specifications index to README.md', () => {
  assert.equal(
    getGithubUrl(['specifications'], 'specifications/index.mdx'),
    'https://github.com/OpenTideHQ/specifications/blob/main/README.md',
  );
});

test('getGithubUrl maps specification root files without doubling the extension', () => {
  assert.equal(
    getGithubUrl(['specifications', 'SPECS'], 'specifications/SPECS.mdx'),
    'https://github.com/OpenTideHQ/specifications/blob/main/SPECS.md',
  );
});
