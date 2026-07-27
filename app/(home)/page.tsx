import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { OpentideName } from '@/components/brand/opentide-name';
import { TideSmokeScene } from '@/components/landing/tide-smoke-scene';
import { HeroInstall } from '@/components/landing/hero-install';
import { HeroPitch } from '@/components/landing/hero-pitch';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { WorkflowStudio, ObjectGraph, AutonomySpectrum } from '@/components/landing/landing-heavy';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'opentide, the DetectionOps Engine',
  description:
    'The normative standard for DetectionOps. Validate, generate, deploy, and document rules with a structured framework that makes engineering faster and more reliable.',
};

const spectrumBullets = [
  {
    title: 'Fully human',
    body: 'Engineers drive every change with strict validation gates.',
  },
  {
    title: 'Human in the loop',
    body: 'Agents draft, humans approve before deploy.',
  },
  {
    title: 'Fully agentic',
    body: 'MCP skills and dry-run deploy for autonomous pipelines.',
  },
  {
    title: 'Anything between',
    body: 'Mix surfaces per team, per workflow, per risk appetite.',
  },
];

export default function HomePage() {
  return (
    <div className="landing relative overflow-x-hidden bg-black">
      <section className="relative min-h-[min(92vh,880px)]">
        <div className="absolute inset-0" aria-hidden>
          <TideSmokeScene className="h-full w-full" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(92vh,880px)] w-full max-w-[1400px] items-center px-4 py-16 pointer-events-none md:px-6 md:py-20">
          <div className="max-w-xl pointer-events-auto">
            <h1 className="text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.04em] text-balance">
              Make detection engineering{' '}
              <span className="text-[var(--landing-accent)]">better and faster</span>
              {' '}with a standard.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--landing-ink)]/80 md:text-lg text-pretty">
              <OpentideName className="font-medium text-[var(--landing-ink)]" /> is the structured
              framework for DetectionOps: normative objects, honest validation, and deploy across
              platforms.
            </p>
            <HeroInstall />
          </div>
        </div>
      </section>

      <HeroPitch />

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
            Objects chain into a graph
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--landing-muted)] text-pretty">
            Intel informs threats. Threats drive objectives. Rules deploy the detection. One chain
            highlighted among everything else in your repo.
          </p>
          <div className="mt-10">
            <ObjectGraph />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
          IDE, CLI, and agents in one workflow
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--landing-muted)] text-pretty">
          File tree, editor, agent trace, and terminal. One scenario from intel to deploy, with MCP
          skills and CLI validation at each stage.
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
            Specs for authors, CLI for pipelines, MCP for agents. Composable surfaces on one engine.
          </p>
          <div className="mt-12">
            <FeatureShowcase />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
              You set the autonomy level
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--landing-muted)] text-pretty">
              DetectionOps is not all-or-nothing. <OpentideName /> structures the work so engineers,
              reviewers, and agents collaborate on the same objects, with MCP, skills, and specs from
              day one.
            </p>
            <ul className="mt-8 space-y-5">
              {spectrumBullets.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-[var(--landing-ink)]">{item.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--landing-muted)]">{item.body}</p>
                  </div>
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

      <section className="landing-section mx-auto max-w-[1400px] px-4 md:px-6">
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
                className="block h-full border-t border-white/15 pt-5 transition hover:border-[var(--landing-accent)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
              >
                <h3 className="text-lg font-semibold">{repo.name}</h3>
                <p className="mt-2 text-sm text-[var(--landing-muted)]">{repo.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-balance">
            Set the standard for DetectionOps
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            Bring your rules, your reviewers, and your agents. <OpentideName /> structures the flow.
            You choose how much of the tide is human and how much runs on its own.
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
