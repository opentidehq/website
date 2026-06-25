import { LandingNav } from '@/components/landing/landing-nav';
import './landing-overrides.css';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <LandingNav>{children}</LandingNav>;
}
