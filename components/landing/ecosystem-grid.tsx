import { ArrowUpRight } from 'lucide-react';
import { ecosystemLinks } from '@/lib/shared';
import { Tag } from '@/components/landing/ui';

const cell = 'flex h-full flex-col bg-[var(--landing-panel)] p-6';

/**
 * Each repository and its one job, as a directory rather than a wall of icon cards. The last
 * cell is the repository that is not ours: the detection repo opentide runs against.
 */
export function EcosystemGrid() {
  return (
    <ul className="landing-panel m-0 grid list-none grid-cols-1 gap-px overflow-hidden bg-[var(--landing-border)] p-0 sm:grid-cols-2 lg:grid-cols-4">
      {ecosystemLinks.map((item) => {
        const head = (
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--landing-ink)]">
              {item.name}
              {item.href && (
                <ArrowUpRight
                  className="size-4 text-[var(--landing-dim)] transition group-hover:text-[var(--landing-accent)]"
                  aria-hidden
                />
              )}
            </span>
            <Tag tone={item.status === 'live' ? 'accent' : 'dashed'}>
              {item.status === 'live' ? item.tag.toLowerCase() : 'coming soon'}
            </Tag>
          </div>
        );
        const body = <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">{item.description}</p>;

        return (
          <li key={item.name}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${cell} transition-colors hover:bg-[color-mix(in_srgb,var(--landing-ink)_3%,var(--landing-panel))] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--landing-accent)]`}
              >
                {head}
                {body}
              </a>
            ) : (
              <div className={cell}>
                {head}
                {body}
              </div>
            )}
          </li>
        );
      })}
      <li>
        <div className={cell}>
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold text-[var(--landing-ink)]">your detection repo</span>
            <Tag tone="solid">yours</Tag>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
            Your content: private objects, platform configuration and CI. The source of truth, in git.
          </p>
        </div>
      </li>
    </ul>
  );
}
