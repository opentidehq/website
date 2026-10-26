import Link from 'next/link';
import type { ReactNode } from 'react';
import { safeHref } from '@/lib/safe-href';

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]';

const linkClass = `text-[var(--landing-accent)] underline decoration-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] underline-offset-2 ${focusRing}`;

/**
 * The inline markdown release notes use: `code`, **bold**, and [links]. Links go through
 * `safeHref`, so a scriptable or protocol-relative target renders as plain text.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="rounded bg-[var(--landing-hover)] px-1 py-px font-mono text-[0.85em] text-[var(--landing-ink)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={key} className="font-semibold text-[var(--landing-ink)]">
          {renderInline(part.slice(2, -2), key)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link?.[1] && link[2]) {
      const href = safeHref(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      if (/^https?:/i.test(href)) {
        return (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {link[1]}
          </a>
        );
      }
      return (
        <Link key={key} href={href} className={linkClass}>
          {link[1]}
        </Link>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export function RichText({ text }: { text: string }) {
  return <>{renderInline(text, 't')}</>;
}
