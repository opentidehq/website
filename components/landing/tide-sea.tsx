'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { halfWidthAt, pointOnWater, SEA } from '@/components/landing/sea/geometry';
import { SeaRenderer, type Rgb } from '@/components/landing/sea/renderer';

/**
 * The water is detection content, not an ASCII ramp: one detection idea in every language
 * opentide deploys to, between the object fields that tie them together. Each row of the sea is
 * a run of it, so the near rows read as query, and neighbouring rows rarely share a language.
 */
const SOURCE = [
  // Microsoft Sentinel and Defender for Endpoint: KQL
  'DeviceProcessEvents | where FileName =~ "lsass.exe" | project Timestamp, DeviceName',
  // Splunk Enterprise Security: SPL
  '`sysmon` EventCode=10 TargetImage="*\\lsass.exe" | stats count by host, SourceImage, GrantedAccess',
  // the opentide object behind every rule
  'detection_model: 00000000-0000-4000-8002-000000000001  status: STAGING',
  // SentinelOne: S1QL
  'EventType = "Open Remote Process Handle" AND TgtProcName = "lsass.exe" AND SrcProcName != "MsMpEng.exe"',
  // HarfangLab: Sigma
  "detection: selection: TargetImage|endswith: '\\lsass.exe' GrantedAccess: '0x1010' condition: selection",
  // Carbon Black Cloud: Lucene
  'process_name:lsass.exe AND crossproc_type:process_open AND -parent_name:svchost.exe',
  'chaining: - relation: sequence::preceeds  surface: OS::Windows::Desktop::11',
  // CrowdStrike Falcon: event search
  '#event_simpleName=ProcessRollup2 ImageFileName=/lsass\\.exe/i | groupBy([aid, ComputerName])',
  // Microsoft Sentinel: KQL
  'SigninLogs | where AuthenticationProtocol == "deviceCode" | summarize count() by UserPrincipalName',
  // HarfangLab: YARA
  'rule lsass_minidump { strings: $a = "MiniDumpWriteDump" ascii condition: uint16(0) == 0x5A4D and $a }',
  // Splunk: SPL
  'index=o365 sourcetype=o365:management:activity Operation=New-InboxRule | stats values(Parameters) by UserId',
  'severity: Significant incident  mitre_attack: T1003.001, T1190  impact: Identity Theft',
  'opentide validate --strict && opentide deploy --plan STAGING --dry-run',
]
  // Rows wrap around the text, so the last statement needs the same gap before the first.
  .map((statement) => `${statement}   `)
  .join('');

/** Detections fire below the copy, where the water is near enough to read. */
const PING_DEPTH = { near: 3.4, far: 9 };
/** The moment reduced motion keeps: swells up, no rings. */
const STILL = 7.5;

function rgb(css: string, fallback: Rgb): Rgb {
  const hex = css.trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
}

/**
 * The hero's sea: lines of detection content on a swell that rolls toward the reader, in
 * perspective. Rows drift like a current, the pointer leaves ripples, and now and then a
 * detection fires: a flash, and a ring of light running out across the water. It only runs
 * while on screen in a visible tab; reduced motion keeps one still frame. Without WebGL2 the
 * hero simply has no water.
 */
export function TideSea({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.closest<HTMLElement>('[data-tide-host]') ?? canvas.parentElement ?? canvas;
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains-mono').trim();
    const family = `${mono || '"JetBrains Mono"'}, ui-monospace, Menlo, monospace`;

    let sea: SeaRenderer | null = null;
    // The program links in the background; nothing draws or moves until it has.
    let ready = false;
    // Whether the water moves: not with reduced motion, and not where WebGL runs on the CPU,
    // where an animated sea would cost the page its smoothness. Both keep one still frame.
    let moving = !reduced;
    let pending = 0;
    let raf = 0;
    let onScreen = true;
    let epoch = performance.now();
    let time = STILL;
    let nextPing = 0;
    let last = { x: 0, y: 0, at: 0 };
    // The lantern follows the pointer over the water and fades once it rests or leaves.
    const lamp = { x: 0, depth: 0, strength: 0, seen: -Infinity };

    const colors = () => {
      const styles = getComputedStyle(canvas.closest('.landing') ?? document.documentElement);
      sea?.setColors(
        rgb(styles.getPropertyValue('--landing-sea-ink'), [0, 0.08, 0.54]),
        rgb(styles.getPropertyValue('--landing-sea-glow'), [1, 0.8, 0]),
        parseFloat(styles.getPropertyValue('--landing-sea-strength')) || 1,
      );
    };
    const size = () => {
      const parent = canvas.parentElement;
      if (!parent || !sea) return;
      // A sea drawn on the CPU stays at one pixel per CSS pixel.
      const dpr = sea.software ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      sea.resize(parent.clientWidth, parent.clientHeight, dpr);
    };
    const paint = () => {
      if (ready) sea?.render(time);
    };

    const begin = () => {
      if (!sea) return;
      ready = true;
      if (sea.software) moving = false;
      sea.setFont(family);
      colors();
      size();
      paint();
      // The first frame fades in rather than popping over the copy.
      canvas.setAttribute('data-ready', '');
      start();
    };
    // Ask each frame whether the program has linked; asking the driver to wait would freeze
    // the page for as long as the shaders take to compile.
    const awaitLink = () => {
      pending = 0;
      if (!sea) return;
      const state = sea.ready();
      if (state === null) {
        sea.dispose();
        sea = null;
      } else if (state) begin();
      else pending = requestAnimationFrame(awaitLink);
    };
    const setup = () => {
      sea = SeaRenderer.create(canvas, SOURCE);
      if (sea) awaitLink();
    };

    let lastFrame = 0;
    const loop = (now: number) => {
      raf = 0;
      if (!sea) return;
      // The sea moves slowly: 60 frames a second is plenty on a 120 Hz screen.
      if (now - lastFrame < 1000 / 60 - 2) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastFrame = now;
      time = STILL + (now - epoch) / 1000;
      if (time >= nextPing) {
        // Nearer water more often: that is where a ring reads best.
        const depth = PING_DEPTH.near * Math.pow(PING_DEPTH.far / PING_DEPTH.near, Math.random() ** 1.4);
        const x = (Math.random() * 2 - 1) * halfWidthAt(depth, sea.viewAspect) * 0.72;
        sea.addPing(x, depth, time);
        nextPing = time + 2.6 + Math.random() * 2.4;
      }
      const target = now - lamp.seen < 1200 ? 1 : 0;
      lamp.strength += (target - lamp.strength) * 0.08;
      sea.setLamp(lamp.x, lamp.depth, lamp.strength);
      sea.render(time);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!moving || raf || !onScreen || document.hidden || !sea || !ready) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (e: PointerEvent) => {
      if (!sea || !moving) return;
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2;
      const hit = pointOnWater(nx, ny, sea.viewAspect);
      if (!hit || hit.depth > SEA.farDepth * 0.5) return;
      const now = performance.now();
      Object.assign(lamp, { x: hit.x, depth: hit.depth, seen: now });
      const moved = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const press = e.type === 'pointerdown';
      if (!press && (now - last.at < 70 || moved < 14)) return;
      const speed = moved / Math.max(16, now - last.at);
      sea.addRipple(hit.x, hit.depth, press ? 1 : Math.min(1, Math.max(0.3, speed * 0.5)), time);
      last = { x: e.clientX, y: e.clientY, at: now };
    };

    const onLeave = () => {
      lamp.seen = -Infinity;
    };

    // The mono face may still be loading: redraw the atlas once it is in.
    document.fonts?.load(`500 44px ${family}`).then(
      () => {
        if (!ready) return;
        sea?.setFont(family);
        paint();
      },
      () => undefined,
    );

    // Pick up where the water was, rather than jumping by the time spent away.
    const resume = () => {
      epoch = performance.now() - (time - STILL) * 1000;
      start();
    };
    const onVisibility = () => (document.hidden ? stop() : resume());
    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      cancelAnimationFrame(pending);
      ready = false;
      sea = null;
    };
    const onRestored = () => setup();
    const ro = new ResizeObserver(() => {
      size();
      paint();
    });
    const mo = new MutationObserver(() => {
      colors();
      paint();
    });
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) resume();
      else stop();
    });

    ro.observe(canvas.parentElement ?? canvas);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    io.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    if (!reduced) {
      host.addEventListener('pointermove', onPointer);
      host.addEventListener('pointerdown', onPointer);
      host.addEventListener('pointerleave', onLeave);
      nextPing = STILL + 1.2;
    }
    // Wait for the page to settle: hydration and first input come before the water.
    const idle = window.requestIdleCallback ? window.requestIdleCallback(setup, { timeout: 1500 }) : window.setTimeout(setup, 300);

    return () => {
      stop();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(pending);
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerdown', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      // Callbacks still in flight (the font load) see no sea rather than a disposed one.
      sea?.dispose();
      sea = null;
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden className={`${className ?? ''} block h-full w-full`} />;
}
