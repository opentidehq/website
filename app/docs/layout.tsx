import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { DocsRootSwitcher } from '@/components/docs/docs-root-switcher';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = source.getPageTree();

  return (
    <DocsLayout
      tree={tree}
      {...baseOptions()}
      tabs={false}
      sidebar={{
        banner: <DocsRootSwitcher />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
