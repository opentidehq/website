#!/usr/bin/env node
/**
 * Snapshot the current opentide version from PyPI at build/dev time.
 * Never commit a real version — this file is regenerated locally and in CI.
 * The landing page also re-fetches in the browser so a new release does not
 * require a website rebuild.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'lib', 'generated', 'pypi-release.json');
const PYPI_JSON_URL = 'https://pypi.org/pypi/opentide/json';
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,31}$/;
const FETCH_TIMEOUT_MS = 8_000;

function writeSnapshot(version) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({ version }, null, 2)}\n`);
}

function parseVersion(payload) {
  if (typeof payload !== 'object' || payload === null || !('info' in payload)) {
    return null;
  }
  const info = payload.info;
  if (typeof info !== 'object' || info === null || !('version' in info)) {
    return null;
  }
  const version = info.version;
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    return null;
  }
  return version;
}

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(PYPI_JSON_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'opentide.org (https://github.com/OpenTideHQ/website)',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`PyPI responded ${response.status}`);
    }
    const version = parseVersion(await response.json());
    if (!version) {
      throw new Error('PyPI payload did not include a usable version');
    }
    writeSnapshot(version);
    console.log(`opentide ${version} (PyPI)`);
  } catch (error) {
    writeSnapshot(null);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Could not snapshot PyPI version (${message}); landing will omit it until the client fetch.`);
  } finally {
    clearTimeout(timeout);
  }
}

await main();
