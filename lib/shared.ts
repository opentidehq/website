export const appName = 'opentide';
export const appDescription =
  'The DetectionOps engine for detection-as-code — validate, generate, deploy, and document rules across seven security platforms.';
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
  { label: 'Blog', href: '/blog/' },
] as const;

/**
 * Docs chrome — no text site links. The wordmark goes home, the sidebar is the
 * docs nav, and GitHub stays as the icon escape hatch. Blog lives on the
 * marketing chrome only.
 */
export const docsNavLinks = [] as const;

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
    description: 'DetectionOps engine on PyPI: validate, generate, deploy, document.',
    href: 'https://github.com/OpenTideHQ/opentide',
    status: 'live',
    tag: 'Engine',
  },
  {
    name: 'specifications',
    description: 'Normative object specs, schemas, and vocabularies.',
    href: 'https://github.com/OpenTideHQ/specifications',
    status: 'live',
    tag: 'Specs',
  },
  {
    name: 'library',
    description: 'Public registry of published detection objects.',
    href: 'https://github.com/OpenTideHQ/library',
    status: 'live',
    tag: 'Registry',
  },
  {
    name: 'explorer',
    description: 'Deployable app for exploring opentide objects end to end.',
    href: 'https://github.com/OpenTideHQ/explorer',
    status: 'live',
    tag: 'App',
  },
  {
    name: 'skills',
    description: 'Canonical agent skills for opentide detection engineering.',
    href: 'https://github.com/OpenTideHQ/skills',
    status: 'live',
    tag: 'Agents',
  },
  {
    name: 'language-server',
    description: 'LSP for opentide object and query authoring in any editor.',
    status: 'soon',
    tag: 'Editor',
  },
  {
    name: 'vscode-extension',
    description: 'VS Code tooling for schemas, validation, and detection workflows.',
    status: 'soon',
    tag: 'Editor',
  },
];
