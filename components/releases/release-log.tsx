import Link from 'next/link';
import { ArrowUpRight, Braces, ChevronRight, Network, Waves, type LucideIcon } from 'lucide-react';
import { Tag } from '@/components/landing/ui';
import { InstallCommand } from '@/components/releases/install-command';
import { RichText, focusRing } from '@/components/releases/rich-text';
import type { ProjectId, ReleaseProject } from '@/lib/release-projects';
import { safeHref } from '@/lib/safe-href';
import {
  groupBySeries,
  kindLabel,
  publicLinks,
  releaseAnchor,
  type ReleaseNote,
  type ReleaseSection,
} from '@/lib/releases';

const ICONS: Record<ProjectId, LucideIcon> = {
  opentide: Waves,
  'language-server': Braces,
  explorer: Network,
};

export type ProjectSummary = {
  project: ReleaseProject;
  latest: ReleaseNote;
};

/**
 * Series worth showing: grouped by minor version where some minor has several releases,
 * otherwise one unlabelled group, since a heading per release only repeats the version.
 */
function seriesOf(releases: ReleaseNote[]) {
  const groups = groupBySeries(releases);
  return groups.some((group) => group.releases.length > 1) ? groups : [{ series: null, releases }];
}

/** `22 Oct` from an ISO date, for the version index. */
function shortDate(release: ReleaseNote): string {
  const [day, month] = release.dateLabel.split(' ');
  return day && month ? `${day} ${month.slice(0, 3)}` : release.dateLabel;
}

function ProjectSwitcher({ projects, current }: { projects: ProjectSummary[]; current: ProjectId }) {
  return (
    <nav aria-label="Projects" className="mt-10">
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {projects.map(({ project, latest }) => {
          const active = project.id === current;
          const Icon = ICONS[project.id];
          return (
            <li key={project.id} className="min-w-0">
              <Link
                href={project.href}
                aria-current={active ? 'page' : undefined}
                className={`group flex h-full min-w-0 flex-col gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-5 ${focusRing} ${
                  active
                    ? 'border-[var(--landing-accent)] bg-[var(--landing-panel)] shadow-[0_0_0_1px_var(--landing-accent)]'
                    : 'border-[var(--landing-border)] hover:border-[color-mix(in_srgb,var(--landing-accent)_45%,transparent)] hover:bg-[var(--landing-hover)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl ${
                      active
                        ? 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]'
                        : 'bg-[color-mix(in_srgb,var(--landing-accent)_10%,transparent)] text-[var(--landing-accent)]'
                    }`}
                  >
                    <Icon className="size-4 sm:size-5" aria-hidden />
                  </span>
                  {active ? (
                    <span className="hidden font-mono text-[11px] text-[var(--landing-accent)] sm:inline">
                      viewing
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--landing-ink)] sm:text-base">
                    <span className="sm:hidden">{project.shortName}</span>
                    <span className="hidden sm:inline">{project.name}</span>
                  </p>
                  <p className="mt-0.5 hidden truncate font-mono text-xs text-[var(--landing-subtle)] sm:block">
                    {project.tagline}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-[var(--landing-border-subtle)] pt-2.5 sm:pt-3">
                  <span className="font-mono text-xs font-semibold text-[var(--landing-ink)] sm:text-sm">
                    {latest.version}
                  </span>
                  <time
                    dateTime={latest.dateIso ?? undefined}
                    className="hidden text-xs text-[var(--landing-dim)] sm:inline"
                  >
                    {latest.dateLabel}
                  </time>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function VersionList({ releases }: { releases: ReleaseNote[] }) {
  const latest = releases[0];
  return (
    <ol className="space-y-4">
      {seriesOf(releases).map((group) => (
        <li key={group.series ?? 'all'}>
          {group.series ? (
            <p className="px-2 font-mono text-[11px] text-[var(--landing-dim)]">{group.series}</p>
          ) : null}
          <ol className="mt-1">
            {group.releases.map((release) => (
              <li key={release.version}>
                <a
                  href={`#${releaseAnchor(release.version)}`}
                  className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm transition hover:bg-[var(--landing-hover)] ${focusRing}`}
                >
                  <span className="flex items-center gap-2 font-mono text-[var(--landing-ink)]">
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full ${
                        release === latest || release.kind !== 'patch'
                          ? 'bg-[var(--landing-accent)]'
                          : 'bg-[var(--landing-dim)]'
                      }`}
                    />
                    {release.version}
                  </span>
                  <span className="text-xs text-[var(--landing-dim)]">{shortDate(release)}</span>
                </a>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function VersionIndex({ releases }: { releases: ReleaseNote[] }) {
  return (
    <aside aria-label="Versions" className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-6">
        <p className="px-2 font-mono text-xs text-[var(--landing-subtle)]">versions</p>
        <div className="mt-3">
          <VersionList releases={releases} />
        </div>
      </div>
    </aside>
  );
}

function ReleaseTags({ release, latest }: { release: ReleaseNote; latest?: boolean }) {
  return (
    <>
      {latest ? <Tag tone="solid">latest</Tag> : null}
      <Tag tone="outline">{kindLabel(release.kind).toLowerCase()}</Tag>
      {release.breaking ? <Tag tone="accent">breaking</Tag> : null}
      {release.installCommand === null ? <Tag tone="dashed">tagged after release</Tag> : null}
    </>
  );
}

function SectionBlock({ section }: { section: ReleaseSection }) {
  return (
    <section className="mt-6 first:mt-0">
      <h4 className="font-mono text-xs text-[var(--landing-subtle)]">
        {section.title.toLowerCase()}
        {section.items.length > 0 ? (
          <span className="text-[var(--landing-dim)]"> · {section.items.length}</span>
        ) : null}
      </h4>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-sm leading-relaxed text-pretty text-[var(--landing-muted)]">
          <RichText text={paragraph} />
        </p>
      ))}
      {section.items.length > 0 ? (
        <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-[var(--landing-muted)]">
          {section.items.map((item) => (
            <li key={item} className="relative pl-4 text-pretty">
              <span
                aria-hidden
                className="absolute top-[0.6rem] left-0 size-1 rounded-full bg-[var(--landing-accent)]"
              />
              <RichText text={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReleaseChanges({ release }: { release: ReleaseNote }) {
  return (
    <>
      {release.notes.map((note) => (
        <p
          key={note}
          className="mb-6 rounded-lg bg-[color-mix(in_srgb,var(--landing-accent)_7%,transparent)] px-4 py-3 text-sm leading-relaxed text-pretty text-[var(--landing-muted)]"
        >
          <RichText text={note} />
        </p>
      ))}
      {release.sections.map((section) => (
        <SectionBlock key={section.title} section={section} />
      ))}
    </>
  );
}

function ReleaseLinks({ release }: { release: ReleaseNote }) {
  const links = publicLinks(release.links).flatMap((link) => {
    const href = safeHref(link.href);
    return href ? [{ ...link, href }] : [];
  });
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-medium text-[var(--landing-accent)] ${focusRing}`}
          >
            {link.label}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

function LatestRelease({
  release,
  project,
  pypiVersion,
}: {
  release: ReleaseNote;
  project: ReleaseProject;
  pypiVersion: string | null;
}) {
  const registryAhead = project.id === 'opentide' && pypiVersion !== null && pypiVersion !== release.version;
  return (
    <article
      id={releaseAnchor(release.version)}
      aria-labelledby="latest-version"
      className="landing-panel scroll-mt-24 overflow-hidden"
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <ReleaseTags release={release} latest />
          <time
            dateTime={release.dateIso ?? undefined}
            className="ml-auto text-sm text-[var(--landing-dim)]"
          >
            {release.dateLabel}
          </time>
        </div>
        <h3
          id="latest-version"
          className="mt-5 font-mono text-[clamp(2.5rem,7vw,3.75rem)] leading-none font-semibold tracking-[-0.04em] text-[var(--landing-ink)]"
        >
          {release.version}
        </h3>
        <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-pretty text-[var(--landing-muted)]">
          <RichText text={release.summary} />
        </p>
      </div>
      <div className="grid border-t border-[var(--landing-border)] md:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Below md the install panel comes first, ahead of a long change list. */}
        <div className="min-w-0 p-6 md:p-8">
          <ReleaseChanges release={release} />
        </div>
        <div className="order-first min-w-0 space-y-5 border-b border-[var(--landing-border)] bg-[var(--landing-band)] p-6 md:order-none md:border-b-0 md:border-l md:p-8">
          {release.installCommand ? (
            <InstallCommand command={release.installCommand} caption={`install ${release.version}`} />
          ) : null}
          {registryAhead ? (
            <p className="text-sm text-[var(--landing-muted)]">
              PyPI is on {pypiVersion}. These notes go through {release.version}.
            </p>
          ) : null}
          <ReleaseLinks release={release} />
        </div>
      </div>
    </article>
  );
}

function EarlierRelease({ release }: { release: ReleaseNote }) {
  const changes = release.sections.reduce((n, section) => n + Math.max(section.items.length, 1), 0);
  return (
    <li
      id={releaseAnchor(release.version)}
      className="relative scroll-mt-24 border-l border-[var(--landing-border)] py-6 pl-6 md:pl-8"
    >
      <span
        aria-hidden
        className={`absolute top-[2.1rem] -left-[4.5px] size-2 rounded-full ring-4 ring-[var(--landing-bg)] ${
          release.kind === 'patch' ? 'bg-[var(--landing-dim)]' : 'bg-[var(--landing-accent)]'
        }`}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h4 className="font-mono text-xl font-semibold tracking-tight text-[var(--landing-ink)]">
          <a href={`#${releaseAnchor(release.version)}`} className={`hover:text-[var(--landing-accent)] ${focusRing}`}>
            {release.version}
          </a>
        </h4>
        <time dateTime={release.dateIso ?? undefined} className="text-sm text-[var(--landing-dim)]">
          {release.dateLabel}
        </time>
        <span className="flex flex-wrap gap-1.5">
          <ReleaseTags release={release} />
        </span>
      </div>
      <p className="mt-3 max-w-[65ch] leading-relaxed text-pretty text-[var(--landing-muted)]">
        <RichText text={release.summary} />
      </p>
      {changes > 0 || release.notes.length > 0 ? (
        <details className="group mt-4">
          <summary
            className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-[var(--landing-accent)] [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <ChevronRight className="size-4 motion-safe:transition-transform group-open:rotate-90" aria-hidden />
            <span className="group-open:hidden">Show {changes} {changes === 1 ? 'change' : 'changes'}</span>
            <span className="hidden group-open:inline">Hide changes</span>
          </summary>
          <div className="mt-4 rounded-xl border border-[var(--landing-border)] p-5 md:p-6">
            <ReleaseChanges release={release} />
            <div className="mt-6 space-y-4 border-t border-[var(--landing-border-subtle)] pt-5">
              {release.installCommand ? (
                <InstallCommand command={release.installCommand} caption={`pin ${release.version}`} />
              ) : null}
              <ReleaseLinks release={release} />
            </div>
          </div>
        </details>
      ) : null}
    </li>
  );
}

function EarlierReleases({ releases }: { releases: ReleaseNote[] }) {
  if (releases.length === 0) return null;
  return (
    <section aria-labelledby="earlier-releases" className="mt-16">
      <h2 id="earlier-releases" className="text-2xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)]">
        Earlier versions
      </h2>
      {seriesOf(releases).map((group) => (
        <div key={group.series ?? 'all'} className="mt-8">
          {group.series ? (
            <div className="flex items-center gap-3">
              <h3 className="font-mono text-sm font-semibold text-[var(--landing-ink)]">{group.series}</h3>
              <span className="font-mono text-xs text-[var(--landing-dim)]">
                {group.releases.length} {group.releases.length === 1 ? 'release' : 'releases'}
              </span>
              <span aria-hidden className="h-px flex-1 bg-[var(--landing-border)]" />
            </div>
          ) : null}
          <ol className="mt-1 ml-1">
            {group.releases.map((release) => (
              <EarlierRelease key={release.version} release={release} />
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

export function ReleaseLog({
  project,
  releases,
  projects,
  pypiVersion,
}: {
  project: ReleaseProject;
  releases: ReleaseNote[];
  projects: ProjectSummary[];
  pypiVersion: string | null;
}) {
  const latest = releases[0];
  if (!latest) return null;
  const earliest = releases.at(-1) ?? latest;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-14 pb-24 md:px-6 md:pt-20">
      <header className="max-w-3xl">
        <p className="font-mono text-xs text-[var(--landing-subtle)]">releases</p>
        <h1 className="mt-3 text-[clamp(2.25rem,5vw,3.5rem)] font-bold tracking-[-0.035em] text-balance">
          What shipped, and when
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-[var(--landing-muted)]">
          Every opentide project is versioned, tagged, and published. Pick one to read its releases, install the
          latest, or pin the version your pipeline should keep.
        </p>
      </header>

      <ProjectSwitcher projects={projects} current={project.id} />

      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-14">
        <VersionIndex releases={releases} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--landing-ink)]">{project.name}</h2>
              <p className="mt-2 leading-relaxed text-pretty text-[var(--landing-muted)]">{project.description}</p>
            </div>
            <dl className="flex gap-6 font-mono text-xs">
              <div>
                <dt className="text-[var(--landing-dim)]">versions</dt>
                <dd className="mt-1 text-sm text-[var(--landing-ink)]">{releases.length}</dd>
              </div>
              <div>
                <dt className="text-[var(--landing-dim)]">since</dt>
                <dd className="mt-1 text-sm text-[var(--landing-ink)]">{earliest.dateLabel}</dd>
              </div>
            </dl>
          </div>

          <details className="group mt-6 rounded-xl border border-[var(--landing-border)] lg:hidden">
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-[var(--landing-ink)] [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              Jump to a version
              <ChevronRight className="size-4 motion-safe:transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <div className="max-h-80 overflow-y-auto border-t border-[var(--landing-border)] p-2">
              <VersionList releases={releases} />
            </div>
          </details>

          <div className="mt-8">
            <LatestRelease release={latest} project={project} pypiVersion={pypiVersion} />
          </div>

          <EarlierReleases releases={releases.slice(1)} />

          <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--landing-border)] pt-6 text-sm text-[var(--landing-muted)]">
            <p>
              Engineering notes live in the{' '}
              <a
                href={project.changelogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium text-[var(--landing-accent)] ${focusRing}`}
              >
                repository changelog
              </a>
              . New to opentide? Start with{' '}
              <Link href="/docs/usage/installation/" className={`font-medium text-[var(--landing-accent)] ${focusRing}`}>
                installation
              </Link>
              .
            </p>
            <a
              href={project.registry.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-mono text-xs text-[var(--landing-muted)] hover:text-[var(--landing-accent)] ${focusRing}`}
            >
              {project.name} on {project.registry.label}
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
