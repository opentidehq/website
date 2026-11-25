/** The projects the Releases page covers. Order is the switcher's order. */
/**
 * The language server is not a project here: it ships inside opentide from 1.0.0 (`opentide lsp
 * start`, the `opentide-lsp` crate), at opentide's version. /releases/language-server/ says so.
 */
export type ProjectId = 'opentide' | 'vscode-extension' | 'explorer';

export type ReleaseProject = {
  id: ProjectId;
  name: string;
  /** The name where the switcher is narrow. */
  shortName: string;
  /** What it is, in a few words, under the name in the switcher. */
  tagline: string;
  /** The lead under the page heading. */
  description: string;
  /** Page path, with the trailing slash the static export uses. */
  href: string;
  repository: string;
  changelogUrl: string;
  /** Where a newcomer starts: the footer links here. */
  gettingStarted: { label: string; href: string };
  /** File under `content/releases/`; the engine's notes are synced docs instead. */
  changelog: string | null;
  /** The first version a registry carries; earlier ones were tagged after the fact. */
  firstPublished?: string;
  registry: {
    label: string;
    url: string;
    /** A page for one version, or the registry's page where it has none per version. */
    versionUrl: (version: string) => string;
  };
  /** Other registries that carry every published version, linked beside the registry. */
  mirrors?: readonly { label: string; versionUrl: (version: string) => string }[];
  /** A version on a pre-release channel, though its number has no SemVer suffix. */
  prerelease?: (version: string) => boolean;
  install: (version: string) => string;
};

export const PROJECTS: readonly ReleaseProject[] = [
  {
    id: 'opentide',
    name: 'opentide',
    shortName: 'opentide',
    tagline: 'CLI · SDKs · MCP · LSP',
    description:
      'The opentide package: validate, generate, and deploy detection objects, with its MCP server, language server and SDKs at the same version. Install the latest, or pin the version your pipeline should keep.',
    href: '/releases/',
    repository: 'https://github.com/opentidehq/opentide',
    gettingStarted: { label: 'installation', href: '/docs/usage/installation/' },
    changelogUrl: 'https://github.com/opentidehq/opentide/blob/development/CHANGELOG.md',
    changelog: null,
    registry: {
      label: 'PyPI',
      url: 'https://pypi.org/project/opentide/',
      versionUrl: (version) => `https://pypi.org/project/opentide/${version}/`,
    },
    install: (version) => `pip install opentide==${version}`,
  },
  {
    id: 'vscode-extension',
    name: 'VS Code extension',
    shortName: 'VS Code',
    tagline: 'Checks · graph · deploy preview',
    description:
      'The opentide workbench for VS Code and its forks: live checks for Tide objects and their queries, templates, a catalogue, a graph and ATT&CK coverage, query results, and deploy previews, with an opentide runtime bundled.',
    href: '/releases/vscode-extension/',
    repository: 'https://github.com/opentidehq/vscode-extension',
    gettingStarted: { label: 'the README', href: 'https://github.com/opentidehq/vscode-extension#install' },
    changelogUrl: 'https://github.com/opentidehq/vscode-extension/blob/main/CHANGELOG.md',
    changelog: 'vscode-extension.md',
    firstPublished: '0.1.0',
    registry: {
      label: 'Visual Studio Marketplace',
      url: 'https://marketplace.visualstudio.com/items?itemName=opentidehq.opentide',
      // The Marketplace has no page per version.
      versionUrl: () => 'https://marketplace.visualstudio.com/items?itemName=opentidehq.opentide',
    },
    mirrors: [
      { label: 'Open VSX', versionUrl: (version) => `https://open-vsx.org/extension/opentidehq/opentide/${version}` },
    ],
    // An odd minor is the pre-release channel; the Marketplace takes no `-beta` suffix.
    prerelease: (version) => Number(version.split('.')[1]) % 2 === 1,
    // A pinned version installs whatever its channel; `--pre-release` only picks the newest.
    install: (version) => `code --install-extension opentidehq.opentide@${version}`,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    shortName: 'Explorer',
    tagline: 'Graph · catalogue · ATT&CK',
    description:
      'Browse a corpus of threats, objectives, signals, and rules as a graph, a catalogue, and an ATT&CK matrix, built from its exports.',
    href: '/releases/explorer/',
    repository: 'https://github.com/opentidehq/explorer',
    gettingStarted: { label: 'the README', href: 'https://github.com/opentidehq/explorer#run-it-on-a-corpus' },
    changelogUrl: 'https://github.com/opentidehq/explorer/blob/main/CHANGELOG.md',
    changelog: 'explorer.md',
    firstPublished: '0.5.0',
    registry: {
      label: 'npm',
      url: 'https://www.npmjs.com/package/@opentide/explorer',
      versionUrl: (version) => `https://www.npmjs.com/package/@opentide/explorer/v/${version}`,
    },
    install: (version) => `npx @opentide/explorer@${version} serve --exports-dir .opentide/exports`,
  },
];

/** The project's name inside a sentence: "the VS Code extension", "the explorer". */
export function nameInSentence(project: ReleaseProject): string {
  const [first = '', ...rest] = project.name.split(' ');
  // An acronym keeps its capitals; any other first word is lowercased.
  const lead = /^[A-Z]{2,}$/.test(first) ? first : first.toLowerCase();
  return [lead, ...rest].join(' ');
}

export function releaseProject(id: ProjectId): ReleaseProject {
  const project = PROJECTS.find((candidate) => candidate.id === id);
  if (!project) throw new Error(`Unknown release project: ${id}`);
  return project;
}

/**
 * The engine crates' and language server's notes: opentide's `crates/CHANGELOG.md`, synced into
 * `content/releases/` by `pnpm sync:changelogs`. From `since` they are cut at opentide's version
 * (one version, one tag), and each opentide release folds in the section of its own version.
 * Before it, the language server had versions of its own (0.x up to 0.16.1), which this page
 * does not mix in.
 */
export const OPENTIDE_CRATES_NOTES = {
  file: 'opentide-crates.md',
  since: '1.0.0',
  changelogUrl: 'https://github.com/opentidehq/opentide/blob/development/crates/CHANGELOG.md',
  /** For `parseChangelog`: links are per crate on the page, so the version links none. */
  project: {
    id: 'opentide',
    name: 'opentide crates',
    shortName: 'crates',
    tagline: '',
    description: '',
    href: '/releases/',
    repository: 'https://github.com/opentidehq/opentide',
    changelogUrl: 'https://github.com/opentidehq/opentide/blob/development/crates/CHANGELOG.md',
    gettingStarted: { label: 'opentide lsp', href: '/docs/cli/lsp/' },
    changelog: 'opentide-crates.md',
    registry: {
      label: 'crates.io',
      url: 'https://crates.io/crates/opentide',
      versionUrl: (version: string) => `https://crates.io/crates/opentide/${version}`,
    },
    install: (version: string) => `cargo install opentide --features cli --version ${version}`,
  } satisfies ReleaseProject,
} as const;

/**
 * Every crate a release publishes on crates.io, at opentide's version, each with what it is.
 * The facade and the language server first, then the layers under them, then the query
 * languages. `lib/releases.test.ts` checks the list against `vendor/opentide/crates/` when the
 * checkout has it.
 */
export const OPENTIDE_CRATES: readonly { name: string; role: string }[] = [
  { name: 'opentide', role: 'Rust SDK (facade); `--features cli` installs the CLI' },
  { name: 'opentide-lsp', role: 'Language server' },
  { name: 'opentide-cli', role: 'The `opentide` command' },
  { name: 'opentide-workspace', role: 'Workspace: load, validate, lint' },
  { name: 'opentide-schema', role: 'Tide object and configuration models' },
  { name: 'opentide-schema-derive', role: 'Derive macros for the models' },
  { name: 'opentide-compile', role: 'Compile rules into platform requests' },
  { name: 'opentide-connectors', role: 'Platform connectors: deploy and query' },
  { name: 'opentide-analysis', role: 'Query analysis, hover and completion' },
  { name: 'opentide-tide', role: 'Tide YAML: index, references' },
  { name: 'opentide-core', role: 'Shared types: nodes, diagnostics, JSON' },
  { name: 'opentide-parse', role: 'Parser toolkit' },
  { name: 'opentide-highlight', role: 'Highlighting spec and grammars' },
  { name: 'opentide-dataset', role: 'Vendor catalogs: tables, fields' },
  { name: 'opentide-ecs', role: 'Elastic Common Schema' },
  { name: 'opentide-kql', role: 'KQL' },
  { name: 'opentide-spl', role: 'SPL' },
  { name: 'opentide-esql', role: 'ES|QL' },
  { name: 'opentide-eql', role: 'EQL' },
  { name: 'opentide-kuery', role: 'Kibana KQL' },
  { name: 'opentide-lucene', role: 'Lucene' },
  { name: 'opentide-cql', role: 'CrowdStrike CQL' },
  { name: 'opentide-falco', role: 'Falco rules' },
  { name: 'opentide-yara', role: 'YARA' },
  { name: 'opentide-yaral', role: 'YARA-L' },
  { name: 'opentide-exabeam', role: 'Exabeam Query Language' },
];

export function crateVersionUrl(name: string, version: string): string {
  return `https://crates.io/crates/${name}/${version}`;
}

/** What one opentide version publishes, by what people install, with a registry page at that version. */
export function opentideArtifacts(version: string): { name: string; what: string; links: { label: string; href: string }[] }[] {
  const pypi = { label: 'PyPI', href: `https://pypi.org/project/opentide/${version}/` };
  return [
    { name: 'Python package and CLI', what: '`pip install opentide`: the `opentide` command and the Python SDK', links: [pypi] },
    { name: 'MCP server', what: '`opentide mcp start`, in the package', links: [pypi] },
    {
      name: 'Rust SDK',
      what: 'the `opentide` crate',
      links: [{ label: 'crates.io', href: crateVersionUrl('opentide', version) }],
    },
    {
      name: 'Node.js SDK',
      what: '`@opentide/opentide`',
      links: [{ label: 'npm', href: `https://www.npmjs.com/package/@opentide/opentide/v/${version}` }],
    },
    {
      name: 'Language server',
      what: '`opentide lsp start`, or the `opentide-lsp` crate and binary',
      links: [
        { label: 'crates.io', href: crateVersionUrl('opentide-lsp', version) },
        { label: 'binaries', href: `https://github.com/opentidehq/opentide/releases/tag/v${version}` },
      ],
    },
  ];
}
