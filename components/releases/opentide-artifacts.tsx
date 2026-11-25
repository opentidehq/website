import { ArrowUpRight, Boxes, ChevronRight } from 'lucide-react';
import { ChangeCounts, ReleaseChanges, type HeadingLevel } from '@/components/releases/release-changes';
import { RichText, focusRing } from '@/components/releases/rich-text';
import { OPENTIDE_CRATES, OPENTIDE_CRATES_NOTES, crateVersionUrl, opentideArtifacts } from '@/lib/release-projects';
import { crateIndex, totalChanges, type ReleaseNote } from '@/lib/releases';

const ENGINE_SCOPE = 'engine';

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-0.5 font-medium text-[var(--landing-accent)] ${focusRing}`}
    >
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
    </a>
  );
}

/**
 * What one opentide version published, artifact by artifact, each linked at that version, and
 * the same version's engine crate and language server notes (`crates/CHANGELOG.md`), folded
 * away. The notes above it are the package's: the CLI, the MCP server and the SDKs. Renders
 * nothing for a version before the lockstep (1.0.0).
 */
export function OpentideArtifacts({ release, level }: { release: ReleaseNote; level: HeadingLevel }) {
  const engine = release.engine;
  if (!engine) return null;
  const Heading = level;
  const version = release.version;
  const perCrate = crateIndex(engine);
  return (
    <section
      aria-labelledby={`${version}-artifacts`}
      className="space-y-5 rounded-xl border border-[var(--landing-border)] p-4 md:p-5"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <Boxes className="size-4 shrink-0 text-[var(--landing-accent)]" aria-hidden />
          <Heading id={`${version}-artifacts`} className="text-sm font-semibold text-[var(--landing-ink)]">
            Published at {version}
          </Heading>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-[var(--landing-muted)]">
          One version and one tag for everything. The notes above are the package’s: the CLI, the MCP server and the
          SDKs. The engine crates and the language server have their own, below.
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {opentideArtifacts(version).map((artifact) => (
          <div key={artifact.name} className="min-w-0">
            <dt className="font-medium text-[var(--landing-ink)]">{artifact.name}</dt>
            <dd className="mt-0.5 text-[var(--landing-muted)]">
              <RichText text={artifact.what} />
              <span className="ml-2 inline-flex gap-3">
                {artifact.links.map((link) => (
                  <External key={link.label} href={link.href}>
                    {link.label}
                  </External>
                ))}
              </span>
            </dd>
          </div>
        ))}
        <div className="min-w-0 sm:col-span-2">
          <dt className="font-medium text-[var(--landing-ink)]">Engine crates</dt>
          <dd className="mt-0.5 text-[var(--landing-muted)]">
            <details className="group">
              <summary
                className={`inline-flex cursor-pointer list-none items-center gap-1 rounded-md [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                <ChevronRight className="size-3.5 motion-safe:transition-transform group-open:rotate-90" aria-hidden />
                {OPENTIDE_CRATES.length} crates on crates.io at {version}
              </summary>
              <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {OPENTIDE_CRATES.map((crate) => (
                  <li key={crate.name} className="min-w-0 truncate">
                    <External href={crateVersionUrl(crate.name, version)}>
                      <span className="font-mono text-xs">{crate.name}</span>
                    </External>{' '}
                    <span className="text-xs">
                      <RichText text={crate.role} />
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </dd>
        </div>
      </dl>

      {totalChanges(engine) > 0 || engine.summary ? (
        <details className="group/engine border-t border-[var(--landing-border-subtle)] pt-4">
          <summary
            className={`flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 rounded-md [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--landing-accent)]">
              <ChevronRight
                className="size-4 motion-safe:transition-transform group-open/engine:rotate-90"
                aria-hidden
              />
              Engine crates and language server changes
            </span>
            <ChangeCounts release={engine} inline scope={ENGINE_SCOPE} />
          </summary>
          <div className="mt-4 space-y-5 [overflow-wrap:anywhere]">
            {engine.summary ? (
              <p className="text-sm leading-relaxed text-pretty text-[var(--landing-muted)]">
                <RichText text={engine.summary} />
              </p>
            ) : null}
            {perCrate.length > 0 ? (
              <ul aria-label="Changes per crate" className="flex flex-wrap gap-2 text-xs">
                {perCrate.map(({ crate, count }) => (
                  <li
                    key={crate}
                    className="rounded-full border border-[var(--landing-border)] px-2.5 py-1 font-mono text-[var(--landing-muted)]"
                  >
                    {crate} <span className="text-[var(--landing-dim)]">{count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ReleaseChanges release={engine} level={level === 'h3' ? 'h4' : 'h5'} scope={ENGINE_SCOPE} />
            <p className="text-sm text-[var(--landing-muted)]">
              <External href={OPENTIDE_CRATES_NOTES.changelogUrl}>crates/CHANGELOG.md</External>
            </p>
          </div>
        </details>
      ) : null}
    </section>
  );
}
