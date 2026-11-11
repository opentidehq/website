'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Shield } from 'lucide-react';
import type { CSSProperties } from 'react';
import { BlockHead } from '@/components/landing/ui';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type Integration = {
  key: string;
  name: string;
  /** What `opentide deploy` creates there, in the platform specs' words. */
  deploys: string;
  /** Unset for `placeholder`. */
  src?: string;
  /** `placeholder`: no vendor artwork in the repo yet, so a neutral glyph stands in for the logo. */
  kind: 'color' | 'mono' | 'raster' | 'placeholder';
};

const INTEGRATIONS: Integration[] = [
  { key: 'sentinel', name: 'Microsoft Sentinel', deploys: 'KQL analytics rule', src: '/icons/platforms/sentinel.svg', kind: 'color' },
  { key: 'defender_for_endpoint', name: 'Defender for Endpoint', deploys: 'KQL custom detection', src: '/icons/platforms/defender.svg', kind: 'color' },
  { key: 'splunk', name: 'Splunk Enterprise Security', deploys: 'SPL saved search', src: '/icons/platforms/splunk.svg', kind: 'mono' },
  { key: 'sentinel_one', name: 'SentinelOne', deploys: 'S1QL STAR rule', src: '/icons/platforms/sentinelone.svg', kind: 'color' },
  { key: 'carbon_black_cloud', name: 'Carbon Black Cloud', deploys: 'Lucene watchlist IOC', src: '/icons/platforms/carbon-black.png', kind: 'raster' },
  { key: 'crowdstrike', name: 'CrowdStrike Falcon', deploys: 'correlation rule', src: '/icons/platforms/crowdstrike.png', kind: 'raster' },
  { key: 'harfanglab', name: 'HarfangLab', deploys: 'Sigma or YARA rule', src: '/icons/platforms/harfanglab.png', kind: 'raster' },
  { key: 'elastic', name: 'Elastic Security', deploys: 'KQL, EQL or ES|QL rule', src: '/icons/platforms/elastic.svg', kind: 'color' },
  { key: 'sysdig', name: 'Sysdig Secure + Falco', deploys: 'Falco rule', src: '/icons/platforms/falco.svg', kind: 'color' },
  // No Bitdefender artwork in public/icons/platforms yet: a neutral placeholder, not the vendor mark.
  { key: 'bitdefender', name: 'Bitdefender GravityZone', deploys: 'custom detection or YARA rule', kind: 'placeholder' },
];

/** When a wire has drawn in: the check on its tile lands just after. */
const wireDelay = (i: number) => 150 + i * 90;

function Logo({ src, kind }: { src?: string; kind: Integration['kind'] }) {
  if (kind === 'placeholder' || !src) {
    return (
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-md border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_25%,transparent)] text-[var(--landing-subtle)]"
      >
        <Shield className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
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


/** The card's header and its `detection_model` / `configurations:` lines take the first two rows. */
const HEAD_ROWS = 2;
/** One row per block, `your_next_one` included. */
const BLOCK_ROWS = INTEGRATIONS.length + 1;

/**
 * A short horizontal connector from the card's edge to the tile on the same row. Both sit in one
 * grid row, so a key and its integration always line up and no connector crosses another.
 */
function Wire({ row, next, drawn, flowing, delay }: { row: number; next?: boolean; drawn: boolean; flowing: boolean; delay: number }) {
  return (
    <div aria-hidden className="hidden items-center pr-1 md:flex" style={{ gridColumn: 2, gridRow: row }}>
      <svg className="h-2 w-full overflow-visible">
        <line
          x1="0"
          x2="100%"
          y1="50%"
          y2="50%"
          stroke={next ? 'color-mix(in srgb, var(--landing-ink) 28%, transparent)' : 'color-mix(in srgb, var(--landing-accent) 45%, transparent)'}
          strokeWidth={1.5}
          strokeDasharray="3 4"
          className="landing-fade-line"
          data-drawn={drawn ? '' : undefined}
          style={{ transitionDelay: `${delay}ms` }}
        />
        {flowing && (
          <line x1="0" x2="100%" y1="50%" y2="50%" stroke="var(--landing-accent)" strokeWidth={2} className="landing-flow" style={{ animationDelay: `${row * -0.13}s` }} />
        )}
        <circle
          cx="0"
          cy="50%"
          r={3}
          fill={next ? 'var(--landing-panel)' : 'var(--landing-accent)'}
          stroke={next ? 'color-mix(in srgb, var(--landing-ink) 30%, transparent)' : 'none'}
        />
      </svg>
    </div>
  );
}

/**
 * One rule, one block per integration: each configuration key sits level with the integration
 * it deploys to. From `md` the card, the connectors and the tiles share one grid row per block
 * (the card and the list are subgrids), so they line up at any width without measuring. Below
 * `md` the card stacks above the list and the connectors drop out.
 */
export function IntegrationFan() {
  const reduced = usePrefersReducedMotion();
  // Starts with the block's reveal, so the connectors come in where they can be seen.
  const { ref: viewRef, seen: inView } = useOnScreen<HTMLDivElement>({ rootMargin: '0px 0px -15% 0px' });
  const shown = inView || reduced;
  const rows = { '--fan-rows': HEAD_ROWS + BLOCK_ROWS, '--fan-blocks': BLOCK_ROWS } as CSSProperties;

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
          style={rows}
          className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,14.5rem)_minmax(2rem,4.5rem)_minmax(0,1fr)] md:gap-x-0 md:gap-y-2"
        >
          <figure className="landing-panel m-0 overflow-hidden md:col-start-1 md:grid md:grid-rows-subgrid md:[grid-row:1/span_var(--fan-rows)]">
            <figcaption className="border-b border-[var(--landing-border)] px-4 py-3">
              <span className="block font-mono text-[11px] text-[var(--landing-subtle)]">rule::1.1</span>
              <span className="block text-sm font-semibold text-[var(--landing-ink)]">one rule, one block each</span>
            </figcaption>
            <div className="self-end px-4 pt-3 font-mono text-[12.5px] leading-[1.9] text-[var(--landing-subtle)]">
              <span className="block">detection_model: …0001</span>
              <span className="block">configurations:</span>
            </div>
            {INTEGRATIONS.map((p) => (
              <span
                key={p.key}
                className="block truncate pl-8 pr-4 font-mono text-[12.5px] leading-[1.9] text-[var(--landing-accent)] md:flex md:items-center"
              >
                {p.key}:
              </span>
            ))}
            <span className="block truncate pb-3 pl-8 pr-4 font-mono text-[12.5px] leading-[1.9] text-[var(--landing-dim)] md:flex md:items-center md:pb-0">
              your_next_one:
            </span>
          </figure>

          {INTEGRATIONS.map((p, i) => (
            <Wire key={p.key} row={HEAD_ROWS + 1 + i} drawn={shown} flowing={inView && !reduced} delay={wireDelay(i)} />
          ))}
          <Wire row={HEAD_ROWS + BLOCK_ROWS} next drawn={shown} flowing={false} delay={wireDelay(INTEGRATIONS.length)} />

          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:col-start-3 md:grid-rows-subgrid md:[grid-row:3/span_var(--fan-blocks)]">
            {INTEGRATIONS.map((p, i) => (
              <li
                key={p.key}
                className="landing-panel flex items-center gap-3 px-3.5 py-2.5 transition-[translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)]"
              >
                <Logo src={p.src} kind={p.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug text-[var(--landing-ink)]">{p.name}</p>
                  <p className="truncate font-mono text-[11px] text-[var(--landing-subtle)]">{p.deploys}</p>
                </div>
                {/* Lands once the block's connector has come in: the rule, deployed. */}
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center rounded-full bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)] transition-[opacity,scale] duration-300 ${
                    shown ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                  }`}
                  style={{ transitionDelay: reduced ? undefined : `${wireDelay(i) + 800}ms` }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              </li>
            ))}
            <li className="flex">
              <a
                href="https://github.com/opentidehq/opentide/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-between gap-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)] px-3.5 py-3 text-sm transition hover:border-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
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
