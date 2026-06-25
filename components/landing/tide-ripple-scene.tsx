'use client';

import { useEffect, useRef } from 'react';

/** Ripple tank — rounded pixels, dim yellow crests on black */
const PIXEL = 4;
const SIM = 80;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BASE = ['#000000', '#020202', '#050505', '#080808', '#0c0c0c'] as const;
const CREST = ['#0f0d00', '#1a1500', '#2a2200', '#4a3d00', '#7a6500', '#b38f00', '#ffcc00'] as const;

export function TideRippleScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    const splash = (nx: number, ny: number, power: number, radius = 5) => {
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
          const f = (1 - d / radius) ** 2.2;
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
          next[i] *= 0.987;
        }
      }
      ping = 1 - ping;

      const { x: mx, y: my, active } = mouseRef.current;
      if (active && !reduced) splash(mx, my, 0.08, 4);

      if (!reduced) {
        const cx = 0.5 + Math.sin(t * 0.22) * 0.06;
        const cy = 0.5 + Math.cos(t * 0.19) * 0.05;
        splash(cx, cy, 0.055, 6);
        if (Math.sin(t * 0.5) > 0.94) splash(cx, cy, 0.03, 4);
        splash(0.22 + Math.sin(t * 0.17) * 0.04, 0.58, 0.025, 3);
        splash(0.78 + Math.cos(t * 0.14) * 0.04, 0.42, 0.025, 3);
      }
    };

    const dither = (v: number, x: number, y: number, ramp: readonly string[]) => {
      const th = BAYER[y % 4][x % 4] / 16;
      const lv = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + (v > th ? 0.06 : -0.06)) * ramp.length)),
      );
      return ramp[lv];
    };

    const drawPixel = (px: number, py: number, color: string) => {
      const r = PIXEL * 0.46;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px + PIXEL / 2, py + PIXEL / 2, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      if (w < 1 || h < 1) return;
      const cols = Math.ceil(w / PIXEL);
      const rows = Math.ceil(h / PIXEL);
      const field = buf[ping];
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * PIXEL;
          const py = row * PIXEL;
          const nx = (px + PIXEL / 2) / w;
          const ny = (py + PIXEL / 2) / h;

          const sx = Math.min(SIM - 2, Math.max(1, Math.floor(nx * (SIM - 2)) + 1));
          const sy = Math.min(SIM - 2, Math.max(1, Math.floor(ny * (SIM - 2)) + 1));
          const wave = field[idx(sx, sy)];
          const dx = field[idx(sx - 1, sy)] - field[idx(sx + 1, sy)];
          const dy = field[idx(sx, sy - 1)] - field[idx(sx, sy + 1)];
          const slope = Math.hypot(dx, dy);

          const dist = Math.hypot(nx - 0.5, ny - 0.5);
          const vignette = 1 - Math.min(1, dist * 1.2) ** 1.8;

          const { x: mx, y: my, active } = mouseRef.current;
          const pointerGlow = active
            ? Math.max(0, 1 - Math.hypot(nx - mx, ny - my) * 2.2) * 0.28
            : 0;

          const crest = Math.max(0, wave) * 0.42 + slope * 0.22 + pointerGlow;
          const isCrest = crest > 0.12;

          const ramp = isCrest ? CREST : BASE;
          const v = Math.min(1, (isCrest ? crest : 0.04 + dist * 0.08) * vignette * 0.72);
          drawPixel(px, py, dither(v, col, row, ramp));
        }
      }

      if (!reduced) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let ring = 0; ring < 3; ring++) {
          const phase = t * 0.28 + ring * 1.6;
          const radius = ((phase % 1) * 0.38 + 0.1) * Math.min(cx, cy) * 2;
          const alpha = (1 - (phase % 1)) * 0.035;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 204, 0, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = parent.clientWidth;
      const nh = parent.clientHeight;
      if (nw < 1 || nh < 1) return;
      w = nw;
      h = nh;
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
      if (!reduced) {
        splash(mouseRef.current.x, mouseRef.current.y, 0.1, 5);
      }
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reduced) {
        step();
        t += 0.014;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    splash(0.5, 0.5, 0.14, 7);
    loop();

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

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
      className={`${className ?? ''} block h-full w-full touch-none`}
      aria-hidden
      role="presentation"
    />
  );
}
