'use client';

import Link from 'next/link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { OpentideWordmark } from '@/components/brand/opentide-mark';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { GITHUB_ORG, ecosystemLinks } from '@/lib/shared';

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'product',
    links: [
      { label: 'Quickstart', href: '/docs/usage/quickstart/' },
      { label: 'Documentation', href: '/docs/usage/' },
      { label: 'CLI', href: '/docs/cli/' },
      { label: 'Python SDK', href: '/docs/sdk/' },
      { label: 'MCP server', href: '/docs/mcp/' },
      { label: 'Releases', href: '/releases/' },
    ],
  },
  {
    title: 'specification',
    links: [
      { label: 'Specifications', href: '/docs/specifications/' },
      { label: 'Vocabularies', href: '/docs/specifications/specs/vocabularies/catalog/' },
      { label: 'Integrations', href: '/docs/usage/concepts/platforms/' },
      { label: 'Detection-as-code', href: '/docs/usage/workflows/detection-as-code/' },
      { label: 'Blog', href: '/blog/' },
    ],
  },
  {
    title: 'ecosystem',
    links: [
      ...ecosystemLinks
        .filter((repo) => repo.status === 'live' && repo.href)
        .map((repo) => ({ label: repo.name, href: repo.href as string, external: true })),
      { label: 'PyPI', href: 'https://pypi.org/project/opentide/', external: true },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const className =
    'group inline-flex items-center gap-1 text-sm text-[var(--landing-muted)] transition hover:text-[var(--landing-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]';
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

/** The site's footer: what opentide is, the latest release, and where everything lives. */
export function SiteFooter({ version }: { version?: string | null }) {
  const reduced = usePrefersReducedMotion();
  return (
    <footer className="landing-footer relative isolate overflow-hidden border-t border-[var(--landing-border)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="max-w-md">
            <OpentideWordmark height={34} />
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--landing-muted)] text-pretty">
              Spec-driven development for agentic detection engineering: an ontology, a taxonomy and the tools that hold
              every detection to them. Open source, and forever free.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {version && (
                <Link href="/releases/" className="landing-footer-chip group">
                  <span className="relative flex size-2">
                    <span className="landing-ping absolute inline-flex size-full rounded-full bg-[var(--landing-accent)] opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[var(--landing-accent)]" />
                  </span>
                  v{version} is out
                </Link>
              )}
              <span className="landing-footer-chip">opentide · EUPL-1.2</span>
              <span className="landing-footer-chip">spec · CC-BY-4.0</span>
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-xs text-[var(--landing-subtle)]">{column.title}</p>
                <ul className="m-0 mt-4 list-none space-y-2.5 p-0">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <FooterAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-[var(--landing-border)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-[var(--landing-subtle)] md:px-6">
          {/* The year is the build's; a reader past New Year should not trip hydration. */}
          <p className="m-0" suppressHydrationWarning>
            © {new Date().getFullYear()} opentide · opentide under EUPL-1.2, the specification under CC-BY-4.0
          </p>
          <div className="flex items-center gap-1">
            <a
              href={GITHUB_ORG}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)] focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)] focus-visible:outline-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Back to top
              <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
