'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { OpentideLicensePill, OpentideWordmark } from '@/components/brand/opentide-mark';
import { baseOptions } from '@/lib/layout.shared';
import { ecosystemLinks, gitConfig } from '@/lib/shared';
import type { ReactNode } from 'react';

function BrandMark() {
  return <OpentideWordmark height={32} />;
}

function navClass(active: boolean) {
  return active
    ? 'px-3 py-2 font-medium text-[var(--landing-ink)]'
    : 'px-3 py-2 text-[var(--landing-muted)] transition hover:text-[var(--landing-ink)]';
}

export function LandingNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const opts = baseOptions();

  return (
    <div className="landing flex min-h-screen flex-col">
      {/* --landing-bg is pure white/black, so the 5% that shows through needs a
          heavy blur or high-contrast headings ghost through as readable text. */}
      <header className="sticky top-0 z-40 border-b border-[var(--landing-border)] bg-[var(--landing-bg)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <Link
            href="/"
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
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
                    className="rounded-md p-2 text-[var(--landing-subtle)] transition hover:bg-[var(--landing-hover)] hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
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
                  <Link
                    key={String(link.text)}
                    href={href}
                    className={`${navClass(active)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]`}
                  >
                    {link.text}
                  </Link>
                );
              }
              return null;
            })}
            <ThemeSwitch className="ml-1 border-[var(--landing-border)] text-[var(--landing-subtle)]" />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-bg)]">
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <OpentideWordmark height={36} />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--landing-muted)]">
                The DetectionOps engine. Structure detection engineering from intel to deploy.
                Forever free.
              </p>
              <div className="mt-4">
                <OpentideLicensePill />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--landing-muted)]">
                Product
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--landing-subtle)]">
                <li>
                  <Link href="/docs/usage/" className="transition hover:text-[var(--landing-accent)]">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs/mcp/" className="transition hover:text-[var(--landing-accent)]">
                    MCP reference
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/usage/concepts/platforms/"
                    className="transition hover:text-[var(--landing-accent)]"
                  >
                    Platform matrix
                  </Link>
                </li>
                <li>
                  <Link href="/blog/" className="transition hover:text-[var(--landing-accent)]">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--landing-muted)]">
                Ecosystem
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--landing-subtle)]">
                {ecosystemLinks.map((repo) => (
                  <li key={repo.name}>
                    <a
                      href={repo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-[var(--landing-accent)]"
                    >
                      {repo.name}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[var(--landing-accent)]"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://pypi.org/project/opentide/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[var(--landing-accent)]"
                  >
                    PyPI
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[var(--landing-border-subtle)] pt-6 text-xs text-[var(--landing-dim)]">
            <p>
              © {new Date().getFullYear()} opentide ·{' '}
              <span className="text-[var(--landing-accent)]">EUPL-1.2</span> · forever free
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
