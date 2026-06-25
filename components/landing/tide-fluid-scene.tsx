'use client';

import { useEffect, useRef } from 'react';

const GRID = 96;

export function TideFluidScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.45, active: false });
  const frameRef = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const size = GRID * GRID;
    const height = new Float32Array(size);
    const vel = new Float32Array(size);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    const idx = (x: number, y: number) => y * GRID + x;

    const addRipple = (nx: number, ny: number, strength: number) => {
      const cx = Math.floor(nx * (GRID - 2)) + 1;
      const cy = Math.floor(ny * (GRID - 2)) + 1;
      const radius = 5;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x <= 0 || y <= 0 || x >= GRID - 1 || y >= GRID - 1) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > radius) continue;
          const falloff = 1 - d / radius;
          const i = idx(x, y);
          vel[i] += strength * falloff;
          height[i] += strength * 0.35 * falloff;
        }
      }
    };

    const step = () => {
      const { x: mx, y: my, active } = mouseRef.current;
      if (active && !reducedMotion) addRipple(mx, my, 0.55);

      for (let y = 1; y < GRID - 1; y++) {
        for (let x = 1; x < GRID - 1; x++) {
          const i = idx(x, y);
          const lap =
            height[idx(x - 1, y)] +
            height[idx(x + 1, y)] +
            height[idx(x, y - 1)] +
            height[idx(x, y + 1)] -
            height[i] * 4;
          vel[i] += lap * 0.38;
          vel[i] *= 0.985;
        }
      }

      for (let i = 0; i < size; i++) {
        height[i] += vel[i];
        height[i] *= 0.998;
      }

      if (!reducedMotion) {
        addRipple(0.15 + Math.sin(t * 0.4) * 0.08, 0.5, 0.08);
        addRipple(0.85 + Math.cos(t * 0.33) * 0.06, 0.52, 0.06);
      }
    };

    const draw = () => {
      if (w === 0 || h === 0) return;

      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, w, h);

      const waterTop = Math.floor(h * 0.28);
      const image = ctx.createImageData(w, h - waterTop);
      const data = image.data;

      for (let py = 0; py < h - waterTop; py++) {
        const screenY = waterTop + py;
        const ny = py / (h - waterTop);
        const gy = Math.min(GRID - 2, Math.floor(ny * (GRID - 2)) + 1);

        for (let px = 0; px < w; px++) {
          const nx = px / w;
          const gx = Math.min(GRID - 2, Math.floor(nx * (GRID - 2)) + 1);
          const i = idx(gx, gy);

          const wave =
            height[i] +
            height[idx(gx, Math.min(GRID - 1, gy + 1))] * 0.35 +
            Math.sin(nx * 10 + t * 1.1) * 0.04;

          const surface = 0.12 + wave * 0.9;
          const depth = Math.min(1, ny + surface * 0.35);
          const slope = Math.abs(height[idx(gx + 1, gy)] - height[idx(gx - 1, gy)]);

          let r: number;
          let g: number;
          let b: number;

          if (depth < 0.2) {
            const f = depth / 0.2;
            r = 126 + slope * 400;
            g = 200 + slope * 300;
            b = 227;
            r = r * f + 0 * (1 - f);
            g = g * f + 8 * (1 - f);
            b = b * f + 20 * (1 - f);
          } else if (depth < 0.55) {
            const f = (depth - 0.2) / 0.35;
            r = 0 + f * 20;
            g = 51 + f * 30;
            b = 153 - f * 40;
          } else {
            const f = (depth - 0.55) / 0.45;
            r = 20 - f * 15;
            g = 26 - f * 20;
            b = 80 - f * 50;
          }

          if (slope > 0.08 && depth < 0.25) {
            r += 255 * Math.min(1, slope * 2);
            g += 204 * Math.min(1, slope * 1.5);
          }

          const di = (py * w + px) * 4;
          data[di] = Math.min(255, r);
          data[di + 1] = Math.min(255, g);
          data[di + 2] = Math.min(255, b);
          data[di + 3] = 255;
        }
      }

      ctx.putImageData(image, 0, waterTop);

      if (!reducedMotion) {
        ctx.fillStyle = 'rgba(255, 204, 0, 0.85)';
        const moonX = w * 0.82;
        const moonY = h * 0.11;
        ctx.beginPath();
        ctx.arc(moonX, moonY, Math.min(w, h) * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(parent.clientWidth, 320);
      h = Math.max(parent.clientHeight, 400);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (clientX: number, clientY: number, active: boolean) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
        active,
      };
    };

    const onMove = (e: PointerEvent) => onPointer(e.clientX, e.clientY, true);
    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const loop = () => {
      if (!reducedMotion) {
        step();
        t += 0.016;
        frameRef.current += 1;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ''} cursor-crosshair touch-none`}
      aria-hidden
      role="presentation"
    />
  );
}
