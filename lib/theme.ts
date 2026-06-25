/** EU visual identity — Pantone Reflex Blue & Yellow (official web values). */
export const euBlue = '#003399';
export const euYellow = '#FFCC00';

export const euBlueHsl = '221 100% 30%';
export const euYellowHsl = '48 100% 50%';

export const docTabs = [
  {
    key: 'usage',
    title: 'Usage',
    description: 'Structured DetectionOps — from scaffold to production',
    url: '/docs/usage/',
    icon: 'BookOpen' as const,
    iconColor: '#f97316',
    iconBg: 'rgba(249, 115, 22, 0.18)',
  },
  {
    key: 'specifications',
    title: 'Specifications',
    description: 'Normative contracts for humans, agents, and engines',
    url: '/docs/specifications/',
    icon: 'FileText' as const,
    iconColor: '#a78bfa',
    iconBg: 'rgba(167, 139, 250, 0.18)',
  },
  {
    key: 'cli',
    title: 'CLI',
    description: 'DetectionOps in terminals, pipelines, and runbooks',
    url: '/docs/cli/',
    icon: 'Terminal' as const,
    iconColor: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.18)',
  },
  {
    key: 'mcp',
    title: 'MCP',
    description: 'Agent-native tools with honest validation output',
    url: '/docs/mcp/',
    icon: 'Bot' as const,
    iconColor: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.18)',
  },
  {
    key: 'sdk',
    title: 'SDK',
    description: 'Embed DetectionOps in your own orchestration',
    url: '/docs/sdk/',
    icon: 'Code' as const,
    iconColor: '#f472b6',
    iconBg: 'rgba(244, 114, 182, 0.18)',
  },
] as const;
