import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeHref } from './safe-href.ts';

test('safeHref keeps site paths, fragments, and web links', () => {
  assert.equal(safeHref('/docs/usage/'), '/docs/usage/');
  assert.equal(safeHref('#credentials'), '#credentials');
  assert.equal(safeHref('https://example.com/foo'), 'https://example.com/foo');
  assert.equal(safeHref('mailto:docs@example.com'), 'mailto:docs@example.com');
});

test('safeHref rejects protocol-relative and non-web URLs', () => {
  assert.equal(safeHref('//evil.example'), null);
  assert.equal(safeHref('/\\evil.example'), null);
  assert.equal(safeHref('javascript:alert(1)'), null);
  assert.equal(safeHref('data:text/html,hi'), null);
  assert.equal(safeHref('https://example.com/a b'), null);
});
