import { AGENT_NEEDS } from '@/lib/landing/agent-needs';

/** What an agent needs from detection tooling, and what opentide gives it, as one strip. */
export function AgentNeedsStrip() {
  return (
    // Revealed as one panel: the cells cover a border-coloured fill, so fading them one by one
    // would flash the fill.
    <ol
      data-reveal
      className="landing-panel m-0 grid list-none grid-cols-1 gap-px overflow-hidden bg-[var(--landing-border)] p-0 sm:grid-cols-2 lg:grid-cols-5"
    >
      {AGENT_NEEDS.map((row, i) => (
        <li key={row.need} className="flex flex-col bg-[var(--landing-panel)] p-6 sm:last:col-span-2 lg:last:col-span-1">
          <span className="font-mono text-xs text-[var(--landing-accent)]">{String(i + 1).padStart(2, '0')}</span>
          <p className="mt-3 font-semibold leading-snug text-[var(--landing-ink)]">{row.need}</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--landing-muted)]">{row.now}</p>
          <code className="mt-5 self-start rounded-md bg-[color-mix(in_srgb,var(--landing-ink)_5%,transparent)] px-2 py-1 font-mono text-xs text-[var(--landing-ink)]">
            {row.artefact}
          </code>
        </li>
      ))}
    </ol>
  );
}
