'use client';

import {
  ArrowRight,
  Check,
  CircleDashed,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Loader,
  UserCheck,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogLine } from '@/components/landing/studio-log-line';
import type { ReviewJob, ReviewMr } from '@/lib/landing/demo-registry';
import { TIMING } from '@/lib/landing/studio-timing';

type JobStatus = 'queued' | 'running' | 'passed';

function StatusDot({ status }: { status: JobStatus }) {
  if (status === 'passed') {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black">
        <Check className="size-2.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (status === 'running') {
    return (
      <Loader
        className="size-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
        aria-hidden
      />
    );
  }
  return <CircleDashed className="size-4 shrink-0 text-[var(--landing-dim)]" aria-hidden />;
}

/** Merge request page as an IDE tab: MR metadata, CI checks with logs, merge footer. */
export function StudioReviewTab({
  mr,
  jobs,
  files,
  armed = true,
  paused = false,
  instant = false,
  onProgress,
  onComplete,
}: {
  mr: ReviewMr;
  jobs: ReviewJob[];
  files: { path: string; added: number }[];
  armed?: boolean;
  paused?: boolean;
  instant?: boolean;
  onProgress?: (ratio: number) => void;
  onComplete?: () => void;
}) {
  const total = jobs.reduce((n, j) => n + j.lines.length, 0);
  const [streamed, setStreamed] = useState(0);
  const [mergedByRun, setMergedByRun] = useState(false);
  const shown = instant ? total : streamed;
  const merged = instant || mergedByRun;
  const scrollRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);
  const shownRef = useRef(shown);
  const progressRef = useRef(onProgress);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);
  useEffect(() => {
    progressRef.current = onProgress;
    completeRef.current = onComplete;
  });

  const finish = useCallback(() => {
    setMergedByRun(true);
    progressRef.current?.(1);
    if (!doneRef.current) {
      doneRef.current = true;
      completeRef.current?.();
    }
  }, []);

  useEffect(() => {
    if (!armed) return;

    if (instant) {
      const frame = window.requestAnimationFrame(finish);
      return () => window.cancelAnimationFrame(frame);
    }

    let mergeTimer = 0;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      if (shownRef.current >= total) {
        window.clearInterval(timer);
        const tryFinish = () => {
          if (pausedRef.current) {
            mergeTimer = window.setTimeout(tryFinish, 200);
            return;
          }
          finish();
        };
        mergeTimer = window.setTimeout(tryFinish, TIMING.ciMerge);
        return;
      }
      const next = shownRef.current + 1;
      shownRef.current = next;
      setStreamed(next);
      progressRef.current?.(Math.min(0.92, (next / Math.max(total, 1)) * 0.92));
    }, TIMING.ciLine);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(mergeTimer);
    };
  }, [armed, instant, total, finish]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !armed || instant || shown === 0) return;
    el.scrollTop = el.scrollHeight;
  }, [shown, armed, instant]);

  const jobState = jobs.map((job, i) => {
    const start = jobs.slice(0, i).reduce((n, j) => n + j.lines.length, 0);
    const visible = armed ? Math.max(0, Math.min(job.lines.length, shown - start)) : 0;
    const status: JobStatus =
      visible >= job.lines.length ? 'passed' : visible > 0 ? 'running' : 'queued';
    return { job, visible, status };
  });
  const passedCount = jobState.filter((j) => j.status === 'passed').length;
  const allPassed = passedCount === jobs.length;

  return (
    <div
      ref={scrollRef}
      className="landing-code-scroll h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--landing-bg)]"
    >
      <div className="mx-auto max-w-[44rem] space-y-4 p-4">
        <header className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium ${
                merged
                  ? 'bg-violet-600 text-white dark:bg-violet-500 dark:text-black'
                  : 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black'
              }`}
            >
              {merged ? (
                <GitMerge className="size-3" aria-hidden />
              ) : (
                <GitPullRequest className="size-3" aria-hidden />
              )}
              {merged ? 'Merged' : 'Open'}
            </span>
            <span className="font-mono text-[11px] text-[var(--landing-subtle)]">{mr.id}</span>
          </div>

          <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-[var(--landing-ink)]">
            {mr.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-[var(--landing-subtle)]">
            <GitBranch className="size-3" aria-hidden />
            <span className="text-[var(--landing-ink)]">{mr.branch}</span>
            <ArrowRight className="size-3" aria-hidden />
            <span>{mr.target}</span>
            <span className="text-[var(--landing-dim)]">·</span>
            <span>{mr.author}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {mr.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-2 py-0.5 font-mono text-[9px] text-[var(--landing-accent)]"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-[var(--landing-border-subtle)] p-3">
            {mr.summary.map((para) => (
              <p key={para} className="text-[11px] leading-relaxed text-[var(--landing-muted)]">
                {para}
              </p>
            ))}
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-[var(--landing-border-subtle)]">
          <div className="flex items-center gap-2 border-b border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] px-3 py-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--landing-subtle)]">
              Files changed
            </span>
            <span className="ml-auto font-mono text-[10px] text-[var(--landing-dim)]">
              {files.length} files
            </span>
          </div>
          <ul>
            {files.map((file) => {
              const parts = file.path.split('/');
              const base = parts.pop();
              return (
                <li
                  key={file.path}
                  className="flex items-center gap-2 border-b border-[var(--landing-border-subtle)] px-3 py-1.5 last:border-b-0"
                >
                  <span className="w-3 shrink-0 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                    A
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-[var(--landing-dim)]">
                    {parts.join('/')}/
                    <span className="text-[var(--landing-ink)]">{base}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                    +{file.added}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="overflow-hidden rounded-lg border border-[var(--landing-border-subtle)]">
          <div className="flex items-center gap-2 border-b border-[var(--landing-border-subtle)] bg-[var(--landing-surface)] px-3 py-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--landing-subtle)]">
              Pipeline
            </span>
            <span className="ml-auto font-mono text-[10px] text-[var(--landing-dim)]">
              {passedCount}/{jobs.length} jobs passed
            </span>
          </div>

          {jobState.map(({ job, visible, status }) => (
            <div
              key={job.id}
              className="border-b border-[var(--landing-border-subtle)] last:border-b-0"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <StatusDot status={status} />
                <span className="font-mono text-[11px] font-medium text-[var(--landing-ink)]">
                  {job.name}
                </span>
                <span className="truncate font-mono text-[9px] text-[var(--landing-dim)]">
                  {job.trigger}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[9px] text-[var(--landing-dim)]">
                  {status === 'passed' ? job.duration : status === 'running' ? 'running…' : 'queued'}
                </span>
              </div>
              {visible > 0 && (
                <div className="space-y-0.5 bg-[var(--landing-surface-deep)] px-3 py-2">
                  <p className="font-mono text-[9px] text-[var(--landing-dim)]">{job.meta}</p>
                  {job.lines.slice(0, visible).map((line, i) => (
                    <LogLine key={`${job.id}-${i}`} line={line} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-2.5 rounded-lg border border-[var(--landing-border-subtle)] p-3">
          <p
            className={`flex items-center gap-2 text-[11px] font-medium ${
              allPassed
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-[var(--landing-muted)]'
            }`}
          >
            {allPassed ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            ) : (
              <CircleDashed className="size-3.5" aria-hidden />
            )}
            {allPassed ? 'All checks have passed' : 'Waiting for checks to finish…'}
          </p>

          <p className="flex items-center gap-2 text-[11px] text-[var(--landing-muted)]">
            <UserCheck className="size-3.5 shrink-0 text-[var(--landing-subtle)]" aria-hidden />
            {mr.approval}
          </p>

          {merged ? (
            <p className="flex items-center gap-2 font-mono text-[11px] text-violet-700 dark:text-violet-300">
              <GitMerge className="size-3.5 shrink-0" aria-hidden />
              Merged into {mr.target}
            </p>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={!allPassed}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--landing-accent)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--brand-accent-foreground)] transition hover:bg-[var(--landing-accent-lift)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--landing-accent)]"
            >
              <GitMerge className="size-3.5" aria-hidden />
              Merge
            </button>
          )}

          <p className="text-[10px] leading-relaxed text-[var(--landing-dim)]">{mr.promotion}</p>
        </section>
      </div>
    </div>
  );
}
