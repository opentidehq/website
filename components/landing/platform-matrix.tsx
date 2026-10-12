import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Platform = {
  id: string;
  name: string;
  flag: string;
  language: string;
  live: boolean;
  src: string;
  kind: 'color' | 'mono' | 'raster';
};

/** Capabilities as of opentide 0.12: every platform deploys; five also take a live tenant query check. */
const PLATFORMS: Platform[] = [
  { id: 'sentinel', name: 'Microsoft Sentinel', flag: 'sentinel', language: 'KQL', live: true, src: '/icons/platforms/sentinel.svg', kind: 'color' },
  { id: 'defender', name: 'Defender for Endpoint', flag: 'defender_for_endpoint', language: 'KQL', live: true, src: '/icons/platforms/defender.svg', kind: 'color' },
  { id: 'splunk', name: 'Splunk Enterprise Security', flag: 'splunk', language: 'SPL', live: true, src: '/icons/platforms/splunk.svg', kind: 'mono' },
  { id: 'sentinelone', name: 'SentinelOne', flag: 'sentinel_one', language: 'S1QL', live: true, src: '/icons/platforms/sentinelone.svg', kind: 'color' },
  { id: 'carbon-black', name: 'Carbon Black Cloud', flag: 'carbon_black_cloud', language: 'Lucene', live: true, src: '/icons/platforms/carbon-black.png', kind: 'raster' },
  { id: 'crowdstrike', name: 'CrowdStrike Falcon', flag: 'crowdstrike', language: 'correlation filter', live: false, src: '/icons/platforms/crowdstrike.png', kind: 'raster' },
  { id: 'harfanglab', name: 'HarfangLab', flag: 'harfanglab', language: 'Sigma or YARA', live: false, src: '/icons/platforms/harfanglab.png', kind: 'raster' },
];

const NEXT = [
  {
    name: 'Elastic Security',
    status: 'RFC 0007 accepted · implementation in a community pull request',
    href: 'https://github.com/OpenTideHQ/opentide/issues/386',
  },
  {
    name: 'Sysdig Secure + Falco',
    status: 'proposed',
    href: 'https://github.com/OpenTideHQ/opentide/issues/143',
  },
] as const;

function Logo({ src, kind }: { src: string; kind: Platform['kind'] }) {
  if (kind === 'raster') {
    return <Image src={src} alt="" width={32} height={32} className="size-8 rounded-md object-contain" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={kind === 'mono' ? 'size-8 object-contain opacity-90 dark:invert' : 'size-8 object-contain'}
      aria-hidden
    />
  );
}

/** One model, seven platforms: what each one deploys and checks, with the flag you pass. */
export function PlatformMatrix() {
  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
      <div>
        <p className="max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          A rule carries one configuration block per platform. The same object deploys to each of
          them, and validation runs against the tenant wherever the platform exposes a query check.
        </p>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-[var(--landing-ink)] text-pretty">
          Five platforms get a live query check in CI.{' '}
          <span className="font-semibold text-[var(--landing-accent)]">
            CrowdStrike and HarfangLab are deploy-only today
          </span>
          , and every result says so:{' '}
          <code className="font-mono text-base">&quot;supported&quot;: false</code>.
        </p>

        <p className="mt-10 font-mono text-sm text-[var(--landing-subtle)]">next</p>
        <ul className="mt-3 list-none space-y-3 p-0">
          {NEXT.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-dashed border-[var(--landing-border)] px-4 py-3 transition hover:border-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              >
                <span className="font-semibold text-[var(--landing-ink)]">{item.name}</span>
                <span className="font-mono text-xs text-[var(--landing-subtle)]">{item.status}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link
            href="/docs/usage/concepts/platforms/"
            className="inline-flex items-center gap-1.5 font-medium text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
          >
            Capability matrix <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <li
            key={p.id}
            className="flex items-start gap-4 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)] px-4 py-3.5"
          >
            <span className="mt-0.5 shrink-0">
              <Logo src={p.src} kind={p.kind} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-snug text-[var(--landing-ink)]">{p.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    p.live
                      ? 'bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)]'
                      : 'border border-[var(--landing-border)] text-[var(--landing-subtle)]'
                  }`}
                >
                  {p.live ? 'live check' : 'deploy-only'}
                </span>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-[var(--landing-subtle)]">--platform {p.flag}</p>
              <p className="font-mono text-[11px] text-[var(--landing-subtle)]">{p.language}</p>
            </div>
          </li>
        ))}
        <li>
          <a
            href="https://github.com/OpenTideHQ/opentide/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--landing-border)] px-4 py-3.5 text-sm transition hover:border-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
            <span className="text-[var(--landing-subtle)]">Your platform next?</span>
            <span className="inline-flex items-center gap-1 font-medium text-[var(--landing-accent)]">
              Request it <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </a>
        </li>
      </ul>
    </div>
  );
}
