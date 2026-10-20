/**
 * Docs pages turn ```mermaid fences into <Mermaid chart="..." />, and that
 * component calls mermaid.render on the reader's page. These cases are the
 * published advisories against mermaid 11.15.0 (GHSA-3rrr-jr9j-h3q3 and
 * GHSA-2v8p-3f2j-5mp7). securityLevel "strict" does not stop either one.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';

const DOM_GLOBALS = [
  'document',
  'DOMParser',
  'XMLSerializer',
  'Element',
  'SVGElement',
  'HTMLElement',
  'Node',
  'navigator',
  'MutationObserver',
  'getComputedStyle',
  'CSSStyleSheet',
];

function installDom() {
  const window = new Window({ url: 'https://opentide.org/docs/usage/' });
  for (const name of DOM_GLOBALS) {
    const value = window[name];
    if (value === undefined) continue;
    try {
      Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    } catch {
      // Some hosts already expose a read-only navigator.
    }
  }
  globalThis.window = window;
}

installDom();

const { default: mermaid } = await import('mermaid');

function initialize() {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  });
}

test('untrusted diagrams cannot pollute the page or block it', async () => {
  initialize();
  const probe = 'opentideMermaidProbe';
  delete Object.prototype[probe];
  const chart = `architecture-beta
      group ${probe}(cloud)[Marker]
      service a(server)[A] in __proto__
      service b(server)[B] in ${probe}
      a:R -- L:b
`;
  try {
    await mermaid.render('opentide-mermaid-arch', chart);
  } catch {
    // Rejecting the diagram is safe. Writing the group id onto the prototype is not.
  }
  assert.equal(Object.prototype[probe], undefined);
  assert.notEqual(typeof Object.prototype.then, 'string');

  const started = Date.now();
  try {
    await mermaid.render('opentide-mermaid-xy', 'xychart\n  x-axis 1 --> 1\n  line [1, 2]\n');
  } catch {
    // A fast parse error is acceptable. The vulnerable release loops until it
    // throws RangeError several seconds later and can exhaust the tab.
  }
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 1000, `xychart render blocked for ${elapsed}ms`);
});
