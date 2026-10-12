'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { usePypiRelease } from '@/lib/hooks/use-pypi-release';

/** The release the hero is talking about: the version PyPI serves today, and what changed. */
export function HeroBadge({ initialVersion }: { initialVersion: string | null }) {
  const release = usePypiRelease(initialVersion);
  return (
    <Link
      href="/releases/"
      className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel)] py-1 pl-1 pr-3.5 text-sm text-[var(--landing-muted)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)] hover:text-[var(--landing-ink)]"
    >
      <span className="rounded-full bg-[var(--landing-accent)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--brand-accent-foreground)]">
        {release.version ? `v${release.version}` : 'latest'}
      </span>
      <span>
        CLI, SDK and MCP server<span className="hidden sm:inline"> in one package</span>
      </span>
      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
