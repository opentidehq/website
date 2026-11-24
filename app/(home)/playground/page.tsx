import type { Metadata } from 'next';
import { Playground } from '@/components/playground/playground';
import { siteOgImage } from '@/lib/shared';

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

/** The IDE is the page: it fills the viewport under the header, with no footer. */
export default function PlaygroundPage() {
  return (
    <>
      <h1 className="sr-only">opentide playground</h1>
      <div className="lg:h-[calc(100svh-4rem)]">
        <Playground />
      </div>
    </>
  );
}
