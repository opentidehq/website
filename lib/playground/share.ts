/**
 * Share links: the files that differ from the demo, deflated into the URL fragment
 * (`/playground/#s=…`). The fragment never reaches a server, so a shared rule stays between the
 * people who hold the link.
 */

const PREFIX = 's=';

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** `#s=…` for these files (path → text). */
export async function encodeShare(files: Record<string, string>): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(files));
  return `#${PREFIX}${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`;
}

/** The files a `#s=…` fragment carries, or null when it carries none or does not decode. */
export async function decodeShare(hash: string): Promise<Record<string, string> | null> {
  const body = hash.replace(/^#/, '');
  if (!body.startsWith(PREFIX)) return null;
  try {
    const json = new TextDecoder().decode(await pipe(fromBase64Url(body.slice(PREFIX.length)), new DecompressionStream('deflate-raw')));
    const value: unknown = JSON.parse(json);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  } catch {
    return null;
  }
}
