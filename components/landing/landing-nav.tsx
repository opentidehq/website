'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';

/**
 * The marketing chrome around the landing, the blog and the releases: a floating header over
 * the page, and the footer. The header takes no room, so pages other than the landing, whose
 * hero runs under it, start below it.
 */
export function LandingNav({ children, version }: { children: ReactNode; version?: string | null }) {
  const pathname = usePathname();

  return (
    <div className="landing flex min-h-screen flex-col">
      <SiteHeader pathname={pathname} />
      <main className={`flex-1 ${pathname === '/' ? '' : 'pt-16'}`}>{children}</main>
      <SiteFooter version={version} />
    </div>
  );
}
