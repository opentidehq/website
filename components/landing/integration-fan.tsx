'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type FocusEvent } from 'react';
import { BlockHead } from '@/components/landing/ui';
import { useOnScreen } from '@/lib/hooks/use-on-screen';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { INTEGRATIONS, type Integration } from '@/lib/landing/integrations';

/**
 * The tile list's rows at `lg`: two tiles a row. With an odd number of integrations the request
 * tile fills the last row's empty cell; with an even number it gets a row of its own.
 */
const requestFillsRow = INTEGRATIONS.length % 2 === 1;
const tileRows = Math.ceil(INTEGRATIONS.length / 2);

/** How long each block stays open while the figure plays. */
const DWELL_MS = 2600;

function Logo({ src, kind }: { src: string; kind: Integration['kind'] }) {
  if (kind === 'raster') {
    return <Image src={src} alt="" width={28} height={28} className="size-7 shrink-0 rounded-md object-contain" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`size-7 shrink-0 object-contain ${kind === 'mono' ? 'opacity-90 dark:invert' : ''}`} aria-hidden />
  );
}

/** One YAML line: the key in key colour, the rest as written. */
function YamlLine({ text, indent }: { text: string; indent: number }) {
  const lead = text.length - text.trimStart().length;
  const body = text.trimStart();
  const colon = body.indexOf(':');
  return (
    <span className="block overflow-hidden text-ellipsis whitespace-pre">
      {' '.repeat(indent + lead)}
      {colon === -1 ? (
        body
      ) : (
        <>
          <span className="text-[var(--landing-code-key)]">{body.slice(0, colon)}</span>
          <span className="text-[var(--landing-code-dim)]">:</span>
          {body.slice(colon + 1)}
        </>
      )}
    </span>
  );
}

/**
 * One rule, one block per integration. The rule file on the left opens one block at a time and
 * the integration it deploys to lights up on the right; the figure steps through them while it
 * is on screen, and pointing at or focusing an integration opens its block instead. Every block
 * is exactly three lines, so the file keeps its height as blocks open and close.
 */
export function IntegrationFan() {
  const reduced = usePrefersReducedMotion();
  const { ref, onScreen } = useOnScreen<HTMLDivElement>();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const current = INTEGRATIONS[active];

  useEffect(() => {
    if (reduced || held || !onScreen) return;
    const id = setInterval(() => setActive((i) => (i + 1) % INTEGRATIONS.length), DWELL_MS);
    return () => clearInterval(id);
  }, [reduced, held, onScreen]);

  const release = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-14 gap-y-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <BlockHead title="One model. Every integration. No rewrites." />
        <div data-reveal>
          <p className="max-w-prose text-lg leading-relaxed text-[var(--landing-muted)] text-pretty">
            A rule carries one configuration block per integration, so adding an integration adds a block, not a
            rewrite. Threats and objectives stay as they are.{' '}
            <code className="font-mono text-base text-[var(--landing-ink)]">opentide deploy</code>{' '}turns each block
            into that integration&rsquo;s own detection, and the rule&rsquo;s status decides where it lands: staging
            tenants while you refine it, production once it is live.
          </p>
          <Link
            href="/docs/usage/workflows/detection-as-code/"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-ink)] transition hover:text-[var(--landing-accent)]"
          >
            The detection-as-code workflow <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <div
        ref={ref}
        data-reveal
        className="mt-10 grid grid-cols-1 gap-4 lg:mt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={release}
      >
        <figure className="m-0 flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--landing-code-bg)] text-[var(--landing-code-ink)] ring-1 ring-[var(--landing-border)]">
          <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-2.5 font-mono text-[11px] text-[var(--landing-code-dim)]">
            <span>suspicious_command_processor.yaml</span>
            <span>rule::1.1</span>
          </figcaption>
          <pre className="m-0 flex-1 overflow-hidden px-3 py-4 font-mono text-[12.5px] leading-[1.75]">
            <code>
              <span className="block px-2">
                <YamlLine text="name: Suspicious command processor" indent={0} />
                <YamlLine text="status: STAGING" indent={0} />
                <YamlLine text="configurations:" indent={0} />
              </span>
              {INTEGRATIONS.map((p, i) => {
                const open = i === active;
                return (
                  <span
                    key={p.key}
                    onMouseEnter={() => setActive(i)}
                    className={`block cursor-default rounded-md px-2 transition-colors duration-300 ${open ? 'bg-white/[0.07]' : ''}`}
                  >
                    <span className="block overflow-hidden text-ellipsis whitespace-pre">
                      {'  '}
                      <span className={open ? 'text-[var(--landing-code-str)]' : 'text-[var(--landing-code-key)]'}>{p.key}</span>
                      <span className="text-[var(--landing-code-dim)]">:{open ? '' : ' …'}</span>
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <span className="block overflow-hidden">
                        {p.block.map((line) => (
                          <YamlLine key={line} text={line} indent={4} />
                        ))}
                      </span>
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
          <div className="border-t border-white/10 px-5 py-3 font-mono text-[12px] leading-relaxed">
            <span className="block text-[var(--landing-code-dim)]">$ opentide deploy</span>
            <span className="flex min-w-0 items-center gap-2">
              <Check className="size-3.5 shrink-0 text-emerald-300" strokeWidth={3} aria-hidden />
              <span className="truncate">
                {current.name}
                <span className="text-[var(--landing-code-dim)]"> · {current.deploys}</span>
              </span>
            </span>
          </div>
        </figure>

        <ul
          className={`m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 ${
            requestFillsRow
              ? 'lg:grid-rows-[repeat(var(--fan-rows),minmax(0,1fr))]'
              : 'lg:grid-rows-[repeat(var(--fan-rows),minmax(0,1fr))_auto]'
          }`}
          style={{ '--fan-rows': tileRows } as CSSProperties}
          aria-label="Integrations"
        >
          {INTEGRATIONS.map((p, i) => {
            const on = i === active;
            return (
              <li key={p.key} className="flex">
                <button
                  type="button"
                  aria-pressed={on}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={`flex flex-1 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[background-color,border-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)] ${
                    on
                      ? 'border-[color-mix(in_srgb,var(--landing-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--landing-accent)_7%,var(--landing-panel))]'
                      : 'border-[var(--landing-border)] bg-[var(--landing-panel)] hover:border-[color-mix(in_srgb,var(--landing-accent)_35%,transparent)]'
                  }`}
                >
                  <Logo src={p.src} kind={p.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold leading-snug text-[var(--landing-ink)]">{p.name}</span>
                    <span className="block truncate font-mono text-[11px] text-[var(--landing-subtle)]">{p.deploys}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`grid size-5 shrink-0 place-items-center rounded-full bg-[var(--landing-accent)] text-[var(--brand-accent-foreground)] transition-[opacity,scale] duration-300 ${
                      on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                    }`}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </button>
              </li>
            );
          })}
          <li className={requestFillsRow ? 'flex' : 'flex sm:col-span-2'}>
            <a
              href="https://github.com/opentidehq/opentide/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-between gap-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--landing-ink)_22%,transparent)] px-3.5 py-3 text-sm transition hover:border-[var(--landing-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-accent)]"
            >
              <span className="text-[var(--landing-subtle)]">Your integration next?</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--landing-accent)]">
                Request it <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
