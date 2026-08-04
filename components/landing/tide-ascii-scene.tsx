'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { FlipFluid } from '@/components/landing/liquid-ascii/flip-fluid';

/**
 * FLIP liquid tank → ASCII (Liquid Ascii defaults).
 * Official @reactbits-starter/liquid-ascii-tw needs REACTBITS_LICENSE_KEY.
 */

const CHARACTERS = ' ·:-~=+*#%@';
const CELL_SIZE = 15;
const SPEED = 0.9;
const GRAVITY = -25;
const FLIP_RATIO = 0.3;
const FILL_HEIGHT = 0.4;
const OVER_RELAXATION = 1.5;
const PRESSURE_ITERS = 30;
const SEPARATION_ITERS = 3;
const CURSOR_RADIUS = 0.25;
const CURSOR_FORCE = 66;
const GRID_RES = 52;
const AUTO_WAVE = true;

const BLUE = { r: 0, g: 20, b: 137 };
const YELLOW = { r: 255, g: 204, b: 0 };

function parseRgb(css: string): { r: number; g: number; b: number } | null {
  const m = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

export function TideAsciiScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let tankW = 1;
    let tankH = 1;
    let fluid: FlipFluid | null = null;
    let engine: FlipFluid | null = null;
    let t = 0;
    let lastMove = 0;
    let lastOx = 0;
    let lastOy = 0;

    const mouse = { x: 0.72, y: 0.45, vx: 0, vy: 0, active: false };

    const isDark = () =>
      document.documentElement.classList.contains('dark') || resolvedTheme === 'dark';

    const themeColors = () => {
      const dark = isDark();
      const styles = getComputedStyle(canvas.closest('.landing') ?? document.documentElement);
      const bgParsed =
        parseRgb(styles.getPropertyValue('--landing-bg').trim()) ??
        (dark ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 });
      let ink = dark ? YELLOW : BLUE;
      const accentCss = styles.getPropertyValue('--landing-accent').trim();
      if (accentCss.startsWith('#') && accentCss.length >= 7) {
        ink = {
          r: parseInt(accentCss.slice(1, 3), 16),
          g: parseInt(accentCss.slice(3, 5), 16),
          b: parseInt(accentCss.slice(5, 7), 16),
        };
      }
      return { bg: bgParsed, ink };
    };

    const build = () => {
      tankH = 1;
      tankW = Math.max(0.55, w / Math.max(1, h));
      const spacing = tankH / GRID_RES;
      const particleRadius = 0.3 * spacing;
      const dx = 2 * particleRadius;
      const dy = (Math.sqrt(3) / 2) * dx;
      const waterH = FILL_HEIGHT * tankH;
      const waterW = tankW - 2 * spacing;
      const numX = Math.max(1, Math.floor((waterW - 2 * particleRadius) / dx));
      const numY = Math.max(1, Math.floor((waterH - 2 * particleRadius) / dy));
      const maxParticles = Math.min(10000, numX * numY + 64);

      fluid = new FlipFluid({
        tankWidth: tankW,
        tankHeight: tankH,
        spacing,
        particleRadius,
        maxParticles,
      });
      fluid.setupTankSolids();
      fluid.fillBottom(FILL_HEIGHT, tankW, tankH);
      engine = fluid;
    };

    const draw = () => {
      if (!fluid || w < 1 || h < 1) return;
      const { bg, ink } = themeColors();
      ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
      ctx.fillRect(0, 0, w, h);

      const cols = Math.max(8, Math.ceil(w / CELL_SIZE));
      const rows = Math.max(8, Math.ceil(h / CELL_SIZE));
      const fontSize = Math.max(10, CELL_SIZE - 2);
      ctx.font = `600 ${fontSize}px ui-monospace, "JetBrains Mono", Menlo, monospace`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = (col + 0.5) / cols;
          const ny = 1 - (row + 0.5) / rows;
          const dens = fluid.sampleDensity01(nx, ny);
          if (dens < 0.05) continue;

          const v = Math.min(1, dens * 1.2);
          const gi = Math.min(CHARACTERS.length - 1, Math.floor(v * (CHARACTERS.length - 1)));
          const ch = CHARACTERS[gi];
          if (ch === ' ') continue;

          const alpha = 0.35 + v * 0.65;
          ctx.fillStyle = `rgba(${ink.r},${ink.g},${ink.b},${alpha})`;
          ctx.fillText(ch, col * CELL_SIZE + 1, row * CELL_SIZE + 1);
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = parent.clientWidth;
      const nh = parent.clientHeight;
      if (nw < 1 || nh < 1) return;
      const aspectChanged = fluid != null && Math.abs(nw / Math.max(1, nh) - tankW / tankH) > 0.12;
      const needsBuild = !fluid || aspectChanged;
      w = nw;
      h = nh;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (needsBuild) build();
      draw();
    };

    const pointerToTank = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = clamp01((clientX - rect.left) / rect.width);
      const ny = clamp01((clientY - rect.top) / rect.height);
      return { x: nx * tankW, y: (1 - ny) * tankH };
    };

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      const p = pointerToTank(e.clientX, e.clientY);
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastMove) / 1000);
      mouse.vx = (p.x - lastOx) / dt;
      mouse.vy = (p.y - lastOy) / dt;
      lastOx = p.x;
      lastOy = p.y;
      lastMove = now;
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
    };

    const onLeave = () => {
      mouse.active = false;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    const loop = () => {
      if (!fluid || reduced) return;
      const dt = Math.min(1 / 30, (1 / 60) * SPEED);
      t += dt;

      let ox = mouse.x;
      let oy = mouse.y;
      let ovx = 0;
      let ovy = 0;
      let orad = 0;

      const idle = performance.now() - lastMove > 1400;
      if (mouse.active) {
        orad = CURSOR_RADIUS * Math.min(tankW, tankH);
        const force = CURSOR_FORCE * 0.015;
        ovx = clamp(mouse.vx, -40, 40) * force;
        ovy = clamp(mouse.vy, -40, 40) * force;
      } else if (AUTO_WAVE && idle) {
        const waveX = tankW * (0.55 + 0.28 * Math.sin(t * 1.1));
        const waveY = tankH * (FILL_HEIGHT + 0.06 + 0.04 * Math.sin(t * 1.7));
        ox = waveX;
        oy = waveY;
        orad = CURSOR_RADIUS * 0.55 * Math.min(tankW, tankH);
        ovx = Math.cos(t * 1.1) * 18;
        ovy = Math.sin(t * 2.2) * 6;
      }

      fluid.simulate(
        dt,
        GRAVITY,
        FLIP_RATIO,
        PRESSURE_ITERS,
        SEPARATION_ITERS,
        OVER_RELAXATION,
        ox,
        oy,
        orad,
        ovx,
        ovy,
      );
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    lastMove = performance.now();
    lastOx = tankW * 0.7;
    lastOy = tankH * FILL_HEIGHT;

    if (reduced) {
      const settled = engine as FlipFluid | null;
      if (settled) {
        for (let i = 0; i < 12; i++) {
          settled.simulate(1 / 60, GRAVITY, FLIP_RATIO, 12, 1, OVER_RELAXATION, 0, 0, 0, 0, 0);
        }
      }
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    const host = canvas.parentElement ?? canvas;
    if (!reduced) {
      host.addEventListener('pointermove', onPointer as EventListener);
      host.addEventListener('pointerdown', onPointer as EventListener);
      host.addEventListener('pointerleave', onLeave);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onPointer as EventListener);
      host.removeEventListener('pointerdown', onPointer as EventListener);
      host.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      mo.disconnect();
    };
  }, [reduced, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ''} block h-full w-full`}
      aria-hidden
    />
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clamp01(n: number) {
  return clamp(n, 0, 1);
}
