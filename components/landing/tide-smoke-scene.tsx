'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

/**
 * Continuous yellow smoke for the hero.
 * Particles paint into an offscreen buffer, then a blur pass upscales to the
 * display canvas so the field reads as smoke (not stretched pixels or bokeh dots).
 * Mouse injects plume; left side stays darker for copy contrast.
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  heat: number;
};

const MAX_PARTICLES = 280;
const SIM_SCALE = 0.42;

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function TideSmokeScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.72, y: 0.48, active: false, px: 0.72, py: 0.48 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { alpha: true });
    if (!octx) return;

    let w = 0;
    let h = 0;
    let sw = 0;
    let sh = 0;
    let raf = 0;
    let t = 0;
    const particles: Particle[] = [];

    const spawn = (x: number, y: number, burst = false) => {
      if (particles.length >= MAX_PARTICLES) {
        particles.splice(0, Math.ceil(MAX_PARTICLES * 0.1));
      }
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (burst ? 1.6 : 1.0);
      const speed = burst ? 0.4 + Math.random() * 0.7 : 0.14 + Math.random() * 0.32;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.2,
        vy: Math.sin(angle) * speed - 0.1 - Math.random() * 0.14,
        life: 0,
        maxLife: 2.8 + Math.random() * 3.6,
        size: (burst ? 40 : 26) + Math.random() * (burst ? 70 : 50),
        heat: 0.75 + Math.random() * 0.6,
      });
    };

    const seedPlume = () => {
      for (let i = 0; i < 70; i++) {
        spawn(w * (0.55 + Math.random() * 0.38), h * (0.4 + Math.random() * 0.4));
        particles[particles.length - 1].life = Math.random() * 1.8;
      }
    };

    const step = (dt: number) => {
      const m = mouseRef.current;
      const mx = m.x * w;
      const my = m.y * h;

      if (!reduced) {
        const ax = w * (0.7 + Math.sin(t * 0.28) * 0.07);
        const ay = h * (0.58 + Math.cos(t * 0.22) * 0.06);
        if (Math.random() < 0.85) spawn(ax + (Math.random() - 0.5) * 60, ay + (Math.random() - 0.5) * 30);
        if (Math.random() < 0.35) spawn(w * (0.6 + Math.random() * 0.25), h * 0.72);

        if (m.active) {
          const dx = m.x - m.px;
          const dy = m.y - m.py;
          const dist = Math.hypot(dx, dy);
          const count = Math.min(12, 3 + Math.floor(dist * 70));
          for (let i = 0; i < count; i++) {
            const f = i / Math.max(1, count);
            spawn(
              mx - dx * f * w + (Math.random() - 0.5) * 20,
              my - dy * f * h + (Math.random() - 0.5) * 20,
              dist > 0.012,
            );
          }
        }

        m.px = m.x;
        m.py = m.y;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const nx = noise2(p.x * 0.0035 + t * 0.12, p.y * 0.0035);
        const ny = noise2(p.x * 0.0035 + 40, p.y * 0.0035 + t * 0.1);
        p.vx += (nx - 0.5) * 0.55 * dt;
        p.vy += (ny - 0.5) * 0.4 * dt - 0.1 * dt;
        p.vx *= 0.982;
        p.vy *= 0.982;

        if (m.active) {
          const ddx = mx - p.x;
          const ddy = my - p.y;
          const d = Math.hypot(ddx, ddy) + 1;
          if (d < 260) {
            const force = (1 - d / 260) * 22 * dt;
            p.vx += (ddx / d) * force * 0.18;
            p.vy += (ddy / d) * force * 0.18 - force * 0.1;
          }
        }

        p.x += p.vx * 70 * dt;
        p.y += p.vy * 70 * dt;
        p.size += 9 * dt;
      }
    };

    const draw = () => {
      if (w < 1 || h < 1 || sw < 1 || sh < 1) return;

      octx.clearRect(0, 0, sw, sh);
      octx.globalCompositeOperation = 'lighter';

      const sx = sw / w;
      const sy = sh / h;

      for (const p of particles) {
        const age = p.life / p.maxLife;
        const fade = age < 0.1 ? age / 0.1 : 1 - (age - 0.1) / 0.9;
        let alpha = Math.max(0, fade) * p.heat * 0.28;
        if (alpha < 0.01) continue;

        const leftDamp = p.x < w * 0.4 ? 0.15 + (p.x / (w * 0.4)) * 0.85 : 1;
        alpha *= leftDamp;

        const px = p.x * sx;
        const py = p.y * sy;
        const r = p.size * sx;

        const g = octx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(255, 210, 40, ${alpha})`);
        g.addColorStop(0.45, `rgba(255, 180, 0, ${alpha * 0.45})`);
        g.addColorStop(1, 'rgba(255, 140, 0, 0)');
        octx.fillStyle = g;
        octx.beginPath();
        octx.arc(px, py, r, 0, Math.PI * 2);
        octx.fill();
      }

      octx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.filter = 'blur(28px)';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
      ctx.filter = 'blur(10px)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      ctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.restore();

      const scrim = ctx.createLinearGradient(0, 0, w * 0.5, 0);
      scrim.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
      scrim.addColorStop(0.45, 'rgba(0, 0, 0, 0.35)');
      scrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, w, h);
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
      sw = Math.max(1, Math.floor(w * SIM_SCALE));
      sh = Math.max(1, Math.floor(h * SIM_SCALE));
      off.width = sw;
      off.height = sh;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length < 30) seedPlume();
      // Resizing clears the bitmap; redraw immediately (critical for reduced-motion static frame)
      draw();
    };

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      const hostEl = canvas.closest('section') ?? canvas;
      const rect = hostEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { ...mouseRef.current, x, y, active: true };
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) {
        t += dt;
        step(dt);
      }
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    resize();
    seedPlume();
    draw();
    if (!reduced) {
      raf = requestAnimationFrame(loop);
    }

    const host = canvas.closest('section') ?? canvas.parentElement ?? canvas;
    if (!reduced) {
      host.addEventListener('pointermove', onPointer as EventListener);
      host.addEventListener('pointerdown', onPointer as EventListener);
      host.addEventListener('pointerleave', onLeave);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onPointer as EventListener);
      host.removeEventListener('pointerdown', onPointer as EventListener);
      host.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className ?? ''} pointer-events-none block h-full w-full`}
      aria-hidden
    />
  );
}
