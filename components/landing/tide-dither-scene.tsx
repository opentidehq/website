'use client';

import { useEffect, useRef } from 'react';

/** Classic 2D wave tank (ShareTechnote / Hugo Elias) + Bayer dither + EU tide palette */
const PIXEL = 4;
const SIM = 72;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const DEEP = ['#000000', '#000408', '#000814', '#001028', '#002266', '#003399', '#1a4fb5'] as const;
const FOAM = ['#0a0a06', '#3d3808', '#8a7a18', '#c9a000', '#ffcc00', '#ffe566'] as const;

export function TideDitherScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.55, active: false });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const n = SIM * SIM;
    const buf = [new Float32Array(n), new Float32Array(n)];
    let ping = 0;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let lastMx = 0.5;
    let lastMy = 0.55;

    const idx = (x: number, y: number) => y * SIM + x;

    const splash = (nx: number, ny: number, power: number) => {
      const cur = buf[ping];
      const cx = Math.floor(nx * (SIM - 4)) + 2;
      const cy = Math.floor(ny * (SIM - 4)) + 2;
      const r = 4;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 1 || y < 1 || x >= SIM - 1 || y >= SIM - 1) continue;
          const d = Math.hypot(dx, dy);
          if (d > r) continue;
          const f = (1 - d / r) ** 2;
          cur[idx(x, y)] += power * f;
        }
      }
    };

    const step = () => {
      const cur = buf[ping];
      const next = buf[1 - ping];
      for (let y = 1; y < SIM - 1; y++) {
        for (let x = 1; x < SIM - 1; x++) {
          const i = idx(x, y);
          next[i] =
            (cur[idx(x - 1, y)] +
              cur[idx(x + 1, y)] +
              cur[idx(x, y - 1)] +
              cur[idx(x, y + 1)]) /
              2 -
            next[i];
          next[i] *= 0.985;
        }
      }
      ping = 1 - ping;

      const { x: mx, y: my, active } = mouseRef.current;
      if (active && !reducedMotion) splash(mx, my, 2.8);

      if (!reducedMotion) {
        const tideX = 0.5 + Math.sin(t * 0.45) * 0.35;
        splash(tideX, 0.55 + Math.cos(t * 0.38) * 0.08, 0.35);
        splash(0.12 + Math.sin(t * 0.31) * 0.05, 0.62, 0.2);
        splash(0.88 + Math.cos(t * 0.27) * 0.05, 0.58, 0.2);
      }
    };

    const dither = (v: number, x: number, y: number, ramp: readonly string[]) => {
      const th = BAYER[y % 4][x % 4] / 16;
      const lv = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + (v > th ? 0.07 : -0.07)) * ramp.length)),
      );
      return ramp[lv];
    };

    const draw = () => {
      if (w === 0) return;
      const cols = Math.ceil(w / PIXEL);
      const rows = Math.ceil(h / PIXEL);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const ny = row / rows;
          const sx = Math.min(SIM - 2, Math.max(1, Math.floor(nx * (SIM - 2)) + 1));
          const sy = Math.min(SIM - 2, Math.max(1, Math.floor(ny * (SIM - 2)) + 1));
          const i = idx(sx, sy);

          const wave = buf[ping][i];
          const dx = buf[ping][idx(sx - 1, sy)] - buf[ping][idx(sx + 1, sy)];
          const dy = buf[ping][idx(sx, sy - 1)] - buf[ping][idx(sx, sy + 1)];
          const slope = Math.hypot(dx, dy);

          const tideLine =
            0.32 +
            Math.sin(nx * 7 + t * 1.1) * 0.04 +
            Math.sin(nx * 3.5 - t * 0.7) * 0.025;
          const depth = ny - tideLine;
          const { x: mx, y: my, active } = mouseRef.current;
          const glow = active ? Math.max(0, 1 - Math.hypot(nx - mx, ny - my) * 2.5) * 0.35 : 0;

          let ramp: readonly string[];
          let v: number;

          if (depth < -0.06) {
            ramp = ['#000000', '#020202', '#050505'];
            v = 0.04;
          } else if (slope > 0.35 || (depth < 0.04 && wave > 0.15)) {
            ramp = FOAM;
            v = Math.min(1, slope * 0.55 + wave * 0.4 + glow + 0.25);
          } else {
            ramp = DEEP;
            v = Math.min(1, depth * 1.6 + wave * 0.35 + slope * 0.15 + glow + 0.12);
          }

          ctx.fillStyle = dither(v, col, row, ramp);
          ctx.fillRect(col * PIXEL, row * PIXEL, PIXEL, PIXEL);
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
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x, y, active: true };
      if (!reducedMotion) splash(x, y, 3.2);
      lastMx = x;
      lastMy = y;
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reducedMotion) {
        step();
        t += 0.018;
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
