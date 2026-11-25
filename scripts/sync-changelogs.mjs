#!/usr/bin/env node
/**
 * Copy each project's CHANGELOG.md from its default branch into content/releases/, which the
 * Releases page renders. The copies are committed, like content/docs, so deploy builds
 * (SKIP_SYNC=1) need no network; `sync-docs.yml` refreshes and commits them every hour.
 *
 * A failed fetch, or a file the Releases page's own parser rejects, keeps the committed
 * copy: an upstream changelog can never break the hourly sync or the deploy. A local
 * checkout can stand in for GitHub: LANGUAGE_SERVER_CHANGELOG=../opentide/crates/CHANGELOG.md.
 *
 * The language server ships inside opentide since 1.0.0 (one version, one tag): its notes are
 * opentide's crates/CHANGELOG.md on development, not the archived opentidehq/language-server.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseProject } from '../lib/release-projects.ts';
import { parseChangelog } from '../lib/releases.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'content', 'releases');
const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 512 * 1024;
const SOURCES = [
  {
    id: 'language-server',
    file: 'language-server.md',
    repo: 'opentidehq/opentide',
    ref: 'development',
    path: 'crates/CHANGELOG.md',
    env: 'LANGUAGE_SERVER_CHANGELOG',
  },
  {
    id: 'vscode-extension',
    file: 'vscode-extension.md',
    repo: 'opentidehq/vscode-extension',
    env: 'VSCODE_EXTENSION_CHANGELOG',
  },
  { id: 'explorer', file: 'explorer.md', repo: 'opentidehq/explorer', env: 'EXPLORER_CHANGELOG' },
];

/** @param {{ repo: string, ref?: string, path?: string }} source */
async function fetchChangelog({ repo, ref = 'main', path = 'CHANGELOG.md' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'opentide.org (https://github.com/opentidehq/website)' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  if (process.env.SKIP_SYNC === '1') {
    console.log('sync-changelogs: skipped (SKIP_SYNC=1)');
    return;
  }
  for (const source of SOURCES) {
    const local = process.env[source.env];
    try {
      const text = local ? readFileSync(local, 'utf8') : await fetchChangelog(source);
      if (text.length > MAX_BYTES) throw new Error(`larger than ${MAX_BYTES} bytes`);
      // Throws on anything the page could not render, with the reason.
      parseChangelog(text, releaseProject(/** @type {any} */ (source.id)));
      writeFileSync(join(OUT_DIR, source.file), text.endsWith('\n') ? text : `${text}\n`);
      console.log(`sync-changelogs: ${source.file} from ${local ?? source.repo}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`sync-changelogs: kept the committed ${source.file} (${reason})`);
    }
  }
}

await main();
