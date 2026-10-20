'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { BlockHead } from '@/components/landing/ui';
import { useMeasure } from '@/lib/hooks/use-measure';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Integration = {
  key: string;
  name: string;
  /** What `opentide deploy` creates there, in the platform specs' words. */
  deploys: string;
  src: string;
  kind: 'color' | 'mono' | 'raster';
};

const INTEGRATIONS: Integration[] = [
  { key: 'sentinel', name: 'Microsoft Sentinel', deploys: 'KQL analytics rule', src: '/icons/platforms/sentinel.svg', kind: 'color' },
  { key: 'defender_for_endpoint', name: 'Defender for Endpoint', deploys: 'KQL custom detection', src: '/icons/platforms/defender.svg', kind: 'color' },
  { key: 'splunk', name: 'Splunk Enterprise Security', deploys: 'SPL saved search', src: '/icons/platforms/splunk.svg', kind: 'mono' },
  { key: 'sentinel_one', name: 'SentinelOne', deploys: 'S1QL STAR rule', src: '/icons/platforms/sentinelone.svg', kind: 'color' },
  { key: 'carbon_black_cloud', name: 'Carbon Black Cloud', deploys: 'Lucene watchlist IOC', src: '/icons/platforms/carbon-black.png', kind: 'raster' },
  { key: 'crowdstrike', name: 'CrowdStrike Falcon', deploys: 'correlation rule', src: '/icons/platforms/crowdstrike.png', kind: 'raster' },
  { key: 'harfanglab', name: 'HarfangLab', deploys: 'Sigma or YARA rule', src: '/icons/platforms/harfanglab.png', kind: 'raster' },
];

/** When a wire has drawn in: the check on its tile lands just after. */
const wireDelay = (i: number) => 150 + i * 90;

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
  // Starts with the block's reveal, so the wires draw in where they can be seen.
  const { ref: viewRef, seen: inView } = useOnScreen<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px' });
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const keyRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);

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
  }, []);

  useMeasure(stageRef, measure);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
      <div data-reveal>
        <BlockHead title="One model. Every integration. No rewrites." />
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          A rule carries one configuration block per integration, so adding an integration adds a block,
          not a rewrite. Threats and objectives stay as they are.
        </p>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          <code className="font-mono text-base text-[var(--landing-ink)]">opentide deploy</code>{' '}turns each
          block into that integration&rsquo;s own detection, from a Sentinel analytics rule to a Splunk saved
          search. The rule&rsquo;s status decides where it lands: staging tenants while you refine it,
          production once it is live.
        </p>
        <Link
          href="/docs/usage/workflows/detection-as-code/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
        >
          The detection-as-code workflow <ArrowRight className="size-3.5" aria-hidden />
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
          >
            {wires.map((wire, i) => (
              <g key={i}>
                <path
                  d={wire.d}
                  pathLength={wire.dashed ? undefined : 1}
                  fill="none"
                  stroke={wire.dashed ? 'color-mix(in srgb, var(--landing-ink) 25%, transparent)' : 'color-mix(in srgb, var(--landing-accent) 38%, transparent)'}
                  strokeWidth={1.5}
                  strokeDasharray={wire.dashed ? '3 4' : undefined}
                  className={wire.dashed ? undefined : 'landing-draw'}
                  data-drawn={inView || reduced ? '' : undefined}
                  style={{ transitionDelay: `${wireDelay(i)}ms` }}
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
                className="landing-panel flex items-center gap-3 px-3.5 py-2.5 transition-[translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]"
              >
                <Logo src={p.src} kind={p.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug text-[var(--landing-ink)]">{p.name}</p>
                  <p className="truncate font-mono text-[11px] text-[var(--landing-subtle)]">{p.deploys}</p>
                </div>
                {/* Lands once the block's wire has drawn in: the rule, deployed. */}
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center rounded-full bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)] transition-[opacity,scale] duration-300 ${
                    inView || reduced ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                  }`}
                  style={{ transitionDelay: reduced ? undefined : `${wireDelay(i) + 800}ms` }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              </li>
            ))}
            <li
              ref={(el) => {
                tileRefs.current[INTEGRATIONS.length] = el;
              }}
            >
              <a
                href="https://github.com/opentidehq/opentide/issues/new"
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
