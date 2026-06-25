'use client';

import { useEffect, useRef } from 'react';

/** 2D wave tank + 8×8 Bayer ordered dither — full-canvas, no tide clip */
const PIXEL = 1;
const SIM = 128;

const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const DEEP = [
  '#000000', '#000306', '#00060c', '#000a14', '#000f1e', '#001433', '#001a4d', '#002266',
  '#002d80', '#003399', '#0d47b8', '#1a4fb5', '#2563c4',
] as const;
const FOAM = [
  '#050504', '#1a1806', '#3d3808', '#665c00', '#8a7a18', '#b8960a', '#ffcc00', '#ffe566', '#fff5b8',
] as const;
const SKY = ['#000000', '#010101', '#030303', '#060606'] as const;

export function TideDitherScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });

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

    const idx = (x: number, y: number) => y * SIM + x;

    const splash = (nx: number, ny: number, power: number, radius = 3) => {
      const cur = buf[ping];
      const cx = Math.floor(nx * (SIM - 4)) + 2;
      const cy = Math.floor(ny * (SIM - 4)) + 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 1 || y < 1 || x >= SIM - 1 || y >= SIM - 1) continue;
          const d = Math.hypot(dx, dy);
          if (d > radius) continue;
          const f = (1 - d / radius) ** 2.5;
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
          next[i] *= 0.995;
        }
      }
      ping = 1 - ping;

      const { x: mx, y: my, active } = mouseRef.current;
      if (active && !reducedMotion) splash(mx, my, 1.0, 3);

      if (!reducedMotion) {
        splash(0.5 + Math.sin(t * 0.22) * 0.28, 0.5 + Math.cos(t * 0.18) * 0.18, 0.07, 3);
        splash(0.2 + Math.sin(t * 0.15) * 0.06, 0.45, 0.05, 2);
        splash(0.8 + Math.cos(t * 0.17) * 0.06, 0.55, 0.05, 2);
      }
    };

    const dither = (v: number, col: number, row: number, ramp: readonly string[]) => {
      const th = BAYER8[row % 8][col % 8] / 64;
      const jitter = ((BAYER8[(row + 3) % 8][(col + 5) % 8] / 64) - 0.5) * 0.06;
      const lv = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + jitter + (v > th ? 0.03 : -0.03)) * ramp.length)),
      );
      return ramp[lv];
    };

    const draw = () => {
      if (w === 0) return;
      const cols = Math.ceil(w / PIXEL);
      const rows = Math.ceil(h / PIXEL);
      const field = buf[ping];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const ny = row / rows;
          const sx = Math.min(SIM - 2, Math.max(1, Math.floor(nx * (SIM - 2)) + 1));
          const sy = Math.min(SIM - 2, Math.max(1, Math.floor(ny * (SIM - 2)) + 1));
          const i = idx(sx, sy);

          const wave = field[i];
          const dx = field[idx(sx - 1, sy)] - field[idx(sx + 1, sy)];
          const dy = field[idx(sx, sy - 1)] - field[idx(sx, sy + 1)];
          const slope = Math.hypot(dx, dy);

          const { x: mx, y: my, active } = mouseRef.current;
          const glow = active ? Math.max(0, 1 - Math.hypot(nx - mx, ny - my) * 2.2) * 0.28 : 0;

          const ambient = 0.22 + ny * 0.12;
          const energy = wave * 0.28 + slope * 0.42 + glow;
          const v = ambient + energy;

          let ramp: readonly string[];
          if (ny < 0.08 && Math.abs(wave) < 0.05) {
            ramp = SKY;
          } else if (slope > 0.18 || wave > 0.22) {
            ramp = FOAM;
          } else {
            ramp = DEEP;
          }

          ctx.fillStyle = dither(Math.min(1, Math.max(0, v)), col, row, ramp);
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
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      };
      if (!reducedMotion) splash(mouseRef.current.x, mouseRef.current.y, 1.1, 3);
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reducedMotion) {
        step();
        t += 0.006;
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
