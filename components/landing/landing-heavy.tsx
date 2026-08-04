'use client';

import dynamic from 'next/dynamic';

function BlockSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-[var(--landing-border-subtle)] bg-black ${className ?? ''}`}
      aria-hidden
    />
  );
}

export const WorkflowStudio = dynamic(
  () => import('@/components/landing/workflow-studio').then((m) => m.WorkflowStudio),
  { loading: () => <BlockSkeleton className="min-h-[560px]" /> },
);

export const ObjectGraph = dynamic(
  () => import('@/components/landing/object-graph').then((m) => m.ObjectGraph),
  { loading: () => <BlockSkeleton className="min-h-[360px]" /> },
);
