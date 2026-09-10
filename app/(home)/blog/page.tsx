import Link from 'next/link';
import { getBlogPosts } from '@/lib/source';
import { blogIndexOgImage } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'News, announcements, and engineering posts from the opentide team.',
  openGraph: {
    images: blogIndexOgImage,
  },
  twitter: {
    images: blogIndexOgImage,
  },
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-16 md:py-20 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Blog</h1>
      <p className="text-fd-muted-foreground mb-12">
        Announcements and engineering notes from the opentide project.
      </p>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.url} className="group border-b border-fd-border pb-8 last:border-0">
            <time className="text-sm text-fd-muted-foreground">
              {formatDate(post.data.date)}
            </time>
            <h2 className="text-xl font-semibold mt-2 mb-2 group-hover:text-sky-400 transition-colors">
              <Link href={post.url}>{post.data.title}</Link>
            </h2>
            <p className="text-fd-muted-foreground text-sm mb-3">{post.data.description}</p>
            <div className="flex items-center gap-3 text-xs text-fd-muted-foreground">
              <span>By {post.data.author}</span>
              {post.data.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-fd-muted px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <p className="text-fd-muted-foreground">No posts yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
