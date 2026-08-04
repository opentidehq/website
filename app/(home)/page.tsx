import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OpentideBadge } from '@/components/brand/opentide-mark';
import { TideAsciiScene } from '@/components/landing/tide-ascii-scene';
import { HeroInstall } from '@/components/landing/hero-install';
import { HeroPitch } from '@/components/landing/hero-pitch';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { EcosystemGrid } from '@/components/landing/ecosystem-grid';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { WorkflowStudio, ObjectGraph } from '@/components/landing/landing-heavy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'opentide, the DetectionOps Engine',
  description:
    'The battle-hardened detection engineering standard for teams adopting detection-as-code—strict validation, deployment pipelines, and agent-native constructs on an object graph that scales with you.',
};

export default function HomePage() {
  return (
    <div className="landing relative overflow-x-hidden bg-[var(--landing-bg)]">
      <section className="relative mx-auto flex min-h-[min(100svh,920px)] w-full max-w-[1400px] flex-col justify-center gap-10 px-4 py-14 md:px-6 md:py-16 lg:gap-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-xl">
            <h1 className="text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.04em] text-balance">
              Adopt detection engineering and keep your{' '}
              <span className="text-[var(--landing-accent)]">security operations flowing</span>
            </h1>
            <HeroInstall />
          </div>

          <div
            className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)] shadow-[0_24px_80px_-40px_var(--landing-btn-shadow)] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[min(52vh,440px)] lg:h-full"
            aria-hidden
          >
            <TideAsciiScene className="h-full w-full" />
          </div>
        </div>

        <HeroPitch />
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
          One DetectionOps pipeline
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-muted)] text-pretty">
          Draft to deployed. Every stage validated, every platform capability honest. You steer how
          much is human and how much is agentic.
        </p>
        <PipelineFlow />
      </section>

      <section className="landing-section">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            From messy, continuous intel to a structured and actionable detection engineering
            graph
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-muted)] text-pretty">
            Threats fan into objectives and rules — linked by stable UUIDs across every branch.
          </p>
          <div className="mt-10">
            <ObjectGraph />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
          Author in the IDE. Validate in the terminal. Agents in the loop.
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--landing-muted)] text-pretty">
          Watch a full DetectionOps scenario play through: file tree, editor, MCP skills, and CLI
          output — end to end, on a loop.
        </p>
        <div className="mt-10">
          <WorkflowStudio />
        </div>
      </section>

      <section className="landing-section">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Built for DetectionOps teams
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-muted)] text-pretty">
            Specs for authors, CLI for pipelines, MCP for agents. One engine across the surfaces your
            team already uses.
          </p>
          <div className="mt-12">
            <FeatureShowcase />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
          The opentide ecosystem
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-muted)] text-pretty">
          Engine, specs, library, explorer, and skills — with editor tooling on the way.
        </p>
        <div className="mt-12">
          <EcosystemGrid />
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-8 flex justify-center">
            <OpentideBadge
              size={72}
              className="drop-shadow-[0_12px_32px_color-mix(in_srgb,var(--landing-accent)_28%,transparent)]"
            />
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Set the standard for DetectionOps
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            Bring your rules, your reviewers, and your agents. opentide structures the flow. You
            choose how much runs with you — and how much runs on its own.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/docs/usage/" className="landing-btn-primary group">
              Explore documentation
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href="https://pypi.org/project/opentide/"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-secondary"
            >
              Install from PyPI
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
