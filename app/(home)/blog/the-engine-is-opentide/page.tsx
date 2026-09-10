import { BlogPostRedirect } from '@/components/blog/blog-post-redirect';
import { NEXT_STEP_HREF } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The next step for OpenTide',
  description:
    'The spec stays the spec. The implementation is a package you pin — pip install opentide==0.1.0.',
  robots: { index: false, follow: true },
  alternates: { canonical: NEXT_STEP_HREF },
};

export default function LegacyEnginePostRedirect() {
  return <BlogPostRedirect />;
}
