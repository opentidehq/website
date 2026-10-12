import { ArrowUpRight } from 'lucide-react';

type Status = 'rfc accepted' | 'in progress' | 'planned' | 'proposed';

type Item = {
  name: string;
  detail: string;
  status: Status;
  issue: string;
  /** For items tracked outside the issue tracker, such as the migration guide. */
  href?: string;
  code?: boolean;
};

type Direction = { title: string; intent: string; items: Item[] };

const ROADMAP: Direction[] = [
  {
    title: 'Integrations',
    intent: 'More places the same rule runs.',
    items: [
      { name: 'Elastic Security', detail: 'RFC 0007 · deploys through Elastic’s detection engine', status: 'rfc accepted', issue: '386' },
      { name: 'Sysdig Secure + Falco', detail: 'Falco-native rules', status: 'proposed', issue: '143' },
    ],
  },
  {
    title: 'In the editor',
    intent: 'The spec where you type.',
    items: [
      { name: 'Language server', detail: 'KQL · SPL · Tide YAML, in opentide[lsp]', status: 'in progress', issue: '332' },
      { name: 'VS Code extension', detail: 'replaces opentide setup vscode', status: 'planned', issue: '47' },
      { name: 'Agent plugins, bundled', detail: 'skills + MCP in one install', status: 'planned', issue: '431' },
    ],
  },
  {
    title: 'A stronger model',
    intent: 'Richer rules, cleaner state.',
    items: [
      { name: 'rule::2.0 beside rule::1.x', detail: 'both shapes in one workspace', status: 'proposed', issue: '394', code: true },
      { name: 'Portable rule validation', detail: 'a disabled integration warns, not fails', status: 'planned', issue: '410' },
      { name: 'Deployment state out of YAML', detail: 'vendor rule ids in state shards', status: 'planned', issue: '396' },
    ],
  },
  {
    title: 'Toward 1.0',
    intent: 'A stable surface, fewer legacy paths.',
    items: [
      {
        name: 'Legacy CoreTide imports removed',
        detail: 'deprecated in 0.x, removed at 1.0',
        status: 'planned',
        issue: '',
        href: '/docs/usage/migration/',
      },
      { name: 'Per-integration skill packs', detail: 'sentinel-ops, splunk-ops, …', status: 'planned', issue: '50' },
      { name: '--logs json|verbose|debug', detail: 'one flag for output modes', status: 'proposed', issue: '187', code: true },
    ],
  },
];

const ORDER: Status[] = ['in progress', 'rfc accepted', 'planned', 'proposed'];

/** One glyph per status, the same in the legend and on every item. */
function Glyph({ status, className }: { status: Status; className?: string }) {
  const c = `size-4 shrink-0 ${className ?? ''}`;
  if (status === 'rfc accepted') {
    return (
      <svg viewBox="0 0 16 16" className={c} aria-hidden>
        <circle cx="8" cy="8" r="7" fill="var(--landing-accent)" />
        <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="var(--brand-accent-foreground)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'in progress') {
    return (
      <svg viewBox="0 0 16 16" className={c} aria-hidden>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="color-mix(in srgb, var(--landing-accent) 25%, transparent)" strokeWidth="1.5" />
        <path d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25" fill="none" stroke="var(--landing-accent)" strokeWidth="1.5" strokeLinecap="round" className="landing-spin" style={{ transformOrigin: '8px 8px' }} />
        <circle cx="8" cy="8" r="2.5" fill="var(--landing-accent)" />
      </svg>
    );
  }
  if (status === 'planned') {
    return (
      <svg viewBox="0 0 16 16" className={c} aria-hidden>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="color-mix(in srgb, var(--landing-ink) 55%, transparent)" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={c} aria-hidden>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="color-mix(in srgb, var(--landing-ink) 40%, transparent)" strokeWidth="1.5" strokeDasharray="2.2 2.4" />
    </svg>
  );
}

/** A direction's items as one segmented bar: where it stands, at a glance. */
function Mix({ items }: { items: Item[] }) {
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  return (
    <span aria-hidden className="flex h-1.5 w-full gap-1">
      {sorted.map((item) => (
        <span
          key={item.name}
          className={`h-full flex-1 rounded-full ${
            item.status === 'in progress' || item.status === 'rfc accepted'
              ? 'bg-[var(--landing-accent)]'
              : item.status === 'planned'
                ? 'bg-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)]'
                : 'border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_30%,transparent)]'
          }`}
        />
      ))}
    </span>
  );
}

/** Four directions, each tracked in a public issue or RFC. */
export function Roadmap() {
  return (
    <div className="@container">
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-xs text-[var(--landing-subtle)]">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <Glyph status={status} />
            {status}
          </li>
        ))}
      </ul>

      <ol data-reveal-group className="mt-8 grid list-none grid-cols-1 gap-4 p-0 @2xl:grid-cols-2 @7xl:grid-cols-4">
        {ROADMAP.map((dir, d) => (
          <li key={dir.title} className="landing-panel flex flex-col p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs text-[var(--landing-accent)]">{String(d + 1).padStart(2, '0')}</span>
              <span className="font-mono text-[11px] text-[var(--landing-subtle)]">
                {dir.items.length} item{dir.items.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-3 text-xl font-bold tracking-[-0.02em] text-[var(--landing-ink)]">{dir.title}</p>
            <p className="mt-1 text-sm text-[var(--landing-muted)]">{dir.intent}</p>
            <div className="mt-4">
              <Mix items={dir.items} />
            </div>
            <ul className="mt-5 list-none space-y-1 p-0">
              {dir.items.map((item) => {
                const href = item.href ?? (item.issue ? `https://github.com/OpenTideHQ/opentide/issues/${item.issue}` : undefined);
                const external = !item.href;
                const body = (
                  <>
                    <Glyph status={item.status} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold text-[var(--landing-ink)] ${item.code ? 'font-mono text-[13px]' : ''}`}
                      >
                        {item.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs leading-relaxed text-[var(--landing-subtle)]">
                        {item.detail}
                        <span className="sr-only"> · {item.status}</span>
                      </span>
                    </span>
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 font-mono text-[11px] text-[var(--landing-subtle)] transition group-hover:text-[var(--landing-accent)]">
                      {item.issue ? `#${item.issue}` : 'guide'}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </span>
                  </>
                );
                return (
                  <li key={item.name}>
                    {href ? (
                      <a
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[var(--landing-hover)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--landing-accent)]"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="-mx-2 flex items-start gap-3 px-2 py-2.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
