'use client';

import { useEffect, useRef } from 'react';

const PIXEL = 3;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** EU yellow ramp on pure black — no blue. */
const RAMP = ['#000000', '#141408', '#2a2808', '#524a10', '#8a7a18', '#ffcc00'] as const;

export function TideDitherScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0, active: false });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let size = 0;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let height: Float32Array | null = null;
    let vel: Float32Array | null = null;
    let lastMx = 0.5;
    let lastMy = 0.5;

    const idx = (x: number, y: number) => y * cols + x;

    const alloc = () => {
      cols = Math.max(1, Math.ceil(w / PIXEL));
      rows = Math.max(1, Math.ceil(h / PIXEL));
      size = cols * rows;
      height = new Float32Array(size);
      vel = new Float32Array(size);
    };

    const ripple = (nx: number, ny: number, strength: number, radius: number) => {
      if (!height || !vel) return;
      const cx = Math.floor(nx * (cols - 2)) + 1;
      const cy = Math.floor(ny * (rows - 2)) + 1;
      const r = Math.ceil(radius);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1) continue;
          const d = Math.hypot(dx, dy);
          if (d > r) continue;
          const f = 1 - d / r;
          const i = idx(x, y);
          vel[i] += strength * f;
        }
      }
    };

    const step = () => {
      if (!height || !vel) return;
      const { x: mx, y: my, vx, vy, active } = mouseRef.current;

      if (active && !reducedMotion) {
        ripple(mx, my, 0.9 + Math.min(1.2, Math.hypot(vx, vy) * 8), 6);
      }

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = idx(x, y);
          const lap =
            height[idx(x - 1, y)] +
            height[idx(x + 1, y)] +
            height[idx(x, y - 1)] +
            height[idx(x, y + 1)] -
            height[i] * 4;
          vel[i] += lap * 0.42;
          vel[i] *= 0.978;
        }
      }

      for (let i = 0; i < size; i++) {
        height[i] += vel[i];
        height[i] *= 0.992;
      }

      if (!reducedMotion) {
        ripple(0.12 + Math.sin(t * 0.55) * 0.1, 0.55 + Math.cos(t * 0.41) * 0.08, 0.12, 4);
        ripple(0.88 + Math.cos(t * 0.48) * 0.08, 0.48 + Math.sin(t * 0.37) * 0.1, 0.1, 4);
      }
    };

    const sampleField = (x: number, y: number) => {
      if (!height) return 0;
      const nx = x / cols;
      const ny = y / rows;
      const i = idx(
        Math.min(cols - 2, Math.max(1, Math.floor(nx * (cols - 2)) + 1)),
        Math.min(rows - 2, Math.max(1, Math.floor(ny * (rows - 2)) + 1)),
      );
      const wave =
        height[i] +
        Math.sin(nx * 9 + t * 1.4) * 0.06 +
        Math.sin(ny * 6 - t * 0.9) * 0.04;
      const { x: mx, y: my, active } = mouseRef.current;
      const dist = Math.hypot(nx - mx, ny - my);
      const glow = active ? Math.max(0, 1 - dist * 2.2) * 0.35 : 0;
      const vignette = 1 - Math.pow(Math.hypot(nx - 0.5, ny - 0.5) * 1.15, 2) * 0.35;
      return Math.min(1, Math.max(0, (wave + 0.5) * 0.55 * vignette + glow));
    };

    const draw = () => {
      if (!height || w === 0) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = sampleField(x, y);
          const threshold = BAYER[y % 4][x % 4] / 16;
          const level = Math.min(RAMP.length - 1, Math.floor((v + (v > threshold ? 0.08 : -0.08)) * RAMP.length));
          ctx.fillStyle = RAMP[level];
          ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      if (w < 1 || h < 1) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      alloc();
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = {
        x,
        y,
        vx: x - lastMx,
        vy: y - lastMy,
        active: true,
      };
      lastMx = x;
      lastMy = y;
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reducedMotion) {
        step();
        t += 0.022;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      canvas.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ''} block h-full w-full cursor-crosshair touch-none`}
      aria-hidden
      role="presentation"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
