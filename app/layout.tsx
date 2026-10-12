import { Inter, JetBrains_Mono } from 'next/font/google';
import { Provider } from '@/components/provider';
import { appDescription, siteOgImage, siteUrl } from '@/lib/shared';
import type { Metadata } from 'next';
import './global.css';

// Names must not collide with Tailwind's `--font-sans`/`--font-mono` theme
// variables: both land on <html> at equal specificity, so the theme value would
// win and self-reference into an invalid cycle.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'opentide',
    template: '%s | opentide',
  },
  description: appDescription,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'opentide',
    images: siteOgImage,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
