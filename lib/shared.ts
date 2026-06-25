export const appName = 'OpenTide';
export const appDescription =
  'The DetectionOps engine for detection-as-code — validate, generate, deploy, and document rules across seven security platforms.';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
// Default GitHub Pages URL until opentide.org DNS is configured.
export const siteUrl = 'https://opentidehq.github.io/website';

export const gitConfig = {
  user: 'OpenTideHQ',
  repo: 'website',
  branch: 'main',
};

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Registry', href: '/registry' },
] as const;

export const ecosystemLinks = [
  {
    name: 'opentide',
    description: 'DetectionOps engine (PyPI package)',
    href: 'https://github.com/OpenTideHQ/opentide',
  },
  {
    name: 'specifications',
    description: 'Normative spec library',
    href: 'https://github.com/OpenTideHQ/specifications',
  },
  {
    name: 'ShareTide',
    description: 'TLP:CLEAR community detection objects',
    href: 'https://github.com/OpenTideHQ/ShareTide',
  },
] as const;
