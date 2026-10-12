'use client';

import dynamic from 'next/dynamic';

export const WorkflowStudio = dynamic(
  () => import('@/components/landing/workflow-studio').then((m) => m.WorkflowStudio),
  {
    // Same box as the studio: its 67px step chrome, then a bordered frame with a 40px title
    // bar over the body, so nothing below moves when it hydrates.
    loading: () => (
      <div className="landing-studio" aria-hidden>
        <div className="h-[67px]" />
        <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]">
          <div className="h-10 border-b border-[var(--landing-border-subtle)]" />
          <div className="landing-studio-body animate-pulse" />
        </div>
      </div>
    ),
  },
);
