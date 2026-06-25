import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { resolveLucideIcon } from '@/lib/icons';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type * as PageTree from 'fumadocs-core/page-tree';

function getRootIcon(node: PageTree.Folder): string | undefined {
  if (typeof node.icon === 'string') return node.icon;
  return undefined;
}

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = source.getPageTree();

  return (
    <DocsLayout
      tree={tree}
      {...baseOptions()}
      tabMode="auto"
      tabs={{
        transform: (option, node) => {
          const iconName = getRootIcon(node);
          return {
            ...option,
            icon: resolveLucideIcon(iconName, 'size-5 shrink-0 text-[var(--eu-yellow)]'),
          };
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
