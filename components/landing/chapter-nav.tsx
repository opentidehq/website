'use client';

import { ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAPTERS, type ChapterId } from '@/components/landing/chapters';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

/** A chapter counts as current once its top passes this share of the viewport. */
const READ_LINE = 0.4;

/**
 * Jump to a chapter. The anchors work without JavaScript; with it, the scroll is smooth
 * (unless reduced motion) and the hash updates without a jump.
 */
export function useChapterJump() {
  const reduced = usePrefersReducedMotion();
  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    },
    [reduced],
  );
}

/**
 * Floating chapter dock. Hidden while the hero is on screen; otherwise it tracks the current
 * chapter and how far down the page the reader is. Below `xl` it collapses to one pill with a
 * menu.
 */
export function ChapterNav() {
  const jump = useChapterJump();
  const [active, setActive] = useState<ChapterId | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const line = vh * READ_LINE;

      let current: ChapterId | null = null;
      for (const chapter of CHAPTERS) {
        const el = document.getElementById(chapter.id);
        if (el && el.getBoundingClientRect().top <= line) current = chapter.id;
      }
      setActive(current);

      const hero = document.getElementById('top');
      setVisible(hero ? hero.getBoundingClientRect().bottom < vh * 0.25 : window.scrollY > vh);

      const max = document.documentElement.scrollHeight - vh;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Close the narrow-screen menu on Escape or a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const current = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0];
  const go = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setOpen(false);
    jump(event, id);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Page chapters"
      className={`landing-dock fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:bottom-6 ${
        visible ? 'landing-dock-visible' : ''
      }`}
    >
      <div className="relative overflow-hidden rounded-full border border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-bg)_88%,transparent)] shadow-[0_12px_40px_-16px_rgb(0_0_0/0.35)] backdrop-blur-xl">
        {/* Wide screens: every chapter, the current one filled. */}
        <ol className="m-0 hidden list-none items-center gap-0.5 p-1.5 xl:flex">
          {CHAPTERS.map((c) => {
            const on = c.id === active;
            return (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => go(e, c.id)}
                  aria-current={on ? 'location' : undefined}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                      : 'text-[var(--landing-muted)] hover:bg-[var(--landing-hover)] hover:text-[var(--landing-ink)]'
                  }`}
                >
                  <span className={`font-mono text-[11px] ${on ? 'opacity-80' : 'text-[var(--landing-accent)]'}`}>{c.n}</span>
                  <span className="whitespace-nowrap font-medium">{c.label}</span>
                </a>
              </li>
            );
          })}
        </ol>

        {/* Narrow screens: the current chapter, opening the full list. */}
        <button
          type="button"
          className="flex items-center gap-3 px-4 py-2.5 text-sm xl:hidden"
          aria-expanded={open}
          aria-controls="landing-dock-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="font-mono text-[11px] text-[var(--landing-accent)]">{current.n}</span>
          <span className="font-medium text-[var(--landing-ink)]">{current.label}</span>
          <ChevronUp
            className={`size-4 text-[var(--landing-subtle)] transition-transform ${open ? '' : 'rotate-180'}`}
            aria-hidden
          />
        </button>

        <span
          ref={progressRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--landing-accent)] opacity-60"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {open && (
        <ol
          id="landing-dock-menu"
          className="absolute bottom-full left-1/2 mb-2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 list-none overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)] p-1.5 shadow-[0_16px_48px_-16px_rgb(0_0_0/0.4)] xl:hidden"
        >
          {CHAPTERS.map((c) => {
            const on = c.id === active;
            return (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => go(e, c.id)}
                  aria-current={on ? 'location' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    on
                      ? 'bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] font-semibold text-[var(--landing-ink)]'
                      : 'text-[var(--landing-muted)]'
                  }`}
                >
                  <span className="font-mono text-[11px] text-[var(--landing-accent)]">{c.n}</span>
                  {c.label}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
