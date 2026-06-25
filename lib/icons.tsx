import {
  BookOpen,
  Bot,
  Code,
  FileText,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Bot,
  Code,
  FileText,
  Terminal,
};

export function resolveLucideIcon(name?: string, className = 'size-4 shrink-0'): ReactNode {
  if (!name) return null;
  const Icon = iconMap[name] ?? iconMap[name.replace(/Icon$/, '')];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}
