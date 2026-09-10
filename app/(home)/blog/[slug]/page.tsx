import { blog, getBlogImage } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage(props: PageProps<'/blog/[slug]'>) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <article className="container mx-auto px-4 py-16 md:py-20 max-w-3xl">
      <Link
        href="/blog/"
        className="text-sm text-fd-muted-foreground hover:text-fd-foreground mb-8 inline-block"
      >
        ← Back to blog
      </Link>

      <header className="mb-10 border-b border-fd-border pb-8">
        <time className="text-sm text-fd-muted-foreground">{formatDate(page.data.date)}</time>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{page.data.title}</h1>
        <p className="text-fd-muted-foreground">{page.data.description}</p>
        <p className="text-sm text-fd-muted-foreground mt-4">By {page.data.author}</p>
        {page.data.tags && page.data.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {page.data.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-fd-muted px-2.5 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDX components={getMDXComponents()} />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return blog.getPages().map((page) => ({
    slug: page.slugs.at(-1) ?? page.slugs.join('/'),
  }));
}

export async function generateMetadata(
  props: PageProps<'/blog/[slug]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    authors: [{ name: page.data.author }],
    openGraph: {
      type: 'article',
      publishedTime: page.data.date.toISOString(),
      authors: [page.data.author],
      tags: page.data.tags,
      images: getBlogImage(page).url,
    },
    twitter: {
      images: getBlogImage(page).url,
    },
  };
}
