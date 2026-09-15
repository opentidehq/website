'use client';

import { useEffect, useState } from 'react';
import {
  parsePypiProjectPayload,
  PYPI_JSON_URL,
  PYPI_PROJECT_URL,
} from '@/lib/pypi';

export type PypiReleaseState = {
  status: 'loading' | 'ready' | 'error';
  version: string | null;
  packageUrl: string;
  releaseUrl: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 60_000;

let cachedVersion: string | null = null;
let cachedAt = 0;
let inflight: Promise<string> | null = null;

function loadLatestVersion(): Promise<string> {
  if (cachedVersion && Date.now() - cachedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedVersion);
  }
  if (!inflight) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    inflight = requestLatestVersion(controller.signal)
      .then((version) => {
        cachedVersion = version;
        cachedAt = Date.now();
        return version;
      })
      .catch((error: unknown) => {
        throw error;
      })
      .finally(() => {
        inflight = null;
        window.clearTimeout(timeout);
      });
  }
  return inflight;
}

async function requestLatestVersion(signal: AbortSignal): Promise<string> {
  const response = await fetch(PYPI_JSON_URL, {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`PyPI responded ${response.status}`);
  }
  const payload: unknown = await response.json();
  const version = parsePypiProjectPayload(payload);
  if (!version) {
    throw new Error('PyPI payload did not include a usable version');
  }
  return version;
}

export function usePypiRelease(initialVersion?: string | null): PypiReleaseState {
  const [version, setVersion] = useState<string | null>(
    () => cachedVersion ?? initialVersion ?? null,
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(() =>
    cachedVersion || initialVersion ? 'ready' : 'loading',
  );

  useEffect(() => {
    let cancelled = false;
    void loadLatestVersion()
      .then((next) => {
        if (cancelled) {
          return;
        }
        setVersion(next);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (cachedVersion || initialVersion) {
          setStatus('ready');
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStatus('error');
          return;
        }
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [initialVersion]);

  return {
    status,
    version,
    packageUrl: PYPI_PROJECT_URL,
    // Always the project page — that URL is the latest release. A versioned
    // permalink would go stale between website deploys.
    releaseUrl: PYPI_PROJECT_URL,
  };
}
