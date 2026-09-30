import { RfcStatus } from '@/components/docs/rfc-status';
import {
  displayFieldParts,
  fieldIsWide,
  parseBannerData,
  safeHref,
  type RfcSegment,
} from '@/lib/rfc';

function RichText({ parts }: { parts: RfcSegment[] }) {
  return parts.map((part, index) => {
    if (part.kind === 'text') return <span key={index}>{part.text}</span>;
    const href = safeHref(part.href);
    if (!href) return <span key={index}>{part.text}</span>;
    const external = href.startsWith('http');
    return (
      <a
        key={index}
        href={href}
        className="text-[var(--brand-accent)] underline-offset-2 hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {part.text}
      </a>
    );
  });
}

export function RfcBanner({ entry }: { entry: string }) {
  const data = parseBannerData(entry);
  if (!data) return null;

  return (
    <aside
      data-rfc-banner
      data-rfc-status={data.status}
      aria-label={`RFC ${data.number} status`}
      className="not-prose mb-8 rounded-xl border border-fd-border bg-fd-card px-4 py-3.5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <RfcStatus status={data.status} />
        <span className="font-mono text-sm text-[#3a3a42] dark:text-[#d4d4d8]">RFC {data.number}</span>
      </div>
      {data.note ? <p className="mt-3 text-sm text-fd-foreground">{data.note}</p> : null}
      {data.fields.length > 0 ? (
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {data.fields.map((field) => {
            const parts = displayFieldParts(field.label, field.parts);
            return (
              <div key={field.label} className={fieldIsWide(field.label, parts) ? 'sm:col-span-2' : undefined}>
                <dt className="text-xs text-[#3a3a42] dark:text-[#d4d4d8]">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-fd-foreground">
                  <RichText parts={parts} />
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </aside>
  );
}
