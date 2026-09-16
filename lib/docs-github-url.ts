/**
 * Map a published docs page back to the upstream source file on GitHub.
 * Synced pages are `.mdx`; upstream opentide/specifications still use `.md`.
 */
export function toSourceMarkdownPath(pagePath: string): string {
  return pagePath.replace(/\.mdx$/i, '.md');
}

export function getGithubUrl(slug: string[] | undefined, pagePath: string): string {
  const markdownPath = toSourceMarkdownPath(pagePath);
  const section = slug?.[0];

  if (section === 'specifications') {
    const specPath = markdownPath.replace(/^specifications\/?/, '');
    if (specPath.startsWith('specs/') || specPath.startsWith('rfcs/')) {
      return `https://github.com/OpenTideHQ/specifications/blob/main/${specPath}`;
    }
    const rootFile = specPath || 'README.md';
    const fileName = rootFile.endsWith('.md') ? rootFile : `${rootFile}.md`;
    return `https://github.com/OpenTideHQ/specifications/blob/main/${fileName === 'index.md' ? 'README.md' : fileName}`;
  }

  return `https://github.com/OpenTideHQ/opentide/blob/development/docs/${markdownPath}`;
}
