'use client';

import { docTabs } from '@/lib/theme';
import { resolveLucideIcon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import Link from 'fumadocs-core/link';
import { usePathname } from 'fumadocs-core/framework';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';

const defaultTab = docTabs.find((t) => t.key === 'usage') ?? docTabs[0];

function isTabActive(url: string, pathname: string) {
  const base = url.replace(/\/$/, '');
  const path = pathname.replace(/\/$/, '');
  return path === base || path.startsWith(`${base}/`);
}

export function DocsRootSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const selected = useMemo(() => {
    return docTabs.findLast((tab) => isTabActive(tab.url, pathname)) ?? defaultTab;
  }, [pathname]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-ot-root-switcher
        aria-label={`Documentation section: ${selected.title}`}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 p-2 text-start text-fd-secondary-foreground transition-colors',
          'hover:bg-fd-accent data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--eu-yellow)]',
        )}
      >
        <div className="size-9 shrink-0 empty:hidden md:size-5">
          {resolveLucideIcon(selected.icon, 'size-full [&_svg]:size-full max-md:p-1.5 max-md:rounded-md max-md:border max-md:bg-fd-secondary')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{selected.title}</p>
          <p className="text-sm text-fd-muted-foreground empty:hidden md:hidden">{selected.description}</p>
        </div>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="flex w-(--radix-popover-trigger-width) flex-col gap-1 p-1 fd-scroll-container"
        align="start"
      >
        {docTabs.map((tab) => {
          const isActive = tab.url === selected.url;
          return (
            <Link
              key={tab.key}
              href={tab.url}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--eu-yellow)]"
            >
              <div className="size-9 shrink-0 empty:hidden md:mb-auto md:size-5">
                {resolveLucideIcon(tab.icon, 'size-full [&_svg]:size-full max-md:p-1.5 max-md:rounded-md max-md:border max-md:bg-fd-secondary')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">{tab.title}</p>
                <p className="mt-1 text-[0.8125rem] text-fd-muted-foreground">{tab.description}</p>
              </div>
              <Check className={cn('ms-auto size-3.5 shrink-0 text-fd-primary', !isActive && 'invisible')} />
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
