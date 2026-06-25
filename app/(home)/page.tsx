import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Waves,
  UserRound,
  Sparkles,
  Circle,
} from 'lucide-react';
import { OpentideName } from '@/components/brand/opentide-name';
import { TideRippleScene } from '@/components/landing/tide-ripple-scene';
import { HeroInstall } from '@/components/landing/hero-install';
import { HeroPitch } from '@/components/landing/hero-pitch';
import { HeroTerminal } from '@/components/landing/hero-terminal';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { WorkflowStudio, ObjectGraph, AutonomySpectrum } from '@/components/landing/landing-heavy';
import { PlatformGrid } from '@/components/landing/platform-grid';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'opentide — The DetectionOps Engine',
  description:
    'The normative standard for DetectionOps — validate, generate, deploy, and document rules with a structured framework that makes engineering faster and more reliable.',
};

const features = [
  'Strict schema validation',
  'Dry-run deploy',
  'MCP agent tools',
  'Multi-platform native',
  'Normative specifications',
  'CI/CD pipelines',
  'Human-in-the-loop gates',
  'Cross-object chaining',
  'Schema generation',
  'Published narratives',
];

const spectrumBullets = [
  'Fully human — engineers drive every change with strict validation gates',
  'Human in the loop — agents draft, humans approve before deploy',
  'Fully agentic — MCP skills and dry-run deploy for autonomous pipelines',
  'Anything between — mix surfaces per team, per workflow, per risk appetite',
];

export default function HomePage() {
  return (
    <div className="landing relative overflow-x-hidden bg-black">
      <section className="relative px-4 pt-2 md:px-6 md:pt-4">
        <div className="landing-hero-shell landing-fade-in relative mx-auto w-full max-w-[1400px] overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="aspect-square w-[min(92vw,58vh,640px)] max-w-full opacity-90">
              <TideRippleScene className="h-full w-full" />
            </div>
          </div>

          <div className="relative z-10 grid min-h-[min(72vh,640px)] items-center lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]">
            <div className="px-5 py-10 md:px-10 md:py-12 lg:py-14">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--eu-yellow)]/45 bg-black/40 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--eu-yellow)] backdrop-blur-sm">
                  EUPL-1.2 · forever free
                </span>
                <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[11px] text-[var(--landing-subtle)] backdrop-blur-sm">
                  open source engine
                </span>
              </div>
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-[var(--landing-subtle)] backdrop-blur-sm">
                <Waves className="size-3 text-[var(--eu-yellow)]" aria-hidden />
                normative spec · open DetectionOps engine
              </div>
              <h1 className="text-[clamp(1.85rem,4.2vw,3.15rem)] font-bold leading-[1.06] tracking-[-0.035em] text-balance">
                Make detection engineering{' '}
                <span className="text-[var(--landing-accent)]">better and faster</span>
                <span className="text-[var(--landing-ink)]"> — with a standard.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--landing-muted)] md:text-[15px] text-pretty">
                <OpentideName className="font-medium text-[var(--landing-ink)]" /> is the structured framework
                and specification for DetectionOps: normative objects, honest validation, and deploy
                across platforms — human-led or agent-assisted.
              </p>
              <HeroInstall />
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link href="/docs/usage/installation/" className="landing-btn-primary group text-sm">
                  Getting started
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/docs/mcp/" className="landing-btn-secondary text-sm">
                  <Bot className="size-3.5" aria-hidden />
                  MCP reference
                </Link>
              </div>
            </div>
            <div className="hidden lg:block" aria-hidden />
          </div>
        </div>
      </section>

      <HeroPitch />

      <section className="border-y border-white/10 py-4" aria-label="Product features">
        <div className="landing-marquee-wrap overflow-hidden">
          <div
            className="landing-marquee flex gap-12 whitespace-nowrap text-sm font-medium text-[var(--landing-subtle)]"
            aria-hidden
          >
            {[...features, ...features].map((name, i) => (
              <span key={`${name}-${i}`} className="inline-flex items-center gap-2">
                <Circle className="size-2 fill-[var(--eu-yellow)] text-[var(--eu-yellow)]" />
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
        <PipelineFlow />
      </section>

      <section className="landing-section border-t border-white/10 px-4 md:px-6">
        <HeroTerminal />
      </section>

      <section className="landing-section border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Objects chain into a graph
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-subtle)] text-pretty">
            Intel informs threats. Threats drive objectives. Rules deploy the detection — one chain
            highlighted among everything else in your repo.
          </p>
          <div className="mt-10 max-h-[min(520px,70vh)]">
            <ObjectGraph />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] border-t border-white/10 px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
          IDE, CLI, and agents — one workflow
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--landing-subtle)] text-pretty">
          From CISA advisory to deployable rules — one scenario, with MCP reasoning, CLI validation,
          and the same engine throughout.
        </p>
        <div className="mt-10">
          <WorkflowStudio />
        </div>
      </section>

      <section className="landing-section border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Built for DetectionOps teams
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-subtle)] text-pretty">
            Specs for authors, CLI for pipelines, MCP for agents — composable surfaces on one engine.
          </p>
          <div className="mt-12">
            <FeatureShowcase />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] border-t border-white/10 px-4 md:px-6">
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
              DetectionOps is not all-or-nothing. <OpentideName /> structures the work so engineers,
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
          <AutonomySpectrum />
        </div>
      </section>

      <section className="landing-section border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
              Multi-platform native by design
            </h2>
            <p className="mt-4 text-[var(--landing-subtle)] text-pretty">
              opentide is built as an expandable standard — not a fixed integration list. Deploy
              everywhere we connect today; add adapters as your stack grows. We only validate queries
              where the platform honestly supports it — never fake syntax checks.
            </p>
          </div>
          <div className="mt-12">
            <PlatformGrid />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] border-t border-white/10 px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em]">
          The <OpentideName /> ecosystem
        </h2>
        <ul className="mt-12 grid list-none gap-4 p-0 md:grid-cols-3">
          {ecosystemLinks.map((repo) => (
            <li key={repo.name}>
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

      <section className="border-t border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 text-sm font-semibold text-[var(--eu-yellow)]">EUPL-1.2 · forever free</p>
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Set the standard for DetectionOps
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            Bring your rules, your reviewers, and your agents. <OpentideName /> structures the flow —
            you choose how much of the tide is human and how much runs on its own.
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
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-8 py-3.5 text-sm font-semibold text-[var(--landing-muted)] transition hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              Install from PyPI
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
