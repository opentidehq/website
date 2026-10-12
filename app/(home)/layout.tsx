import { LandingNav } from '@/components/landing/landing-nav';
import { readBuildTimePypiVersion } from '@/lib/pypi-build';

export default async function Layout({ children }: LayoutProps<'/'>) {
  // The footer names the latest release, read from PyPI when the site is built.
  const version = await readBuildTimePypiVersion();
  return <LandingNav version={version}>{children}</LandingNav>;
}
