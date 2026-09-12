import { BlogPostRedirect } from '@/components/blog/blog-post-redirect';
import { NEXT_STEP_HREF, NEXT_STEP_OG_IMAGE } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The next step for opentide',
  description:
    'The spec stays the spec. The implementation is a package you install — pip install opentide.',
  robots: { index: false, follow: true },
  alternates: { canonical: NEXT_STEP_HREF },
  openGraph: {
    type: 'article',
    url: NEXT_STEP_HREF,
    images: NEXT_STEP_OG_IMAGE,
  },
  twitter: {
    images: NEXT_STEP_OG_IMAGE,
  },
};

export default function LegacyIntroducingPostRedirect() {
  return <BlogPostRedirect />;
}
