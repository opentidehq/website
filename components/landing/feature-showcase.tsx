import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Boxes, Code2, ShieldCheck, Workflow } from 'lucide-react';

const platforms = [
  {
    id: 'sentinel',
    name: 'Microsoft Sentinel',
    src: '/icons/platforms/sentinel.svg',
    kind: 'color' as const,
  },
  {
    id: 'defender',
    name: 'Defender for Endpoint',
    src: '/icons/platforms/defender.svg',
    kind: 'color' as const,
  },
  {
    id: 'splunk',
    name: 'Splunk ES',
    src: '/icons/platforms/splunk.svg',
    kind: 'mono' as const,
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne',
    src: '/icons/platforms/sentinelone.svg',
    kind: 'color' as const,
  },
  {
    id: 'carbon-black',
    name: 'Carbon Black',
    src: '/icons/platforms/carbon-black.png',
    kind: 'raster' as const,
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    src: '/icons/platforms/crowdstrike.png',
    kind: 'raster' as const,
  },
  {
    id: 'harfanglab',
    name: 'HarfangLab',
    src: '/icons/platforms/harfanglab.png',
    kind: 'raster' as const,
  },
] as const;

const surfaces = [
  {
    icon: Code2,
    title: 'CLI & CI',
    body: 'validate · generate · deploy in the same commands your pipelines already run.',
    href: '/docs/cli/',
  },
  {
    icon: Workflow,
    title: 'MCP & agents',
    body: 'Structured tools and skills so agents draft objects humans can still review.',
    href: '/docs/mcp/',
  },
  {
    icon: Boxes,
    title: 'Normative objects',
    body: 'Threats, objectives, and rules share UUIDs — one contract for authors and agents.',
    href: '/docs/usage/concepts/object-model/',
  },
  {
    icon: ShieldCheck,
    title: 'Validation that sticks',
    body: 'Schema, cross-object refs, and platform query checks when the target supports them.',
    href: '/docs/cli/validate/',
  },
] as const;

function PlatformLogo({
  src,
  kind,
}: {
  src: string;
  kind: 'color' | 'mono' | 'raster';
}) {
  if (kind === 'raster') {
    return (
      <Image
        src={src}
        alt=""
        width={36}
        height={36}
        className="size-9 rounded-lg object-contain"
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={
        kind === 'mono'
          ? 'size-9 object-contain opacity-90 dark:invert'
          : 'size-9 object-contain'
      }
      aria-hidden
    />
  );
}

export function FeatureShowcase() {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {/* Platforms — one card */}
      <div className="overflow-hidden rounded-3xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,var(--landing-bg))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--landing-ink)_8%,transparent)]">
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--landing-subtle)]">
              Platforms
            </p>
            <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[var(--landing-ink)] text-balance md:text-3xl">
              One model. Every stack you actually run.
            </h3>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--landing-muted)] text-pretty">
              opentide is built to move with your environment — SIEM today, EDR tomorrow, another
              vendor when the org consolidates. Same objects, same workflows, adapters that plug in
              without rewriting your library.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--landing-muted)]">
              <li className="flex gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]"
                  aria-hidden
                />
                <span>
                  <strong className="font-medium text-[var(--landing-ink)]">Cross-platform</strong>{' '}
                  — author once, target the systems your SOC already trusts
                </span>
              </li>
              <li className="flex gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]"
                  aria-hidden
                />
                <span>
                  <strong className="font-medium text-[var(--landing-ink)]">Flexible</strong> — mix
                  Microsoft, Splunk, CrowdStrike, and more in one repo
                </span>
              </li>
              <li className="flex gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]"
                  aria-hidden
                />
                <span>
                  <strong className="font-medium text-[var(--landing-ink)]">Extensible</strong> — same
                  adapter contract when you add the next platform
                </span>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="https://github.com/OpenTideHQ/opentide/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
              >
                Don&apos;t see your platform? Open an issue{' '}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <Link
                href="/docs/usage/concepts/platforms/"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--landing-subtle)] transition hover:text-[var(--landing-accent)]"
              >
                Platform docs <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="border-t border-[color-mix(in_srgb,var(--landing-ink)_8%,transparent)] bg-[color-mix(in_srgb,var(--landing-ink)_3%,transparent)] p-6 md:p-8 lg:border-t-0 lg:border-l">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {platforms.map((p) => (
                <li
                  key={p.id}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--landing-bg)] px-3 py-5 text-center shadow-[0_0_0_1px_color-mix(in_srgb,var(--landing-ink)_6%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-16px_color-mix(in_srgb,var(--landing-ink)_35%,transparent)]"
                >
                  <PlatformLogo src={p.src} kind={p.kind} />
                  <p className="text-[11px] font-semibold leading-tight text-[var(--landing-ink)] sm:text-[12px]">
                    {p.name}
                  </p>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/OpenTideHQ/opentide/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full min-h-[6.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_18%,transparent)] px-3 py-5 text-center transition hover:border-[var(--landing-accent)]/40 hover:bg-[color-mix(in_srgb,var(--landing-accent)_6%,transparent)]"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--landing-accent)]">
                    Yours next
                  </span>
                  <p className="text-[11px] leading-snug text-[var(--landing-subtle)] sm:text-[12px]">
                    Request a platform
                  </p>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Surfaces */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--landing-subtle)]">
          Surfaces
        </p>
        <h3 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.02em] text-[var(--landing-ink)] text-balance md:text-3xl">
          Specs, shell, agents — one DetectionOps engine underneath.
        </h3>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {surfaces.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,var(--landing-bg))] p-6 transition hover:bg-[color-mix(in_srgb,var(--landing-ink)_7%,var(--landing-bg))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              <s.icon className="size-5 text-[var(--landing-accent)]" aria-hidden />
              <h4 className="mt-4 text-lg font-semibold text-[var(--landing-ink)]">{s.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{s.body}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--landing-ink)] transition group-hover:gap-1.5 group-hover:text-[var(--landing-accent)]">
                Explore <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
