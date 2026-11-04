/** The projects the Releases page covers. Order is the switcher's order. */
export type ProjectId = 'opentide' | 'language-server' | 'vscode-extension' | 'explorer';

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
    tagline: 'CLI · SDK · MCP server',
    description:
      'The opentide package: validate, generate, and deploy detection objects. Install the latest, or pin the version your pipeline should keep.',
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
    id: 'language-server',
    name: 'Language server',
    shortName: 'LSP',
    tagline: 'KQL · SPL · ES|QL · Tide YAML',
    description:
      'Diagnostics, hover, completion, and highlighting for detection queries and Tide objects, in any editor that speaks LSP.',
    href: '/releases/language-server/',
    repository: 'https://github.com/opentidehq/language-server',
    gettingStarted: { label: 'the README', href: 'https://github.com/opentidehq/language-server#install' },
    changelogUrl: 'https://github.com/opentidehq/language-server/blob/main/CHANGELOG.md',
    changelog: 'language-server.md',
    firstPublished: '0.5.0',
    registry: {
      label: 'crates.io',
      url: 'https://crates.io/crates/opentide-lsp',
      versionUrl: (version) => `https://crates.io/crates/opentide-lsp/${version}`,
    },
    install: (version) => `cargo install opentide-lsp --version ${version}`,
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
    gettingStarted: { label: 'the README', href: 'https://github.com/opentidehq/vscode-extension#works-on-install' },
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

/** The project's name inside a sentence: "the language server", "the VS Code extension". */
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
