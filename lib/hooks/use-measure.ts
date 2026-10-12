'use client';

import { useLayoutEffect, type DependencyList, type RefObject } from 'react';

/**
 * Re-runs `measure` whenever the element resizes and once web fonts are ready, for drawings
 * whose connectors are measured from the layout. A ResizeObserver reports as soon as it
 * starts observing, so this also takes the first measure.
 */
export function useMeasure(ref: RefObject<Element | null>, measure: () => void, deps: DependencyList = []) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let live = true;
    const run = () => {
      if (live) measure();
    };
    const observer = new ResizeObserver(run);
    observer.observe(el);
    document.fonts?.ready.then(run, () => undefined);
    return () => {
      live = false;
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, measure, ...deps]);
}
