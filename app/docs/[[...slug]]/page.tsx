import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import { DocsUsageRedirect } from '@/components/docs/docs-usage-redirect';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';

function getGithubUrl(slug: string[] | undefined, pagePath: string) {
  const section = slug?.[0];

  if (section === 'specifications') {
    const specPath = pagePath.replace(/^specifications\/?/, '');
    if (specPath.startsWith('specs/') || specPath.startsWith('rfcs/')) {
      return `https://github.com/OpenTideHQ/specifications/blob/main/${specPath}`;
    }
    const rootFile = specPath || 'README.md';
    const fileName = rootFile.endsWith('.md') ? rootFile : `${rootFile}.md`;
    return `https://github.com/OpenTideHQ/specifications/blob/main/${fileName === 'index.md' ? 'README.md' : fileName}`;
  }

  const docsPath = pagePath.replace(/\.mdx?$/, '.md');
  return `https://github.com/OpenTideHQ/opentide/blob/development/docs/${docsPath}`;
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  if (!params.slug?.length) {
    return <DocsUsageRedirect />;
  }
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const githubUrl = getGithubUrl(params.slug, page.path);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return [{ slug: [] }, ...source.generateParams()];
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
