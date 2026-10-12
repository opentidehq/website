'use client';

import Link from 'next/link';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { INSTALL_CMD } from '@/lib/pypi';

/** The install command with a copy button, and the way in. */
export function HeroInstall() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-10 flex w-full flex-col items-center">
      <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-panel)] py-1 pl-4 pr-1 font-mono text-sm">
          <span aria-hidden className="select-none text-[var(--landing-dim)]">
            $
          </span>
          <code className="min-w-0 flex-1 truncate text-left text-[var(--landing-ink)]">{INSTALL_CMD}</code>
          <button
            type="button"
            onClick={() => {
              void copy();
            }}
            aria-label={copied ? 'Copied' : `Copy ${INSTALL_CMD}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </button>
        </div>
        <Link href="/docs/usage/installation/" className="landing-btn-primary group justify-center">
          Get started
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
