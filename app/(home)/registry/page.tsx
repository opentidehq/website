import Link from 'next/link';
import { ArrowRight, Database, Globe, Share2 } from 'lucide-react';
import { ecosystemLinks } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registry — Coming Soon',
  description:
    'Browse OpenTide detection objects from ShareTide and the future OpenTide Exchange. Registry server coming soon.',
};

export default function RegistryPage() {
  const shareTide = ecosystemLinks.find((l) => l.name === 'ShareTide');

  return (
    <div className="container mx-auto px-4 py-20 md:py-28 max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-6">
        <Database className="size-3.5" />
        Coming soon
      </div>

      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
        OpenTide Registry
      </h1>

      <p className="text-lg text-fd-muted-foreground leading-relaxed mb-10">
        A browsable registry server for OpenTide detection objects — rendered from live registry
        indexes, powered by ShareTide today and evolving into a curated{' '}
        <strong className="text-fd-foreground font-medium">Exchange</strong> tomorrow.
      </p>

      <div className="space-y-6 mb-12">
        <div className="rounded-xl border border-fd-border p-6">
          <div className="flex items-start gap-4">
            <Share2 className="size-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-lg mb-2">ShareTide today</h2>
              <p className="text-sm text-fd-muted-foreground mb-4">
                Community <code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded">TLP:CLEAR</code>{' '}
                detection objects you can import into your OpenTide repository today. Validation
                pipelines ensure shared content meets schema requirements.
              </p>
              {shareTide && (
                <a
                  href={shareTide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:underline"
                >
                  Browse ShareTide on GitHub
                  <ArrowRight className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-fd-border p-6 opacity-80">
          <div className="flex items-start gap-4">
            <Globe className="size-6 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-lg mb-2">Exchange tomorrow</h2>
              <p className="text-sm text-fd-muted-foreground">
                The registry server will expose curated detection content under{' '}
                <code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded">opentide.org/registry</code>
                — searchable, versioned, and integrated with the OpenTide validation toolchain.
                SSR or incremental static rendering TBD; this URL is reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-fd-border p-8 text-center">
        <p className="text-fd-muted-foreground mb-4">
          Want updates when the registry launches?
        </p>
        <a
          href="https://github.com/OpenTideHQ/website/watchers"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium hover:bg-fd-accent transition-colors"
        >
          Watch the website repository
        </a>
      </div>

      <p className="text-center mt-8 text-sm text-fd-muted-foreground">
        Meanwhile, explore the{' '}
        <Link href="/docs/" className="text-sky-400 hover:underline">
          documentation
        </Link>{' '}
        or read our{' '}
        <Link href="/blog/" className="text-sky-400 hover:underline">
          blog
        </Link>
        .
      </p>
    </div>
  );
}
