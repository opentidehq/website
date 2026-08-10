'use client';

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileDown,
  Lock,
  RotateCw,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { AdvisoryBlock, AdvisoryPage } from '@/lib/landing/demo-registry';
import { TIMING } from '@/lib/landing/studio-timing';

const LINK = 'text-sky-700 underline decoration-dotted underline-offset-2 dark:text-sky-300';

/** The publisher's own blue, kept off the OpenTide accent so the page reads as someone else's. */
const SITE_BLUE = '#004494';

/** `[[text]]` renders as a page link, `` `text` `` as inline code. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\[\[(.+?)\]\]|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) != null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] != null) {
      parts.push(
        <span key={match.index} className={LINK}>
          {match[1]}
        </span>,
      );
    } else {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-[color-mix(in_srgb,var(--landing-ink)_8%,transparent)] px-1 py-px font-mono text-[10px]"
        >
          {match[2]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}

function Block({ block, marked }: { block: AdvisoryBlock; marked: boolean }) {
  // Heading levels start at h5: the simulated page nests under the landing section's own h2.
  if (block.kind === 'h3') {
    return (
      <h5 className="pt-1 text-[11.5px] font-semibold text-[var(--landing-ink)]">{block.text}</h5>
    );
  }

  if (block.kind === 'note') {
    return (
      <p className="rounded-md border border-[var(--landing-border-subtle)] bg-[var(--landing-surface-deep)] px-2.5 py-2 text-[10.5px] italic leading-relaxed text-[var(--landing-subtle)]">
        <Inline text={block.text} />
      </p>
    );
  }

  if (block.kind === 'list') {
    return (
      <ul className="list-disc space-y-1.5 pl-4 marker:text-[var(--landing-dim)]">
        {block.items.map((item) => (
          <li key={item} className="text-pretty text-[11px] leading-[1.75] text-[var(--landing-muted)]">
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === 'files') {
    return (
      <ul className="space-y-1.5">
        {block.items.map((item) => (
          <li key={item} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed">
            <FileDown className="mt-[2px] size-3 shrink-0 text-[var(--landing-dim)]" aria-hidden />
            <span className={LINK}>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === 'table') {
    return (
      <figure>
        <figcaption className="mb-1.5 text-[10px] font-medium text-[var(--landing-subtle)]">
          {block.caption}
        </figcaption>
        <div className="overflow-hidden rounded-md border border-[var(--landing-border-subtle)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--landing-surface)]">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    className="px-2 py-1.5 font-mono text-[9px] font-medium tracking-wide text-[var(--landing-subtle)]"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-[var(--landing-border-subtle)]">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-2 py-1.5 align-top text-[10px] leading-snug ${
                        i === 1
                          ? 'whitespace-nowrap font-mono text-sky-700 dark:text-sky-300'
                          : 'text-[var(--landing-muted)]'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    );
  }

  return (
    <p className="text-pretty text-[11px] leading-[1.75] text-[var(--landing-muted)]">
      {block.mark ? (
        <span
          className={
            marked
              ? 'bg-[color-mix(in_srgb,var(--landing-accent)_24%,transparent)] text-[var(--landing-ink)] transition-colors duration-500'
              : 'transition-colors duration-500'
          }
        >
          <Inline text={block.text} />
        </span>
      ) : (
        <Inline text={block.text} />
      )}
    </p>
  );
}

/**
 * Advisory opened in a browser tab next to the repo — the source the agent reads
 * before any object exists. `read` scrolls the page from the step timeline so the
 * scroll position always trails the trace, and `marked` selects the passages the
 * agent quotes back.
 */
export function StudioBrowserTab({
  page,
  read = 0,
  marked = false,
  instant = false,
}: {
  page: AdvisoryPage;
  /** How far through the page the agent has read, 0–1. */
  read?: number;
  /** Select the passages the agent extracted. */
  marked?: boolean;
  /** Skip the load beat and the reading scroll. */
  instant?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(false);
  const loaded = instant || painted;

  useEffect(() => {
    if (instant) return;
    const id = window.setTimeout(() => setPainted(true), TIMING.pageLoad);
    return () => window.clearTimeout(id);
  }, [instant]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loaded) return;
    if (instant) {
      el.scrollTop = 0;
      return;
    }
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    el.scrollTop = max * Math.min(1, Math.max(0, read));
  }, [read, instant, loaded]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--landing-bg)]">
      <div
        className="relative shrink-0 border-b border-[var(--landing-border-subtle)] bg-[var(--landing-surface)]"
        aria-hidden
      >
        <div className="flex h-9 items-center gap-1.5 px-2">
          <ArrowLeft className="size-3.5 shrink-0 text-[var(--landing-subtle)]" />
          <ArrowRight className="size-3.5 shrink-0 text-[var(--landing-dim)]" />
          <RotateCw className="size-3 shrink-0 text-[var(--landing-subtle)]" />
          <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[var(--landing-bg)] px-2.5 py-1">
            <Lock className="size-2.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span className="truncate font-mono text-[10px] text-[var(--landing-dim)]">
              <span className="text-[var(--landing-ink)]">{page.host}</span>
              {page.path}
            </span>
            <Search className="ml-auto size-2.5 shrink-0 text-[var(--landing-dim)]" />
          </span>
          <Star className="size-3 shrink-0 text-[var(--landing-dim)]" />
        </div>
        <span
          className="absolute inset-x-0 bottom-0 block h-[2px] bg-[var(--landing-accent)] ease-out"
          style={{
            width: loaded ? '100%' : '16%',
            opacity: loaded ? 0 : 1,
            transitionProperty: 'width, opacity',
            transitionDuration: `${TIMING.pageLoad}ms`,
          }}
        />
      </div>

      <div
        ref={scrollRef}
        className="landing-code-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {loaded ? (
          <div className={instant ? undefined : 'landing-fade-slide'}>
            <div
              className="flex items-center gap-1.5 bg-[var(--landing-surface-deep)] px-4 py-1.5 text-[9px] text-[var(--landing-subtle)]"
              aria-hidden
            >
              <span className="inline-flex items-center gap-1 rounded-sm bg-[color-mix(in_srgb,var(--landing-ink)_10%,transparent)] px-1.5 py-0.5 font-mono text-[8.5px] font-semibold text-[var(--landing-ink)]">
                <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                {page.banner.text}
              </span>
              <span className="truncate">{page.banner.hint}</span>
            </div>

            <div className="border-b border-[var(--landing-border-subtle)]">
              <div className="mx-auto flex max-w-[40rem] items-center gap-2 px-4 pt-3">
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: SITE_BLUE }}
                >
                  <ShieldCheck className="size-3.5" aria-hidden />
                </span>
                <span className="text-[13px] font-bold tracking-tight text-[var(--landing-ink)]">
                  {page.site}
                </span>
                <span className="truncate text-[9.5px] text-[var(--landing-subtle)]">
                  {page.siteTagline}
                </span>
              </div>
              <nav className="mx-auto flex max-w-[40rem] gap-3 overflow-hidden px-4 py-2" aria-hidden>
                {page.nav.map((item) => (
                  <span key={item} className="shrink-0 text-[9.5px] text-[var(--landing-subtle)]">
                    {item}
                  </span>
                ))}
              </nav>
            </div>

            <article className="mx-auto max-w-[40rem] px-4 pb-7 pt-3">
              <nav
                className="flex items-center gap-1 text-[9.5px] text-[var(--landing-subtle)]"
                aria-hidden
              >
                {page.breadcrumb.map((crumb, i) => (
                  <span key={crumb} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-2.5" />}
                    <span className={i === page.breadcrumb.length - 1 ? '' : LINK}>{crumb}</span>
                  </span>
                ))}
              </nav>

              <p
                className="mt-2.5 text-[10px] font-semibold text-[var(--site-blue)] dark:text-sky-300"
                style={{ '--site-blue': SITE_BLUE } as CSSProperties}
              >
                {page.label}
              </p>
              <h3 className="mt-1 text-balance text-[17px] font-bold leading-tight tracking-tight text-[var(--landing-ink)]">
                {page.title}
              </h3>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[var(--landing-border-subtle)] py-2.5 sm:grid-cols-3">
                {page.meta.map((entry) => (
                  <div key={entry.label}>
                    <dt className="font-mono text-[9px] tracking-wide text-[var(--landing-dim)]">
                      {entry.label}
                    </dt>
                    <dd className="mt-0.5 text-[10.5px] text-[var(--landing-ink)]">{entry.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-2 text-[10px] leading-relaxed text-[var(--landing-subtle)]">
                <span className="text-[var(--landing-dim)]">Topics: </span>
                {page.topics}
              </p>

              <div className="mt-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] p-3">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-subtle)]">
                  {page.glance.heading}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {page.glance.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[10.5px] leading-relaxed text-[var(--landing-muted)]"
                    >
                      <span
                        className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {page.sections.map((section) => (
                <section key={section.heading} className="mt-5">
                  <h4 className="border-b border-[var(--landing-border-subtle)] pb-1.5 text-[13px] font-semibold tracking-tight text-[var(--landing-ink)]">
                    {section.heading}
                  </h4>
                  <div className="mt-2.5 space-y-2.5">
                    {section.blocks.map((block, i) => (
                      <Block key={i} block={block} marked={marked} />
                    ))}
                  </div>
                </section>
              ))}

              <footer className="mt-6 border-t border-[var(--landing-border-subtle)] pt-3">
                <p className="font-mono text-[9px] tracking-wide text-[var(--landing-subtle)]">Tags</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {page.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--landing-surface)] px-2 py-0.5 text-[9.5px] text-[var(--landing-subtle)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[9.5px] leading-relaxed text-[var(--landing-subtle)]">
                  {page.legal}
                </p>
              </footer>
            </article>
          </div>
        ) : (
          <p className="p-4 font-mono text-[10px] text-[var(--landing-dim)]">
            Loading {page.host}…
          </p>
        )}
      </div>
    </div>
  );
}
