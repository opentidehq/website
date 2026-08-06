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

/**
 * Circular ring seal from OpenTideHQ/.github assets.
 * Light → badge-normal (blue). Dark → badge-dark (yellow), matching the icon/logo mapping.
 * Ring text is a `<textPath>` over a subsetted Inter face embedded in the SVG.
 */
export function OpentideBadge({
  className,
  size = 44,
}: {
  className?: string;
  /** Any CSS length; strings let a parent drive the size (`100%`, `clamp(...)`). */
  size?: number | string;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/svg/badge-normal.svg"
        alt=""
        width={200}
        height={200}
        className="block size-full dark:hidden"
        aria-hidden
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/svg/badge-dark.svg"
        alt=""
        width={200}
        height={200}
        className="hidden size-full dark:block"
        aria-hidden
        decoding="async"
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
