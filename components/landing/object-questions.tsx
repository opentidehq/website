import { ArrowLeft, ArrowRight } from 'lucide-react';

const OBJECTS = [
  {
    kind: 'tvm · threat',
    schema: 'threat::1.0',
    name: 'Threat',
    question: 'What do we defend against?',
    fields: 'severity · impact · leverage · viability · terrain · surface · mitre_attack · actors · chaining',
  },
  {
    kind: 'dom · objective',
    schema: 'objective::1.0',
    name: 'Objective',
    question: 'What are we trying to detect?',
    fields: 'priority · type · composition · threats[ ] · signals[ ]: methodology, entities, data',
  },
  {
    kind: 'mdr · rule',
    schema: 'rule::1.1',
    name: 'Rule',
    question: 'How do we detect it, on which platform?',
    fields: 'status · severity · techniques · detection_model · configurations.{sentinel, splunk, …}',
  },
] as const;

/** The ontology in three columns: each object answers one question, and links run back by UUID. */
export function ObjectQuestions() {
  return (
    <div className="mt-12">
      <ol className="grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3 md:gap-6">
        {OBJECTS.map((o) => (
          <li key={o.name} className="border-t-2 border-[var(--landing-accent)] pt-5">
            <div className="flex items-center justify-between gap-3 font-mono text-xs">
              <span className="text-[var(--landing-subtle)]">{o.kind}</span>
              <span className="rounded-md bg-[color-mix(in_srgb,var(--landing-accent)_10%,transparent)] px-2 py-0.5 text-[var(--landing-accent)]">
                {o.schema}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[var(--landing-ink)]">{o.name}</p>
            <p className="mt-1 text-lg text-[var(--landing-muted)]">{o.question}</p>
            <p className="mt-4 font-mono text-xs leading-relaxed text-[var(--landing-subtle)]">{o.fields}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid grid-cols-1 gap-4 font-mono text-xs md:grid-cols-2 md:gap-6">
        <p className="flex items-start gap-3 rounded-xl bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] px-4 py-3 text-[var(--landing-muted)]">
          <ArrowLeft className="mt-px size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
          <span>
            <span className="font-semibold text-[var(--landing-ink)]">references point back</span> ·
            rule.detection_model → objective · objective.threats → threat
          </span>
        </p>
        <p className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--landing-border)] px-4 py-3 text-[var(--landing-muted)]">
          <ArrowRight className="mt-px size-3.5 shrink-0 text-[var(--landing-accent)]" aria-hidden />
          <span>
            <span className="font-semibold text-[var(--landing-ink)]">coverage flows forward</span> ·
            threats covered by objectives, implemented by rules
          </span>
        </p>
      </div>
    </div>
  );
}
