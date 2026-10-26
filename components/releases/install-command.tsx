'use client';

import { Check, Copy } from 'lucide-react';
import { useCopy } from '@/lib/hooks/use-copy';

/** A command in a deep-tide code panel, with a copy button. Long commands wrap. */
export function InstallCommand({ command, caption = 'install' }: { command: string; caption?: string }) {
  const { copied, copy } = useCopy(command);

  return (
    <figure className="m-0 overflow-hidden rounded-xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] ring-1 ring-[var(--landing-border)]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 pr-1.5 pl-4 font-mono text-[11px] text-[var(--landing-code-dim)]">
        <span>{caption}</span>
        <button
          type="button"
          onClick={() => {
            void copy();
          }}
          aria-label={copied ? 'Copied' : `Copy ${caption} command`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--landing-code-dim)] transition hover:bg-white/10 hover:text-[var(--landing-code-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--landing-code-key)]"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? 'copied' : 'copy'}</span>
        </button>
      </figcaption>
      <pre className="m-0 px-4 py-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">
        <code>
          <span className="text-[var(--landing-code-dim)] select-none">$ </span>
          {command}
        </code>
      </pre>
    </figure>
  );
}
