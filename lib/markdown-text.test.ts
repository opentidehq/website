import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainText } from './markdown-text.ts';

test('character references read as the characters they name', () => {
  // The VS Code extension's changelog writes angle brackets as references for the Marketplace.
  assert.equal(plainText('"Explain &lt;code&gt;" on every problem'), '"Explain <code>" on every problem');
  assert.equal(plainText('A &amp; B, &#8212; and &#x2014;'), 'A & B, \u2014 and \u2014');
  // A reference that names nothing stays as written.
  assert.equal(plainText('&notareference; &#0;'), '&notareference; &#0;');
});

test('a backslash escape reads as its punctuation', () => {
  assert.equal(plainText('ES\\|QL and \\*literal\\*'), 'ES|QL and *literal*');
  // A backslash before a letter is not an escape.
  assert.equal(plainText('C:\\path'), 'C:\\path');
});
