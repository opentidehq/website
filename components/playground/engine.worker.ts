/// <reference lib="webworker" />
/**
 * The playground's engine worker: the opentide language server (`opentide-wasm`, the server
 * `opentide-lsp --stdio` runs, built for the browser) served by `@opentide/lsp-worker`.
 *
 * The page posts `{ type: 'start', glue, wasm, bytes, lsp }` once, with `lsp` the worker's end of
 * a MessageChannel: JSON-RPC goes over that port, one message per `postMessage`, which is what
 * `@codemirror/lsp-client` sends. Highlight requests come on the worker's own port, so syntax
 * colour never queues behind a JSON-RPC exchange in the client. The module is downloaded here,
 * so the page can show how far along it is.
 */
import { loadHighlightModule, loadLanguageServer, serveLanguageServer, type GlueModule } from '@opentide/lsp-worker';

type Start = { type: 'start'; glue: string; wasm: string; bytes: number; lsp: MessagePort };
type Highlight = { type: 'highlight'; id: number; language: string; text: string };
type Inbound = Start | Highlight;

declare const self: DedicatedWorkerGlobalScope;

let highlighter: Promise<Awaited<ReturnType<typeof loadHighlightModule>>> | null = null;
const encoder = new TextEncoder();

/** Download the module, posting progress, and compile it. */
async function download(url: string, expected: number): Promise<WebAssembly.Module> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`the engine module answered ${response.status}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let last = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const now = performance.now();
    if (now - last > 60) {
      last = now;
      self.postMessage({ type: 'progress', received, total: expected });
    }
  }
  self.postMessage({ type: 'progress', received, total: received, compiling: true });
  const bytes = new Uint8Array(received);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return WebAssembly.compile(bytes);
}

self.addEventListener('message', (event: MessageEvent<Inbound>) => {
  const message = event.data;
  if (message.type === 'start') {
    const started = performance.now();
    // The glue lives under public/, fetched at build time: the bundler must not resolve it.
    const glue: Promise<GlueModule> = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ message.glue);
    const compiled = download(message.wasm, message.bytes);
    const server = Promise.all([glue, compiled]).then(([g, m]) => loadLanguageServer(g, m));
    // After the server: the glue initialises once, and a second concurrent init would swap the
    // module under the server's session.
    highlighter = server.then(() => glue).then((g) => loadHighlightModule(g));
    server.then(
      (s) => self.postMessage({ type: 'ready', version: s.version(), ms: Math.round(performance.now() - started) }),
      (error: unknown) => self.postMessage({ type: 'failed', reason: error instanceof Error ? error.message : String(error) }),
    );
    message.lsp.start();
    void serveLanguageServer(message.lsp, server);
    return;
  }
  if (message.type === 'highlight') {
    const { id, language, text } = message;
    if (!highlighter) return;
    highlighter.then(
      (h) => {
        try {
          const result = h.highlight(language, encoder.encode(text)) as { tokens?: unknown[] };
          self.postMessage({ type: 'highlighted', id, tokens: result.tokens ?? [] });
        } catch (error) {
          self.postMessage({ type: 'highlighted', id, tokens: [], error: String(error) });
        }
      },
      () => self.postMessage({ type: 'highlighted', id, tokens: [] }),
    );
  }
});
