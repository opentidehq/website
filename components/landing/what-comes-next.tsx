type Item = {
  name: string;
  detail: string;
  status: 'rfc accepted' | 'in progress' | 'planned' | 'proposed';
  issue: string;
  /** For items tracked outside the issue tracker, such as the migration guide. */
  href?: string;
  code?: boolean;
};

const ROADMAP: { title: string; items: Item[] }[] = [
  {
    title: 'Platforms',
    items: [
      { name: 'Elastic Security', detail: 'RFC 0007 · deploys through the detection engine', status: 'rfc accepted', issue: '386' },
      { name: 'Sysdig Secure + Falco', detail: 'Falco-native rules', status: 'proposed', issue: '143' },
    ],
  },
  {
    title: 'In the editor',
    items: [
      { name: 'Language server', detail: 'KQL · SPL · Tide YAML, in opentide[lsp]', status: 'in progress', issue: '332' },
      { name: 'VS Code extension', detail: 'replaces opentide setup vscode', status: 'planned', issue: '47' },
      { name: 'Agent plugins from the engine', detail: 'skills + MCP in one install', status: 'planned', issue: '431' },
    ],
  },
  {
    title: 'A stronger model',
    items: [
      { name: 'rule::2.0 beside rule::1.x', detail: 'both shapes in one workspace', status: 'proposed', issue: '394', code: true },
      { name: 'Portable rule validation', detail: 'a disabled platform warns, not fails', status: 'planned', issue: '410' },
      { name: 'Deployment state out of YAML', detail: 'vendor rule ids in state shards', status: 'planned', issue: '396' },
    ],
  },
  {
    title: 'Toward 1.0',
    items: [
      {
        name: 'Legacy CoreTide imports removed',
        detail: 'deprecated in 0.x, removed at 1.0',
        status: 'planned',
        issue: '',
        href: '/docs/usage/migration/',
      },
      { name: 'Per-platform skill packs', detail: 'sentinel-ops, splunk-ops, …', status: 'planned', issue: '50' },
      { name: '--logs json|verbose|debug', detail: 'one flag for output modes', status: 'proposed', issue: '187', code: true },
    ],
  },
];

const STATUS_CLASS: Record<Item['status'], string> = {
  'rfc accepted': 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]',
  'in progress': 'bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] text-[var(--landing-accent)]',
  planned: 'border border-[var(--landing-border)] text-[var(--landing-muted)]',
  proposed: 'border border-dashed border-[var(--landing-border)] text-[var(--landing-subtle)]',
};

/** Four directions, each tracked in a public issue or RFC. */
export function Roadmap() {
  return (
    <div className="@container mt-12">
      <div className="grid grid-cols-1 gap-10 @xl:grid-cols-2 @5xl:grid-cols-4 @5xl:gap-8">
        {ROADMAP.map((col) => (
          <div key={col.title}>
            <p className="border-b-2 border-[var(--landing-accent)] pb-3 text-lg font-semibold text-[var(--landing-ink)]">
              {col.title}
            </p>
            <ul className="mt-2 list-none p-0">
              {col.items.map((item) => (
                <li key={item.name} className="border-b border-[var(--landing-border)] py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-sm font-semibold text-[var(--landing-ink)] ${item.code ? 'font-mono text-[13px]' : ''}`}
                    >
                      {item.name}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] leading-4 ${STATUS_CLASS[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--landing-subtle)]">
                    {item.detail}
                    {item.issue && (
                      <>
                        {' · '}
                        <a
                          href={`https://github.com/OpenTideHQ/opentide/issues/${item.issue}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:text-[var(--landing-accent)] hover:underline"
                        >
                          #{item.issue}
                        </a>
                      </>
                    )}
                    {item.href && (
                      <>
                        {' · '}
                        <a href={item.href} className="underline-offset-2 hover:text-[var(--landing-accent)] hover:underline">
                          migration guide
                        </a>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
