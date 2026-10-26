import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { TideSea } from '@/components/landing/tide-sea';
import { ClosingSeal } from '@/components/landing/closing-seal';
import { HeroBadge } from '@/components/landing/hero-badge';
import { HeroInstall } from '@/components/landing/hero-install';
import { PypiProjectLink } from '@/components/landing/pypi-release-link';
import { ChapterNav } from '@/components/landing/chapter-nav';
import { RevealOnScroll } from '@/components/landing/reveal';
import { Accent, BlockHead, Caption, Chapter, ChapterHead, block, wrap } from '@/components/landing/ui';
import { WhyItMatters } from '@/components/landing/why-it-matters';
import { OntologyMap } from '@/components/landing/ontology-map';
import { TaxonomyRibbon } from '@/components/landing/taxonomy-ribbon';
import { CoverageFigure } from '@/components/landing/coverage-figure';
import { PipelineFlow } from '@/components/landing/pipeline-flow';
import { IntegrationFan } from '@/components/landing/integration-fan';
import { AgentNeedsStrip } from '@/components/landing/agent-needs-strip';
import { CliShowcase } from '@/components/landing/cli-showcase';
import { Guardrails } from '@/components/landing/guardrails';
import { NorthStar } from '@/components/landing/north-star';
import { Roadmap } from '@/components/landing/what-comes-next';
import { GetStarted } from '@/components/landing/get-started';
import { EcosystemGrid } from '@/components/landing/ecosystem-grid';
import { WorkflowStudio } from '@/components/landing/landing-heavy';
import { readBuildTimePypiVersion } from '@/lib/pypi-build';
import { appDescription, siteOgImage } from '@/lib/shared';
import { SPEC_DRIVEN_POST_HREF } from '@/lib/blog';

const title = 'opentide · spec-driven development for agentic detection engineering';

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

/**
 * The landing, in seven chapters. Each chapter is one idea: a heading, then the one or two
 * artefacts that prove it. Chapters alternate between the page and a tinted band.
 */
export default async function HomePage() {
  const pypiVersion = await readBuildTimePypiVersion();

  return (
    <div className="landing relative overflow-x-clip bg-[var(--landing-bg)]">
      {/*
       * The sea fills the hero edge to edge, its horizon behind the headline: far water is haze
       * behind the copy, and `--tide` is the near water left below it, where the query reads.
       * The hero fades into the band of the chapter below, so the water has no shore.
       */}
      <section
        id="top"
        data-tide-host
        className="landing-hero relative isolate overflow-hidden"
        style={{ '--tide': 'clamp(210px, 30vh, 340px)' } as CSSProperties}
      >
        <div aria-hidden className="landing-sea absolute inset-0 -z-20 print:hidden">
          <TideSea />
        </div>
        <div
          className={`landing-hero-copy ${wrap} flex flex-col items-center pb-[calc(var(--tide)+2rem)] pt-32 text-center md:pt-44 lg:pt-48`}
        >
          <HeroBadge initialVersion={pypiVersion} />
          <h1 className="mt-8 max-w-5xl text-[clamp(2.4rem,5.4vw,4.4rem)] font-bold leading-[1.03] tracking-[-0.045em] text-balance">
            Spec-driven development for <br className="hidden sm:block" />
            <Accent>agentic detection engineering</Accent>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty md:text-xl md:leading-relaxed">
            opentide gives every detection an{' '}
            <span className="font-semibold text-[var(--landing-ink)]">ontology and a taxonomy</span>, so
            it stays threat-aligned, maintainable and fast to ship, with or without agents.
          </p>
          <HeroInstall />
        </div>
      </section>

      {/* Fixed to the viewport; early in the DOM so keyboard users reach the chapters first. */}
      <ChapterNav />

      <Chapter id="why" band>
        <ChapterHead
          chapter="why"
          label="why it matters"
          title="Agents made the query cheap. Not threat-aligned."
          lead="Intelligence outruns detection engineering, and agents now write a KQL or SPL query in seconds. What did not get any cheaper is knowing that the query is valid, maps to a real threat and is deployed where it should be."
        />
        <WhyItMatters />
      </Chapter>

      <Chapter id="what">
        <ChapterHead
          chapter="what"
          label="what opentide is"
          title="Three objects. Three questions. One graph."
          lead="A threat says what you defend against, an objective what to detect, a rule how and where. They link to each other by UUID, threats chain into attack paths, and all of it meets the assets, log sources and detectors of your environment by name and vocabulary."
        />
        <div data-reveal className="mt-12 md:mt-16">
          <OntologyMap />
        </div>
        <div data-reveal className="mt-10 md:mt-12">
          <TaxonomyRibbon />
        </div>

        <div className={block}>
          <BlockHead
            title="Coverage is a graph, not a heatmap."
            lead="“We cover 85% of ATT&CK” cannot say which threats hit what you run, or where an attack path goes unseen. The graph can: threats meet your assets on their surface, chain into attack paths, and every step traces to the objective and rules that detect it, or shows up as a gap."
          />
          <div data-reveal className="mt-10">
            <CoverageFigure />
          </div>
        </div>
      </Chapter>

      <Chapter id="how" band>
        <ChapterHead
          chapter="how"
          label="how it runs"
          title="From YAML to every integration."
          lead="One pipeline: author, generate, validate, deploy, document. The commands you run on a laptop are the commands CI runs."
        />
        <div id="pipeline" data-reveal className="mt-12 scroll-mt-20 md:mt-16">
          <PipelineFlow />
        </div>
        <div id="platforms" className={`${block} scroll-mt-20`}>
          <IntegrationFan />
        </div>
      </Chapter>

      <Chapter id="why-a-cli">
        <ChapterHead
          chapter="why-a-cli"
          label="built for agents"
          title="An agent is only as good as the spec it is held to."
          lead="People and agents need the same things from detection tooling. Agents need them stricter: a contract to read, feedback to act on, tools to call, knowledge to load, and gates they cannot skip."
        />
        <div className="mt-12 md:mt-16">
          <AgentNeedsStrip />
        </div>
        <div id="doors" className={`${block} scroll-mt-20`}>
          <BlockHead
            title="Three ways in. One model."
            lead="Every command answers the same way, so pipelines and agents act on results, not prose. The CLI, the Python SDK and the MCP server load the same objects from the same models, in one package."
          />
          <div data-reveal className="mt-10">
            <CliShowcase />
          </div>
        </div>
        <Link
          href={SPEC_DRIVEN_POST_HREF}
          className="mt-14 inline-flex items-center gap-2 text-base font-semibold text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
        >
          Read more: spec-driven detection engineering
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Chapter>

      <Chapter id="agents" band>
        <ChapterHead
          chapter="agents"
          label="agentic detection engineering"
          title="Agents draft. opentide checks. Humans decide what reaches production."
          lead="Prompt in, objects out: skills draft the chain, opentide validates it, and the pull request meets the same gates as any human change."
        />
        <div data-reveal className="mt-12 md:mt-16">
          <WorkflowStudio />
        </div>
        <div className={block}>
          <Guardrails />
        </div>
      </Chapter>

      <Chapter id="next">
        <ChapterHead
          chapter="next"
          label="what comes next"
          title={
            <>
              The north star: intel to a reviewed, deployed detection in <Accent>under an hour</Accent>.
            </>
          }
          lead="Agents and opentide carry everything up to STAGING. People keep the gates that decide what reaches production."
        />
        <div data-reveal className="mt-12 md:mt-16">
          <NorthStar />
        </div>
        <div className={block}>
          <BlockHead
            title="Where opentide goes next."
            lead="Four directions, tracked in public issues, RFCs and the migration guide, each with a clear status."
          />
          <div className="mt-10">
            <Roadmap />
          </div>
        </div>
      </Chapter>

      <Chapter id="start" band>
        <ChapterHead
          chapter="start"
          label="get started"
          title="Start in five commands."
          lead="From an empty folder to a validated detection repo, with your agent wired in."
        />
        <div data-reveal className="mt-12 md:mt-16">
          <GetStarted />
        </div>
        <div className={block}>
          <Caption>the ecosystem</Caption>
          <BlockHead
            className="mt-3"
            title="Each repository has one job."
            lead="The toolchain, the contract, the content, the interface and the agent brain. Your detection repo stays yours."
          />
          <div data-reveal className="mt-10">
            <EcosystemGrid />
          </div>
        </div>
      </Chapter>

      <section className="landing-chapter">
        <div data-reveal className="mx-auto max-w-3xl px-4 text-center">
          <ClosingSeal />
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.035em] text-balance">
            Agents write the queries. <Accent>The spec keeps them aligned.</Accent>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
            An ontology, a taxonomy, and the gates that hold every detection to them. Open source and
            forever free: the spec under CC-BY-4.0, opentide under EUPL-1.2. You choose how much runs
            with you, and how much runs on its own.
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

      <RevealOnScroll />
    </div>
  );
}
