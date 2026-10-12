import type { ReactNode } from 'react';
import { CHAPTERS, type ChapterId } from '@/components/landing/chapters';

/**
 * The landing's whole vocabulary: a chapter, its heading, a block heading inside it, and a
 * tag. Every section composes these, so spacing and type stay the same from top to bottom.
 */

/** Page container shared by every landing section. */
export const wrap = 'mx-auto w-full max-w-[1400px] px-4 md:px-6';

/** An accent run inside a heading. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-[var(--landing-accent)]">{children}</span>;
}

/**
 * One chapter of the landing, anchored by its id in CHAPTERS. Chapters alternate between the
 * page and a tinted band, so where one ends and the next begins reads at a glance.
 */
export function Chapter({ id, band, children }: { id: ChapterId; band?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`landing-chapter ${band ? 'landing-band' : ''}`}>
      <div className={wrap}>{children}</div>
    </section>
  );
}

/**
 * A chapter's head: its number from CHAPTERS, so the dock and the heading cannot disagree, a
 * lowercase mono label in place of an uppercase eyebrow, the title and one lead.
 */
export function ChapterHead({
  chapter,
  label,
  title,
  lead,
}: {
  chapter: ChapterId;
  label: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  const n = CHAPTERS.find((c) => c.id === chapter)?.n;
  return (
    <header data-reveal className="max-w-3xl">
      <p className="flex items-center gap-3 font-mono text-sm">
        <span className="font-semibold text-[var(--landing-accent)]">{n}</span>
        <span aria-hidden className="h-px w-6 bg-[var(--landing-border)]" />
        <span className="text-[var(--landing-subtle)]">{label}</span>
      </p>
      <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.035em] text-balance">{title}</h2>
      {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">{lead}</p>}
    </header>
  );
}

/** A block inside a chapter: one heading, at most one lead. */
export function BlockHead({
  title,
  lead,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={`max-w-2xl ${className ?? ''}`}>
      <h3 className="text-2xl font-bold leading-tight tracking-[-0.025em] text-balance md:text-[1.75rem]">
        {title}
      </h3>
      {lead && (
        <p className="mt-3 text-base leading-relaxed text-[var(--landing-muted)] text-pretty md:text-lg">{lead}</p>
      )}
    </div>
  );
}

/** Space between the blocks of one chapter. */
export const block = 'mt-20 md:mt-24';

export type TagTone = 'solid' | 'accent' | 'outline' | 'dashed';

const TONE: Record<TagTone, string> = {
  solid: 'bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)]',
  accent: 'bg-[color-mix(in_srgb,var(--landing-accent)_12%,transparent)] text-[var(--landing-accent)]',
  outline: 'border border-[var(--landing-border)] text-[var(--landing-muted)]',
  dashed: 'border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)] text-[var(--landing-subtle)]',
};

/** Status and capability tags. Four tones, used the same way everywhere on the page. */
export function Tag({
  tone = 'outline',
  children,
  className,
}: {
  tone?: TagTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[11px] leading-4 ${TONE[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

/** Small lowercase mono caption above a list or a figure. */
export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-xs text-[var(--landing-subtle)] ${className ?? ''}`}>{children}</p>;
}
