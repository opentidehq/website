/** EU visual identity — Pantone Reflex Blue & Yellow (official web values). */
export const euBlue = '#003399';
export const euYellow = '#FFCC00';

export const euBlueHsl = '221 100% 30%';
export const euYellowHsl = '48 100% 50%';

export const docTabs = [
  {
    key: 'specifications',
    title: 'Specifications',
    description: 'Normative specs for authors, maintainers, and agents',
    url: '/docs/specifications/',
    icon: 'FileText' as const,
  },
  {
    key: 'usage',
    title: 'Usage',
    description: 'Setup, workflows, and day-to-day detection engineering',
    url: '/docs/usage/',
    icon: 'BookOpen' as const,
  },
  {
    key: 'cli',
    title: 'CLI',
    description: 'Command-line reference for operators and CI',
    url: '/docs/cli/',
    icon: 'Terminal' as const,
  },
  {
    key: 'mcp',
    title: 'MCP',
    description: 'Agent server for editors and AI assistants',
    url: '/docs/mcp/',
    icon: 'Bot' as const,
  },
  {
    key: 'sdk',
    title: 'SDK',
    description: 'Python API for embedding OpenTide',
    url: '/docs/sdk/',
    icon: 'Code' as const,
  },
] as const;
