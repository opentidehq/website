import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Code,
  FileText,
  ChevronDown,
  GitBranch,
  Layers,
  Rocket,
  Shield,
  Terminal,
  Waves,
} from 'lucide-react';
import { TidePixelScene } from '@/components/landing/tide-pixel-scene';
import { WaveDivider } from '@/components/landing/wave-divider';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { McpTerminalDemo } from '@/components/landing/mcp-terminal-demo';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

export const metadata: Metadata = {
  title: 'OpenTide — The DetectionOps Engine',
  description:
    'Validate, generate, deploy, and document detection rules across seven security platforms. Agent-native with MCP, CLI, SDK, and normative specifications.',
};

const pipeline = [
  { label: 'Validate', icon: Shield, desc: 'Strict schema and query checks' },
  { label: 'Generate', icon: Layers, desc: 'Schemas, templates, indexes' },
  { label: 'Deploy', icon: Rocket, desc: 'Seven platforms, dry-run safe' },
  { label: 'Document', icon: FileText, desc: 'Published rule narratives' },
];

const surfaces = [
  {
    title: 'Usage',
    tag: 'Start here',
    description: 'Install, scaffold repos, and run DetectionOps workflows end to end.',
    href: '/docs/usage/installation/',
    icon: BookOpen,
    featured: true,
  },
  {
    title: 'Specifications',
    tag: 'Normative',
    description: 'Objects, vocabularies, governance — the contract agents and engines share.',
    href: '/docs/specifications/',
    icon: FileText,
  },
  {
    title: 'CLI',
    tag: 'CI/CD',
    description: 'The same commands locally, in pipelines, and in incident runbooks.',
    href: '/docs/cli/',
    icon: Terminal,
  },
  {
    title: 'MCP',
    tag: 'Agents',
    description: 'Catalogue search, validation reports, and dry-run deploy for assistants.',
    href: '/docs/mcp/',
    icon: Bot,
  },
  {
    title: 'SDK',
    tag: 'Embed',
    description: 'Python registry API for tools that orchestrate detection content.',
    href: '/docs/sdk/',
    icon: Code,
  },
];

const platforms = [
  'Microsoft Sentinel',
  'Defender for Endpoint',
  'Splunk ES',
  'SentinelOne',
  'Carbon Black',
  'CrowdStrike',
  'HarfangLab',
];

const agentBullets = [
  'MCP tools return structured validation — never hallucinated pass/fail',
  'Portable agent skills scaffolded with opentide setup',
  'Platform matrix exposed as resources for honest capability checks',
  'Dry-run deploy before any production SIEM touch',
];

export default function HomePage() {
  return (
    <div className="landing relative overflow-x-hidden">
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        <TidePixelScene className="absolute inset-0 h-full min-h-[480px] w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[var(--landing-bg)]" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-28 md:pb-20 md:pt-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="landing-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--landing-accent)]/40 bg-[var(--landing-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--landing-accent)]">
                <Waves className="size-3.5" aria-hidden />
                DetectionOps engine
              </div>
              <h1 className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.02em] text-balance">
                Ride the tide of{' '}
                <span className="text-[var(--landing-accent)]">detection-as-code</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)] md:text-xl text-pretty">
                OpenTide validates, generates, deploys, and documents rules across seven
                platforms — with MCP, skills, and specs built for engineers and the agents beside
                them.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/docs/usage/installation/" className="landing-btn-primary group">
                  Get started
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/docs/mcp/" className="landing-btn-secondary">
                  <Bot className="size-4" aria-hidden />
                  Wire up agents
                </Link>
              </div>
            </div>

            <div className="landing-fade-in landing-delay-2 rounded-xl border border-[var(--landing-brand)]/30 bg-[var(--landing-surface-deep)]/95 p-1 shadow-lg shadow-black/40">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
                <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
                <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
                <span className="ml-2 font-mono text-xs text-[var(--landing-foam)]">detection-repo</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-[var(--landing-muted)] sm:text-xs md:text-sm">
                <code>{`$ pip install "opentide[sentinel,cli,mcp]>=0.1"
$ export OPENTIDE_REPO_ROOT=./rules

$ opentide setup --yes --platform sentinel
$ opentide generate
$ opentide validate --strict
$ opentide deploy --platform sentinel --dry-run

✓ 142 rules · 0 errors · 7 platforms indexed`}</code>
              </pre>
            </div>
          </div>
        </div>
        <WaveDivider className="relative z-10 -mb-px text-[var(--landing-brand)]" />
        <a
          href="#platforms"
          className="landing-scroll-cue absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full p-3 text-[var(--landing-subtle)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--landing-accent)]"
        >
          <span className="sr-only">Scroll to platforms</span>
          <ChevronDown className="size-5" aria-hidden />
        </a>
      </section>

      <section
        id="platforms"
        className="border-y border-[var(--landing-brand)]/30 bg-[var(--landing-surface-deep)] py-4"
        aria-label="Supported platforms"
      >
        <div className="landing-marquee-wrap overflow-hidden">
          <div className="landing-marquee flex gap-12 whitespace-nowrap text-sm font-medium text-[var(--landing-subtle)]" aria-hidden>
            {[...platforms, ...platforms].map((name, i) => (
              <span key={`${name}-${i}`} className="inline-flex items-center gap-2">
                <GitBranch className="size-3.5 text-[var(--landing-accent)]" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
          Everything flows in one direction
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-subtle)] text-pretty">
          Like the tide, your content moves from draft to deployed — validated at every stage,
          never faking platform capabilities.
        </p>
        <PipelineFlow steps={pipeline} />
      </section>

      <WaveDivider className="text-[var(--landing-surface-raised)]" />

      <section className="landing-section border-t border-[var(--landing-brand)]/20 bg-[var(--landing-surface-deep)]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">Five surfaces, one engine</h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-subtle)] text-pretty">
            Pick the door that matches your job — specs for authors, MCP for agents, CLI for
            pipelines.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {surfaces.map((s, i) => (
              <Link
                key={s.title}
                href={s.href}
                className={`landing-card group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                  s.featured ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
                style={{ '--i': i } as CSSProperties}
              >
                <div
                  className={`landing-surface-card h-full p-6 transition ${
                    s.featured
                      ? 'border-[var(--landing-accent)]/30 bg-[var(--landing-surface-raised)] hover:border-[var(--landing-accent)]/60'
                      : 'hover:border-[var(--landing-accent)]/40 hover:bg-[var(--landing-surface-raised)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <s.icon className="size-8 text-[var(--landing-accent)]" aria-hidden />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        s.featured
                          ? 'bg-[var(--landing-accent)]/20 text-[var(--landing-accent)]'
                          : 'bg-[var(--landing-brand)]/50 text-[var(--landing-foam)]'
                      }`}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold transition-colors group-hover:text-[var(--landing-accent)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--landing-subtle)]">{s.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--landing-foam)] group-hover:text-[var(--landing-accent)]">
                    Explore <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
              Built for the assistants in your IDE
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--landing-subtle)] text-pretty">
              OpenTide does not bolt AI on after the fact. MCP servers, portable skills, and
              structured tool responses are first-class — so agents work safely with live detection
              content.
            </p>
            <ul className="mt-8 space-y-4">
              {agentBullets.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--landing-muted)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/docs/usage/workflows/agentic-setup/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-foam)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Agentic setup guide <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <McpTerminalDemo />
        </div>
      </section>

      <section className="landing-section border-t border-[var(--landing-brand)]/20 bg-[var(--landing-surface-deep)]">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Seven platforms. Honest validation.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--landing-subtle)] text-pretty">
            We deploy everywhere we integrate. We only validate queries where the platform supports
            it — never fake syntax checks.
          </p>
          <ul className="mt-12 flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <li
                key={p}
                className="rounded-full border border-white/10 bg-[var(--landing-surface)] px-4 py-2 text-sm text-[var(--landing-muted)]"
              >
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/docs/usage/concepts/platforms/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-foam)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
            Full capability matrix <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em]">The OpenTide ecosystem</h2>
        <ul className="mt-12 grid list-none gap-4 p-0 md:grid-cols-3">
          {ecosystemLinks.map((repo, i) => (
            <li key={repo.name} className="landing-card" style={{ '--i': i } as CSSProperties}>
              <a
                href={repo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-surface-card block h-full p-6 transition hover:border-[var(--landing-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              >
                <h3 className="text-lg font-semibold">{repo.name}</h3>
                <p className="mt-2 text-sm text-[var(--landing-subtle)]">{repo.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden border-t border-[var(--landing-brand)]/30 bg-[var(--landing-surface-raised)] py-24 md:py-32">
        <WaveDivider className="absolute inset-x-0 top-0 -translate-y-full text-[var(--landing-surface-raised)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Set the standard for DetectionOps
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            The tide is rising. Bring your rules, your agents, and your specs — we will meet you at
            the shore.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/usage/"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--landing-accent)] px-8 py-3.5 text-sm font-bold text-[var(--landing-bg)] transition hover:bg-[#ffe566] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore documentation
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="https://pypi.org/project/opentide/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[var(--landing-bg)] px-8 py-3.5 text-sm font-semibold text-[var(--landing-muted)] transition hover:border-[var(--landing-foam)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Install from PyPI
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
