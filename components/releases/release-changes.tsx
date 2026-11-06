import {
  CircleMinus,
  CirclePlus,
  Hourglass,
  List as ListIcon,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Tag } from '@/components/landing/ui';
import { RichText } from '@/components/releases/rich-text';
import {
  breakingEntry,
  categoryAnchor,
  categoryBlocks,
  changeCounts,
  otherSections,
  otherChangeCount,
  type ChangeCategory,
  type ReleaseNote,
  type ReleaseSection,
} from '@/lib/releases';

/**
 * One icon per category, the same on every project's page. Categories are told apart by icon
 * and label, never by colour: green and red stay in code panels (DESIGN.md).
 */
export const CATEGORY_ICONS: Record<ChangeCategory, LucideIcon> = {
  breaking: TriangleAlert,
  added: CirclePlus,
  changed: RefreshCw,
  deprecated: Hourglass,
  removed: CircleMinus,
  fixed: Wrench,
  security: ShieldCheck,
};

export type HeadingLevel = 'h3' | 'h4' | 'h5';

const BELOW: Record<HeadingLevel, HeadingLevel> = { h3: 'h4', h4: 'h5', h5: 'h5' };

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * The release at a glance: whether there are upgrade steps, and how many entries each category
 * holds. In the latest release each count links to its list; `inline` renders phrasing content
 * only, for a `<summary>`.
 */
export function ChangeCounts({
  release,
  linked = false,
  inline = false,
}: {
  release: ReleaseNote;
  linked?: boolean;
  inline?: boolean;
}) {
  const steps = release.upgrade ? Math.max(release.upgrade.items.length, 1) : 0;
  const categories = changeCounts(release);
  // Entries under a heading that names no category, as notes written before the standard have.
  const other = otherChangeCount(release);
  const counts: { part: ChangeCategory | 'upgrade' | 'other'; text: string; Icon: LucideIcon; anchored: boolean }[] = [
    ...(steps > 0
      ? [{ part: 'upgrade' as const, text: plural(steps, 'upgrade step'), Icon: ListChecks, anchored: true }]
      : []),
    ...categories.map(({ category, label, count, listed }) => ({
      part: category,
      text: `${count} ${label.toLowerCase()}`,
      Icon: CATEGORY_ICONS[category],
      // Entries marked breaking under other categories have no Breaking list to link to.
      anchored: listed,
    })),
    ...(other > 0
      ? [
          {
            part: 'other' as const,
            text: categories.length > 0 ? `${other} other` : plural(other, 'change'),
            Icon: ListIcon,
            anchored: false,
          },
        ]
      : []),
  ];
  if (counts.length === 0) return null;
  const List = inline ? 'span' : 'ul';
  const Item = inline ? 'span' : 'li';
  return (
    <List className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--landing-muted)]">
      {counts.map(({ part, text, Icon, anchored }) => (
        <Item
          key={part}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
            part === 'upgrade' || part === 'breaking' ? 'font-medium text-[var(--landing-ink)]' : ''
          }`}
        >
          <Icon className="size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
          {linked && anchored && part !== 'other' ? (
            <a
              href={`#${categoryAnchor(release.version, part)}`}
              className="underline-offset-2 hover:text-[var(--landing-ink)] hover:underline"
            >
              {text}
            </a>
          ) : (
            text
          )}
        </Item>
      ))}
    </List>
  );
}

function Entries({ section, ordered = false }: { section: ReleaseSection; ordered?: boolean }) {
  if (section.items.length === 0) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <List className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--landing-muted)]">
      {section.items.map((raw, index) => {
        // An entry may carry the breaking mark itself; under Breaking the tag would repeat the heading.
        const marked = breakingEntry(raw);
        const breaking = marked.breaking && section.category !== 'breaking';
        const text = marked.text;
        return (
          <li key={index} className={`relative text-pretty ${ordered ? 'pl-8' : 'pl-4'}`}>
            {ordered ? (
              <span
                aria-hidden
                className="absolute top-0 left-0 flex size-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] font-mono text-[11px] font-semibold text-[var(--landing-accent)]"
              >
                {index + 1}
              </span>
            ) : (
              <span
                aria-hidden
                className="absolute top-[0.6rem] left-0 size-1 rounded-full bg-[var(--landing-accent)]"
              />
            )}
            {breaking ? (
              <Tag tone="accent" className="mr-2 align-[0.1em]">
                breaking
              </Tag>
            ) : null}
            <RichText text={text} />
            {section.subitems[index]?.length ? (
              <ul className="mt-2 space-y-1.5">
                {section.subitems[index].map((subitem, subindex) => (
                  <li key={subindex} className="relative pl-4 text-pretty">
                    <span
                      aria-hidden
                      className="absolute top-[0.6rem] left-0 size-1 rounded-full bg-[var(--landing-dim)]"
                    />
                    <RichText text={subitem} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </List>
  );
}

function Paragraphs({ paragraphs }: { paragraphs: readonly string[] }) {
  return paragraphs.map((paragraph, index) => (
    <p key={index} className="mt-2 text-sm leading-relaxed text-pretty text-[var(--landing-muted)]">
      <RichText text={paragraph} />
    </p>
  ));
}

/** What a user does after installing: a numbered list in a tinted panel, ahead of the changes. */
function UpgradeSteps({ release, level }: { release: ReleaseNote; level: HeadingLevel }) {
  const upgrade = release.upgrade;
  if (!upgrade) return null;
  const Heading = level;
  return (
    <section
      id={categoryAnchor(release.version, 'upgrade')}
      aria-label={`Upgrade to ${release.version}`}
      className="scroll-mt-24 rounded-xl border border-[color-mix(in_srgb,var(--landing-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--landing-accent)_6%,transparent)] p-4 md:p-5"
    >
      <div className="flex items-center gap-2.5">
        <ListChecks className="size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
        <Heading className="text-sm font-semibold text-[var(--landing-ink)]">Upgrade</Heading>
      </div>
      <Paragraphs paragraphs={upgrade.paragraphs} />
      <Entries section={upgrade} ordered={upgrade.items.length > 1} />
    </section>
  );
}

function CategoryHeading({
  category,
  label,
  count,
  level,
}: {
  category: ChangeCategory;
  label: string;
  count: number;
  level: HeadingLevel;
}) {
  const Heading = level;
  const Icon = CATEGORY_ICONS[category];
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
          category === 'breaking'
            ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
            : 'bg-[color-mix(in_srgb,var(--landing-accent)_11%,transparent)] text-[var(--landing-accent)]'
        }`}
      >
        <Icon className="size-3.5" />
      </span>
      <Heading className="text-sm font-semibold text-[var(--landing-ink)]">
        {label}
        <span className="sr-only">: {plural(count, 'entry', 'entries')}</span>
      </Heading>
      <span aria-hidden className="font-mono text-xs text-[var(--landing-dim)]">
        {count}
      </span>
    </div>
  );
}

/**
 * A release's changes: notes, the upgrade steps, then each category under its heading, in the
 * same order on every project's page. Headings are one level below the version's.
 */
export function ReleaseChanges({ release, level }: { release: ReleaseNote; level: HeadingLevel }) {
  const blocks = categoryBlocks(release);
  const others = otherSections(release);
  return (
    <div className="space-y-7">
      {/* Prose outside every part: a yanked version's warning, or notes written before the standard. */}
      {release.notes.length > 0 ? (
        <div className="space-y-2 rounded-lg bg-[color-mix(in_srgb,var(--landing-accent)_7%,transparent)] px-4 py-3">
          {release.notes.map((note, index) => (
            <p key={index} className="text-sm leading-relaxed text-pretty text-[var(--landing-muted)]">
              <RichText text={note} />
            </p>
          ))}
        </div>
      ) : null}
      <UpgradeSteps release={release} level={level} />
      {blocks.map((block) => (
        <section
          key={block.category}
          id={categoryAnchor(release.version, block.category)}
          className="scroll-mt-24"
        >
          <CategoryHeading category={block.category} label={block.label} count={block.count} level={level} />
          <div className="sm:pl-[2.125rem]">
            {block.groups.map((group, index) => {
              const GroupHeading = BELOW[level];
              return (
                <div key={index} className={group.group ? 'mt-5 first:mt-4' : undefined}>
                  {group.group ? (
                    <GroupHeading className="font-mono text-xs text-[var(--landing-subtle)]">
                      {group.group.toLowerCase()}
                    </GroupHeading>
                  ) : null}
                  <Paragraphs paragraphs={group.paragraphs} />
                  <Entries section={group} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {others.map((section, index) => {
        const Heading = level;
        return (
          <section key={`other-${index}`}>
            <Heading className="text-sm font-semibold text-[var(--landing-ink)]">{section.title}</Heading>
            <Paragraphs paragraphs={section.paragraphs} />
            <Entries section={section} />
          </section>
        );
      })}
    </div>
  );
}
