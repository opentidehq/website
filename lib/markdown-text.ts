const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

/**
 * Markdown text outside code as it reads: a character reference (`&lt;code&gt;`, which notes
 * shown on the VS Code Marketplace need) is the character, and a backslash escape (`\|`) its
 * punctuation. Code spans keep both as written, as CommonMark does.
 */
export function plainText(text: string): string {
  return text
    .replaceAll(/\\([!-/:-@[-`{-~])/g, '$1')
    .replaceAll(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]+);/gi, (reference: string, name: string) => {
      if (name.startsWith('#')) {
        const code = name[1] === 'x' || name[1] === 'X' ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : reference;
      }
      return ENTITIES[name.toLowerCase()] ?? reference;
    });
}
