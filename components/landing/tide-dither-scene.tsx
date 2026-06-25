'use client';

import { useEffect, useRef } from 'react';

const PIXEL = 3;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const RAMP_SKY = ['#000000', '#030303', '#080808'] as const;
const RAMP_DEEP = ['#000000', '#000510', '#000814', '#001028', '#001a4d', '#003399'] as const;
const RAMP_FOAM = ['#0a0a08', '#2a2808', '#665c00', '#c9a000', '#ffcc00', '#ffe566'] as const;

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
        ripple(mx, my, 0.85 + Math.min(1, Math.hypot(vx, vy) * 6), 7);
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
          vel[i] += lap * 0.4;
          vel[i] *= 0.98;
        }
      }

      for (let i = 0; i < size; i++) {
        height[i] += vel[i];
        height[i] *= 0.993;
      }

      if (!reducedMotion) {
        ripple(0.08 + Math.sin(t * 0.5) * 0.06, 0.72, 0.14, 5);
        ripple(0.92 + Math.cos(t * 0.44) * 0.05, 0.68, 0.12, 5);
      }
    };

    const tideSurface = (nx: number, col: number) => {
      if (!height) return 0.38;
      const gx = Math.min(cols - 2, Math.max(1, col));
      const gy = Math.floor(rows * 0.38);
      const i = idx(gx, gy);
      const swell =
        height[i] * 0.12 +
        Math.sin(nx * 11 + t * 1.3) * 0.028 +
        Math.sin(nx * 5.5 - t * 0.85) * 0.016 +
        Math.cos(nx * 2.2 + t * 0.4) * 0.01;
      return 0.36 + swell;
    };

    const pickRamp = (nx: number, ny: number, col: number) => {
      const surface = tideSurface(nx, col);
      const depth = ny - surface;
      const { x: mx, y: my, active } = mouseRef.current;
      const dist = Math.hypot(nx - mx, ny - my);
      const glow = active ? Math.max(0, 1 - dist * 2) * 0.25 : 0;

      if (depth < -0.04) {
        return { ramp: RAMP_SKY, v: 0.05 + glow * 0.3 };
      }
      if (depth < 0.035) {
        const crest = 1 - Math.abs(depth) / 0.035;
        return { ramp: RAMP_FOAM, v: Math.min(1, crest * 0.85 + glow) };
      }
      const deep = Math.min(1, depth * 2.8 + 0.15 + glow * 0.2);
      return { ramp: RAMP_DEEP, v: deep };
    };

    const dither = (v: number, x: number, y: number, ramp: readonly string[]) => {
      const threshold = BAYER[y % 4][x % 4] / 16;
      const level = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + (v > threshold ? 0.06 : -0.06)) * ramp.length)),
      );
      return ramp[level];
    };

    const draw = () => {
      if (!height || w === 0) return;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          const ny = y / rows;
          const { ramp, v } = pickRamp(nx, ny, x);
          ctx.fillStyle = dither(v, x, y, ramp);
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
