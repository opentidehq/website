import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Code,
  FileText,
  Search,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenTide — The DetectionOps Engine',
  description:
    'Validate, generate, deploy, and document detection rules across seven security platforms. Agent-native with MCP, CLI, SDK, and normative specifications.',
};

const surfaces = [
  {
    title: 'Usage',
    description: 'Setup, workflows, and day-to-day detection engineering',
    href: '/docs/usage/installation/',
    icon: BookOpen,
    color: 'text-sky-400',
  },
  {
    title: 'CLI',
    description: 'Operators and CI pipelines — validate, deploy, generate',
    href: '/docs/cli/',
    icon: Terminal,
    color: 'text-emerald-400',
  },
  {
    title: 'MCP',
    description: 'Agent server for Cursor, VS Code, and AI assistants',
    href: '/docs/mcp/',
    icon: Bot,
    color: 'text-violet-400',
  },
  {
    title: 'SDK',
    description: 'Embed OpenTide in Python applications',
    href: '/docs/sdk/',
    icon: Code,
    color: 'text-amber-400',
  },
  {
    title: 'Specifications',
    description: 'Normative specs for objects, vocabularies, and governance',
    href: '/docs/specifications/',
    icon: FileText,
    color: 'text-rose-400',
  },
];

const agentSteps = [
  {
    step: '01',
    title: 'Setup MCP',
    description: 'Run opentide setup to scaffold MCP config and agent skills for your detection repo.',
    icon: Bot,
  },
  {
    step: '02',
    title: 'Search catalogue',
    description: 'Agents query the object index, schemas, and platform matrix via MCP resources.',
    icon: Search,
  },
  {
    step: '03',
    title: 'Validate safely',
    description: 'Structured validation reports — strict mode, query checks, and honest platform limits.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Dry-run deploy',
    description: 'Preview deployment payloads before anything touches production SIEMs.',
    icon: Zap,
  },
];

const platforms = [
  { name: 'Microsoft Sentinel', deploy: true, validate: true },
  { name: 'Defender for Endpoint', deploy: true, validate: true },
  { name: 'Splunk ES', deploy: true, validate: true },
  { name: 'SentinelOne', deploy: true, validate: true },
  { name: 'Carbon Black Cloud', deploy: true, validate: true },
  { name: 'CrowdStrike Falcon', deploy: true, validate: false },
  { name: 'HarfangLab', deploy: true, validate: false },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-sky-400 mb-4 tracking-wide uppercase">
              DetectionOps
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The engine for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">
                detection-as-code
              </span>
            </h1>
            <p className="text-lg md:text-xl text-fd-muted-foreground mb-8 leading-relaxed">
              OpenTide validates, generates, deploys, and documents detection rules across seven
              security platforms. Built for engineers and the agents that assist them — with MCP,
              skills, and normative specifications.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/docs/usage/installation/"
                className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs/mcp/"
                className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium hover:bg-fd-accent transition-colors"
              >
                <Bot className="size-4" />
                For agents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quickstart code */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Five minutes to your first validate</h2>
            <p className="text-fd-muted-foreground leading-relaxed">
              Install from PyPI, point at your detection repository, generate framework artifacts,
              and run strict validation. Same workflow in CI, locally, or through an MCP-connected
              agent.
            </p>
          </div>
          <pre className="rounded-xl border border-fd-border bg-fd-muted/50 p-6 text-sm overflow-x-auto font-mono leading-relaxed">
            <code>{`pip install "opentide[sentinel,cli,mcp]>=0.1"
export OPENTIDE_REPO_ROOT=/path/to/detection-repo

opentide setup --yes --platform sentinel --ci github
opentide generate
opentide validate --strict
opentide deploy --platform sentinel --dry-run`}</code>
          </pre>
        </div>
      </section>

      {/* Surfaces */}
      <section className="border-y border-fd-border bg-fd-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">One engine, five surfaces</h2>
          <p className="text-fd-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Pick the interface that matches your workflow — from terminal operators to autonomous
            agents.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surfaces.map((surface) => (
              <Link
                key={surface.title}
                href={surface.href}
                className="group rounded-xl border border-fd-border bg-fd-background p-6 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all"
              >
                <surface.icon className={`size-8 mb-4 ${surface.color}`} />
                <h3 className="font-semibold text-lg mb-2 group-hover:text-sky-400 transition-colors">
                  {surface.title}
                </h3>
                <p className="text-sm text-fd-muted-foreground">{surface.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Agent workflow */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-center gap-3 mb-2">
          <Workflow className="size-6 text-violet-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Agent-native by design</h2>
        </div>
        <p className="text-fd-muted-foreground mb-12 max-w-2xl">
          OpenTide ships MCP servers, portable agent skills, and structured tool responses so AI
          assistants work safely with detection content — never guessing validation results.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {agentSteps.map((item) => (
            <div key={item.step} className="relative">
              <span className="text-4xl font-bold text-fd-muted/40 absolute -top-2 -left-1">
                {item.step}
              </span>
              <div className="pt-8 pl-4">
                <item.icon className="size-5 text-violet-400 mb-3" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-fd-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/docs/usage/workflows/agentic-setup/"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:underline"
          >
            Read the agentic setup guide
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Platform matrix */}
      <section className="border-y border-fd-border bg-fd-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">Seven platforms. Honest validation.</h2>
          <p className="text-fd-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            OpenTide deploys to seven platforms and validates queries on five. CrowdStrike and
            HarfangLab never get fake syntax checks.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto text-sm">
              <thead>
                <tr className="border-b border-fd-border">
                  <th className="text-left py-3 px-4 font-medium">Platform</th>
                  <th className="text-center py-3 px-4 font-medium">Deploy</th>
                  <th className="text-center py-3 px-4 font-medium">Query validate</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.name} className="border-b border-fd-border/50">
                    <td className="py-3 px-4">{p.name}</td>
                    <td className="text-center py-3 px-4 text-emerald-400">{p.deploy ? '✓' : '—'}</td>
                    <td className="text-center py-3 px-4">
                      {p.validate ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-fd-muted-foreground">unsupported</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center mt-6">
            <Link href="/docs/usage/concepts/platforms/" className="text-sm text-sky-400 hover:underline">
              Full capability matrix →
            </Link>
          </p>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Ecosystem</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {ecosystemLinks.map((repo) => (
            <a
              key={repo.name}
              href={repo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-fd-border p-6 hover:border-sky-500/50 transition-colors"
            >
              <h3 className="font-semibold mb-2">{repo.name}</h3>
              <p className="text-sm text-fd-muted-foreground">{repo.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-fd-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Set the standard for DetectionOps</h2>
          <p className="text-fd-muted-foreground mb-8 max-w-xl mx-auto">
            Start with the quickstart, wire up MCP for your agents, and explore normative
            specifications — all from one place.
          </p>
          <Link
            href="/docs/"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground hover:opacity-90 transition-opacity"
          >
            Explore documentation
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
