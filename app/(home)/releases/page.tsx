import type { Metadata } from 'next';
import { ReleaseLog } from '@/components/releases/release-log';
import { readBuildTimePypiVersion } from '@/lib/pypi-build';
import { loadReleaseNotes } from '@/lib/releases';
import { siteOgImage } from '@/lib/shared';

const title = 'Releases';
const description =
  'What shipped in the opentide engine — install the latest, or pin the version your pipeline should keep.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: siteOgImage,
  },
  twitter: {
    images: siteOgImage,
  },
};

export default async function ReleasesPage() {
  const [releases, pypiVersion] = await Promise.all([loadReleaseNotes(), readBuildTimePypiVersion()]);

  return <ReleaseLog releases={releases} pypiVersion={pypiVersion} />;
}
