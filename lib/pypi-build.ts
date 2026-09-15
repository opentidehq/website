import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isSafePypiVersion } from '@/lib/pypi';

const SNAPSHOT_PATH = join(process.cwd(), 'lib/generated/pypi-release.json');

/**
 * Version written by `scripts/fetch-pypi-version.mjs` during `pnpm dev` / `pnpm build`.
 * Server-only — do not import from client components.
 */
export async function readBuildTimePypiVersion(): Promise<string | null> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    const payload: unknown = JSON.parse(raw);
    if (typeof payload !== 'object' || payload === null || !('version' in payload)) {
      return null;
    }
    const version: unknown = payload.version;
    if (typeof version !== 'string' || !isSafePypiVersion(version)) {
      return null;
    }
    return version;
  } catch {
    return null;
  }
}
