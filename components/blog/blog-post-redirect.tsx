'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { NEXT_STEP_HREF } from '@/lib/blog';

export function BlogPostRedirect() {
  useEffect(() => {
    window.location.replace(NEXT_STEP_HREF);
  }, []);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-[var(--landing-muted)]">
      <p>This post moved.</p>
      <Link
        href={NEXT_STEP_HREF}
        className="text-[var(--landing-accent)] underline underline-offset-2"
      >
        Continue to The next step for opentide
      </Link>
    </div>
  );
}
