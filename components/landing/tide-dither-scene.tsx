'use client';

import { useEffect, useRef } from 'react';

const PIXEL = 2;
const SIM = 88;

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

const rampAbgr = new Map<string, number>();
function abgr(hex: string) {
  let v = rampAbgr.get(hex);
  if (v !== undefined) return v;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  v = (255 << 24) | (b << 16) | (g << 8) | r;
  rampAbgr.set(hex, v);
  return v;
}

export function TideDitherScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, down: false });

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
    let imageData: ImageData | null = null;
    let pixels: Uint32Array | null = null;

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
          const f = (1 - d / radius) ** 3;
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
          next[i] *= 0.997;
        }
      }
      ping = 1 - ping;

      if (!reduced) {
        splash(0.5 + Math.sin(t * 0.35) * 0.28, 0.5 + Math.cos(t * 0.29) * 0.2, 0.09, 5);
        splash(0.28 + Math.sin(t * 0.22) * 0.08, 0.58, 0.05, 4);
        splash(0.72 + Math.cos(t * 0.24) * 0.08, 0.42, 0.05, 4);
      }

      const { x: mx, y: my, down } = mouseRef.current;
      if (down && !reduced) splash(mx, my, 0.22, 3);
    };

    const dither = (v: number, col: number, row: number, ramp: readonly string[]) => {
      const th = BAYER8[row % 8][col % 8] / 64;
      const lv = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + (v > th ? 0.02 : -0.02)) * ramp.length)),
      );
      return ramp[lv];
    };

    const draw = () => {
      if (!pixels || !imageData || w < 1 || h < 1) return;
      const cols = Math.ceil(w / PIXEL);
      const rows = Math.ceil(h / PIXEL);
      const field = buf[ping];
      const stride = w;

      for (let row = 0; row < rows; row++) {
        const ny = row / rows;
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const sx = Math.min(SIM - 2, Math.max(1, Math.floor(nx * (SIM - 2)) + 1));
          const sy = Math.min(SIM - 2, Math.max(1, Math.floor(ny * (SIM - 2)) + 1));
          const i = idx(sx, sy);

          const wave = field[i];
          const dx = field[idx(sx - 1, sy)] - field[idx(sx + 1, sy)];
          const dy = field[idx(sx, sy - 1)] - field[idx(sx, sy + 1)];
          const slope = Math.hypot(dx, dy);

          const ambient = 0.2 + ny * 0.1;
          const energy = wave * 0.22 + slope * 0.32;
          const v = ambient + energy;

          let ramp: readonly string[];
          if (ny < 0.08 && Math.abs(wave) < 0.04) ramp = SKY;
          else if (slope > 0.14 || wave > 0.16) ramp = FOAM;
          else ramp = DEEP;

          const color = abgr(dither(Math.min(1, Math.max(0, v)), col, row, ramp));
          const px0 = col * PIXEL;
          const py0 = row * PIXEL;
          for (let py = 0; py < PIXEL; py++) {
            const y = py0 + py;
            if (y >= h) continue;
            const rowOff = y * stride;
            for (let px = 0; px < PIXEL; px++) {
              const x = px0 + px;
              if (x < w) pixels[rowOff + x] = color;
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
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
      imageData = ctx.createImageData(w, h);
      const buf8 = imageData.data;
      pixels = new Uint32Array(buf8.buffer, buf8.byteOffset, buf8.byteLength / 4);
    };

    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        down: true,
      };
      if (!reduced) splash(mouseRef.current.x, mouseRef.current.y, 0.35, 4);
    };

    const onMove = (e: PointerEvent) => {
      if (!mouseRef.current.down) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };

    const onUp = () => {
      mouseRef.current.down = false;
    };

    const loop = () => {
      if (!reduced) {
        step();
        t += 0.011;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    splash(0.5, 0.55, 0.2, 6);
    splash(0.35, 0.45, 0.15, 5);
    splash(0.65, 0.5, 0.15, 5);
    loop();

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
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
