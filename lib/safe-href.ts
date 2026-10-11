/** Site-relative paths and web links. Protocol-relative URLs are a different origin. */
const WEB_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /[\s\\]/.test(trimmed)) return null;
  if (trimmed.startsWith('#')) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (WEB_PROTOCOLS.has(url.protocol)) return trimmed;
  } catch {
    return null;
  }
  return null;
}
