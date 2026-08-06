'use client';

import { type CSSProperties, useEffect, useRef } from 'react';
import { OpentideBadge } from '@/components/brand/opentide-mark';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

/** Rotation in degrees once the pointer reaches the edge of the hover area. */
const MAX_TILT = 15;
/** Share of the remaining distance covered each frame — the spring's stiffness. */
const EASE = 0.13;
/** Once every channel is within this of its target it snaps, and the loop can stop. */
const SETTLE = 0.01;

/** Animated values, all unitless so CSS can reuse them for both `deg` and `px`. */
type Channels = {
  /** Rotation about the horizontal and vertical axes. */
  rx: number;
  ry: number;
  /** Specular highlight position, in percent of the badge box. */
  px: number;
  py: number;
  /** 0 at rest, 1 while the pointer is over the badge — drives scale, glow and glare. */
  lift: number;
};

const REST: Channels = { rx: 0, ry: 0, px: 50, py: 50, lift: 0 };
const CHANNELS = ['rx', 'ry', 'px', 'py', 'lift'] as const;

const clamp = (n: number) => (n < -1 ? -1 : n > 1 ? 1 : n);

/**
 * The seal as a tilt card: it leans away from the pointer, catches a specular highlight,
 * and drags its accent glow along behind it.
 *
 * Values are eased toward the pointer on a rAF loop and written to CSS custom properties,
 * so the animation never touches React's render path. The loop parks itself as soon as
 * everything has settled back to rest. Purely decorative, so it sits out entirely for
 * reduced motion and for coarse pointers, where there is no hover to react to.
 */
export function TiltBadge({
  size = 'clamp(116px, 16vw, 176px)',
  className,
}: {
  /** Any CSS length. Drives the badge only — the hover area's padding is fixed. */
  size?: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const current: Channels = { ...REST };
    const target: Channels = { ...REST };
    let frame = 0;

    const paint = () => {
      frame = 0;
      let moving = false;

      for (const key of CHANNELS) {
        const delta = target[key] - current[key];
        if (Math.abs(delta) > SETTLE) {
          current[key] += delta * EASE;
          moving = true;
        } else {
          current[key] = target[key];
        }
      }

      host.style.setProperty('--tilt-x', current.rx.toFixed(3));
      host.style.setProperty('--tilt-y', current.ry.toFixed(3));
      host.style.setProperty('--tilt-px', current.px.toFixed(2));
      host.style.setProperty('--tilt-py', current.py.toFixed(2));
      host.style.setProperty('--tilt-lift', current.lift.toFixed(3));

      if (moving) frame = window.requestAnimationFrame(paint);
      else host.removeAttribute('data-tilting');
    };

    const wake = () => {
      host.setAttribute('data-tilting', '');
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      // −1 … 1 out from the centre of the hover area
      const nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
      const ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);

      target.ry = nx * MAX_TILT;
      target.rx = -ny * MAX_TILT;
      // Highlight tracks the pointer, but only across the middle of the face so it
      // never slides off the edge of the seal.
      target.px = 50 + nx * 38;
      target.py = 50 + ny * 38;
      target.lift = 1;
      wake();
    };

    const onLeave = () => {
      Object.assign(target, REST);
      wake();
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);

    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div
      ref={hostRef}
      className={`landing-tilt ${className ?? ''}`}
      style={{ '--tilt-size': size } as CSSProperties}
    >
      <div className="landing-tilt-stage">
        <span className="landing-tilt-glow" aria-hidden />
        <OpentideBadge size="100%" className="landing-tilt-face" />
        <span className="landing-tilt-glare" aria-hidden />
      </div>
    </div>
  );
}
