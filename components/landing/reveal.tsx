'use client';

import { useEffect } from 'react';

/**
 * Scroll reveals for the landing. Elements opt in with `data-reveal`; the children of a
 * `data-reveal-group` reveal one after another. Everything renders visible until this runs,
 * so nothing is hidden without JavaScript, and nothing moves for reduced motion.
 *
 * It also marks each chapter `data-live` while it is on screen, so endless CSS animations
 * (flows, carets, the ribbon) pause wherever the reader is not.
 */
export function RevealOnScroll() {
  useEffect(() => {
    // Reduced motion: nothing hides and nothing loops, so there is nothing to do.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    const live = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.toggleAttribute('data-live', entry.isIntersecting);
      },
      { rootMargin: '10% 0px' },
    );
    for (const section of document.querySelectorAll('.landing section')) live.observe(section);

    for (const group of document.querySelectorAll('[data-reveal-group]')) {
      Array.from(group.children).forEach((child, i) => {
        child.setAttribute('data-reveal', '');
        (child as HTMLElement).style.setProperty('--reveal-i', String(i));
      });
    }

    const targets = Array.from(document.querySelectorAll('[data-reveal]'));
    // What is already on screen stays put; only content below the fold waits for its turn.
    const fold = window.innerHeight;
    for (const el of targets) {
      if (el.getBoundingClientRect().top < fold) el.setAttribute('data-shown', '');
    }
    root.classList.add('landing-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-shown', '');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of targets) if (!el.hasAttribute('data-shown')) observer.observe(el);

    return () => {
      observer.disconnect();
      live.disconnect();
      root.classList.remove('landing-reveal');
    };
  }, []);

  return null;
}
