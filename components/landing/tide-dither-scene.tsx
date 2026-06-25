'use client';

import { useEffect, useRef } from 'react';

/** Wave tank + Bayer dither — ImageData render for 60fps, soft reactivity */
const PIXEL = 2;
const SIM = 96;

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

const hexAbgr = new Map<string, number>();
function toAbgr(hex: string) {
  let v = hexAbgr.get(hex);
  if (v !== undefined) return v;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  v = (255 << 24) | (b << 16) | (g << 8) | r;
  hexAbgr.set(hex, v);
  return v;
}

export function TideDitherScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false, frame: 0 });

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
    let imageData: ImageData | null = null;
    let pixels: Uint32Array | null = null;

    const idx = (x: number, y: number) => y * SIM + x;

    const splash = (nx: number, ny: number, power: number, radius = 4) => {
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

    const seedRipples = () => {
      splash(0.35, 0.55, 0.35, 5);
      splash(0.65, 0.45, 0.3, 5);
      splash(0.5, 0.7, 0.25, 4);
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
          next[i] *= 0.994;
        }
      }
      ping = 1 - ping;

      const { x: mx, y: my, active, frame } = mouseRef.current;
      if (active && !reducedMotion && frame % 2 === 0) splash(mx, my, 0.55, 3);

      if (!reducedMotion) {
        splash(0.5 + Math.sin(t * 0.55) * 0.32, 0.48 + Math.cos(t * 0.47) * 0.22, 0.14, 4);
        splash(0.22 + Math.sin(t * 0.41) * 0.1, 0.62, 0.09, 3);
        splash(0.78 + Math.cos(t * 0.38) * 0.1, 0.38, 0.09, 3);
        splash(0.5 + Math.sin(t * 0.9) * 0.15, 0.55 + Math.cos(t * 0.7) * 0.12, 0.06, 2);
      }
    };

    const dither = (v: number, col: number, row: number, ramp: readonly string[]) => {
      const th = BAYER8[row % 8][col % 8] / 64;
      const jitter = ((BAYER8[(row + 3) % 8][(col + 5) % 8] / 64) - 0.5) * 0.05;
      const lv = Math.min(
        ramp.length - 1,
        Math.max(0, Math.floor((v + jitter + (v > th ? 0.025 : -0.025)) * ramp.length)),
      );
      return ramp[lv];
    };

    const draw = () => {
      if (w === 0 || !pixels || !imageData) return;
      const cols = Math.ceil(w / PIXEL);
      const rows = Math.ceil(h / PIXEL);
      const field = buf[ping];
      const { x: mx, y: my, active } = mouseRef.current;

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
          const glow = active ? Math.max(0, 1 - Math.hypot(nx - mx, ny - my) * 2.4) * 0.18 : 0;

          const ambient = 0.2 + ny * 0.11;
          const energy = wave * 0.26 + slope * 0.38 + glow;
          const v = ambient + energy;

          let ramp: readonly string[];
          if (ny < 0.08 && Math.abs(wave) < 0.05) ramp = SKY;
          else if (slope > 0.16 || wave > 0.2) ramp = FOAM;
          else ramp = DEEP;

          const color = toAbgr(dither(Math.min(1, Math.max(0, v)), col, row, ramp));
          for (let py = 0; py < PIXEL; py++) {
            for (let px = 0; px < PIXEL; px++) {
              const x = col * PIXEL + px;
              const y = row * PIXEL + py;
              if (x < w && y < h) pixels[y * w + x] = color;
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
      w = parent.clientWidth;
      h = parent.clientHeight;
      if (w < 1 || h < 1) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      imageData = ctx.createImageData(w, h);
      pixels = new Uint32Array(imageData.data.buffer);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
      mouseRef.current.active = true;
      mouseRef.current.frame += 1;
      if (!reducedMotion && e.type === 'pointerdown') {
        splash(mouseRef.current.x, mouseRef.current.y, 0.7, 4);
      }
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reducedMotion) {
        step();
        step();
        t += 0.014;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    seedRipples();
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
