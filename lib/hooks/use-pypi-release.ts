'use client';

import { useEffect, useState } from 'react';
import {
  parsePypiProjectPayload,
  PYPI_JSON_URL,
  PYPI_PROJECT_URL,
  pypiReleaseUrl,
} from '@/lib/pypi';

export type PypiReleaseState = {
  status: 'loading' | 'ready' | 'error';
  version: string | null;
  packageUrl: string;
  releaseUrl: string;
};

const FETCH_TIMEOUT_MS = 8_000;

let cachedVersion: string | null = null;
let inflight: Promise<string> | null = null;

function loadLatestVersion(): Promise<string> {
  if (cachedVersion) {
    return Promise.resolve(cachedVersion);
  }
  if (!inflight) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    inflight = requestLatestVersion(controller.signal)
      .then((version) => {
        cachedVersion = version;
        return version;
      })
      .catch((error: unknown) => {
        inflight = null;
        throw error;
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
  }
  return inflight;
}

async function requestLatestVersion(signal: AbortSignal): Promise<string> {
  const response = await fetch(PYPI_JSON_URL, {
    signal,
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

export function usePypiRelease(): PypiReleaseState {
  const [version, setVersion] = useState<string | null>(cachedVersion);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    cachedVersion ? 'ready' : 'loading',
  );

  useEffect(() => {
    if (cachedVersion) {
      return;
    }

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
        if (error instanceof DOMException && error.name === 'AbortError') {
          setStatus('error');
          return;
        }
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    version,
    packageUrl: PYPI_PROJECT_URL,
    releaseUrl: version ? pypiReleaseUrl(version) : PYPI_PROJECT_URL,
  };
}
