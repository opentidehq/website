/**
 * The page's side of the engine: starts the worker, reports its download, carries JSON-RPC to it
 * as an `@codemirror/lsp-client` Transport, and asks it for highlight tokens.
 */
import type { Transport } from '@codemirror/lsp-client';

export type EngineStatus =
  | { state: 'idle' }
  | { state: 'loading'; received: number; total: number; compiling: boolean; version: string }
  | { state: 'ready'; version: string; ms: number }
  | { state: 'missing' }
  | { state: 'failed'; reason: string };

export type HighlightToken = {
  capture: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
};

export type Engine = {
  transport: Transport;
  highlight(language: string, text: string): Promise<HighlightToken[]>;
  dispose(): void;
};

/** `/playground/engine/…` under the site's base path, as an absolute URL a worker can import. */
function engineUrl(file: string) {
  return new URL(`/playground/engine/${file}`, window.location.origin).href;
}

export async function startEngine(onStatus: (status: EngineStatus) => void): Promise<Engine | null> {
  let stamp: { version: string; wasmBytes: number };
  try {
    const response = await fetch(engineUrl('engine.json'), { cache: 'no-cache' });
    if (!response.ok) throw new Error(String(response.status));
    stamp = await response.json();
  } catch {
    onStatus({ state: 'missing' });
    return null;
  }
  onStatus({ state: 'loading', received: 0, total: stamp.wasmBytes, compiling: false, version: stamp.version });

  const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module', name: 'opentide-engine' });
  const channel = new MessageChannel();
  const handlers = new Set<(value: string) => void>();
  channel.port1.onmessage = (event: MessageEvent<string>) => {
    for (const handler of handlers) handler(event.data);
  };

  let nextId = 0;
  const pending = new Map<number, (tokens: HighlightToken[]) => void>();
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as { type: string; [key: string]: unknown };
    if (data.type === 'progress') {
      onStatus({
        state: 'loading',
        received: data.received as number,
        total: Math.max(data.total as number, data.received as number),
        compiling: Boolean(data.compiling),
        version: stamp.version,
      });
    } else if (data.type === 'ready') {
      onStatus({ state: 'ready', version: data.version as string, ms: data.ms as number });
    } else if (data.type === 'failed') {
      onStatus({ state: 'failed', reason: data.reason as string });
    } else if (data.type === 'highlighted') {
      pending.get(data.id as number)?.(data.tokens as HighlightToken[]);
      pending.delete(data.id as number);
    }
  };
  worker.onerror = (event) => onStatus({ state: 'failed', reason: event.message || 'the engine worker stopped' });

  worker.postMessage(
    { type: 'start', glue: engineUrl('opentide_wasm.js'), wasm: engineUrl('opentide_wasm_bg.wasm'), bytes: stamp.wasmBytes, lsp: channel.port2 },
    [channel.port2],
  );

  return {
    transport: {
      send: (message) => channel.port1.postMessage(message),
      subscribe: (handler) => handlers.add(handler),
      unsubscribe: (handler) => handlers.delete(handler),
    },
    highlight(language, text) {
      const id = ++nextId;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        worker.postMessage({ type: 'highlight', id, language, text });
      });
    },
    dispose() {
      worker.terminate();
      channel.port1.close();
      pending.clear();
    },
  };
}
