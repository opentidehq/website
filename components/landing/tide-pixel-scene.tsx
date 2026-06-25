'use client';

import { useEffect, useRef } from 'react';

const PIXEL = 4;
const PALETTE = {
  abyss: '#000814',
  deep: '#001a4d',
  mid: '#003399',
  shallow: '#1a5fbf',
  foam: '#7ec8e3',
  gold: '#ffcc00',
  goldDim: '#c9a000',
} as const;

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const rgb = {
  abyss: hexToRgb(PALETTE.abyss),
  deep: hexToRgb(PALETTE.deep),
  mid: hexToRgb(PALETTE.mid),
  shallow: hexToRgb(PALETTE.shallow),
  foam: hexToRgb(PALETTE.foam),
};

interface Floater {
  x: number;
  phase: number;
  size: number;
  kind: 'rule' | 'buoy';
}

export function TidePixelScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;

    const floaters: Floater[] = Array.from({ length: 14 }, (_, i) => ({
      x: (i / 14) * 1.2 - 0.05,
      phase: i * 0.65,
      size: i % 3 === 0 ? 3 : 2,
      kind: i % 4 === 0 ? 'buoy' : 'rule',
    }));

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
      cols = Math.ceil(w / PIXEL);
      rows = Math.ceil(h / PIXEL);
    };

    const waveY = (col: number, t: number, layer: number) => {
      const x = col / Math.max(cols, 1);
      return (
        h * (0.38 + layer * 0.07) +
        Math.sin(x * 7 + t * 1.1 + layer * 1.4) * 18 +
        Math.sin(x * 14 + t * 1.6 + layer * 0.8) * 8 +
        Math.cos(x * 3.5 - t * 0.7) * 12
      );
    };

    const drawSky = () => {
      ctx.fillStyle = PALETTE.abyss;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 56; i++) {
        const sx = ((i * 97) % cols) * PIXEL;
        const sy = ((i * 53) % Math.floor(rows * 0.38)) * PIXEL;
        const twinkle = reducedMotion ? 0.65 : 0.4 + 0.6 * Math.sin(frame * 0.05 + i * 1.3);
        if (twinkle > 0.5) {
          ctx.fillStyle = `rgba(232,244,255,${twinkle * 0.9})`;
          ctx.fillRect(sx, sy, PIXEL, PIXEL);
        }
      }

      const moonX = w * 0.82;
      const moonY = h * 0.12;
      ctx.fillStyle = PALETTE.gold;
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy <= 14) {
            ctx.fillRect(moonX + dx * PIXEL, moonY + dy * PIXEL, PIXEL, PIXEL);
          }
        }
      }
      ctx.fillStyle = PALETTE.abyss;
      ctx.fillRect(moonX + PIXEL * 2, moonY - PIXEL, PIXEL * 2, PIXEL * 2);
    };

    const drawWaterLayer = (layer: number, t: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      for (let col = 0; col < cols; col++) {
        const surface = waveY(col, t, layer);
        const baseRow = Math.floor(surface / PIXEL);
        for (let row = baseRow; row < rows; row++) {
          const depth = (row - baseRow) / Math.max(rows - baseRow, 1);
          let color: string;
          if (depth < 0.1 && layer === 2) {
            color = lerpColor(rgb.foam, rgb.shallow, depth * 6);
          } else if (depth < 0.28) {
            color = lerpColor(rgb.shallow, rgb.mid, depth * 2.8);
          } else if (depth < 0.58) {
            color = lerpColor(rgb.mid, rgb.deep, (depth - 0.28) * 2.2);
          } else {
            color = lerpColor(rgb.deep, rgb.abyss, (depth - 0.58) * 2);
          }
          ctx.fillStyle = color;
          ctx.fillRect(col * PIXEL, row * PIXEL, PIXEL, PIXEL);
        }
        if (layer === 2 && !reducedMotion && col % 5 === Math.floor(frame / 12) % 5) {
          const fy = baseRow * PIXEL - PIXEL;
          if (fy > 0) {
            ctx.fillStyle = PALETTE.gold;
            ctx.fillRect(col * PIXEL, fy, PIXEL, PIXEL);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawFloaters = (t: number) => {
      floaters.forEach((f) => {
        const col = Math.floor(f.x * cols);
        const surface = waveY(col, t, 2);
        const bob = reducedMotion ? 0 : Math.sin(t * 2.2 + f.phase) * 5;
        const ox = col * PIXEL;
        const oy = surface - f.size * PIXEL - 10 + bob;
        const s = f.size * PIXEL;
        if (f.kind === 'buoy') {
          ctx.fillStyle = PALETTE.gold;
          ctx.fillRect(ox, oy, s, s);
          ctx.fillStyle = PALETTE.goldDim;
          ctx.fillRect(ox, oy + s, s, PIXEL);
        } else {
          ctx.fillStyle = PALETTE.foam;
          ctx.fillRect(ox, oy, s, s);
          ctx.fillStyle = PALETTE.mid;
          ctx.fillRect(ox + PIXEL, oy + PIXEL, Math.max(s - PIXEL * 2, PIXEL), Math.max(s - PIXEL * 2, PIXEL));
        }
        if (!reducedMotion) f.x += 0.00035;
        if (f.x > 1.12) f.x = -0.08;
      });
    };

    const draw = () => {
      if (w === 0 || h === 0) {
        resize();
      }
      const t = reducedMotion ? 0 : frame * 0.022;
      drawSky();
      drawWaterLayer(0, t, 0.5);
      drawWaterLayer(1, t, 0.72);
      drawWaterLayer(2, t, 1);
      drawFloaters(t);
      frame += 1;
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      role="presentation"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
