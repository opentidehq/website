import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { TideAsciiScene } from '@/components/landing/tide-ascii-scene';
import { TiltBadge } from '@/components/landing/tilt-badge';
import { HeroInstall } from '@/components/landing/hero-install';
import { PypiProjectLink } from '@/components/landing/pypi-release-link';
import { HeroPitch } from '@/components/landing/hero-pitch';
import { SectionLabel } from '@/components/landing/section-label';
import { WhyItMatters } from '@/components/landing/why-it-matters';
import { SpecLayers } from '@/components/landing/spec-layers';
import { ObjectQuestions } from '@/components/landing/object-questions';
import { CoverageTable } from '@/components/landing/coverage-table';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { PlatformMatrix } from '@/components/landing/platform-matrix';
import { ThreeDoors } from '@/components/landing/three-doors';
import { AgentNeeds, CliContract } from '@/components/landing/agent-contract';
import { Guardrails } from '@/components/landing/guardrails';
import { NorthStar } from '@/components/landing/north-star';
import { Roadmap, Velocity } from '@/components/landing/what-comes-next';
import { GetStarted } from '@/components/landing/get-started';
import { EcosystemGrid } from '@/components/landing/ecosystem-grid';
import { WorkflowStudio, ObjectGraph } from '@/components/landing/landing-heavy';
import type { Metadata } from 'next';
import { readBuildTimePypiVersion } from '@/lib/pypi-build';
import { loadReleaseNotes } from '@/lib/releases';
import { releaseVelocity } from '@/lib/landing/velocity';
import { appDescription, siteOgImage } from '@/lib/shared';
import { SPEC_DRIVEN_POST_HREF } from '@/lib/blog';

const title = 'opentide · spec-driven development for detection engineering';

export const metadata: Metadata = {
  title: { absolute: title },
  description: appDescription,
  openGraph: {
    title,
    description: appDescription,
    images: siteOgImage,
  },
  twitter: {
    images: siteOgImage,
  },
};

const accent = (text: string) => <span className="text-[var(--landing-accent)]">{text}</span>;

function SectionHead({
  n,
  label,
  title,
  lead,
  center,
}: {
  n?: string;
  label?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {label && <SectionLabel n={n} className={center ? 'justify-center' : undefined}>{label}</SectionLabel>}
      <h2 className={`text-3xl font-bold tracking-[-0.025em] text-balance md:text-[2.75rem] md:leading-[1.08] ${label ? 'mt-5' : ''}`}>
        {title}
      </h2>
      {lead && (
        <p className={`mt-5 text-lg leading-relaxed text-[var(--landing-muted)] text-pretty ${center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
          {lead}
        </p>
      )}
    </div>
  );
}

const wrap = 'mx-auto w-full max-w-[1400px] px-4 md:px-6';

export default async function HomePage() {
  const [pypiVersion, releases] = await Promise.all([readBuildTimePypiVersion(), loadReleaseNotes()]);
  const velocity = releaseVelocity(releases);

  // `overflow-x-clip` rather than `hidden`: hidden would turn this into a scroll container
  // and break the sticky stage the workflow studio pins against.
  return (
    <div className="landing relative overflow-x-clip bg-[var(--landing-bg)]">
      <section className="relative mx-auto flex min-h-[min(100svh,920px)] w-full max-w-[1400px] flex-col justify-center gap-10 px-4 py-14 md:px-6 md:py-16 lg:gap-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-xl">
            <h1 className="text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.04em] text-balance">
              The engine behind{' '}
              <span className="text-[var(--landing-accent)]">agentic detection engineering</span>
            </h1>
            <HeroInstall pypiVersion={pypiVersion} />
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

      <section id="why" className={`landing-section ${wrap}`}>
        <SectionHead
          n="01"
          label="why it matters"
          title="Agents made the query cheap. Not threat-aligned."
          lead="Intelligence outruns detection engineering, and agents now write a KQL or SPL query in seconds. What did not get any cheaper is knowing that the query is valid, maps to a real threat and is deployed where it should be."
        />
        <WhyItMatters />
      </section>

      <section id="what" className={`landing-section ${wrap}`}>
        <SectionHead
          n="02"
          label="what opentide is"
          title="An ontology, a taxonomy, and an engine you pin."
          lead="The spec defines what a detection is. The engine enforces it, on a laptop and in CI, the same way every time."
        />
        <SpecLayers />
      </section>

      <section className={`landing-subsection ${wrap}`}>
        <SectionHead
          title="Three objects. Three questions."
          lead="Threats, objectives and rules link by UUID, so every rule can say which threat it serves, and a threat nobody covers shows up as a gap instead of hiding in a heatmap."
        />
        <ObjectQuestions />
        <div className="mt-12">
          <ObjectGraph />
        </div>
        <div className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">
              Coverage is a graph, not a heatmap.
            </h3>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
              “We cover 85% of ATT&amp;CK” cannot say for which threat, with which signal, or on which
              platform. A threat-informed graph can.
            </p>
          </div>
          <CoverageTable />
        </div>
      </section>

      <section className={`landing-subsection ${wrap}`}>
        <SectionHead
          title="One pipeline: author, generate, validate, deploy, document."
          lead="The commands you run on a laptop are the commands CI runs."
        />
        <PipelineFlow />
      </section>

      <section className={`landing-subsection ${wrap}`}>
        <SectionHead title="One model. Seven platforms. No rewrites." />
        <PlatformMatrix />
      </section>

      <section className={`landing-subsection ${wrap}`}>
        <SectionHead
          title="Three doors, one engine."
          lead="The CLI, the Python SDK and the MCP server load the same objects from the same models, in one package."
        />
        <ThreeDoors />
      </section>

      <section id="why-a-cli" className={`landing-section ${wrap}`}>
        <SectionHead
          n="03"
          label="why we re-released it"
          title="An agent is only as good as the spec it is held to."
          lead="opentide ran in production for years as a git submodule. We re-released it as one versioned package with a CLI, because people and agents both need a contract, not a folder of scripts."
        />
        <AgentNeeds />
        <div className="mt-20">
          <h3 className="text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">The CLI is the agent’s API.</h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
            Every command answers the same way, so pipelines and agents act on results, not prose.
          </p>
          <div className="mt-10">
            <CliContract />
          </div>
        </div>
        <Link
          href={SPEC_DRIVEN_POST_HREF}
          className="mt-12 inline-flex items-center gap-2 text-base font-semibold text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
        >
          Read the story: from a submodule to a CLI built for agents
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section id="agents" className={`landing-section ${wrap}`}>
        <SectionHead
          n="04"
          label="agentic detection engineering"
          title="Agents draft. The engine checks. Humans decide what reaches production."
          lead="Prompt in, objects out: skills draft the chain, the engine validates it, and the pull request meets the same gates as any human change."
        />
        <div className="mt-12">
          <WorkflowStudio />
        </div>
        <Guardrails />
      </section>

      <section id="next" className={`landing-section ${wrap}`}>
        <SectionHead
          n="05"
          label="what comes next"
          title={<>The north star: intel to a reviewed, deployed detection in {accent('under an hour')}.</>}
        />
        <NorthStar />

        <div className="mt-24">
          <h3 className="text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">
            We build opentide the way we want detections built.
          </h3>
          <Velocity velocity={velocity} />
        </div>

        <div className="mt-24">
          <h3 className="text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">Where opentide goes next.</h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
            Four directions, tracked in public issues, RFCs and the migration guide, each with a clear
            status.
          </p>
          <Roadmap />
        </div>
      </section>

      <section id="start" className={`landing-section ${wrap}`}>
        <SectionHead
          label="get started"
          title="Start in five commands."
          lead="From an empty folder to a validated detection repo, with your agent wired in."
        />
        <GetStarted />
      </section>

      <section className={`landing-subsection ${wrap}`}>
        <SectionHead
          center
          label="the ecosystem"
          title="Each repository has one job."
          lead="The engine, the contract, the content, the interface and the agent brain. Your detection repo stays yours."
        />
        <div className="mt-12">
          <EcosystemGrid />
        </div>
      </section>

      {/* Pulled up into the section gap above: the seal is large enough to carry it. */}
      <section className="-mt-4 pb-20 pt-0 md:-mt-8 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="flex justify-center">
            <TiltBadge />
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.025em] text-balance md:text-[2.75rem] md:leading-[1.08]">
            Agents write the queries. {accent('The spec keeps them aligned.')}
          </h2>
          <p className="mt-6 text-lg text-[var(--landing-muted)] text-pretty">
            Ontology, taxonomy, engine and gates. Open source and forever free: the spec under
            CC-BY-4.0, the engine under EUPL-1.2. You choose how much runs with you, and how much runs
            on its own.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/docs/usage/" className="landing-btn-primary group">
              Explore documentation
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <PypiProjectLink className="landing-btn-secondary" initialVersion={pypiVersion}>
              Install from PyPI
            </PypiProjectLink>
          </div>
        </div>
      </section>
    </div>
  );
}
