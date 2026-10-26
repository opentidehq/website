import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROJECTS, type ProjectId, type ReleaseProject } from './release-projects.ts';

/** Synced from the engine repo. The product page renders this file; do not hand-copy versions. */
export const RELEASE_NOTES_PATH = join(process.cwd(), 'content/docs/usage/releases.mdx');

/** Each project's CHANGELOG.md, synced by `scripts/sync-changelogs.mjs`. */
export const CHANGELOG_DIR = join(process.cwd(), 'content/releases');

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
  /** The summary or a section says the release breaks something users rely on. */
  breaking: boolean;
  summary: string;
  /** Prose that sits between the install block and the first change list. */
  notes: string[];
  sections: ReleaseSection[];
  links: ReleaseLink[];
  /** Null for a version tagged after the fact, which no registry carries. */
  installCommand: string | null;
};

/** The minor series a version belongs to, newest first: `0.17` holds 0.17.0 to 0.17.2. */
export type ReleaseSeries = {
  series: string;
  releases: ReleaseNote[];
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

/** The engine's notes open with "Patch release." or "First public beta"; a version alone says less. */
function kindFor(version: string, summary: string): ReleaseKind {
  const plain = summary.replaceAll('**', '');
  if (/first public/i.test(plain)) return 'beta';
  if (/^minor\b/i.test(plain)) return 'minor';
  if (/^patch\b/i.test(plain)) return 'patch';
  return kindForVersion(version);
}

function kindForVersion(version: string): ReleaseKind {
  const parts = version.split('.').map((part) => Number(part));
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (patch === 0 && minor === 0) return 'major';
  if (patch === 0) return 'minor';
  return 'patch';
}

// "breaking changes", "**Breaking:**", but never "non-breaking" or "no breaking changes".
const BREAKING = /(?<![-\w])(?<!\bno\s)(?<!\bnot\s)breaking\b/i;

function isBreaking(summary: string, sections: readonly ReleaseSection[]): boolean {
  return BREAKING.test(summary) || sections.some((section) => /^breaking\b/i.test(section.title));
}

function collapse(lines: string[]): string {
  return lines.join(' ').replaceAll(/\s+/g, ' ').trim();
}

type ParseMode = 'summary' | 'body' | 'links' | 'fence';

function parseReleaseBody(body: string, version: string): Omit<
  ReleaseNote,
  'version' | 'dateLabel' | 'dateIso' | 'kind' | 'breaking' | 'installCommand'
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
      breaking: isBreaking(parsed.summary, parsed.sections),
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

const MONTH_NAMES = Object.keys(MONTHS).map((name) => name[0]!.toUpperCase() + name.slice(1));

/** `2026-10-26` as the engine notes write it: `26 October 2026`. */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  return `${day} ${MONTH_NAMES[(month ?? 1) - 1]} ${year}`;
}

/** SemVer order: the numeric core, then a prerelease (`1.0.0-rc.1`) before its release. */
export function compareVersions(a: string, b: string): number {
  const [coreA = '', preA] = a.split(/-(.*)/s);
  const [coreB = '', preB] = b.split(/-(.*)/s);
  const pa = coreA.split('.').map(Number);
  const pb = coreB.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (preA === preB) return 0;
  if (preA === undefined) return 1;
  if (preB === undefined) return -1;
  return preA.localeCompare(preB, 'en', { numeric: true });
}

const CHANGELOG_HEADING =
  /^##\s+\[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]\s+[—–-]\s+(\d{4})-(\d{2})-(\d{2})(\s+\[yanked\])?\s*$/i;
const UNRELEASED = /^##\s+\[?unreleased\]?/i;
const CHANGELOG_SECTION = /^###\s+(.+?)\s*$/;
const LIST_ITEM = /^[-*+]\s+(.+)$/;
const LINK_REFERENCE = /^\[[^\]]+\]:\s/;

/** The `## ` headings of a markdown file, ignoring lines inside code fences. */
function versionChunks(markdown: string): string[][] {
  const chunks: string[][] = [];
  let fence = false;
  for (const line of markdown.replaceAll('\r\n', '\n').split('\n')) {
    if (line.trimStart().startsWith('```')) fence = !fence;
    if (!fence && line.startsWith('## ')) chunks.push([line]);
    else chunks.at(-1)?.push(line);
  }
  return chunks;
}

function isoDate(year: string, month: string, day: string): string | null {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const iso = `${year}-${month}-${day}`;
  return date.toISOString().startsWith(iso) ? iso : null;
}

/**
 * A Keep a Changelog file (`## [1.2.0] - 2026-10-26`, `### Added`) as release notes,
 * newest first. The first paragraph under a version, when there is one, is its summary.
 * `Unreleased` is skipped, nested list items become items of their own, and code blocks
 * are left out. A heading that is not a version and a real date throws: the sync keeps
 * the committed copy rather than publish a broken page.
 */
export function parseChangelog(markdown: string, project: ReleaseProject): ReleaseNote[] {
  const releases: ReleaseNote[] = [];

  for (const lines of versionChunks(markdown)) {
    const heading = lines[0] ?? '';
    if (UNRELEASED.test(heading)) continue;
    const match = CHANGELOG_HEADING.exec(heading);
    const version = match?.[1];
    const dateIso = match ? isoDate(match[2]!, match[3]!, match[4]!) : null;
    if (!version || !dateIso) {
      throw new Error(`${project.name}: changelog heading is not a version and date: ${heading}`);
    }
    const yanked = Boolean(match?.[5]);

    const summaryParts: string[] = [];
    const notes: string[] = [];
    const sections: ReleaseSection[] = [];
    let current: ReleaseSection | null = null;
    let paragraph: string[] = [];
    let fence = false;

    const flush = () => {
      const text = collapse(paragraph);
      paragraph = [];
      if (!text) return;
      if (current) current.paragraphs.push(text);
      else if (summaryParts.length === 0) summaryParts.push(text);
      else notes.push(text);
    };

    for (const raw of lines.slice(1)) {
      const trimmed = raw.trim();
      if (trimmed.startsWith('```')) {
        flush();
        fence = !fence;
        continue;
      }
      if (fence || LINK_REFERENCE.test(trimmed)) continue;
      if (!trimmed) {
        flush();
        continue;
      }
      const section = CHANGELOG_SECTION.exec(trimmed);
      if (section?.[1]) {
        flush();
        current = { title: section[1], paragraphs: [], items: [] };
        sections.push(current);
        continue;
      }
      const item = LIST_ITEM.exec(trimmed);
      if (item?.[1]) {
        flush();
        if (!current) {
          current = { title: 'Details', paragraphs: [], items: [] };
          sections.push(current);
        }
        current.items.push(item[1].trim());
        continue;
      }
      // An indented line under a list item continues it.
      if (/^\s/.test(raw) && current && current.items.length > 0 && paragraph.length === 0) {
        const last = current.items.length - 1;
        current.items[last] = `${current.items[last]} ${trimmed}`;
        continue;
      }
      paragraph.push(trimmed);
    }
    flush();

    const summary = summaryParts.join(' ');
    const kept = sections.filter((section) => section.items.length > 0 || section.paragraphs.length > 0);
    const published =
      !yanked && project.firstPublished !== undefined && compareVersions(version, project.firstPublished) >= 0;

    releases.push({
      version,
      dateLabel: formatIsoDate(dateIso),
      dateIso,
      kind: kindForVersion(version),
      breaking: isBreaking(summary, kept),
      summary,
      notes: yanked ? ['This version was yanked: do not install it.', ...notes] : notes,
      sections: kept,
      links: [
        ...(published ? [{ label: project.registry.label, href: project.registry.versionUrl(version) }] : []),
        { label: 'GitHub Release', href: `${project.repository}/releases/tag/v${version}` },
      ],
      installCommand: published ? project.install(version) : null,
    });
  }

  if (releases.length === 0) {
    throw new Error(`${project.name}: the changelog did not include any versions`);
  }
  return releases.sort((a, b) => compareVersions(b.version, a.version));
}

/** Releases grouped by minor series, newest first, in the order they arrive. */
export function groupBySeries(releases: readonly ReleaseNote[]): ReleaseSeries[] {
  const groups: ReleaseSeries[] = [];
  for (const release of releases) {
    const series = release.version.split('.').slice(0, 2).join('.');
    const last = groups.at(-1);
    if (last?.series === series) last.releases.push(release);
    else groups.push({ series, releases: [release] });
  }
  return groups;
}

export async function loadReleaseNotes(): Promise<ReleaseNote[]> {
  const markdown = await readFile(RELEASE_NOTES_PATH, 'utf8');
  return parseReleaseNotes(markdown);
}

/** One project's releases, newest first. */
export async function loadProjectReleases(id: ProjectId): Promise<ReleaseNote[]> {
  const project = PROJECTS.find((candidate) => candidate.id === id);
  if (!project) throw new Error(`Unknown release project: ${id}`);
  if (!project.changelog) return loadReleaseNotes();
  const markdown = await readFile(join(CHANGELOG_DIR, project.changelog), 'utf8');
  return parseChangelog(markdown, project);
}
