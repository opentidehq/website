/** The landing's chapters, in page order. `id` is the section anchor; `n` matches its chapter label. */
export const CHAPTERS = [
  { id: 'why', n: '01', label: 'Why it matters' },
  { id: 'what', n: '02', label: 'What opentide is' },
  { id: 'how', n: '03', label: 'How it runs' },
  { id: 'why-a-cli', n: '04', label: 'Built for agents' },
  { id: 'agents', n: '05', label: 'Agents' },
  { id: 'next', n: '06', label: 'What comes next' },
  { id: 'start', n: '07', label: 'Get started' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
