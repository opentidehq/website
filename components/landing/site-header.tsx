'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { OpentideWordmark } from '@/components/brand/opentide-mark';
import { GITHUB_ORG, siteNavLinks } from '@/lib/shared';

const QUICKSTART = '/docs/usage/quickstart/';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href.replace(/\/$/, '')}/`);
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
      />
    </svg>
  );
}

/** One button; the icon follows the theme in CSS, so it is right before hydration. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="landing-pill-icon relative"
    >
      <Sun className="size-4 transition-[opacity,rotate,scale] duration-500 dark:rotate-90 dark:scale-50 dark:opacity-0" aria-hidden />
      <Moon className="absolute size-4 -rotate-90 scale-50 opacity-0 transition-[opacity,rotate,scale] duration-500 dark:rotate-0 dark:scale-100 dark:opacity-100" aria-hidden />
    </button>
  );
}

/**
 * The site's header: a floating glass pill. It tightens and lifts once the page scrolls,
 * slips away while reading down and comes back on the way up, and never while it holds focus.
 * A highlight slides under whichever link the pointer is on.
 */
export function SiteHeader({ pathname }: { pathname: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [away, setAway] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mark, setMark] = useState({ x: 0, w: 0, on: false });
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      // A few pixels of jitter should not flick the header; a deliberate scroll should.
      if (Math.abs(y - last) > 6) {
        setAway(y > last && y > 200);
        last = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // The menu closes on Escape and on a tap anywhere outside the header.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const hidden = away && !open && !focused;
  const follow = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setMark({ x: el.offsetLeft, w: el.offsetWidth, on: true });
  };

  return (
    <header
      ref={headerRef}
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none print:hidden ${
        hidden ? '-translate-y-[130%]' : ''
      }`}
      // Keyboard focus keeps the header in view; a mouse click on the theme toggle should not pin it.
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(':focus-visible')) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="landing-pill pointer-events-auto relative w-full" data-scrolled={scrolled || open ? '' : undefined}>
        {/* Brand, links and actions in three columns, so the links sit in the middle. */}
        {/* Nested pills: 8px all round, so the wordmark, icons and button (36px) sit concentric. */}
        <div className="grid h-[52px] grid-cols-[1fr_auto_1fr] items-center gap-1 px-2">
          <Link href="/" aria-label="opentide home" className="landing-pill-focus flex items-center justify-self-start rounded-full">
            <OpentideWordmark height={36} />
          </Link>

          <nav aria-label="Site" className="relative hidden items-center md:flex" onMouseLeave={() => setMark((m) => ({ ...m, on: false }))}>
            <span
              aria-hidden
              className="landing-pill-mark absolute inset-y-0 left-0 rounded-full"
              style={{ transform: `translateX(${mark.x}px)`, width: mark.w, opacity: mark.on ? 1 : 0 }}
            />
            {siteNavLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={follow}
                  aria-current={active ? 'page' : undefined}
                  className="landing-pill-link landing-pill-focus relative rounded-full px-3.5 py-1.5 text-sm"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="col-start-3 flex items-center justify-self-end gap-1">
          <a href={GITHUB_ORG} target="_blank" rel="noopener noreferrer" aria-label="opentide on GitHub" className="landing-pill-icon hidden sm:inline-flex">
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
          <Link href={QUICKSTART} className="landing-pill-cta group ml-1 hidden sm:inline-flex">
            Get started
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
            className="landing-pill-icon md:hidden"
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
          </div>
        </div>

        <div id="site-menu" hidden={!open} className="border-t border-[var(--landing-border)] px-2 pb-2 pt-1 md:hidden">
          <ul className="m-0 list-none p-0">
            {siteNavLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                  className="landing-pill-focus flex items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-[var(--landing-ink)] transition hover:bg-[var(--landing-hover)] aria-[current=page]:text-[var(--landing-accent)]"
                >
                  {link.label}
                  <ArrowRight className="size-4 text-[var(--landing-subtle)]" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <a
                href={GITHUB_ORG}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-pill-focus flex items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-[var(--landing-ink)] transition hover:bg-[var(--landing-hover)]"
              >
                GitHub
                <GitHubIcon className="size-4 text-[var(--landing-subtle)]" />
              </a>
            </li>
          </ul>
          <Link href={QUICKSTART} onClick={() => setOpen(false)} className="landing-btn-primary mt-2 w-full justify-center rounded-2xl">
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
