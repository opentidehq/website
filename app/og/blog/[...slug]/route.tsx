import { getBlogImage, blog } from '@/lib/source';
import { notFound } from 'next/navigation';
import { generateOgImage } from '@/lib/og';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/blog/[...slug]'>) {
  const { slug } = await params;
  if (slug.at(-1) !== 'image.png') notFound();

  const pageSlug = slug.slice(0, -1);
  if (pageSlug.length === 0) {
    return generateOgImage({
      title: 'Blog',
      description: 'News, announcements, and engineering posts from the opentide team.',
    });
  }

  const page = blog.getPage(pageSlug);
  if (!page) notFound();

  return generateOgImage({
    title: page.data.title ?? 'opentide blog',
    description: page.data.description,
    eyebrow: 'Blog',
  });
}

export function generateStaticParams() {
  return [
    { slug: ['image.png'] },
    ...blog.getPages().map((page) => ({
      slug: getBlogImage(page).segments,
    })),
  ];
}
