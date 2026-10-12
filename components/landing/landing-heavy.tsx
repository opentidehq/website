'use client';

import dynamic from 'next/dynamic';

export const WorkflowStudio = dynamic(
  () => import('@/components/landing/workflow-studio').then((m) => m.WorkflowStudio),
  {
    // Reserve the studio's height so the page does not jump when it hydrates.
    loading: () => (
      <div className="landing-studio" aria-hidden>
        <div className="h-9" />
        <div className="landing-studio-body animate-pulse rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]" />
      </div>
    ),
  },
);
