import Link from 'next/link';
import { ArrowRight, Bot, Code, FileText, Terminal, BookOpen } from 'lucide-react';
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
    <div
      className={`flex h-full flex-col rounded-2xl border border-white/10 bg-black p-6 shadow-lg ${className ?? ''}`}
    >
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
      <Link href={href} className="group block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--eu-yellow)]">
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

const surfaces = [
  { icon: BookOpen, label: 'Usage' },
  { icon: FileText, label: 'Specs' },
  { icon: Terminal, label: 'CLI' },
  { icon: Bot, label: 'MCP' },
  { icon: Code, label: 'SDK' },
];

export function FeatureShowcase() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FeatureCard
        title="Multi-platform native"
        description="One normative rule model — deploy to Sentinel, Defender, Splunk, and more. We only validate queries where the platform honestly supports it."
        className="relative overflow-hidden lg:min-h-[280px]"
        href="/docs/usage/"
      >
        <div className="flex flex-wrap gap-2">
          {surfaces.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-zinc-400"
            >
              <Icon className="size-3 text-[var(--eu-yellow)]" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </FeatureCard>

      <FeatureCard
        title="A truly composable engine"
        description="Content → core → surfaces. Same DetectionOps engine in your shell, CI, and agent tools — mix CLI, MCP, and SDK without rebuilding workflows."
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
        description="Threats, objectives, and rules chain together with stable UUIDs — the contract humans and agents share when authoring detection content."
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
        description="Strict schema checks, cross-object references, and platform query honesty — so pass/fail means something in CI and in agent loops."
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
        description="Engineers drive every change, agents draft with MCP skills, or fully autonomous pipelines with dry-run deploy — you set the balance per workflow."
        href="/docs/usage/workflows/agentic-setup/"
      />
    </div>
  );
}
