import Image from 'next/image';

type MarkProps = {
  className?: string;
  size?: number;
};

/**
 * Circle icon from OpenTideHQ/.github assets.
 * Light → icon-normal (blue). Dark → icon-dark (yellow).
 */
export function OpentideMark({ className, size = 28 }: MarkProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <Image
        src="/brand/svg/icon-normal.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        aria-hidden
        unoptimized
      />
      <Image
        src="/brand/svg/icon-dark.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        aria-hidden
        unoptimized
      />
    </span>
  );
}

/**
 * Official pill logotype from OpenTideHQ/.github.
 * Light → logo-normal (Reflex Blue pill). Dark → logo-dark (EU Yellow pill).
 */
export function OpentideWordmark({
  className,
  height = 34,
}: {
  className?: string;
  /** Display height in px; width scales from the 424.35×144 viewBox. */
  height?: number;
}) {
  const width = Math.round((height * 424.35) / 144);
  const sizeClass = height >= 36 ? 'h-9' : height >= 32 ? 'h-8' : 'h-7';

  return (
    <span className={`relative inline-flex shrink-0 items-center ${className ?? ''}`}>
      <Image
        src="/brand/svg/logo-normal.svg"
        alt="opentide"
        width={width}
        height={height}
        className={`${sizeClass} w-auto dark:hidden`}
        unoptimized
        priority
      />
      <Image
        src="/brand/svg/logo-dark.svg"
        alt="opentide"
        width={width}
        height={height}
        className={`hidden ${sizeClass} w-auto dark:block`}
        unoptimized
        priority
      />
    </span>
  );
}

/** Compact OTIDE ring seal for footers. */
export function OpentideBadge({
  className,
  size = 44,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={`relative inline-flex shrink-0 ${className ?? ''}`} style={{ width: size, height: size }}>
      <Image
        src="/brand/svg/badge-normal.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        aria-hidden
        unoptimized
      />
      <Image
        src="/brand/svg/badge-inverse.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        aria-hidden
        unoptimized
      />
    </span>
  );
}

/** Official EUPL license pill from OpenTideHQ/.github (outlined; works on light and dark). */
export function OpentideLicensePill({
  className,
  height = 22,
}: {
  className?: string;
  height?: number;
}) {
  const width = Math.round((height * 71.91) / 23.5);
  return (
    <Image
      src="/brand/svg/license-pill-normal.svg"
      alt="EUPL 1.2"
      width={width}
      height={height}
      className={`h-[22px] w-auto ${className ?? ''}`}
      unoptimized
    />
  );
}
