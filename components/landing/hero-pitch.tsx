import { OpentideName } from '@/components/brand/opentide-name';

export function HeroPitch() {
  return (
    <div className="border-t border-white/[0.06] px-5 py-8 md:px-10 md:py-10">
      <p className="mx-auto max-w-3xl text-center text-[clamp(1.05rem,2.2vw,1.35rem)] leading-relaxed text-[var(--landing-muted)] text-pretty">
        <OpentideName className="font-medium text-[var(--landing-ink)]" /> is the{' '}
        <span className="font-medium text-[var(--landing-accent)]">DetectionOps</span> standard for teams
        who want normative objects, honest validation, and deploy pipelines that work the same in your
        shell, CI, and with agents — without rebuilding the workflow every time.
      </p>
    </div>
  );
}
