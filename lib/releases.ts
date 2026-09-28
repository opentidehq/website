import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Synced from the engine repo. The product page renders this file; do not hand-copy versions. */
export const RELEASE_NOTES_PATH = join(process.cwd(), 'content/docs/usage/releases.mdx');

export const CHANGELOG_URL =
  'https://github.com/OpenTideHQ/opentide/blob/development/CHANGELOG.md';

export type ReleaseKind = 'major' | 'minor' | 'patch' | 'beta';

export type ReleaseLink = {
  label: string;
  href: string;
};

export type ReleaseSection = {
  title: string;
  paragraphs: string[];
  items: string[];
};

export type ReleaseNote = {
  version: string;
  dateLabel: string;
  dateIso: string | null;
  kind: ReleaseKind;
  summary: string;
  /** Prose that sits between the install block and the first change list. */
  notes: string[];
  sections: ReleaseSection[];
  links: ReleaseLink[];
  installCommand: string;
};

const MONTHS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

const SECTION_TITLES: Record<string, string> = {
  'What changes for authors and scripts': 'What changes',
  'What changes for scripts': 'What changes',
  'What this version fixes': 'Fixes',
  'What this version adds': 'Adds',
  'What this version changes': 'Changes',
  'What this version is': 'In this release',
  'What it is not': 'Not in this release',
};

const VERSION_HEADING = /^##\s+(\d+\.\d+\.\d+)\s+[—–-]\s+(.+?)\s*$/;
const BOLD_LINE = /^\*\*(.+?)\*\*\s*$/;
const BULLET = /^- (.+)$/;
const LINK_BULLET = /^- \[([^\]]+)\]\(([^)\s]+)\)\s*$/;

export function releaseAnchor(version: string): string {
  return `v${version.replaceAll('.', '-')}`;
}

export function friendlySectionTitle(title: string): string {
  return SECTION_TITLES[title] ?? title;
}

export function kindLabel(kind: ReleaseKind): string {
  if (kind === 'beta') return 'Public beta';
  if (kind === 'major') return 'Major';
  if (kind === 'minor') return 'Minor';
  return 'Patch';
}

function toIsoDate(label: string): string | null {
  const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(label.trim());
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
}

function kindFor(version: string, summary: string): ReleaseKind {
  const plain = summary.replaceAll('**', '');
  if (/first public/i.test(plain)) return 'beta';
  if (/^minor\b/i.test(plain)) return 'minor';
  if (/^patch\b/i.test(plain)) return 'patch';
  const parts = version.split('.').map((part) => Number(part));
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (patch === 0 && minor === 0) return 'major';
  if (patch === 0) return 'minor';
  return 'patch';
}

function collapse(lines: string[]): string {
  return lines.join(' ').replaceAll(/\s+/g, ' ').trim();
}

type ParseMode = 'summary' | 'body' | 'links' | 'fence';

function parseReleaseBody(body: string, version: string): Omit<
  ReleaseNote,
  'version' | 'dateLabel' | 'dateIso' | 'kind' | 'installCommand'
> {
  const lines = body.replaceAll('\r\n', '\n').split('\n');
  let mode: ParseMode = 'summary';
  let resume: ParseMode = 'body';
  const summaryParts: string[] = [];
  const notes: string[] = [];
  const sections: ReleaseSection[] = [];
  const links: ReleaseLink[] = [];
  let current: ReleaseSection | null = null;
  let paragraph: string[] = [];

  function flush(target: 'summary' | 'note' | 'section') {
    const text = collapse(paragraph);
    paragraph = [];
    if (!text) return;
    if (target === 'summary') {
      summaryParts.push(text);
      return;
    }
    if (target === 'note') {
      notes.push(text);
      return;
    }
    current?.paragraphs.push(text);
  }

  function flushOpen() {
    if (mode === 'summary') {
      flush('summary');
      return;
    }
    if (current) {
      flush('section');
      return;
    }
    flush('note');
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      flushOpen();
      if (mode === 'fence') {
        mode = resume;
      } else {
        resume = mode === 'summary' ? 'body' : mode;
        mode = 'fence';
      }
      continue;
    }
    if (mode === 'fence') continue;

    if (!trimmed) {
      flushOpen();
      if (mode === 'summary' && summaryParts.length > 0) mode = 'body';
      continue;
    }

    if (mode === 'links') {
      const link = LINK_BULLET.exec(trimmed);
      if (link?.[1] && link[2]) {
        links.push({ label: link[1], href: link[2] });
      }
      continue;
    }

    const heading = BOLD_LINE.exec(trimmed);
    if (heading?.[1] && (mode !== 'summary' || heading[1] === 'Install' || heading[1] === 'Links')) {
      flushOpen();
      const title = heading[1].trim();
      if (title === 'Links') {
        mode = 'links';
        current = null;
        continue;
      }
      if (title === 'Install') {
        mode = 'body';
        current = null;
        continue;
      }
      current = { title: friendlySectionTitle(title), paragraphs: [], items: [] };
      sections.push(current);
      mode = 'body';
      continue;
    }

    if (mode === 'summary') {
      paragraph.push(trimmed);
      continue;
    }

    const bullet = BULLET.exec(trimmed);
    if (bullet?.[1]) {
      flushOpen();
      if (!current) {
        current = { title: 'Details', paragraphs: [], items: [] };
        sections.push(current);
      }
      current.items.push(bullet[1].trim());
      continue;
    }

    paragraph.push(trimmed);
  }

  flushOpen();

  return {
    summary: summaryParts.join(' '),
    notes,
    sections: sections.filter((section) => section.items.length > 0 || section.paragraphs.length > 0),
    links,
  };
}

export function parseReleaseNotes(markdown: string): ReleaseNote[] {
  const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n*/, '');
  const releases: ReleaseNote[] = [];

  for (const chunk of withoutFrontmatter.split(/\n(?=## )/)) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('## ')) continue;
    const newline = trimmed.indexOf('\n');
    const heading = newline === -1 ? trimmed : trimmed.slice(0, newline);
    const body = newline === -1 ? '' : trimmed.slice(newline + 1);
    const match = VERSION_HEADING.exec(heading);
    if (!match?.[1] || !match[2]) {
      throw new Error(`Release heading is not a version and date: ${heading}`);
    }
    const version = match[1];
    const dateLabel = match[2].trim();
    const parsed = parseReleaseBody(body, version);
    if (!parsed.summary) {
      throw new Error(`Release ${version} is missing a summary paragraph`);
    }
    releases.push({
      version,
      dateLabel,
      dateIso: toIsoDate(dateLabel),
      kind: kindFor(version, parsed.summary),
      summary: parsed.summary,
      notes: parsed.notes,
      sections: parsed.sections,
      links: parsed.links,
      installCommand: `pip install opentide==${version}`,
    });
  }

  if (releases.length === 0) {
    throw new Error('Release notes did not include any versions');
  }

  return releases;
}

export function publicLinks(links: readonly ReleaseLink[]): ReleaseLink[] {
  return links.filter((link) => link.label.toLowerCase() !== 'changelog');
}

export async function loadReleaseNotes(): Promise<ReleaseNote[]> {
  const markdown = await readFile(RELEASE_NOTES_PATH, 'utf8');
  return parseReleaseNotes(markdown);
}
