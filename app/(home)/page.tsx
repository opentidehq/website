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
  UserRound,
  Sparkles,
} from 'lucide-react';
import { TideFluidScene } from '@/components/landing/tide-fluid-scene';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { McpTerminalDemo } from '@/components/landing/mcp-terminal-demo';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

export const metadata: Metadata = {
  title: 'OpenTide — The DetectionOps Engine',
  description:
    'Structure detection engineering end to end. Human-in-the-loop or fully agentic — validate, generate, deploy, and document rules across seven platforms.',
};

const pipeline = [
  {
    label: 'Validate',
    icon: Shield,
    desc: 'Schema, query, and platform honesty checks',
    color: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.15)',
  },
  {
    label: 'Generate',
    icon: Layers,
    desc: 'Schemas, templates, and indexes from your repo',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.15)',
  },
  {
    label: 'Deploy',
    icon: Rocket,
    desc: 'Seven platforms, dry-run before production',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.15)',
  },
  {
    label: 'Document',
    icon: FileText,
    desc: 'Published narratives for analysts and auditors',
    color: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.15)',
  },
];

const surfaces = [
  {
    title: 'Usage',
    tag: 'DetectionOps',
    description: 'Scaffold repos, wire CI, and run structured workflows — solo or with agents.',
    href: '/docs/usage/installation/',
    icon: BookOpen,
    iconColor: '#f97316',
    iconBg: 'rgba(249, 115, 22, 0.18)',
    featured: true,
  },
  {
    title: 'Specifications',
    tag: 'Normative',
    description: 'Objects, vocabularies, governance — the contract humans and agents share.',
    href: '/docs/specifications/',
    icon: FileText,
    iconColor: '#a78bfa',
    iconBg: 'rgba(167, 139, 250, 0.18)',
  },
  {
    title: 'CLI',
    tag: 'Pipelines',
    description: 'Same commands in your shell, CI, and incident runbooks.',
    href: '/docs/cli/',
    icon: Terminal,
    iconColor: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.18)',
  },
  {
    title: 'MCP',
    tag: 'Agents',
    description: 'Structured tool output for assistants — no hallucinated pass/fail.',
    href: '/docs/mcp/',
    icon: Bot,
    iconColor: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.18)',
  },
  {
    title: 'SDK',
    tag: 'Embed',
    description: 'Python registry API for orchestration you already own.',
    href: '/docs/sdk/',
    icon: Code,
    iconColor: '#f472b6',
    iconBg: 'rgba(244, 114, 182, 0.18)',
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
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        <TideFluidScene className="absolute inset-0 h-full min-h-[480px] w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--landing-bg)] to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-28 md:pb-20 md:pt-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="landing-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--landing-accent)]/40 bg-[var(--landing-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--landing-accent)]">
                <Waves className="size-3.5" aria-hidden />
                DetectionOps engine
              </div>
              <h1 className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.02em] text-balance">
                Structure{' '}
                <span className="text-[var(--landing-accent)]">detection engineering</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)] md:text-xl text-pretty">
                OpenTide is the DetectionOps layer for detection-as-code — validate, generate,
                deploy, and document rules across seven platforms. Human-led, agent-assisted, or
                fully autonomous: you choose the balance.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/docs/usage/installation/" className="landing-btn-primary group">
                  Start DetectionOps
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/docs/mcp/" className="landing-btn-secondary">
                  <Bot className="size-4" aria-hidden />
                  Wire up agents
                </Link>
              </div>
            </div>

            <div className="landing-fade-in landing-delay-2 rounded-xl border border-white/10 bg-[var(--landing-surface-deep)]/95 p-1 shadow-lg shadow-black/40">
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

      <section className="landing-section mx-auto max-w-6xl px-4">
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
        <div className="mx-auto max-w-6xl px-4">
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
                          : 'bg-white/10 text-[var(--landing-foam)]'
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
              DetectionOps is not all-or-nothing. OpenTide structures the work so engineers,
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
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-foam)] transition hover:text-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
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
            Bring your rules, your reviewers, and your agents. OpenTide structures the flow — you
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
