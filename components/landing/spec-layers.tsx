import { ArrowDown } from 'lucide-react';
import { VOCABULARIES } from '@/lib/landing/vocabularies';

type Layer = {
  kicker: string;
  name: string;
  meta: string;
  lines: { label: string; value: string }[];
  repo: string;
  href?: string;
  pinned?: boolean;
};

const LAYERS: Layer[] = [
  {
    kicker: 'the spec · ontology + taxonomy',
    name: 'specifications',
    meta: 'normative · CC-BY-4.0',
    lines: [
      { label: 'ontology', value: 'threat::1.0 · objective::1.0 · rule::1.1' },
      { label: 'taxonomy', value: `${VOCABULARIES.length} versioned vocabularies · fixtures · RFCs` },
    ],
    repo: 'OpenTideHQ/specifications',
    href: 'https://github.com/OpenTideHQ/specifications',
  },
  {
    kicker: 'the package you pin',
    name: 'opentide',
    meta: 'pip install opentide · EUPL-1.2',
    lines: [
      { label: 'one package', value: 'CLI, Python SDK, MCP server and every integration' },
      { label: 'one model', value: 'Types and JSON Schema come from the same models, so they cannot drift' },
    ],
    repo: 'OpenTideHQ/opentide',
    href: 'https://github.com/OpenTideHQ/opentide',
    pinned: true,
  },
  {
    kicker: 'the source of truth',
    name: 'your detection repo',
    meta: 'yours · in git',
    lines: [
      { label: 'objects/', value: 'threats, objectives and rules as YAML' },
      { label: '.opentide/', value: 'platform configuration, generated schemas and templates' },
      { label: 'git', value: 'your CI, your reviews, your history' },
    ],
    repo: 'private or public',
  },
];

const SEAMS = [
  'spec markdown → Pydantic models → JSON Schema, generated and never hand-edited',
  'validates · generates · deploys · documents',
];

function LayerCard({ layer }: { layer: Layer }) {
  const shell = layer.pinned
    ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
    : 'landing-panel text-[var(--landing-ink)]';
  const quiet = layer.pinned ? 'opacity-80' : 'text-[var(--landing-subtle)]';

  return (
    <div className={`rounded-2xl p-6 ${shell}`}>
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] @xl:gap-8">
        <div>
          <p className={`font-mono text-xs ${quiet}`}>{layer.kicker}</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.03em]">{layer.name}</p>
          <p className={`mt-1 font-mono text-xs ${quiet}`}>{layer.meta}</p>
        </div>
        <div className="flex flex-col justify-between gap-4">
          <dl className="m-0 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-x-4">
            {layer.lines.map((line) => (
              <div key={line.label} className="contents">
                <dt className={`font-mono text-xs sm:pt-0.5 ${quiet}`}>{line.label}</dt>
                <dd className={`m-0 leading-relaxed ${layer.pinned ? '' : 'text-[var(--landing-muted)]'}`}>
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>
          {layer.href ? (
            <a
              href={layer.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`self-start font-mono text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                layer.pinned
                  ? 'focus-visible:outline-[var(--brand-accent-foreground)]'
                  : `${quiet} focus-visible:outline-[var(--landing-accent)]`
              }`}
            >
              {layer.repo}
            </a>
          ) : (
            <p className={`font-mono text-xs ${quiet}`}>{layer.repo}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** The spec, the package you pin, and your repo: three layers joined by what flows between them. */
export function SpecLayers() {
  // A container, not the viewport, decides the card layout: blog columns vary in width.
  return (
    <div className="@container">
      {LAYERS.map((layer, i) => (
        <div key={layer.name}>
          <LayerCard layer={layer} />
          {i < SEAMS.length && (
            <p className="flex items-center gap-3 py-3 pl-6 font-mono text-xs text-[var(--landing-subtle)]">
              <ArrowDown className="size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
              {SEAMS[i]}
            </p>
          )}
        </div>
      ))}
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
        The spec does not ship detections. The package does not hold your YAML.{' '}
        <span className="font-semibold text-[var(--landing-ink)]">Your repo stays the source of truth.</span>
      </p>
    </div>
  );
}
