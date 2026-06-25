'use client';

import { useEffect, useRef } from 'react';

const SIM = 96;

export function TideRippleScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const splash = (nx: number, ny: number, power: number, radius = 6) => {
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
          next[i] *= 0.9982;
        }
      }
      ping = 1 - ping;

      if (!reduced) {
        const cx = 0.5 + Math.sin(t * 0.18) * 0.04;
        const cy = 0.5 + Math.cos(t * 0.15) * 0.03;
        splash(cx, cy, 0.045, 7);
        if (Math.sin(t * 0.42) > 0.92) splash(cx, cy, 0.025, 5);
      }
    };

    const sample = (field: Float32Array, nx: number, ny: number) => {
      const fx = nx * (SIM - 2) + 1;
      const fy = ny * (SIM - 2) + 1;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(SIM - 1, x0 + 1);
      const y1 = Math.min(SIM - 1, y0 + 1);
      const tx = fx - x0;
      const ty = fy - y0;
      const v00 = field[idx(x0, y0)];
      const v10 = field[idx(x1, y0)];
      const v01 = field[idx(x0, y1)];
      const v11 = field[idx(x1, y1)];
      return (
        v00 * (1 - tx) * (1 - ty) +
        v10 * tx * (1 - ty) +
        v01 * (1 - tx) * ty +
        v11 * tx * ty
      );
    };

    const draw = () => {
      if (w < 1 || h < 1) return;
      const field = buf[ping];
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.hypot(cx, cy);

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      bg.addColorStop(0, '#020810');
      bg.addColorStop(0.45, '#000408');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const stepPx = w > 900 ? 2 : 3;
      for (let py = 0; py < h; py += stepPx) {
        for (let px = 0; px < w; px += stepPx) {
          const nx = px / w;
          const ny = py / h;
          const wave = sample(field, nx, ny);
          const dx =
            sample(field, Math.min(1, nx + 0.004), ny) - sample(field, Math.max(0, nx - 0.004), ny);
          const dy =
            sample(field, nx, Math.min(1, ny + 0.004)) - sample(field, nx, Math.max(0, ny - 0.004));
          const slope = Math.hypot(dx, dy);

          const dist = Math.hypot(nx - 0.5, ny - 0.5);
          const vignette = 1 - Math.min(1, dist * 1.15) ** 1.6;

          const depth = 0.06 + (1 - ny) * 0.04;
          const crest = Math.max(0, wave) * 0.35;
          const spec = Math.min(0.11, slope * 0.22 + crest * 0.18) * vignette;

          const br = Math.floor((depth + spec * 0.35) * 255);
          const bb = Math.floor((12 + depth * 40 + spec * 8) * vignette);
          const bgG = Math.floor((4 + depth * 18) * vignette);
          const rg = Math.floor(spec * 210 * vignette);
          const rb = Math.floor(spec * 28 * vignette);

          ctx.fillStyle = `rgb(${br + rg},${bgG + Math.floor(spec * 170 * vignette)},${bb + rb})`;
          ctx.fillRect(px, py, stepPx, stepPx);
        }
      }

      if (!reduced) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let ring = 0; ring < 4; ring++) {
          const phase = t * 0.22 + ring * 1.4;
          const radius = ((phase % 1) * 0.42 + 0.08) * Math.min(cx, cy) * 2;
          const alpha = (1 - (phase % 1)) * 0.045;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 204, 0, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const nw = parent.clientWidth;
      const nh = parent.clientHeight;
      if (nw < 1 || nh < 1) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const loop = () => {
      if (!reduced) {
        step();
        t += 0.006;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    splash(0.5, 0.5, 0.12, 8);
    loop();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ''} pointer-events-none block h-full w-full rounded-full`}
      aria-hidden
      role="presentation"
    />
  );
}
