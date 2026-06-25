import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import Link from 'next/link';
import { gitConfig } from '@/lib/shared';

function SiteFooter() {
  return (
    <footer className="border-t border-fd-border mt-auto">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-fd-muted-foreground">
        <p>
          © {new Date().getFullYear()} OpenTide. Website licensed under{' '}
          <a
            href="https://github.com/OpenTideHQ/website/blob/main/LICENSE"
            className="underline hover:text-fd-foreground"
          >
            EUPL-1.2
          </a>
          . Specifications under CC-BY-4.0.
        </p>
        <div className="flex items-center gap-6">
          <Link href="/docs/" className="hover:text-fd-foreground">
            Docs
          </Link>
          <Link href="/blog/" className="hover:text-fd-foreground">
            Blog
          </Link>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            className="hover:text-fd-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://pypi.org/project/opentide/"
            className="hover:text-fd-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            PyPI
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      <SiteFooter />
    </>
  );
}
