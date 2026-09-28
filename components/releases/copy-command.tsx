'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
      <code className="flex min-w-0 flex-1 items-center overflow-x-auto rounded-lg border border-[var(--landing-border)] px-4 py-3 font-mono text-sm text-[var(--landing-ink)]">
        {command}
      </code>
      <button
        type="button"
        onClick={() => {
          void onCopy();
        }}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--landing-accent)_50%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--landing-accent)] transition hover:bg-[var(--landing-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
