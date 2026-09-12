'use client';

import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePypiRelease } from '@/lib/hooks/use-pypi-release';

export function PypiReleaseLink() {
  const release = usePypiRelease();
  const hasVersion = release.status === 'ready' && release.version !== null;
  const label = hasVersion ? `${release.version} on PyPI` : 'opentide on PyPI';
  const ariaLabel = hasVersion
    ? `opentide ${release.version} on PyPI`
    : 'opentide package on PyPI';

  return (
    <p className="mt-2.5 min-h-[1.25rem] font-mono text-xs text-[var(--landing-muted)]">
      <a
        href={release.releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-sm transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
        aria-label={ariaLabel}
      >
        <span>{label}</span>
        <ArrowUpRight className="size-3" aria-hidden />
      </a>
    </p>
  );
}

export function PypiProjectLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const release = usePypiRelease();
  const title =
    release.status === 'ready' && release.version
      ? `${release.version} on PyPI`
      : undefined;

  return (
    <a
      href={release.releaseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
    </a>
  );
}
