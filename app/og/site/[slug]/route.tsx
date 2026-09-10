import { notFound } from 'next/navigation';
import { defaultOgProps, generateOgImage } from '@/lib/og';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/site/[slug]'>) {
  const { slug } = await params;
  if (slug !== 'image.png') notFound();
  return generateOgImage(defaultOgProps);
}

export function generateStaticParams() {
  return [{ slug: 'image.png' }];
}
