import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { INSTALL_CMD } from '@/lib/pypi';
import { PypiReleaseLink } from '@/components/landing/pypi-release-link';

export function HeroInstall() {
  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <code className="flex min-w-0 flex-1 items-center rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)]/80 px-4 py-3 font-mono text-sm text-[var(--landing-ink)] backdrop-blur-sm">
          {INSTALL_CMD}
        </code>
        <Link
          href="/docs/usage/installation/"
          className="landing-btn-primary group inline-flex shrink-0 justify-center text-sm"
        >
          Get started
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <PypiReleaseLink />
    </div>
  );
}
