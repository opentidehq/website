#!/usr/bin/env node
/**
 * Fetch the opentide engine built for the browser (`opentide-wasm`, wasm-bindgen `--target web`)
 * from its opentide release (the same pin as the VS Code extension's `pins.json`) into `public/playground/engine/`, where the playground's
 * worker loads it. The module is EUPL-1.2 and its NOTICE asks whoever serves it to ship its
 * LICENSE, NOTICE and third-party licences with it, so the whole release zip is unpacked.
 *
 * The version and the zip's SHA-256 are pinned here; bump both together. Nothing is fetched when
 * the pinned version is already unpacked. Outside CI a failed download only warns: the playground
 * then says the engine could not be loaded. In CI it fails the build.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

export const ENGINE_VERSION = '1.0.0-rc.4';
const ENGINE_SHA256 = '48e9155f021e50d206e1a549895f46d59f5e878b2479b72ee3e8ed63d2c067ae';
const ENGINE_URL = `https://github.com/opentidehq/opentide/releases/download/v${ENGINE_VERSION}/opentide-wasm-web-v${ENGINE_VERSION}.zip`;
/** The licences of every crate the module links, an asset of the same release. */
const LICENSES_URL = `https://github.com/opentidehq/opentide/releases/download/v${ENGINE_VERSION}/THIRD-PARTY-LICENSES.html`;
const LICENSES_SHA256 = '16f4b87fc153f4366407cfb3e4fa55b69e3a2b78236f281e696a37673a8ac3bd';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'playground', 'engine');
const STAMP = join(OUT, 'engine.json');
const FETCH_TIMEOUT_MS = 120_000;

/** The entries of a zip archive: stored and deflated files, read through the central directory. */
export function unzip(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('not a zip archive: no end of central directory');
  const count = buffer.readUInt16LE(eocd + 10);
  let at = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(at) !== 0x02014b50) throw new Error('corrupt zip central directory');
    const method = buffer.readUInt16LE(at + 10);
    const compressed = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const local = buffer.readUInt32LE(at + 42);
    const name = buffer.toString('utf8', at + 46, at + 46 + nameLength);
    at += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith('/')) continue;
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(dataStart, dataStart + compressed);
    if (method === 0) entries.push({ name, data: Buffer.from(raw) });
    else if (method === 8) entries.push({ name, data: inflateRawSync(raw) });
    else throw new Error(`unsupported zip compression method ${method} for ${name}`);
  }
  return entries;
}

function installed() {
  try {
    const stamp = JSON.parse(readFileSync(STAMP, 'utf8'));
    return stamp.version === ENGINE_VERSION && typeof stamp.wasmBytes === 'number' && existsSync(join(OUT, 'opentide_wasm_bg.wasm'));
  } catch {
    return false;
  }
}

async function main() {
  if (installed()) {
    console.log(`opentide engine ${ENGINE_VERSION} (WASM) already in public/playground/engine`);
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(ENGINE_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'opentide.org (https://github.com/opentidehq/website)' },
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status} for ${ENGINE_URL}`);
    const zip = Buffer.from(await response.arrayBuffer());
    const digest = createHash('sha256').update(zip).digest('hex');
    if (digest !== ENGINE_SHA256) throw new Error(`engine zip SHA-256 ${digest} does not match the pinned ${ENGINE_SHA256}`);
    // Both downloads are checked before the current install is touched.
    const licences = await fetch(LICENSES_URL, { signal: controller.signal });
    if (!licences.ok) throw new Error(`GitHub responded ${licences.status} for ${LICENSES_URL}`);
    const licencesBytes = Buffer.from(await licences.arrayBuffer());
    const licencesDigest = createHash('sha256').update(licencesBytes).digest('hex');
    if (licencesDigest !== LICENSES_SHA256) throw new Error(`THIRD-PARTY-LICENSES.html SHA-256 ${licencesDigest} does not match the pinned ${LICENSES_SHA256}`);

    rmSync(OUT, { recursive: true, force: true });
    for (const { name, data } of unzip(zip)) {
      const target = normalize(join(OUT, name));
      if (!target.startsWith(OUT + sep)) throw new Error(`zip entry escapes the output directory: ${name}`);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, data);
    }
    writeFileSync(join(OUT, 'THIRD-PARTY-LICENSES.html'), licencesBytes);
    // The playground reads this before it loads the engine: the version, and the module's size for
    // its download progress (a gzipped response's Content-Length is not the size it streams).
    const wasmBytes = readFileSync(join(OUT, 'opentide_wasm_bg.wasm')).length;
    writeFileSync(STAMP, `${JSON.stringify({ version: ENGINE_VERSION, wasmBytes, source: ENGINE_URL }, null, 2)}\n`);
    console.log(`opentide engine ${ENGINE_VERSION} (WASM) → public/playground/engine`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.CI) {
      console.error(`Could not fetch the opentide engine: ${message}`);
      process.exitCode = 1;
    } else {
      console.warn(`Could not fetch the opentide engine (${message}); the playground will run without it.`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  await main();
}
