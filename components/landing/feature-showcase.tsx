import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import type { ReactNode } from 'react';

function FeatureCard({
  title,
  description,
  children,
  className,
  href,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  href?: string;
}) {
  const inner = (
    <div className={`flex h-full flex-col border-t border-white/15 pt-6 ${className ?? ''}`}>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--landing-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{description}</p>
      {children && <div className="mt-5 min-h-0 flex-1">{children}</div>}
      {href && (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--landing-subtle)] transition group-hover:text-[var(--eu-yellow)]">
          Explore <ArrowRight className="size-3.5" aria-hidden />
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--eu-yellow)]"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function CodeSnippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] text-[11px] shadow-sm">
      <div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] text-zinc-500">{title}</div>
      <pre className="overflow-x-auto p-3 font-mono leading-relaxed text-zinc-400">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const platforms = [
  { id: 'sentinel', name: 'Microsoft Sentinel', tag: 'deploy + validate', src: '/icons/platforms/sentinel.svg', raster: false },
  { id: 'defender', name: 'Defender for Endpoint', tag: 'deploy + validate', src: '/icons/platforms/defender.svg', raster: false },
  { id: 'splunk', name: 'Splunk ES', tag: 'deploy', src: '/icons/platforms/splunk.svg', raster: false },
  { id: 'sentinelone', name: 'SentinelOne', tag: 'deploy', src: '/icons/platforms/sentinelone.svg', raster: false },
  { id: 'carbon-black', name: 'Carbon Black', tag: 'deploy', src: '/icons/platforms/carbon-black.svg', raster: false },
  { id: 'crowdstrike', name: 'CrowdStrike', tag: 'deploy', src: '/icons/platforms/crowdstrike.svg', raster: false },
  { id: 'harfanglab', name: 'HarfangLab', tag: 'deploy', src: '/icons/platforms/harfanglab.png', raster: true },
] as const;

function PlatformLogo({ src, raster }: { src: string; raster: boolean }) {
  return (
    <div className="relative size-7 opacity-80 transition group-hover:opacity-100">
      {raster ? (
        <Image src={src} alt="" width={28} height={28} className="size-7 object-contain" aria-hidden />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="size-7 object-contain brightness-0 invert opacity-90 transition group-hover:opacity-100"
          aria-hidden
        />
      )}
    </div>
  );
}

function MultiPlatformCard() {
  return (
    <div className="border-t border-white/15 pt-6 lg:col-span-2">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--landing-ink)]">
            One rule model, honest adapters per platform
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">
            Deploy the same normative objects to Sentinel, Defender, Splunk, and more. We validate
            queries only where the platform honestly supports it. Never fake syntax checks on
            deploy-only adapters.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-[var(--landing-muted)]">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
              <span>
                <strong className="text-[var(--landing-ink)]">deploy + validate:</strong> live query
                checks where supported
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
              <span>
                <strong className="text-[var(--landing-ink)]">deploy only:</strong> honest flags when
                syntax validation isn&apos;t available
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
              <span>Extensible adapter contract as your stack grows</span>
            </li>
          </ul>
          <Link
            href="/docs/usage/concepts/platforms/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--eu-yellow)] transition hover:text-[var(--color-yellow-lift)]"
          >
            Full capability matrix <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {platforms.map((p) => (
            <li key={p.id} className="group flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center">
                <PlatformLogo src={p.src} raster={p.raster} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[var(--landing-ink)]">{p.name}</p>
                <p className="font-mono text-[10px] text-[var(--landing-subtle)]">{p.tag}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export function FeatureShowcase() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MultiPlatformCard />

      <FeatureCard
        title="A truly composable engine"
        description="Content to core to surfaces. Same DetectionOps engine in your shell, CI, and agent tools. Mix CLI, MCP, and SDK without rebuilding workflows."
        href="/docs/mcp/"
      >
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10 text-sm">
          {[
            ['opentide CLI', 'validate · generate · deploy in pipelines'],
            ['opentide-mcp', 'structured tool output for agents'],
            ['Python SDK', 'embed the registry in your orchestration'],
          ].map(([name, desc]) => (
            <li key={name} className="px-3 py-2.5">
              <p className="font-mono text-xs text-[var(--eu-yellow)]">{name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
            </li>
          ))}
        </ul>
      </FeatureCard>

      <FeatureCard
        title="Normative objects, not ad-hoc YAML"
        description="Threats, objectives, and rules chain together with stable UUIDs: the contract humans and agents share when authoring detection content."
        className="lg:col-span-2"
        href="/docs/specifications/"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeSnippet
            title="objects/objectives/credential-access.yaml"
            code={`objective:
  threats:
    - 00000000-0000-4000-8001-…010
  signals:
    - name: LSASS process access`}
          />
          <CodeSnippet
            title="objects/rules/lsass-memory-access.yaml"
            code={`detection_model: 00000000-…002-…001
configurations:
  sentinel:
    query: |
      DeviceProcessEvents
      | where TargetImage has "lsass.exe"`}
          />
        </div>
      </FeatureCard>

      <FeatureCard
        title="Honest validation gates"
        description="Strict schema checks, cross-object references, and platform query honesty, so pass/fail means something in CI and in agent loops."
        href="/docs/cli/validate/"
      >
        <CodeSnippet
          title="terminal"
          code={`$ opentide validate --strict
✓ schema · uuid-format
✓ cross-object references
✓ sentinel KQL honesty
0 blocking errors`}
        />
      </FeatureCard>

      <FeatureCard
        title="Human ↔ agentic spectrum"
        description="Engineers drive every change, agents draft with MCP skills, or fully autonomous pipelines with dry-run deploy. You set the balance per workflow."
        className="lg:col-span-2"
        href="/docs/usage/workflows/agentic-setup/"
      />
    </div>
  );
}
