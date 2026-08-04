/** Platform logos: Azure-Sentinel, Elastic integrations, Splunk SOAR connector repos */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** Platform logos sourced from vendor/integration repos. See public/icons/platforms/README */
const platforms = [
  {
    id: 'sentinel',
    name: 'Microsoft Sentinel',
    tag: 'deploy + validate',
    src: '/icons/platforms/sentinel.svg',
    raster: false,
  },
  {
    id: 'defender',
    name: 'Defender for Endpoint',
    tag: 'deploy + validate',
    src: '/icons/platforms/defender.svg',
    raster: false,
  },
  {
    id: 'splunk',
    name: 'Splunk ES',
    tag: 'deploy',
    src: '/icons/platforms/splunk.svg',
    raster: false,
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne',
    tag: 'deploy',
    src: '/icons/platforms/sentinelone.svg',
    raster: false,
  },
  {
    id: 'carbon-black',
    name: 'Carbon Black',
    tag: 'deploy',
    src: '/icons/platforms/carbon-black.svg',
    raster: false,
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    tag: 'deploy',
    src: '/icons/platforms/crowdstrike.svg',
    raster: false,
  },
  {
    id: 'harfanglab',
    name: 'HarfangLab',
    tag: 'deploy',
    src: '/icons/platforms/harfanglab.png',
    raster: true,
  },
] as const;

function PlatformLogo({ src, name, raster }: { src: string; name: string; raster: boolean }) {
  return (
    <div className="relative size-8 opacity-80 transition group-hover:opacity-100">
      {raster ? (
        <Image src={src} alt="" width={32} height={32} className="size-8 object-contain" aria-hidden />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="size-8 object-contain brightness-0 invert opacity-90 transition group-hover:opacity-100"
          aria-hidden
        />
      )}
    </div>
  );
}

export function PlatformGrid() {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {platforms.map((p) => (
          <li key={p.id}>
            <div className="group landing-surface-card flex h-full flex-col items-center gap-3 p-5 text-center transition hover:border-[var(--landing-accent)]/25">
              <div className="flex size-12 items-center justify-center rounded-full bg-[var(--landing-bg)] ring-1 ring-[var(--landing-border-subtle)] transition group-hover:ring-[var(--landing-accent)]/20">
                <PlatformLogo src={p.src} name={p.name} raster={p.raster} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--landing-ink)]">{p.name}</p>
                <p className="mt-0.5 font-mono text-[9px] text-[var(--landing-subtle)]">{p.tag}</p>
              </div>
            </div>
          </li>
        ))}
        <li>
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--landing-border)] p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--landing-accent)]">extensible</p>
            <p className="mt-2 text-sm text-[var(--landing-subtle)]">Platform adapters follow the same normative contract</p>
          </div>
        </li>
      </ul>
      <Link
        href="/docs/usage/concepts/platforms/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-muted)] transition hover:text-[var(--landing-accent)]"
      >
        Full capability matrix <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
