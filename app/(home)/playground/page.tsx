import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Accent, wrap } from '@/components/landing/ui';
import { Playground } from '@/components/playground/playground';
import { LIBRARY_EXPLORER_URL, siteOgImage } from '@/lib/shared';

const title = 'Playground';
const description =
  'Edit a detection repository in your browser: opentide, compiled to WebAssembly, checks it as you type, then deploys the rule to simulated Sentinel and Splunk tenants.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/playground/' },
  openGraph: { title, description, images: siteOgImage },
  twitter: { images: siteOgImage },
};

const KEYS: [string, string][] = [
  ['Ctrl Space', 'complete'],
  ['F12 · ⌘/Ctrl click', 'go to definition'],
  ['F2', 'rename'],
  ['Shift Alt F', 'format'],
  ['⌘/Ctrl F', 'find'],
];

export default function PlaygroundPage() {
  return (
    <div className="pb-24 pt-10 md:pt-14">
      <div className={wrap}>
        <header className="grid gap-x-16 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
          <div>
            <p className="flex items-center gap-3 font-mono text-sm">
              <span className="size-1.5 rounded-full bg-[var(--landing-accent)]" aria-hidden />
              <span className="text-[var(--landing-subtle)]">playground</span>
            </p>
            <h1 className="mt-5 text-[clamp(2.2rem,4.6vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.04em] text-balance">
              Write a detection. <Accent>Watch it deploy.</Accent>
            </h1>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-[var(--landing-subtle)]">
              <li>nothing leaves your browser</li>
              <li>the checks the VS Code extension runs</li>
              <li>platforms simulated, payloads real</li>
            </ul>
          </div>
          <div>
            <p className="max-w-xl text-base leading-relaxed text-[var(--landing-muted)] text-pretty md:text-lg">
              A detection repository, open in your browser. opentide runs here as WebAssembly and checks every keystroke: diagnostics,
              hover, completion and go-to-definition across the threats, objective and rule. Then deploy the rule and see what Sentinel
              and Splunk would receive.
            </p>
          </div>
        </header>

        <div className="mt-9">
          <Playground />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--landing-subtle)]">
            {KEYS.map(([key, what]) => (
              <li key={key} className="flex items-center gap-2">
                <kbd className="rounded-md border border-[var(--landing-border)] bg-[var(--landing-panel)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--landing-muted)]">
                  {key}
                </kbd>
                {what}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <a href={LIBRARY_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              Browse the library
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
            <Link href="/docs/usage/quickstart/" className="landing-btn-primary">
              Run it on your repository
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
