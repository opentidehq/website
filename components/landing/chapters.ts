/** The landing's chapters, in page order. `id` is the section anchor; `n` matches its SectionLabel. */
export const CHAPTERS = [
  { id: 'why', n: '01', label: 'Why it matters', short: 'Why' },
  { id: 'what', n: '02', label: 'What opentide is', short: 'What' },
  { id: 'why-a-cli', n: '03', label: 'Why a CLI', short: 'CLI' },
  { id: 'agents', n: '04', label: 'Agents', short: 'Agents' },
  { id: 'next', n: '05', label: 'What comes next', short: 'Next' },
  { id: 'start', n: '06', label: 'Get started', short: 'Start' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
