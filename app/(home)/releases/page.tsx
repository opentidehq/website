import { ReleasesPage, releasesMetadata } from '@/components/releases/releases-page';

export const metadata = releasesMetadata('opentide');

export default function OpentideReleasesPage() {
  return <ReleasesPage id="opentide" />;
}
