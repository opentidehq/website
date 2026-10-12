'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled into view, and stays true. Used to start one-shot
 * reveals; without IntersectionObserver the content simply renders in its final state.
 */
export function useInView<T extends Element>({ rootMargin = '0px 0px -15% 0px' } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
