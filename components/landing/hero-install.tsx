import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const INSTALL_CMD = 'pip install "opentide[sentinel,cli,mcp]>=0.1"';

export function HeroInstall() {
  return (
    <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
          Install from PyPI
        </p>
        <code className="mt-1 block truncate rounded-lg border border-[var(--eu-yellow)]/25 bg-[var(--eu-yellow)]/5 px-3 py-2 font-mono text-xs text-[var(--landing-ink)] sm:text-sm">
          {INSTALL_CMD}
        </code>
      </div>
      <Link
        href="/docs/usage/installation/"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--eu-yellow)] px-4 py-2 text-xs font-bold text-[var(--landing-bg)] transition hover:bg-[#ffe566] sm:text-sm"
      >
        Installation docs
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
