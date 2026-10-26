/** The projects the Releases page covers. Order is the switcher's order. */
export type ProjectId = 'opentide' | 'language-server' | 'explorer';

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
  /** File under `content/releases/`; the engine's notes are synced docs instead. */
  changelog: string | null;
  /** The first version a registry carries; earlier ones were tagged after the fact. */
  firstPublished?: string;
  registry: {
    label: string;
    url: string;
    versionUrl: (version: string) => string;
  };
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
    id: 'explorer',
    name: 'Explorer',
    shortName: 'Explorer',
    tagline: 'Graph · catalogue · ATT&CK',
    description:
      'Browse a corpus of threats, objectives, signals, and rules as a graph, a catalogue, and an ATT&CK matrix, built from its exports.',
    href: '/releases/explorer/',
    repository: 'https://github.com/opentidehq/explorer',
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

export function releaseProject(id: ProjectId): ReleaseProject {
  const project = PROJECTS.find((candidate) => candidate.id === id);
  if (!project) throw new Error(`Unknown release project: ${id}`);
  return project;
}
