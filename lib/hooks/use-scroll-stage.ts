'use client';

import { useEffect, useRef, useState } from 'react';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Smoothstep so the panel eases into and out of full size instead of tracking scroll linearly. */
const ease = (n: number) => n * n * (3 - 2 * n);

type ScrollStage = {
  /** Wrap the tall scroll track. */
  trackRef: React.RefObject<HTMLDivElement | null>;
  /** Receives `--stage-open` (0 → 1 → 0) as the track passes through the viewport. */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** False while the track is well outside the viewport, so callers can idle their timers. */
  onScreen: boolean;
};

/**
 * Drives a scroll-linked "take the space" stage.
 *
 * While the track scrolls past, the pinned stage opens to full height, holds, then closes
 * back to its resting size — so the section reads as a deliberate stop rather than a panel
 * that hijacks the page. The open amount is written straight to a CSS custom property to
 * keep it off the React render path.
 *
 * @param growTo fraction of the track spent opening (and, mirrored, closing)
 * @param enabled when false the stage stays closed — used for reduced motion and small screens
 */
export function useScrollStage({ growTo = 0.26, enabled = true }: { growTo?: number; enabled?: boolean } = {}): ScrollStage {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: '10% 0px' },
    );
    observer.observe(track);

    if (!enabled) {
      stage.style.setProperty('--stage-open', '0');
      return () => observer.disconnect();
    }

    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - window.innerHeight);
      const progress = clamp01(-rect.top / travel);

      const open =
        progress < growTo
          ? ease(progress / growTo)
          : progress > 1 - growTo
            ? ease((1 - progress) / growTo)
            : 1;

      const rounded = Math.round(open * 1000) / 1000;
      if (rounded !== last) {
        last = rounded;
        stage.style.setProperty('--stage-open', String(rounded));
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [growTo, enabled]);

  return { trackRef, stageRef, onScreen };
}
