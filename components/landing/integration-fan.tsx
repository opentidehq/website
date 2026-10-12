'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { BlockHead, Tag } from '@/components/landing/ui';
import { useInView } from '@/lib/hooks/use-in-view';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Integration = {
  key: string;
  name: string;
  language: string;
  live: boolean;
  src: string;
  kind: 'color' | 'mono' | 'raster';
};

/** Capabilities as of opentide 0.12: every integration deploys; most also take a live tenant query check. */
const INTEGRATIONS: Integration[] = [
  { key: 'sentinel', name: 'Microsoft Sentinel', language: 'KQL', live: true, src: '/icons/platforms/sentinel.svg', kind: 'color' },
  { key: 'defender_for_endpoint', name: 'Defender for Endpoint', language: 'KQL', live: true, src: '/icons/platforms/defender.svg', kind: 'color' },
  { key: 'splunk', name: 'Splunk Enterprise Security', language: 'SPL', live: true, src: '/icons/platforms/splunk.svg', kind: 'mono' },
  { key: 'sentinel_one', name: 'SentinelOne', language: 'S1QL', live: true, src: '/icons/platforms/sentinelone.svg', kind: 'color' },
  { key: 'carbon_black_cloud', name: 'Carbon Black Cloud', language: 'Lucene', live: true, src: '/icons/platforms/carbon-black.png', kind: 'raster' },
  { key: 'crowdstrike', name: 'CrowdStrike Falcon', language: 'correlation filter', live: false, src: '/icons/platforms/crowdstrike.png', kind: 'raster' },
  { key: 'harfanglab', name: 'HarfangLab', language: 'Sigma or YARA', live: false, src: '/icons/platforms/harfanglab.png', kind: 'raster' },
];

function Logo({ src, kind }: { src: string; kind: Integration['kind'] }) {
  if (kind === 'raster') {
    return <Image src={src} alt="" width={28} height={28} className="size-7 shrink-0 rounded-md object-contain" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`size-7 shrink-0 object-contain ${kind === 'mono' ? 'opacity-90 dark:invert' : ''}`}
      aria-hidden
    />
  );
}

type Wire = { d: string; x1: number; y1: number; dashed?: boolean };

/**
 * One rule, one block per integration: the configuration keys fan out to the integrations
 * they deploy to. Wires are measured from the rows they join, so they hold at any width.
 */
export function IntegrationFan() {
  const reduced = usePrefersReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const keyRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const card = cardRef.current;
    if (!card) return;
    const box = stage.getBoundingClientRect();
    // Every wire leaves from the card's edge, level with its key, so the fan never crosses.
    const edge = card.getBoundingClientRect().right - box.left;
    const next: Wire[] = [];
    keyRefs.current.forEach((keyEl, i) => {
      const tileEl = tileRefs.current[i];
      if (!keyEl || !tileEl) return;
      const k = keyEl.getBoundingClientRect();
      const t = tileEl.getBoundingClientRect();
      const x1 = edge;
      const y1 = k.top + k.height / 2 - box.top;
      const x2 = t.left - box.left - 4;
      const y2 = t.top + t.height / 2 - box.top;
      const mx = x1 + (x2 - x1) * 0.5;
      next.push({ d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, x1, y1, dashed: i === INTEGRATIONS.length });
    });
    setWires(next);
    setSize({ w: box.width, h: box.height });
  }, []);

  // A ResizeObserver reports once as soon as it observes, so it also takes the first measure.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.fonts?.ready.then(measure, () => undefined);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
      <div data-reveal>
        <BlockHead title="One model. Every integration. No rewrites." />
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          A rule carries one configuration block per integration, so adding one adds a block, not a
          rewrite: threats and objectives stay as they are. opentide deploys the same rule to each, and
          checks the query against the tenant wherever the integration allows it.
        </p>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          <span className="font-semibold text-[var(--landing-ink)]">CrowdStrike and HarfangLab are deploy-only today</span>
          , and their query checks say so:{' '}
          <code className="font-mono text-base text-[var(--landing-ink)]">&quot;supported&quot;: false</code>.
        </p>
        <Link
          href="/docs/usage/concepts/platforms/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
        >
          Capability matrix <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div ref={viewRef} data-reveal>
        <div
          ref={stageRef}
          className="relative grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-center md:gap-20"
        >
          <figure ref={cardRef} className="landing-panel relative z-10 m-0 overflow-hidden">
            <figcaption className="border-b border-[var(--landing-border)] px-4 py-3">
              <span className="block font-mono text-[11px] text-[var(--landing-subtle)]">rule::1.1</span>
              <span className="block text-sm font-semibold text-[var(--landing-ink)]">one rule, one block each</span>
            </figcaption>
            <pre className="m-0 overflow-hidden px-4 py-3 font-mono text-[12.5px] leading-[1.9] text-[var(--landing-ink)]">
              <span className="text-[var(--landing-subtle)]">detection_model: …0001{'\n'}</span>
              <span className="text-[var(--landing-subtle)]">configurations:{'\n'}</span>
              {INTEGRATIONS.map((p, i) => (
                <span key={p.key}>
                  {'  '}
                  <span
                    ref={(el) => {
                      keyRefs.current[i] = el;
                    }}
                    className="text-[var(--landing-accent)]"
                  >
                    {p.key}:
                  </span>
                  {'\n'}
                </span>
              ))}
              {'  '}
              <span
                ref={(el) => {
                  keyRefs.current[INTEGRATIONS.length] = el;
                }}
                className="text-[var(--landing-dim)]"
              >
                your_next_one:
              </span>
            </pre>
          </figure>

          {/* Wires only where the two columns sit side by side. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block"
            width={size.w}
            height={size.h}
          >
            {wires.map((wire, i) => (
              <g key={i}>
                <path
                  d={wire.d}
                  pathLength={1}
                  fill="none"
                  stroke={wire.dashed ? 'color-mix(in srgb, var(--landing-ink) 25%, transparent)' : 'color-mix(in srgb, var(--landing-accent) 38%, transparent)'}
                  strokeWidth={1.5}
                  strokeDasharray={wire.dashed ? '3 4' : undefined}
                  className={wire.dashed ? undefined : 'landing-draw'}
                  data-drawn={inView || reduced ? '' : undefined}
                  style={{ transitionDelay: `${150 + i * 90}ms` }}
                />
                <circle
                  cx={wire.x1}
                  cy={wire.y1}
                  r={3}
                  fill={wire.dashed ? 'var(--landing-panel)' : 'var(--landing-accent)'}
                  stroke={wire.dashed ? 'color-mix(in srgb, var(--landing-ink) 30%, transparent)' : 'none'}
                />
                {!wire.dashed && inView && !reduced && (
                  <path
                    d={wire.d}
                    fill="none"
                    stroke="var(--landing-accent)"
                    strokeWidth={2}
                    className="landing-flow"
                    style={{ animationDelay: `${i * -0.13}s` }}
                  />
                )}
              </g>
            ))}
          </svg>

          <ul className="relative z-10 m-0 grid list-none grid-cols-1 gap-2 p-0">
            {INTEGRATIONS.map((p, i) => (
              <li
                key={p.key}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                className="landing-panel flex items-center gap-3 px-3.5 py-2.5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]"
              >
                <Logo src={p.src} kind={p.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug text-[var(--landing-ink)]">{p.name}</p>
                  <p className="truncate font-mono text-[11px] text-[var(--landing-subtle)]">{p.language}</p>
                </div>
                <Tag tone={p.live ? 'accent' : 'outline'}>{p.live ? 'live check' : 'deploy-only'}</Tag>
              </li>
            ))}
            <li
              ref={(el) => {
                tileRefs.current[INTEGRATIONS.length] = el;
              }}
            >
              <a
                href="https://github.com/OpenTideHQ/opentide/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)] px-3.5 py-3 text-sm transition hover:border-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              >
                <span className="text-[var(--landing-subtle)]">Your integration next?</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--landing-accent)]">
                  Request it <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
