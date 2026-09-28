import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { CopyCommand } from '@/components/releases/copy-command';
import { PypiReleaseLink } from '@/components/landing/pypi-release-link';
import { INSTALL_CMD } from '@/lib/pypi';
import {
  CHANGELOG_URL,
  kindLabel,
  publicLinks,
  type ReleaseNote,
  type ReleaseSection,
} from '@/lib/releases';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="rounded bg-[var(--landing-hover)] px-1 py-px font-mono text-[0.85em] text-[var(--landing-ink)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={key} className="font-semibold text-[var(--landing-ink)]">
          {renderInline(part.slice(2, -2), key)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link?.[1] && link[2]) {
      const external = /^https?:/i.test(link[2]);
      if (external) {
        return (
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[var(--landing-accent)] underline decoration-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] underline-offset-2 ${focusRing}`}
          >
            {link[1]}
          </a>
        );
      }
      return (
        <Link
          key={key}
          href={link[2]}
          className={`text-[var(--landing-accent)] underline decoration-[color-mix(in_srgb,var(--landing-accent)_40%,transparent)] underline-offset-2 ${focusRing}`}
        >
          {link[1]}
        </Link>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function RichText({ text }: { text: string }) {
  return <>{renderInline(text, 't')}</>;
}

function LinkRow({ release }: { release: ReleaseNote }) {
  const links = publicLinks(release.links);
  if (links.length === 0) return null;

  return (
    <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
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

function SectionBlock({ section }: { section: ReleaseSection }) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-[var(--landing-ink)]">{section.title}</h3>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">
          <RichText text={paragraph} />
        </p>
      ))}
      {section.items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--landing-muted)]">
          {section.items.map((item) => (
            <li key={item} className="relative pl-4 text-pretty">
              <span
                aria-hidden
                className="absolute top-[0.55rem] left-0 size-1.5 rounded-full bg-[var(--landing-dim)]"
              />
              <RichText text={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReleaseBody({ release, showInstall }: { release: ReleaseNote; showInstall: boolean }) {
  return (
    <>
      {release.notes.map((note) => (
        <p
          key={note}
          className="mt-4 border-l-2 border-[var(--landing-accent)] pl-3 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty"
        >
          <RichText text={note} />
        </p>
      ))}
      {release.sections.map((section) => (
        <SectionBlock key={section.title} section={section} />
      ))}
      {showInstall ? (
        <p className="mt-5 font-mono text-xs text-[var(--landing-dim)]">{release.installCommand}</p>
      ) : null}
      <LinkRow release={release} />
    </>
  );
}

function KindBadge({ kind }: { kind: ReleaseNote['kind'] }) {
  return (
    <span className="rounded-full border border-[var(--landing-border)] px-2.5 py-0.5 text-xs text-[var(--landing-muted)]">
      {kindLabel(kind)}
    </span>
  );
}

function ReleaseDate({ release }: { release: ReleaseNote }) {
  return (
    <time dateTime={release.dateIso ?? undefined} className="text-sm text-[var(--landing-dim)]">
      {release.dateLabel}
    </time>
  );
}

export function ReleaseLog({
  releases,
  pypiVersion,
}: {
  releases: ReleaseNote[];
  pypiVersion: string | null;
}) {
  const latest = releases[0];
  if (!latest) return null;
  const earliest = releases.at(-1) ?? latest;
  const pypiIsAhead = pypiVersion !== null && pypiVersion !== latest.version;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24 md:px-6 md:pt-20">
      <header>
        <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold tracking-[-0.03em] text-balance">
          Releases
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
          What shipped in the opentide engine. Install the latest, or pin the version your
          pipeline should keep.
        </p>
        <p className="mt-3 font-mono text-xs text-[var(--landing-dim)]">
          {releases.length} public versions · {earliest.dateLabel} – {latest.dateLabel}
        </p>
        <div className="mt-8">
          <CopyCommand command={INSTALL_CMD} />
          <PypiReleaseLink initialVersion={pypiVersion} />
          {pypiIsAhead ? (
            <p className="mt-2 text-sm text-[var(--landing-muted)]">
              PyPI is on {pypiVersion}. These notes go through {latest.version}.
            </p>
          ) : null}
        </div>
      </header>

      <article className="mt-12 rounded-2xl border border-[var(--landing-border)] p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="font-mono text-xs font-medium text-[var(--landing-accent)]">Latest</p>
          <h2 className="font-mono text-3xl font-semibold tracking-tight">{latest.version}</h2>
          <ReleaseDate release={latest} />
          <KindBadge kind={latest.kind} />
        </div>
        <p className="mt-4 text-base leading-relaxed text-[var(--landing-muted)] text-pretty">
          <RichText text={latest.summary} />
        </p>
        <div className="mt-6">
          <CopyCommand command={latest.installCommand} />
        </div>
        <ReleaseBody release={latest} showInstall={false} />
      </article>

      <section className="mt-14" aria-labelledby="earlier-releases">
        <h2 id="earlier-releases" className="text-xl font-semibold tracking-[-0.02em]">
          Earlier versions
        </h2>
        <ol className="mt-2">
          {releases.slice(1).map((release) => (
            <li key={release.version} className="relative border-l border-[var(--landing-border)] py-6 pl-6">
              <span
                aria-hidden
                className="absolute top-8 -left-[5px] size-2 rounded-full bg-[var(--landing-dim)]"
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="font-mono text-xl font-semibold">{release.version}</h3>
                <ReleaseDate release={release} />
                <KindBadge kind={release.kind} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)] text-pretty">
                <RichText text={release.summary} />
              </p>
              <details className="group mt-3">
                <summary
                  className={`flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-[var(--landing-accent)] [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  <ChevronRight
                    className="size-4 motion-safe:transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                  Read the changes
                </summary>
                <div className="pt-1">
                  <ReleaseBody release={release} showInstall />
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-12 border-t border-[var(--landing-border)] pt-6 text-sm text-[var(--landing-muted)]">
        <p>
          Engineering notes live in the{' '}
          <a
            href={CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium text-[var(--landing-accent)] ${focusRing}`}
          >
            repository changelog
          </a>
          . New to the engine? Start with{' '}
          <Link href="/docs/usage/installation/" className={`font-medium text-[var(--landing-accent)] ${focusRing}`}>
            installation
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
