'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Word = { text: string; accent?: boolean };

/**
 * Word tokens keep spacing stable with inline-block animation.
 * Accent runs use --landing-accent (Reflex Blue / EU Yellow).
 */
const WORDS: Word[] = [
  { text: 'opentide' },
  { text: 'is' },
  { text: 'spec-driven', accent: true },
  { text: 'development', accent: true },
  { text: 'for', accent: true },
  { text: 'detection', accent: true },
  { text: 'engineering:', accent: true },
  { text: 'an' },
  { text: 'ontology', accent: true },
  { text: 'and' },
  { text: 'a' },
  { text: 'taxonomy', accent: true },
  { text: 'that' },
  { text: 'keep' },
  { text: 'every' },
  { text: 'detection' },
  { text: 'threat-aligned,', accent: true },
  { text: 'maintainable' },
  { text: 'and' },
  { text: 'fast' },
  { text: 'to' },
  { text: 'ship,' },
  { text: 'with' },
  { text: 'or' },
  { text: 'without' },
  { text: 'agents.' },
];

const PITCH_PLAIN = WORDS.map((w) => w.text).join(' ');

/**
 * Full-width pitch under the hero. On scroll-past, words lift in a cascade.
 */
export function HeroPitch({ className }: { className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const start = window.innerHeight * 0.55;
      const end = -rect.height * 0.35;
      const raw = (start - rect.top) / (start - end);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  return (
    <p
      ref={ref}
      className={`w-full text-[clamp(1.1rem,2vw,1.55rem)] font-medium leading-[1.5] tracking-[-0.02em] text-[var(--landing-ink)] text-pretty ${className ?? ''}`}
      aria-label={PITCH_PLAIN}
    >
      {WORDS.map((w, i) => {
        const wave = reduced
          ? 0
          : Math.max(0, Math.min(1, (progress - i / WORDS.length) * 3.2));
        const lift = wave * -0.28;

        return (
          <span
            key={`${w.text}-${i}`}
            className={`inline-block will-change-transform ${
              w.accent ? 'font-semibold text-[var(--landing-accent)]' : ''
            }`}
            style={{
              opacity: 0.78 + wave * 0.22,
              transform: `translateY(${lift}em)`,
              transition: reduced
                ? undefined
                : 'opacity 0.2s linear, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {w.text}
            {i < WORDS.length - 1 ? '\u00A0' : ''}
          </span>
        );
      })}
    </p>
  );
}
