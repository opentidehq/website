'use client';

import { Check, Copy } from 'lucide-react';
import { useCopy } from '@/lib/hooks/use-copy';

export function CopyCommand({ command }: { command: string }) {
  const { copied, copy } = useCopy(command);

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
      <code className="flex min-w-0 flex-1 items-center overflow-x-auto rounded-lg border border-[var(--landing-border)] px-4 py-3 font-mono text-sm text-[var(--landing-ink)]">
        {command}
      </code>
      <button
        type="button"
        onClick={() => {
          void copy();
        }}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--landing-accent)_50%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--landing-accent)] transition hover:bg-[var(--landing-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
