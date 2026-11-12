import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHighlighter } from 'shiki';
import { EXTRA_LANGUAGES } from './languages.ts';

test('a yaral fence highlights with the language-server grammar', async () => {
  const highlighter = await createHighlighter({ themes: ['github-light'], langs: EXTRA_LANGUAGES });
  assert.ok(highlighter.getLoadedLanguages().includes('yaral'));
  const tokens = highlighter.codeToTokensBase('events:\n  $e.metadata.event_type = "USER_LOGIN"\ncondition:\n  $e', {
    lang: 'yaral',
    theme: 'github-light',
  });
  const scoped = tokens.flat().filter((t) => t.content.trim());
  // A keyword and a string get colours of their own, so the grammar applied.
  const keyword = scoped.find((t) => t.content.startsWith('events'));
  const string = scoped.find((t) => t.content.includes('"USER_LOGIN"'));
  assert.ok(keyword && string);
  assert.notEqual(keyword.color, string.color);
  highlighter.dispose();
});
