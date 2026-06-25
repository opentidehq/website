import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

export function PipelineFlow({
  steps,
}: {
  steps: { label: string; icon: LucideIcon; desc: string }[];
}) {
  return (
    <ol className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="landing-card group relative list-none"
          style={{ '--i': i } as CSSProperties}
        >
          {i < steps.length - 1 && (
            <span
              className="pointer-events-none absolute -right-3 top-10 hidden h-px w-6 bg-[var(--landing-brand)]/40 lg:block"
              aria-hidden
            />
          )}
          <div className="landing-surface-card h-full p-6 transition hover:border-[var(--landing-brand)] hover:bg-[var(--landing-surface-raised)]">
            <div className="mb-4 inline-flex rounded-lg bg-[var(--landing-brand)]/40 p-2.5 text-[var(--landing-foam)] ring-1 ring-[var(--landing-brand)]/60 transition group-hover:text-[var(--landing-accent)]">
              <step.icon className="size-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold">{step.label}</h3>
            <p className="mt-2 text-sm text-[var(--landing-subtle)]">{step.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
