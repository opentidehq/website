import { LandingNav } from '@/components/landing/landing-nav';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <LandingNav>{children}</LandingNav>;
}
