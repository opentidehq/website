export function WaveDivider({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        className="block h-8 w-full text-[#003399] md:h-12"
        fill="currentColor"
      >
        <path className="landing-wave-a" d="M0,24 C200,8 400,40 600,24 S1000,8 1200,24 L1200,48 L0,48 Z" />
        <path
          className="landing-wave-b"
          d="M0,32 C250,16 450,44 700,28 S1050,20 1200,32 L1200,48 L0,48 Z"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}
