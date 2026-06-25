import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Code,
  FileText,
  GitBranch,
  Layers,
  Rocket,
  Shield,
  Terminal,
  Waves,
  UserRound,
  Sparkles,
} from 'lucide-react';
import { TideDitherScene } from '@/components/landing/tide-dither-scene';
import { HeroTerminal } from '@/components/landing/hero-terminal';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { McpTerminalDemo } from '@/components/landing/mcp-terminal-demo';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

export const metadata: Metadata = {
  title: 'opentide — The DetectionOps Engine',
  description:
    'Structure detection engineering end to end. Human-in-the-loop or fully agentic — validate, generate, deploy, and document rules across seven platforms.',
};

const pipeline = [
  {
    label: 'Validate',
    icon: Shield,
    desc: 'Schema, query, and platform honesty checks',
    color: '#ffcc00',
    bg: 'rgba(255, 204, 0, 0.12)',
  },
  {
    label: 'Generate',
    icon: Layers,
    desc: 'Schemas, templates, and indexes from your repo',
    color: '#e6b800',
    bg: 'rgba(255, 204, 0, 0.08)',
  },
  {
    label: 'Deploy',
    icon: Rocket,
    desc: 'Seven platforms, dry-run before production',
    color: '#fff0a3',
    bg: 'rgba(255, 204, 0, 0.15)',
  },
  {
    label: 'Document',
    icon: FileText,
    desc: 'Published narratives for analysts and auditors',
    color: '#c9a000',
    bg: 'rgba(255, 204, 0, 0.1)',
  },
];

const surfaces = [
  {
    title: 'Usage',
    tag: 'DetectionOps',
    description: 'Scaffold repos, wire CI, and run structured workflows — solo or with agents.',
    href: '/docs/usage/installation/',
    icon: BookOpen,
    iconColor: '#ffcc00',
    iconBg: 'rgba(255, 204, 0, 0.12)',
    featured: true,
  },
  {
    title: 'Specifications',
    tag: 'Normative',
    description: 'Objects, vocabularies, governance — the contract humans and agents share.',
    href: '/docs/specifications/',
    icon: FileText,
    iconColor: '#e6b800',
    iconBg: 'rgba(255, 204, 0, 0.08)',
  },
  {
    title: 'CLI',
    tag: 'Pipelines',
    description: 'Same commands in your shell, CI, and incident runbooks.',
    href: '/docs/cli/',
    icon: Terminal,
    iconColor: '#fff0a3',
    iconBg: 'rgba(255, 204, 0, 0.1)',
  },
  {
    title: 'MCP',
    tag: 'Agents',
    description: 'Structured tool output for assistants — no hallucinated pass/fail.',
    href: '/docs/mcp/',
    icon: Bot,
    iconColor: '#ffcc00',
    iconBg: 'rgba(255, 204, 0, 0.14)',
  },
  {
    title: 'SDK',
    tag: 'Embed',
    description: 'Python registry API for orchestration you already own.',
    href: '/docs/sdk/',
    icon: Code,
    iconColor: '#c9a000',
    iconBg: 'rgba(255, 204, 0, 0.09)',
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

const spectrumBullets = [
  'Fully human — engineers drive every change with strict validation gates',
  'Human in the loop — agents draft, humans approve before deploy',
  'Fully agentic — MCP skills and dry-run deploy for autonomous pipelines',
  'Anything between — mix surfaces per team, per workflow, per risk appetite',
];

export default function HomePage() {
  return (
    <div className="landing relative overflow-x-hidden">
      <section className="px-4 pt-5 pb-2 md:px-6 md:pt-8">
        <div className="landing-hero-shell landing-fade-in mx-auto max-w-[1400px]">
          <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:min-h-[min(72vh,720px)]">
            <div className="flex flex-col justify-center px-6 py-10 md:px-10 md:py-14 lg:py-16">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--landing-accent)]/30 bg-black px-3 py-1 text-xs font-medium text-[var(--landing-accent)]">
                <Waves className="size-3.5" aria-hidden />
                the DetectionOps engine for detection-as-code
              </div>
              <h1 className="text-[clamp(2.35rem,5.8vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">
                Structure{' '}
                <span className="text-[var(--landing-accent)]">detection engineering</span>
                <span className="text-[var(--landing-ink)]">, your way.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--landing-muted)] md:text-lg text-pretty">
                <span className="text-[var(--landing-accent)]">opentide</span> validates, generates,
                deploys, and documents rules across seven platforms. Human-led, agent-assisted, or
                fully autonomous — you set the balance.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/docs/usage/installation/" className="landing-btn-primary group">
                  Getting started
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/docs/mcp/" className="landing-btn-secondary">
                  <Bot className="size-4" aria-hidden />
                  MCP reference
                </Link>
              </div>
            </div>

            <div className="relative min-h-[300px] border-t border-white/[0.06] sm:min-h-[360px] lg:min-h-0 lg:border-t-0 lg:border-l lg:border-white/[0.06]">
              <TideDitherScene className="absolute inset-0" />
            </div>
          </div>

          <div className="border-t border-white/[0.06] bg-black p-4 md:p-6">
            <HeroTerminal />
          </div>
        </div>
      </section>

      <section
        id="platforms"
        className="border-y border-white/10 bg-[var(--landing-surface-deep)] py-4"
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

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
          One DetectionOps pipeline
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-subtle)] text-pretty">
          Draft to deployed — every stage validated, every platform capability honest. The tide
          carries your content forward; you steer how much is human and how much is agentic.
        </p>
        <PipelineFlow steps={pipeline} />
      </section>

      <section className="landing-section border-t border-white/10 bg-[var(--landing-surface-deep)]">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">Five surfaces, one engine</h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-subtle)] text-pretty">
            Specs for authors, CLI for pipelines, MCP for agents — all running the same
            DetectionOps core.
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
                      ? 'border-[var(--landing-accent)]/25 bg-[var(--landing-surface-raised)] hover:border-[var(--landing-accent)]/50'
                      : 'hover:border-white/20 hover:bg-[var(--landing-surface-raised)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="inline-flex rounded-xl p-2.5 ring-1 ring-white/10"
                      style={{ backgroundColor: s.iconBg, color: s.iconColor }}
                    >
                      <s.icon className="size-7" aria-hidden />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        s.featured
                          ? 'bg-[var(--landing-accent)]/20 text-[var(--landing-accent)]'
                          : 'bg-white/[0.06] text-[var(--landing-muted)]'
                      }`}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold transition-colors group-hover:text-[var(--landing-accent)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--landing-subtle)]">{s.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--landing-subtle)] group-hover:text-[var(--landing-accent)]">
                    Explore <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-accent)]">
              <UserRound className="size-4" aria-hidden />
              <span>Human</span>
              <span className="text-[var(--landing-subtle)]">↔</span>
              <Sparkles className="size-4" aria-hidden />
              <span>Agentic</span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
              You set the autonomy level
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--landing-subtle)] text-pretty">
              DetectionOps is not all-or-nothing. opentide structures the work so engineers,
              reviewers, and agents collaborate on the same objects — with MCP, skills, and specs
              built in from day one.
            </p>
            <ul className="mt-8 space-y-4">
              {spectrumBullets.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--landing-muted)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/docs/usage/workflows/agentic-setup/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-muted)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Agentic setup guide <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <McpTerminalDemo />
        </div>
      </section>

      <section className="landing-section border-t border-white/10 bg-[var(--landing-surface-deep)]">
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
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-muted)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
          >
            Full capability matrix <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em]">The opentide ecosystem</h2>
        <ul className="mt-12 grid list-none gap-4 p-0 md:grid-cols-3">
          {ecosystemLinks.map((repo, i) => (
            <li key={repo.name} className="landing-card" style={{ '--i': i } as CSSProperties}>
              <a
                href={repo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-surface-card block h-full p-6 transition hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              >
                <h3 className="text-lg font-semibold">{repo.name}</h3>
                <p className="mt-2 text-sm text-[var(--landing-subtle)]">{repo.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-white/10 bg-[var(--landing-surface-raised)] py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Set the standard for DetectionOps
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            Bring your rules, your reviewers, and your agents. opentide structures the flow — you
            choose how much of the tide is human and how much runs on its own.
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
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black px-8 py-3.5 text-sm font-semibold text-[var(--landing-muted)] transition hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Install from PyPI
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
