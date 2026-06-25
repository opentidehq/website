'use client';

import dynamic from 'next/dynamic';

function BlockSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/[0.06] bg-black ${className ?? ''}`}
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

export const AutonomySpectrum = dynamic(
  () => import('@/components/landing/autonomy-spectrum').then((m) => m.AutonomySpectrum),
  { loading: () => <BlockSkeleton className="min-h-[320px]" /> },
);
