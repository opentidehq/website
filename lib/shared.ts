export const appName = 'OpenTide';
export const appDescription =
  'The DetectionOps engine for detection-as-code — validate, generate, deploy, and document rules across seven security platforms.';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const siteUrl = 'https://congenial-winner-o8y3gq9.pages.github.io';

export const gitConfig = {
  user: 'OpenTideHQ',
  repo: 'website',
  branch: 'main',
};

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
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
