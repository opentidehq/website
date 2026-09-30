import type { LoaderPlugin } from 'fumadocs-core/source';
import { rfcStatusClass, rfcStatusLabel, sidebarLabel } from '@/lib/rfc';
import { cn } from '@/lib/utils';

type RfcPageData = {
  title?: string;
  status?: string;
  rfc?: string;
};

function isRfcArticle(url: string, filePath: string): boolean {
  const path = `${filePath} ${url}`.replaceAll('\\', '/');
  if (!path.includes('/rfcs/')) return false;
  if (path.includes('/rfcs/index')) return false;
  if (/\/rfcs\/?$/.test(url)) return false;
  return true;
}

/**
 * Show the RFC number and status beside each proposal in the docs sidebar.
 * Host elements only — the page tree is passed into the client layout.
 */
export function rfcSidebarPlugin(): LoaderPlugin {
  return {
    name: 'opentide:rfc-sidebar',
    transformPageTree: {
      file(node, filePath) {
        const path = filePath ?? '';
        if (!isRfcArticle(node.url, path)) return node;
        const stored = path ? this.storage.read(path) : undefined;
        if (!stored || stored.format !== 'page') return node;
        const data = stored.data as RfcPageData;
        if (!data.status) return node;
        const label = sidebarLabel(typeof data.title === 'string' ? data.title : '', data.rfc);
        node.name = (
          <span className="inline-flex min-w-0 max-w-full items-baseline gap-2">
            <span className="truncate">{label}</span>
            <span
              data-rfc-status={data.status}
              className={cn(
                'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
                rfcStatusClass(data.status),
              )}
            >
              {rfcStatusLabel(data.status)}
            </span>
          </span>
        );
        return node;
      },
    },
  };
}
