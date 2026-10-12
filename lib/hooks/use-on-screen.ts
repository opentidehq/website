'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * False while the element is well outside the viewport, so callers can idle their timers
 * instead of playing to nobody.
 */
export function useOnScreen<T extends Element>({ rootMargin = '10% 0px' } = {}) {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, onScreen };
}
