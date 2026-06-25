'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export function DocsUsageRedirect() {
  useEffect(() => {
    window.location.replace('/docs/usage/');
  }, []);

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-fd-muted-foreground">
      <p>Redirecting to Usage documentation…</p>
      <Link href="/docs/usage/" className="text-fd-primary underline underline-offset-2">
        Continue to Usage docs
      </Link>
    </main>
  );
}
