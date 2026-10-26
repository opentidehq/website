#!/usr/bin/env node
/**
 * Copy each project's CHANGELOG.md from its default branch into content/releases/, which the
 * Releases page renders. The copies are committed, like content/docs, so deploy builds
 * (SKIP_SYNC=1) need no network; `sync-docs.yml` refreshes and commits them every hour.
 *
 * A failed fetch, or a file that is not a changelog, keeps the committed copy. A local
 * checkout can stand in for GitHub: LANGUAGE_SERVER_CHANGELOG=../language-server/CHANGELOG.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'content', 'releases');
const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 512 * 1024;
const VERSION_HEADING = /^## \[\d+\.\d+\.\d+\] [—–-] \d{4}-\d{2}-\d{2}$/m;

const SOURCES = [
  { file: 'language-server.md', repo: 'opentidehq/language-server', env: 'LANGUAGE_SERVER_CHANGELOG' },
  { file: 'explorer.md', repo: 'opentidehq/explorer', env: 'EXPLORER_CHANGELOG' },
];

/** @param {string} repo */
async function fetchChangelog(repo) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/main/CHANGELOG.md`, {
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
      const text = local ? readFileSync(local, 'utf8') : await fetchChangelog(source.repo);
      if (text.length > MAX_BYTES) throw new Error(`larger than ${MAX_BYTES} bytes`);
      if (!VERSION_HEADING.test(text)) throw new Error('no "## [x.y.z] - YYYY-MM-DD" version');
      writeFileSync(join(OUT_DIR, source.file), text.endsWith('\n') ? text : `${text}\n`);
      console.log(`sync-changelogs: ${source.file} from ${local ?? source.repo}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`sync-changelogs: kept the committed ${source.file} (${reason})`);
    }
  }
}

await main();
