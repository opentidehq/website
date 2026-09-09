import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm text-fd-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-fd-muted-foreground">
        That URL is not on this site.
      </p>
      <p className="mt-8 flex gap-6 text-sm">
        <Link href="/" className="text-[var(--landing-accent,#0284c7)] hover:underline">
          Home
        </Link>
        <Link href="/docs/usage/" className="text-[var(--landing-accent,#0284c7)] hover:underline">
          Docs
        </Link>
        <Link href="/blog/" className="text-[var(--landing-accent,#0284c7)] hover:underline">
          Blog
        </Link>
      </p>
    </div>
  );
}
