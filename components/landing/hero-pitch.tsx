'use client';

import { useEffect, useRef, useState } from 'react';

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
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-black px-4 py-4 md:px-6 md:py-5" aria-label="What opentide is">
      <div className="mx-auto w-full max-w-[1400px]">
        <p
          className={`landing-pitch-line w-full text-left text-[clamp(1.1rem,2vw,1.65rem)] font-medium leading-[1.28] tracking-[-0.015em] text-[var(--landing-muted)] ${visible ? 'is-visible' : ''}`}
        >
          <span className="landing-pitch-highlight font-bold text-[var(--eu-yellow)]">opentide</span> is the{' '}
          <span className="landing-pitch-highlight font-bold text-[var(--eu-yellow)]">DetectionOps</span>{' '}
          standard for teams shipping detection-as-code at scale —{' '}
          <span className="landing-pitch-highlight text-[var(--landing-ink)]">honest validation</span>{' '}
          (no fake query checks),{' '}
          <span className="landing-pitch-highlight text-[var(--landing-ink)]">deploy pipelines</span> that
          behave the same in your shell, CI, and with agents, plus{' '}
          <span className="landing-pitch-highlight text-[var(--landing-ink)]">agent skills</span> from the
          OpenTide ecosystem — without rebuilding the workflow every time.
        </p>
      </div>
    </section>
  );
}
