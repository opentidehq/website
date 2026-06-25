import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const INSTALL_CMD = 'pip install opentide';

export function HeroInstall() {
  return (
    <div className="mt-4 space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-subtle)]">
        Install from PyPI
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-[var(--eu-yellow)]/25 bg-[var(--eu-yellow)]/5 px-3 py-2 font-mono text-xs text-[var(--landing-ink)] sm:text-sm">
          {INSTALL_CMD}
        </code>
        <Link
          href="/docs/usage/installation/"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[var(--landing-muted)] transition hover:border-[var(--eu-yellow)]/30 hover:text-[var(--landing-ink)]"
        >
          Installation docs
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
