/**
 * Assert the static export compiled synced docs as MDX (JSX components, not escaped tags).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ESCAPED_MDX_TAGS = [
  '&lt;Tabs',
  '&lt;Tab',
  '&lt;Callout',
  '&lt;Cards',
  '&lt;Card',
  '&lt;Steps',
  '&lt;Step',
];

export function readHtml(outDir, relPath) {
  const p = join(outDir, relPath);
  if (!existsSync(p)) {
    throw new Error(`Missing built page ${relPath}`);
  }
  return readFileSync(p, 'utf8');
}

export function assertNoEscapedMdx(html, label) {
  const hits = ESCAPED_MDX_TAGS.filter((needle) => html.includes(needle));
  if (hits.length) {
    throw new Error(`${label} contains escaped MDX tags (${hits.join(', ')}). Synced docs must be .mdx.`);
  }
}

export function assertTabsRendered(html, label, labels) {
  for (const tab of labels) {
    if (!html.includes(tab)) {
      throw new Error(`${label} is missing tab label ${JSON.stringify(tab)}`);
    }
  }
  const hasTablist =
    html.includes('role="tablist"') ||
    html.includes("role='tablist'") ||
    html.includes('role="tab"') ||
    html.includes("role='tab'") ||
    html.includes('data-orientation') ||
    /class="[^"]*tablist/i.test(html);
  if (!hasTablist) {
    throw new Error(`${label} has tab labels but no tablist markup — Tabs did not render as a component`);
  }
}

export function verifyBuiltDocs(outDir) {
  const installation = readHtml(outDir, 'docs/usage/installation/index.html');
  assertNoEscapedMdx(installation, '/docs/usage/installation');
  if (!installation.includes('One install gets the CLI')) {
    throw new Error('/docs/usage/installation dropped the Callout body');
  }
  if (!installation.includes('--callout-color') && !installation.toLowerCase().includes('callout')) {
    throw new Error('/docs/usage/installation did not render a Callout component');
  }
  assertTabsRendered(installation, '/docs/usage/installation', ['venv + pip', 'uv']);

  const usageIndex = readHtml(outDir, 'docs/usage/index.html');
  assertNoEscapedMdx(usageIndex, '/docs/usage');
  if (!usageIndex.includes('How opentide works')) {
    throw new Error('/docs/usage dropped the Cards content');
  }
  if (!usageIndex.includes('data-card="true"')) {
    throw new Error('/docs/usage did not render Card components');
  }

  const quickstart = readHtml(outDir, 'docs/usage/quickstart/index.html');
  assertNoEscapedMdx(quickstart, '/docs/usage/quickstart');
  if (!quickstart.includes('Install and point at your repo')) {
    throw new Error('/docs/usage/quickstart dropped the Steps content');
  }
  if (!quickstart.includes('fd-steps')) {
    throw new Error('/docs/usage/quickstart did not render the Steps component');
  }

  return {
    installation,
    usageIndex,
    quickstart,
  };
}
