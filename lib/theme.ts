/** EU visual identity — Pantone Reflex Blue & Yellow (official web values). */
export const euBlue = '#003399';
export const euYellow = '#FFCC00';

export const euBlueHsl = '221 100% 30%';
export const euYellowHsl = '48 100% 50%';

export const docTabs = [
  {
    key: 'usage',
    title: 'Usage',
    description: 'Spec-driven detection engineering — from scaffold to production',
    url: '/docs/usage/',
    icon: 'BookOpen' as const,
    iconColor: '#ffcc00',
    iconBg: 'rgba(255, 204, 0, 0.12)',
  },
  {
    key: 'specifications',
    title: 'Specifications',
    description: 'Normative contracts for humans, agents, and engines',
    url: '/docs/specifications/',
    icon: 'FileText' as const,
    iconColor: '#e6b800',
    iconBg: 'rgba(255, 204, 0, 0.08)',
  },
  {
    key: 'cli',
    title: 'CLI',
    description: 'The opentide engine in terminals, pipelines, and runbooks',
    url: '/docs/cli/',
    icon: 'Terminal' as const,
    iconColor: '#fff0a3',
    iconBg: 'rgba(255, 204, 0, 0.1)',
  },
  {
    key: 'mcp',
    title: 'MCP',
    description: 'Search, coverage, validation and dry-run deploys for agents',
    url: '/docs/mcp/',
    icon: 'Bot' as const,
    iconColor: '#ffcc00',
    iconBg: 'rgba(255, 204, 0, 0.14)',
  },
  {
    key: 'sdk',
    title: 'SDK',
    description: 'Embed the opentide engine in your own orchestration',
    url: '/docs/sdk/',
    icon: 'Code' as const,
    iconColor: '#c9a000',
    iconBg: 'rgba(255, 204, 0, 0.09)',
  },
] as const;
