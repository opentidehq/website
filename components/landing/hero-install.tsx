import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const INSTALL_CMD = 'pip install opentide';

export function HeroInstall() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <code className="flex min-w-0 flex-1 items-center rounded-lg border border-white/12 bg-black/50 px-4 py-3 font-mono text-sm text-[var(--landing-ink)] backdrop-blur-sm">
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
  );
}
