'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

function Reveal({
  children,
  visible,
  delayMs,
  className,
}: {
  children: ReactNode;
  visible: boolean;
  delayMs: number;
  className?: string;
}) {
  return (
    <span
      className={`landing-pitch-reveal inline ${visible ? 'is-visible' : ''} ${className ?? ''}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </span>
  );
}

export function HeroPitch() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="border-t border-white/[0.06] bg-black px-4 py-14 md:px-6 md:py-20"
      aria-label="What opentide is"
    >
      <div className="mx-auto max-w-[1400px]">
        <p className="max-w-4xl text-left text-[clamp(1.35rem,2.8vw,2.15rem)] font-medium leading-[1.35] tracking-[-0.02em] text-[var(--landing-muted)] text-pretty">
          <Reveal visible={visible} delayMs={0}>
            <span className="font-bold text-[var(--eu-yellow)]">opentide</span>
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={80}>
            is the
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={160}>
            <span className="font-bold text-[var(--eu-yellow)]">DetectionOps</span>
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={240}>
            standard for teams shipping detection-as-code at scale — normative objects,
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={320}>
            <span className="text-[var(--landing-ink)]">honest validation</span>
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={400}>
            (no fake query checks), and
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={480}>
            <span className="text-[var(--landing-ink)]">deploy pipelines</span>
          </Reveal>{' '}
          <Reveal visible={visible} delayMs={560}>
            that behave the same in your shell, CI, and with agents — without rebuilding the
            workflow every time you add a platform or onboard a new engineer.
          </Reveal>
        </p>
      </div>
    </section>
  );
}
