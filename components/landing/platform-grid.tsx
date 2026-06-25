import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** Simplified brand marks — monochrome, normalized to landing palette */
function PlatformIcon({ id }: { id: string }) {
  const className = 'size-7 text-[var(--landing-muted)] transition group-hover:text-[var(--landing-ink)]';
  switch (id) {
    case 'sentinel':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7.5 3.75v7.5L12 19.8l-7.5-3.75v-7.5L12 4.2z" />
          <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z" opacity="0.7" />
        </svg>
      );
    case 'defender':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M12 2l8 3v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V5l8-3zm0 2.2L6 6.3v4.7c0 4.1 2.7 7.65 6 8.8 3.3-1.15 6-4.7 6-8.8V6.3l-6-2.1z" />
        </svg>
      );
    case 'splunk':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M23.348 11.911l-2.241-1.091v-.65L24 11.621v.593l-2.893 1.438v-.636zm-5.397 1.841h-.961v-5.31h.961v3.116h.102l1.28-1.481.723.31-1.23 1.316 1.453 1.809-.888.311-1.44-1.996zm-2.577-.002v-2.068a2.685 2.685 0 0 0-.026-.42.791.791 0 0 0-.09-.26c-.113-.202-.308-.304-.59-.304a.888.888 0 0 0-.484.145 1.01 1.01 0 0 0-.35.39 1.158 1.158 0 0 0-.13.55v2.567h-.96zm-3.834 0h-.96v-5.31h.96v5.31zm-2.577 0H6.4v-5.31h.96v3.116h.102l1.28-1.481.723.31-1.23 1.316 1.453 1.809-.888.311-1.44-1.996zm-5.397 0H.5v-.65l2.893-1.438v.636L.5 12.214v-.593l2.241-1.091v.65z" />
        </svg>
      );
    case 'sentinelone':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'carbonblack':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'crowdstrike':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M12 3c-2 3-6 4-6 8 0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-4-5-6-8zm0 14c-2.2 0-4-1.8-4-4 0-2.5 2-3.5 4-5.5 2 2 4 3 4 5.5 0 2.2-1.8 4-4 4z" />
        </svg>
      );
    case 'harfanglab':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
          <path d="M4 18l4-10h2l4 10h-2l-.8-2.2H6.8L6 18H4zm3.2-4.2h3.6L10 10.8 7.2 13.8zM14 8h6v2h-2v8h-2v-8h-2V8z" />
        </svg>
      );
    default:
      return null;
  }
}

const platforms = [
  { id: 'sentinel', name: 'Microsoft Sentinel', tag: 'deploy + validate' },
  { id: 'defender', name: 'Defender for Endpoint', tag: 'deploy + validate' },
  { id: 'splunk', name: 'Splunk ES', tag: 'deploy' },
  { id: 'sentinelone', name: 'SentinelOne', tag: 'deploy' },
  { id: 'carbonblack', name: 'Carbon Black', tag: 'deploy' },
  { id: 'crowdstrike', name: 'CrowdStrike', tag: 'deploy' },
  { id: 'harfanglab', name: 'HarfangLab', tag: 'deploy' },
];

export function PlatformGrid() {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {platforms.map((p) => (
          <li key={p.id}>
            <div className="group landing-surface-card flex h-full flex-col items-center gap-3 p-5 text-center transition hover:border-[var(--eu-yellow)]/25 hover:bg-[var(--landing-surface-raised)]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--landing-bg)] ring-1 ring-white/[0.06] transition group-hover:ring-[var(--eu-yellow)]/20">
                <PlatformIcon id={p.id} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--landing-ink)]">{p.name}</p>
                <p className="mt-0.5 font-mono text-[9px] text-[var(--landing-subtle)]">{p.tag}</p>
              </div>
            </div>
          </li>
        ))}
        <li className="sm:col-span-1 lg:col-span-1">
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--eu-yellow)]">extensible</p>
            <p className="mt-2 text-sm text-[var(--landing-subtle)]">Platform adapters follow the same normative contract</p>
          </div>
        </li>
      </ul>
      <Link
        href="/docs/usage/concepts/platforms/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-muted)] transition hover:text-[var(--landing-accent)]"
      >
        Full capability matrix <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
