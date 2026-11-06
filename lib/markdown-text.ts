const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

/** A backslash escape, or a character reference, read in one pass. */
const ESCAPE_OR_REFERENCE = /\\([!-/:-@[-`{-~])|&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]+);/gi;

/** A numeric reference CommonMark replaces with U+FFFD: zero, a surrogate, or past Unicode. */
function codePoint(code: number): string {
  return code === 0 || (code >= 0xd800 && code <= 0xdfff) || code > 0x10ffff ? '\ufffd' : String.fromCodePoint(code);
}

/**
 * Markdown text outside code as it reads: a character reference (`&lt;code&gt;`, which notes
 * shown on the VS Code Marketplace need) is the character, and a backslash escape (`\|`) its
 * punctuation, so `\&amp;` stays `&amp;`. Code spans keep both as written, as CommonMark does.
 */
export function plainText(text: string): string {
  return text.replaceAll(ESCAPE_OR_REFERENCE, (match: string, escaped: string | undefined, name: string | undefined) => {
    if (escaped !== undefined) return escaped;
    if (!name) return match;
    if (name.startsWith('#')) {
      const hex = name[1] === 'x' || name[1] === 'X';
      return codePoint(hex ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1)));
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });
}
