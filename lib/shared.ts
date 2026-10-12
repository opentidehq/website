export const appName = 'opentide';
export const appDescription =
  'Spec-driven development for detection engineering: an ontology and a taxonomy that keep every detection threat-aligned, maintainable and fast to ship.';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const blogImageRoute = '/og/blog';
export const siteImageRoute = '/og/site';
export const siteOgImage = `${siteImageRoute}/image.png`;
export const blogIndexOgImage = `${blogImageRoute}/image.png`;
export const docsContentRoute = '/llms.mdx/docs';
export const siteUrl = 'https://opentide.org';

export const gitConfig = {
  user: 'OpenTideHQ',
  repo: 'website',
  branch: 'main',
};

/** Marketing chrome — the wordmark already goes home, so no Home link. */
export const siteNavLinks = [
  { label: 'Docs', href: '/docs/usage/' },
  { label: 'Releases', href: '/releases/' },
  { label: 'Blog', href: '/blog/' },
] as const;

/**
 * Docs chrome keeps the sidebar for documentation. Releases is a product page,
 * so it stays in the header instead of the usage tree.
 */
export const docsNavLinks = [{ label: 'Releases', href: '/releases/' }] as const;

export type EcosystemItem = {
  name: string;
  description: string;
  href?: string;
  status: 'live' | 'soon';
  tag: string;
};

export const ecosystemLinks: EcosystemItem[] = [
  {
    name: 'opentide',
    description: 'The CLI, Python SDK and MCP server, in one package on PyPI.',
    href: 'https://github.com/OpenTideHQ/opentide',
    status: 'live',
    tag: 'Toolchain',
  },
  {
    name: 'specifications',
    description: 'The contract: normative object specs, 36 versioned vocabularies and RFCs.',
    href: 'https://github.com/OpenTideHQ/specifications',
    status: 'live',
    tag: 'Contract',
  },
  {
    name: 'library',
    description: 'Shared content: published threats, objectives and rules at TLP:CLEAR.',
    href: 'https://github.com/OpenTideHQ/library',
    status: 'live',
    tag: 'Content',
  },
  {
    name: 'explorer',
    description: 'The interface: browse threats, objectives, signals, rules and their chains.',
    href: 'https://github.com/OpenTideHQ/explorer',
    status: 'live',
    tag: 'Interface',
  },
  {
    name: 'skills',
    description: 'The agent brain: 27 skills for Claude Code, Cursor, Codex, Copilot and Kiro.',
    href: 'https://github.com/OpenTideHQ/skills',
    status: 'live',
    tag: 'Agents',
  },
  {
    name: 'language-server',
    description: 'Rust and tree-sitter language server for KQL, SPL and Tide YAML. In progress.',
    href: 'https://github.com/OpenTideHQ/language-server',
    status: 'soon',
    tag: 'Editor',
  },
  {
    name: 'vscode-extension',
    description: 'VS Code onboarding, validation and authoring, built on the language server.',
    status: 'soon',
    tag: 'Editor',
  },
];
