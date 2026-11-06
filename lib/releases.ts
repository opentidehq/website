import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROJECTS, type ProjectId, type ReleaseProject } from './release-projects.ts';

/** Synced from the engine repo. The product page renders this file; do not hand-copy versions. */
export const RELEASE_NOTES_PATH = join(process.cwd(), 'content/docs/usage/releases.mdx');

/** Each project's CHANGELOG.md, synced by `scripts/sync-changelogs.mjs`. */
export const CHANGELOG_DIR = join(process.cwd(), 'content/releases');

export type ReleaseKind = 'major' | 'minor' | 'patch' | 'beta' | 'prerelease';

export type ReleaseLink = {
  label: string;
  href: string;
};

/**
 * The parts of a version that list changes, in the order every project's notes use (the
 * release-notes skill in each repository): Keep a Changelog's six types, after Breaking.
 */
export type ChangeCategory = 'breaking' | 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';

export const CHANGE_CATEGORIES: readonly { id: ChangeCategory; label: string }[] = [
  { id: 'breaking', label: 'Breaking' },
  { id: 'added', label: 'Added' },
  { id: 'changed', label: 'Changed' },
  { id: 'deprecated', label: 'Deprecated' },
  { id: 'removed', label: 'Removed' },
  { id: 'fixed', label: 'Fixed' },
  { id: 'security', label: 'Security' },
];

export type ReleaseSection = {
  /** The category's label, or the heading as written when it names no category. */
  title: string;
  /** The category the heading names; null for any other heading. */
  category: ChangeCategory | null;
  /** The `####` heading under the category's, when the category is split into groups. */
  group: string | null;
  paragraphs: string[];
  items: string[];
  /** The nested list under each item, by index: `subitems[i]` belongs to `items[i]`. */
  subitems: string[][];
};

export type ReleaseNote = {
  version: string;
  dateLabel: string;
  dateIso: string | null;
  kind: ReleaseKind;
  /** The summary, a Breaking section or an entry marked breaking says it breaks something users rely on. */
  breaking: boolean;
  summary: string;
  /** Prose that sits between the summary (or install block) and the first section. */
  notes: string[];
  /** What a user does after installing this version; null when there is nothing to do. */
  upgrade: ReleaseSection | null;
  /** The categories in their standard order, then any other heading in the order it was written. */
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

/** Headings, lowercased, that name a category in the words some notes use instead of its label. */
const CATEGORY_ALIASES: Record<string, ChangeCategory> = {
  'breaking changes': 'breaking',
  'breaking change': 'breaking',
  adds: 'added',
  new: 'added',
  features: 'added',
  'what this version adds': 'added',
  changes: 'changed',
  'what this version changes': 'changed',
  deprecations: 'deprecated',
  removals: 'removed',
  fixes: 'fixed',
  'bug fixes': 'fixed',
  'what this version fixes': 'fixed',
};

const UPGRADE_HEADINGS = new Set(['upgrade', 'upgrading', 'upgrade steps', 'upgrade notes']);

/** Headings that name no category, shown in plainer words. */
const OTHER_TITLES: Record<string, string> = {
  'what changes': 'What changes',
  'what changes for authors and scripts': 'What changes',
  'what changes for scripts': 'What changes',
  'what this version is': 'In this release',
  'what it is not': 'Not in this release',
};

export type HeadingKind =
  | { kind: 'category'; category: ChangeCategory; title: string }
  | { kind: 'upgrade'; title: string }
  | { kind: 'other'; title: string };

/**
 * What a section heading names: one of the categories, the upgrade steps, or something else.
 * Case, a trailing colon and a leading warning sign do not matter; `Security: regenerate CI`
 * is still Security.
 */
export function classifyHeading(heading: string): HeadingKind {
  const written = heading.trim().replace(/:\s*$/, '');
  const key = written
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .toLowerCase()
    .replaceAll(/\s+/g, ' ');
  const category =
    CHANGE_CATEGORIES.find(({ id }) => id === key)?.id ??
    CATEGORY_ALIASES[key] ??
    (/^security\b/.test(key) ? 'security' : undefined);
  if (category) {
    return { kind: 'category', category, title: CHANGE_CATEGORIES.find(({ id }) => id === category)!.label };
  }
  if (UPGRADE_HEADINGS.has(key)) return { kind: 'upgrade', title: 'Upgrade' };
  return { kind: 'other', title: OTHER_TITLES[key] ?? written };
}

const CATEGORY_RANK = new Map(CHANGE_CATEGORIES.map(({ id }, index) => [id, index]));

/** Categories in their standard order, groups in the order written; other headings after them. */
function ordered(sections: readonly ReleaseSection[]): ReleaseSection[] {
  const rank = (section: ReleaseSection) =>
    section.category === null ? CHANGE_CATEGORIES.length : CATEGORY_RANK.get(section.category)!;
  return sections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => rank(a.section) - rank(b.section) || a.index - b.index)
    .map(({ section }) => section);
}

function newSection(heading: HeadingKind, group: string | null = null): ReleaseSection {
  return {
    title: heading.title,
    category: heading.kind === 'category' ? heading.category : null,
    group,
    paragraphs: [],
    items: [],
    subitems: [],
  };
}

function hasContent(section: ReleaseSection): boolean {
  return section.items.length > 0 || section.paragraphs.length > 0;
}

/** `**Breaking:** detail` or `**Breaking** — detail`: the mark is the whole bold run. */
const BREAKING_RUN = /^\*\*breaking(?:\s*[:—–-]\s*\*\*|\*\*\s*[:—–-]?)\s*/i;
/** `**Breaking: lead.** detail`: the mark opens the lead, which stays bold. */
const BREAKING_LEAD = /^\*\*breaking\s*[:—–-]\s*(?!\*\*)/i;

/**
 * An entry with its breaking mark taken off, and whether it had one. The mark is how notes
 * without a Breaking section flag an entry under Changed or Removed.
 */
export function breakingEntry(item: string): { breaking: boolean; text: string } {
  const run = BREAKING_RUN.exec(item);
  if (run) return { breaking: true, text: item.slice(run[0].length) };
  const lead = BREAKING_LEAD.exec(item);
  if (lead) return { breaking: true, text: `**${item.slice(lead[0].length)}` };
  return { breaking: false, text: item };
}

/** `See the [CHANGELOG](…) for every change.`: a link to the full record, not prose. */
const CHANGELOG_POINTER = /^See the \[CHANGELOG\]\(([^)\s]+)\) for every change\.?$/i;

const VERSION_HEADING = /^##\s+(\d+\.\d+\.\d+)\s+[—–-]\s+(.+?)\s*$/;
const BOLD_LINE = /^\*\*(.+?)\*\*\s*$/;
const BULLET = /^- (.+)$/;
const LINK_BULLET = /^- \[([^\]]+)\]\(([^)\s]+)\)\s*$/;

export function releaseAnchor(version: string): string {
  return `v${version.replaceAll('.', '-')}`;
}

/** The anchor of a release's upgrade steps, or of one category's list, inside the release. */
export function categoryAnchor(version: string, part: ChangeCategory | 'upgrade'): string {
  return `${releaseAnchor(version)}-${part}`;
}

export function kindLabel(kind: ReleaseKind): string {
  if (kind === 'beta') return 'Public beta';
  if (kind === 'prerelease') return 'Pre-release';
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
  return (
    BREAKING.test(summary) ||
    sections.some(
      (section) =>
        (section.category === 'breaking' && hasContent(section)) ||
        section.items.some((item) => breakingEntry(item).breaking),
    )
  );
}

function collapse(lines: string[]): string {
  return lines.join(' ').replaceAll(/\s+/g, ' ').trim();
}

type Block = Pick<ReleaseSection, 'paragraphs' | 'items' | 'subitems'>;

/** `- item`, `* item`, `+ item`, and the `1.` of an ordered list (upgrade steps are often numbered). */
const LIST_ITEM = /^(?:[-*+]|\d{1,3}[.)])\s+(.+)$/;

/**
 * The paragraphs and list of one section. A list nested under an item becomes that item's
 * subitems, and anything nested deeper joins the same list. An indented line continues the
 * item, or the nested item, above it.
 */
function parseBlock(lines: readonly string[]): Block {
  const block: Block = { paragraphs: [], items: [], subitems: [] };
  let paragraph: string[] = [];
  // The indent of the last top-level item, and whether the last line was a nested item.
  let itemIndent = 0;
  let inSubitem = false;
  const flush = () => {
    const text = collapse(paragraph);
    paragraph = [];
    if (text) block.paragraphs.push(text);
  };
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    const item = LIST_ITEM.exec(trimmed);
    if (item?.[1]) {
      flush();
      if (block.items.length > 0 && indent > itemIndent) {
        block.subitems.at(-1)!.push(item[1].trim());
        inSubitem = true;
        continue;
      }
      block.items.push(item[1].trim());
      block.subitems.push([]);
      itemIndent = indent;
      inSubitem = false;
      continue;
    }
    if (indent > 0 && block.items.length > 0 && paragraph.length === 0) {
      const list = inSubitem ? block.subitems.at(-1)! : block.items;
      list[list.length - 1] = `${list.at(-1)} ${trimmed}`;
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return block;
}

/** A run of lines under one heading; `group` is the `####` heading under a category's. */
type Segment = { heading: HeadingKind; group: string | null; lines: string[] };

/** Prose, with each `See the [CHANGELOG](…) for every change.` taken out as a link. */
function withoutPointers(paragraphs: readonly string[], links: ReleaseLink[]): string[] {
  return paragraphs.filter((paragraph) => {
    const pointer = CHANGELOG_POINTER.exec(paragraph);
    if (!pointer?.[1]) return true;
    if (!links.some((link) => link.href === pointer[1])) links.push({ label: 'Full changelog', href: pointer[1] });
    return false;
  });
}

/**
 * A version's notes and its sections. The Upgrade steps come out on their own; the categories
 * are put in their standard order, whatever order they were written in. A list before the first
 * heading is a section of its own, Details.
 */
function assemble(
  intro: Block,
  segments: readonly Segment[],
  links: ReleaseLink[],
): Pick<ReleaseNote, 'notes' | 'upgrade' | 'sections'> {
  let upgrade: ReleaseSection | null = null;
  const sections: ReleaseSection[] = [];
  if (intro.items.length > 0) {
    sections.push({ ...newSection({ kind: 'other', title: 'Details' }), items: intro.items, subitems: intro.subitems });
  }
  for (const segment of segments) {
    const block = parseBlock(segment.lines);
    const paragraphs = withoutPointers(block.paragraphs, links);
    if (segment.heading.kind === 'upgrade') {
      upgrade ??= newSection(segment.heading);
      upgrade.paragraphs.push(...paragraphs);
      upgrade.items.push(...block.items);
      upgrade.subitems.push(...block.subitems);
      continue;
    }
    sections.push({ ...newSection(segment.heading, segment.group), paragraphs, items: block.items, subitems: block.subitems });
  }
  return {
    notes: withoutPointers(intro.paragraphs, links),
    upgrade: upgrade && hasContent(upgrade) ? upgrade : null,
    sections: ordered(sections.filter(hasContent)),
  };
}

/** A bold line names a part of the notes before the summary has ended only when it is a known one. */
function isNotesHeading(title: string): boolean {
  return /^(install|links)$/i.test(title) || classifyHeading(title).kind !== 'other';
}

/**
 * One version of the engine's notes (`docs/usage/releases.md`): the summary paragraph, an
 * `**Install**` fence the page replaces with its own command, notes, sections headed by a bold
 * line (`**Added**`), and `**Links**`.
 */
function parseReleaseBody(body: string): Pick<ReleaseNote, 'summary' | 'notes' | 'upgrade' | 'sections' | 'links'> {
  const summaryLines: string[] = [];
  const notes: string[] = [];
  const segments: Segment[] = [];
  const links: ReleaseLink[] = [];
  let state: 'summary' | 'notes' | 'links' | 'section' = 'summary';
  let fence = false;

  const push = (line: string) => {
    if (state === 'section') segments.at(-1)!.lines.push(line);
    else if (state === 'notes') notes.push(line);
  };

  for (const raw of body.replaceAll('\r\n', '\n').split('\n')) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      fence = !fence;
      if (state === 'summary' && summaryLines.length > 0) state = 'notes';
      // A fence ends the paragraph it interrupts.
      push('');
      continue;
    }
    if (fence) continue;
    const bold = BOLD_LINE.exec(trimmed)?.[1]?.trim();
    if (bold && (state !== 'summary' || isNotesHeading(bold))) {
      if (/^links$/i.test(bold)) state = 'links';
      else if (/^install$/i.test(bold)) state = 'notes';
      else {
        segments.push({ heading: classifyHeading(bold), group: null, lines: [] });
        state = 'section';
      }
      continue;
    }
    if (state === 'summary') {
      if (trimmed) summaryLines.push(trimmed);
      else if (summaryLines.length > 0) state = 'notes';
      continue;
    }
    if (state === 'links') {
      const link = LINK_BULLET.exec(trimmed);
      if (link?.[1] && link[2]) links.push({ label: link[1], href: link[2] });
      continue;
    }
    push(raw);
  }

  // The summary is the first paragraph; everything else before the first section is a note.
  return { summary: collapse(summaryLines), ...assemble(parseBlock(notes), segments, links), links };
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
    const parsed = parseReleaseBody(body);
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
      upgrade: parsed.upgrade,
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

export type ChangeCount = { category: ChangeCategory; label: string; count: number };

/** Entries in one section; a section of prose alone counts as one. */
function entries(section: ReleaseSection): number {
  return section.items.length || (section.paragraphs.length > 0 ? 1 : 0);
}

/** How many entries each category holds, in the standard order, leaving out empty ones. */
export function changeCounts(release: Pick<ReleaseNote, 'sections'>): ChangeCount[] {
  return CHANGE_CATEGORIES.flatMap(({ id, label }) => {
    const count = release.sections
      .filter((section) => section.category === id)
      .reduce((total, section) => total + entries(section), 0);
    return count > 0 ? [{ category: id, label, count }] : [];
  });
}

/** Entries under headings that name no category. */
export function otherChangeCount(release: Pick<ReleaseNote, 'sections'>): number {
  return release.sections
    .filter((section) => section.category === null)
    .reduce((total, section) => total + entries(section), 0);
}

/** Every entry of a release: its notes, its upgrade steps, and every section's. */
export function totalChanges(release: Pick<ReleaseNote, 'notes' | 'upgrade' | 'sections'>): number {
  return (
    release.notes.length +
    (release.upgrade ? entries(release.upgrade) : 0) +
    release.sections.reduce((total, section) => total + entries(section), 0)
  );
}

export type CategoryBlock = ChangeCount & {
  /** The category's sections: one, or one per `####` group, in the order written. */
  groups: ReleaseSection[];
};

/** The categories a release lists, each with its groups, in the standard order. */
export function categoryBlocks(release: Pick<ReleaseNote, 'sections'>): CategoryBlock[] {
  return changeCounts(release).map((count) => ({
    ...count,
    groups: release.sections.filter((section) => section.category === count.category && hasContent(section)),
  }));
}

/** Sections whose heading names no category, in the order written. */
export function otherSections(release: Pick<ReleaseNote, 'sections'>): ReleaseSection[] {
  return release.sections.filter((section) => section.category === null);
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
const CHANGELOG_SECTION = /^(#{3,6})\s+(.+?)\s*$/;
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
 * A Keep a Changelog file (`## [1.2.0] - 2026-10-26`, `### Added`) as release notes, newest
 * first. The first paragraph under a version, when there is one, is its summary; later prose
 * before the first heading is a note. `### Upgrade` holds the upgrade steps, and the categories
 * are put in their standard order. A `####` heading under a category splits it into groups
 * (`Added`, group `Runtime and core`). `Unreleased` is skipped and code blocks are left out. A
 * heading that is not a version and a real date throws: the sync keeps the committed copy
 * rather than publish a broken page.
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

    const intro: string[] = [];
    const segments: Segment[] = [];
    let parent: HeadingKind | null = null;
    let fence = false;
    for (const raw of lines.slice(1)) {
      const trimmed = raw.trim();
      const target = segments.at(-1)?.lines ?? intro;
      if (trimmed.startsWith('```')) {
        fence = !fence;
        // A fence ends the paragraph it interrupts.
        target.push('');
        continue;
      }
      if (fence || LINK_REFERENCE.test(trimmed)) continue;
      const section = CHANGELOG_SECTION.exec(trimmed);
      if (section?.[1] && section[2]) {
        const kind = classifyHeading(section[2]);
        if (section[1].length === 3 || parent === null) {
          parent = kind;
          segments.push({ heading: kind, group: null, lines: [] });
        } else if (parent.kind === 'category') {
          segments.push({ heading: parent, group: section[2], lines: [] });
        } else if (parent.kind === 'upgrade') {
          segments.push({ heading: parent, group: null, lines: [] });
        } else {
          segments.push({ heading: { kind: 'other', title: `${parent.title}: ${section[2]}` }, group: null, lines: [] });
        }
        continue;
      }
      target.push(raw);
    }

    const extraLinks: ReleaseLink[] = [];
    const introBlock = parseBlock(intro);
    const summary = introBlock.paragraphs[0] ?? '';
    const parsed = assemble({ ...introBlock, paragraphs: introBlock.paragraphs.slice(1) }, segments, extraLinks);
    const published =
      !yanked && project.firstPublished !== undefined && compareVersions(version, project.firstPublished) >= 0;

    releases.push({
      version,
      dateLabel: formatIsoDate(dateIso),
      dateIso,
      kind: version.includes('-') || project.prerelease?.(version) ? 'prerelease' : kindForVersion(version),
      breaking: isBreaking(summary, parsed.sections),
      summary,
      notes: yanked ? ['This version was yanked: do not install it.', ...parsed.notes] : parsed.notes,
      upgrade: parsed.upgrade,
      sections: parsed.sections,
      links: [
        ...(published
          ? [
              { label: project.registry.label, href: project.registry.versionUrl(version) },
              ...(project.mirrors ?? []).map((mirror) => ({ label: mirror.label, href: mirror.versionUrl(version) })),
            ]
          : []),
        { label: 'GitHub Release', href: `${project.repository}/releases/tag/v${version}` },
        ...extraLinks,
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
