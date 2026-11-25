import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { focusRing } from '@/components/releases/rich-text';
import { siteOgImage } from '@/lib/shared';

/**
 * /releases/language-server/ had its own release log until the language server shipped inside
 * opentide (1.0.0). The static export cannot answer with a 301, and a refresh would move readers
 * on before they learn why, so the old address says where the notes are now. Search engines are
 * pointed at /releases/.
 */
const PRE_1_0_HISTORY = 'https://github.com/opentidehq/opentide/blob/development/crates/CHANGELOG.md';
const CRATE = 'https://crates.io/crates/opentide-lsp';

const title = 'Language server releases';
const description =
  'The opentide language server ships with opentide from 1.0.0, at the same version: its releases are opentide’s.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/releases/' },
  robots: { index: false, follow: true },
  openGraph: { title, description, images: siteOgImage },
  twitter: { images: siteOgImage },
};

const link = `font-medium text-[var(--landing-accent)] ${focusRing}`;

export default function LanguageServerReleasesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-14 pb-24 md:px-6 md:pt-20">
      <div className="max-w-2xl">
        <p className="font-mono text-xs text-[var(--landing-subtle)]">releases / language server</p>
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.035em] text-balance">
          The language server ships with opentide
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-pretty text-[var(--landing-muted)]">
          From 1.0.0 the language server is part of opentide, at opentide’s version: run{' '}
          <code className="font-mono text-[0.9em] text-[var(--landing-ink)]">opentide lsp start</code>, depend on the{' '}
          <a href={CRATE} target="_blank" rel="noopener noreferrer" className={link}>
            <code className="font-mono text-[0.9em]">opentide-lsp</code> crate
          </a>
          , or take the <code className="font-mono text-[0.9em] text-[var(--landing-ink)]">opentide-lsp</code> binary
          from opentide’s GitHub Release. One release, one tag, one set of notes.
        </p>
        <ul className="mt-8 space-y-3 text-base">
          <li>
            <Link href="/releases/" className={link}>
              opentide releases
            </Link>
            <span className="text-[var(--landing-muted)]">: what changed in each version, the language server included.</span>
          </li>
          <li>
            <a href={PRE_1_0_HISTORY} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${link}`}>
              Pre-1.0 history
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            <span className="text-[var(--landing-muted)]">
              : the language server’s versions up to 0.16.1, in opentide’s{' '}
              <code className="font-mono text-[0.9em]">crates/CHANGELOG.md</code>.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
