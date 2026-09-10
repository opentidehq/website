import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { generateOgImage } from '@/lib/og';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return generateOgImage({
    title: page.data.title,
    description: page.data.description,
    eyebrow: 'Docs',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
