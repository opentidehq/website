import { ArrowUpRight, BookOpen, Boxes, Code2, Compass, Package, Sparkles, Wand2 } from 'lucide-react';
import { ecosystemLinks, type EcosystemItem } from '@/lib/shared';

const ICONS: Record<string, typeof Package> = {
  opentide: Package,
  specifications: BookOpen,
  library: Boxes,
  explorer: Compass,
  skills: Wand2,
  'language-server': Code2,
  'vscode-extension': Sparkles,
};

function EcosystemCard({ item }: { item: EcosystemItem }) {
  const Icon = ICONS[item.name] ?? Package;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)]">
          <Icon className="size-5" aria-hidden />
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            item.status === 'live'
              ? 'bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] text-[var(--landing-ink)]'
              : 'bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] text-[var(--landing-subtle)]'
          }`}
        >
          {item.status === 'live' ? item.tag : 'Coming soon'}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--landing-ink)]">
        {item.name}
        {item.href && (
          <ArrowUpRight
            className="ml-1 inline size-4 translate-y-[-1px] text-[var(--landing-dim)] transition group-hover:text-[var(--landing-accent)]"
            aria-hidden
          />
        )}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{item.description}</p>
    </>
  );

  const className =
    'group flex h-full flex-col rounded-2xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,var(--landing-bg))] p-6 transition hover:bg-[color-mix(in_srgb,var(--landing-ink)_7%,var(--landing-bg))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]';

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <div className={`${className} opacity-90`}>
      {inner}
    </div>
  );
}

export function EcosystemGrid() {
  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {ecosystemLinks.map((item) => (
        <li key={item.name}>
          <EcosystemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
