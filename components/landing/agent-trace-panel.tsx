'use client';

import { BookOpen, Bot, ChevronRight, Sparkles, Terminal, User, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CommandTokens, LogLine } from '@/components/landing/studio-log-line';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { TIMING } from '@/lib/landing/studio-timing';

export type AgentEvent =
  | { kind: 'prompt'; text: string }
  | { kind: 'reasoning'; text: string }
  | { kind: 'response'; text: string }
  | { kind: 'skill'; skill: string; action: string; detail?: string }
  | { kind: 'mcp'; tool: string; input?: string; output: string }
  | { kind: 'cli'; command: string; output?: string };

export function EventCard({ event, animate }: { event: AgentEvent; animate?: boolean }) {
  const enter = animate ? 'landing-fade-slide' : '';

  if (event.kind === 'prompt') {
    return (
      <div
        className={`rounded-lg bg-[color-mix(in_srgb,var(--landing-ink)_5%,transparent)] px-3 py-2.5 ${enter}`}
      >
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-[var(--landing-subtle)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-subtle)]">
            Engineer prompt
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--landing-ink)]">{event.text}</p>
      </div>
    );
  }

  if (event.kind === 'reasoning') {
    return (
      <div
        className={`rounded-lg bg-[color-mix(in_srgb,var(--landing-ink)_4%,transparent)] px-3 py-2.5 ${enter}`}
      >
        <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-accent)]">
          Reasoning
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--landing-muted)]">{event.text}</p>
      </div>
    );
  }

  if (event.kind === 'response') {
    return (
      <div
        className={`rounded-lg border border-[var(--landing-border-subtle)] px-3 py-2.5 ${enter}`}
      >
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-[var(--landing-accent)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-subtle)]">
            Agent
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--landing-ink)]">{event.text}</p>
      </div>
    );
  }

  if (event.kind === 'skill') {
    return (
      <div
        className={`rounded-lg bg-[color-mix(in_srgb,var(--landing-accent)_10%,transparent)] px-3 py-2.5 ${enter}`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="size-3.5 text-[var(--landing-accent)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-accent)]">
            skill invoked
          </span>
          <Sparkles className="size-3 text-[var(--landing-accent)] opacity-70" aria-hidden />
        </div>
        <p className="mt-2 font-mono text-[10px] font-medium text-[var(--landing-ink)]">
          .agents/skills/{event.skill}/
        </p>
        <p className="mt-1 text-[10px] text-[var(--landing-muted)]">{event.action}</p>
        {event.detail && (
          <p className="mt-1 font-mono text-[9px] text-[var(--landing-dim)]">{event.detail}</p>
        )}
      </div>
    );
  }

  if (event.kind === 'mcp') {
    return (
      <div
        className={`rounded-lg bg-[color-mix(in_srgb,var(--landing-accent)_8%,transparent)] px-3 py-2.5 ${enter}`}
      >
        <div className="flex items-center gap-2">
          <Wrench className="size-3.5 text-[var(--landing-accent)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-accent)]">
            opentide-mcp
          </span>
          <span className="rounded bg-[color-mix(in_srgb,var(--landing-accent)_16%,transparent)] px-1.5 py-0.5 font-mono text-[8px] text-[var(--landing-accent)]">
            tool
          </span>
        </div>
        <p className="mt-2 flex items-start gap-1 font-mono text-[10px] text-[var(--landing-ink)]">
          <ChevronRight className="mt-0.5 size-3 shrink-0 text-[var(--landing-accent)]" aria-hidden />
          {event.tool}
        </p>
        {event.input && (
          <pre className="mt-1.5 overflow-x-auto rounded bg-[color-mix(in_srgb,var(--landing-ink)_6%,transparent)] px-2 py-1 font-mono text-[9px] text-[var(--landing-subtle)]">
            {event.input}
          </pre>
        )}
        <p className="mt-1.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
          → {event.output}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-[color-mix(in_srgb,var(--landing-ink)_5%,transparent)] px-3 py-2.5 ${enter}`}
    >
      <div className="flex items-center gap-2">
        <Terminal className="size-3.5 text-[var(--landing-subtle)]" aria-hidden />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--landing-subtle)]">
          opentide CLI
        </span>
      </div>
      <p className="mt-2 break-all font-mono text-[10px]">
        <span className="text-[var(--landing-accent)]">$</span>{' '}
        <CommandTokens command={event.command} />
      </p>
      {event.output && (
        <p className="mt-1.5 font-mono text-[10px] text-sky-700 dark:text-sky-300">
          {event.output}
        </p>
      )}
    </div>
  );
}

/**
 * Agent timeline — controlled by parent for live sync with the editor.
 * Parent remounts via `key` on step change.
 */
export function AgentTracePanel({
  label,
  events,
  visibleCount,
  animate = true,
}: {
  label: string;
  events: AgentEvent[];
  /** How many leading events to show (0..events.length). */
  visibleCount: number;
  animate?: boolean;
}) {
  const traceRef = useRef<HTMLDivElement>(null);
  const shown = Math.max(0, Math.min(visibleCount, events.length));

  useEffect(() => {
    const el = traceRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--landing-surface)]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--landing-border-subtle)] px-3">
        <Bot className="size-4 text-[var(--landing-accent)]" aria-hidden />
        <span className="font-mono text-[11px] font-medium text-[var(--landing-ink)]">Agent trace</span>
        <span className="ml-auto truncate rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_14%,transparent)] px-2 py-0.5 font-mono text-[9px] text-[var(--landing-accent)]">
          {label}
        </span>
      </div>
      <div
        ref={traceRef}
        className="landing-code-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain p-3"
      >
        {shown === 0 && (
          <p className="font-mono text-[10px] text-[var(--landing-dim)]">Agent starting…</p>
        )}
        {events.slice(0, shown).map((event, i) => (
          <EventCard key={`${label}-${i}`} event={event} animate={animate && i === shown - 1} />
        ))}
      </div>
    </div>
  );
}

/** Parent should remount via `key` on step/cmd change. */
export function StudioTerminal({
  cmd,
  out,
  instant = false,
  armed = true,
  paused = false,
  onComplete,
  onProgress,
}: {
  cmd: string;
  out: string[];
  instant?: boolean;
  armed?: boolean;
  paused?: boolean;
  onComplete?: () => void;
  onProgress?: (ratio: number) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const showAll = reduced || instant;
  const [typedLen, setTypedLen] = useState(showAll ? cmd.length : 0);
  const [showOut, setShowOut] = useState(showAll);
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);
  const typedRef = useRef(typedLen);
  const showOutRef = useRef(showOut);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    typedRef.current = typedLen;
  }, [typedLen]);

  useEffect(() => {
    showOutRef.current = showOut;
  }, [showOut]);

  useEffect(() => {
    if (!armed) return;

    if (showAll) {
      const frame = window.requestAnimationFrame(() => {
        setTypedLen(cmd.length);
        setShowOut(true);
        onProgress?.(1);
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let ci = typedRef.current;
    let outTimer = 0;

    if (showOutRef.current) {
      onProgress?.(1);
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
      return;
    }

    if (ci >= cmd.length) {
      outTimer = window.setTimeout(() => {
        if (pausedRef.current) return;
        setShowOut(true);
        onProgress?.(1);
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
      }, TIMING.cliOutput);
      return () => window.clearTimeout(outTimer);
    }

    const typeTimer = window.setInterval(() => {
      if (pausedRef.current) return;
      ci += 1;
      setTypedLen(ci);
      onProgress?.(Math.min(0.85, (ci / cmd.length) * 0.85));
      if (ci >= cmd.length) {
        window.clearInterval(typeTimer);
        outTimer = window.setTimeout(() => {
          if (pausedRef.current) return;
          setShowOut(true);
          onProgress?.(1);
          if (!doneRef.current) {
            doneRef.current = true;
            onComplete?.();
          }
        }, TIMING.cliOutput);
      }
    }, TIMING.cliTick);

    return () => {
      window.clearInterval(typeTimer);
      window.clearTimeout(outTimer);
    };
  }, [showAll, armed, cmd, onComplete, onProgress, paused]);

  const typedCmd = armed ? (showAll ? cmd : cmd.slice(0, typedLen)) : '';
  const outVisible = armed && (showAll || showOut);

  return (
    <div className="flex h-[152px] shrink-0 flex-col border-t border-[var(--landing-border-subtle)] bg-[var(--landing-surface-deep)]">
      <div className="flex h-7 shrink-0 items-center gap-2 px-3">
        <Terminal className="size-3 text-[var(--landing-subtle)]" aria-hidden />
        <span className="font-mono text-[10px] text-[var(--landing-muted)]">Terminal</span>
      </div>
      <div className="landing-code-scroll min-h-0 flex-1 overflow-auto px-3 pb-2.5 font-mono text-[11px] leading-relaxed">
        {armed ? (
          <>
            <p className="break-all">
              <span className="text-[var(--landing-accent)]">$</span>{' '}
              <CommandTokens command={typedCmd} />
              {!outVisible && (
                <span className="ml-0.5 inline-block h-[0.95em] w-[7px] animate-pulse bg-[var(--landing-accent)] align-middle" />
              )}
            </p>
            <div className="mt-1.5 min-h-[2.5rem]">
              {outVisible && (
                <div className="landing-fade-slide">
                  {out.map((line, i) => (
                    <LogLine key={`${i}-${line}`} line={line} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="font-mono text-[10px] text-[var(--landing-dim)]">
            <span className="text-[var(--landing-accent)]">$</span>
          </p>
        )}
      </div>
    </div>
  );
}
