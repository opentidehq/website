'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const RELEASES_HREF = '/releases/';

export function DocsReleasesRedirect() {
  useEffect(() => {
    window.location.replace(RELEASES_HREF);
  }, []);

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center text-fd-muted-foreground">
      <p>Release notes moved to their own page.</p>
      <Link href={RELEASES_HREF} className="text-fd-primary underline underline-offset-2">
        Continue to Releases
      </Link>
    </main>
  );
}
