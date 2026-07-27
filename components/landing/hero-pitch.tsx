export function HeroPitch() {
  return (
    <section className="border-y border-white/[0.06] bg-black px-4 py-14 md:px-6 md:py-16" aria-label="What opentide is">
      <div className="mx-auto w-full max-w-[1400px]">
        <p className="max-w-4xl text-[clamp(1.15rem,2.1vw,1.7rem)] font-medium leading-[1.35] tracking-[-0.02em] text-[var(--landing-ink)] text-pretty">
          <span className="text-[var(--eu-yellow)]">opentide</span> is the DetectionOps standard for
          teams shipping detection-as-code. Honest validation, deploy pipelines that match from shell
          to CI to agents, and skills from the OpenTide ecosystem.
        </p>
      </div>
    </section>
  );
}
