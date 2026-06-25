'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { baseOptions } from '@/lib/layout.shared';
import { gitConfig } from '@/lib/shared';
import type { ReactNode } from 'react';

function BrandMark() {
  return baseOptions().nav?.title as ReactNode;
}

function navClass(active: boolean) {
  return active
    ? 'rounded-md bg-[var(--landing-surface-raised)] px-3 py-2 font-medium text-[var(--landing-ink)]'
    : 'rounded-md px-3 py-2 text-[var(--landing-muted)] transition hover:bg-white/5 hover:text-[var(--landing-ink)]';
}

export function LandingNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const opts = baseOptions();

  return (
    <div className="landing flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--landing-bg)]/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]">
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Site">
            {opts.links?.map((link) => {
              if ('type' in link && link.type === 'icon') {
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-2 text-[var(--landing-subtle)] transition hover:bg-white/5 hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </a>
                );
              }
              if ('text' in link && link.url) {
                const href = link.url;
                const active =
                  href === '/'
                    ? pathname === '/'
                    : pathname === href || pathname.startsWith(`${href.replace(/\/$/, '')}/`);
                return (
                  <Link key={String(link.text)} href={href} className={`${navClass(active)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]`}>
                    {link.text}
                  </Link>
                );
              }
              return null;
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 bg-[var(--landing-surface-deep)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-[var(--landing-subtle)] md:flex-row">
          <p>© {new Date().getFullYear()} OpenTide · EUPL-1.2 · Specs CC-BY-4.0</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/docs/usage/" className="transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]">
              Docs
            </Link>
            <Link href="/blog/" className="transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]">
              Blog
            </Link>
            <a
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              className="transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://pypi.org/project/opentide/"
              className="transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              PyPI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
