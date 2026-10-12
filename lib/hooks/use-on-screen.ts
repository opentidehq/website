'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Whether the element is on screen in a visible tab, so callers can idle their timers and
 * animations instead of playing to nobody; `seen` latches once it has been. Without
 * IntersectionObserver the element counts as on screen.
 */
export function useOnScreen<T extends Element>({ rootMargin = '10% 0px' } = {}) {
  const ref = useRef<T>(null);
  const [intersecting, setIntersecting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setIntersecting(true));
      return () => {
        cancelAnimationFrame(id);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
    // One batch can hold several entries for the element; the last one is current.
    const observer = new IntersectionObserver((entries) => setIntersecting(entries[entries.length - 1].isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rootMargin]);

  const onScreen = intersecting && !hidden;
  if (onScreen && !seen) setSeen(true);

  return { ref, onScreen, seen };
}
