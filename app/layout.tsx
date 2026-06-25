import { Inter, JetBrains_Mono } from 'next/font/google';
import { Provider } from '@/components/provider';
import { siteUrl } from '@/lib/shared';
import type { Metadata } from 'next';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'OpenTide',
    template: '%s | OpenTide',
  },
  description:
    'The DetectionOps engine for detection-as-code — validate, generate, deploy, and document rules across seven security platforms.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
