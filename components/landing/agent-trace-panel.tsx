'use client';

import { Bot, ChevronRight, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

export type AgentEvent =
  | { kind: 'reasoning'; text: string }
  | { kind: 'mcp'; tool: string; input?: string; output: string }
  | { kind: 'cli'; command: string; output?: string };

function EventCard({ event }: { event: AgentEvent }) {
  if (event.kind === 'reasoning') {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[var(--landing-bg)]/60 px-3 py-2.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--eu-yellow)]">
          Reasoning
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--landing-muted)]">{event.text}</p>
      </div>
    );
  }

  if (event.kind === 'mcp') {
    return (
      <div className="rounded-lg border border-[var(--eu-yellow)]/20 bg-[var(--eu-yellow)]/[0.04] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--eu-yellow)]">
            opentide-mcp
          </span>
          <span className="rounded bg-[var(--eu-yellow)]/15 px-1.5 py-0.5 font-mono text-[8px] text-[var(--eu-yellow)]">
            tool
          </span>
        </div>
        <p className="mt-2 flex items-start gap-1 font-mono text-[10px] text-[var(--landing-ink)]">
          <ChevronRight className="mt-0.5 size-3 shrink-0 text-[var(--eu-yellow)]" aria-hidden />
          {event.tool}
        </p>
        {event.input && (
          <pre className="mt-1.5 overflow-x-auto rounded bg-black/50 px-2 py-1 font-mono text-[9px] text-zinc-400">
            {event.input}
          </pre>
        )}
        <p className="mt-1.5 font-mono text-[10px] text-emerald-400/90">→ {event.output}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Terminal className="size-3.5 text-zinc-400" aria-hidden />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
          opentide CLI
        </span>
      </div>
      <p className="mt-2 font-mono text-[10px] text-zinc-300">
        <span className="text-[var(--eu-yellow)]">$</span> {event.command}
      </p>
      {event.output && (
        <p className="mt-1.5 font-mono text-[10px] text-emerald-400/90">{event.output}</p>
      )}
    </div>
  );
}

export function AgentTracePanel({
  label,
  events,
  terminalCmd,
  terminalOut,
}: {
  label: string;
  events: AgentEvent[];
  terminalCmd: string;
  terminalOut: string[];
}) {
  const reduced = usePrefersReducedMotion();
  const [visibleEvents, setVisibleEvents] = useState(reduced ? events.length : 0);
  const [typedCmd, setTypedCmd] = useState(reduced ? terminalCmd : '');
  const [showOut, setShowOut] = useState(reduced);

  useEffect(() => {
    if (reduced) return;

    let ei = 0;
    const eventTimer = window.setInterval(() => {
      ei += 1;
      setVisibleEvents(ei);
      if (ei >= events.length) window.clearInterval(eventTimer);
    }, 650);

    let ci = 0;
    const typeTimer = window.setInterval(() => {
      ci += 1;
      setTypedCmd(terminalCmd.slice(0, ci));
      if (ci >= terminalCmd.length) window.clearInterval(typeTimer);
    }, 18);

    const outTimer = window.setTimeout(() => setShowOut(true), 1100);

    return () => {
      window.clearInterval(eventTimer);
      window.clearInterval(typeTimer);
      window.clearTimeout(outTimer);
    };
  }, [reduced, events, terminalCmd]);

  return (
    <>
      <div className="flex min-h-[300px] flex-col bg-black lg:min-h-0">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
          <Bot className="size-4 text-[var(--eu-yellow)]" aria-hidden />
          <span className="font-mono text-[11px] font-medium text-[var(--landing-ink)]">Agent trace</span>
          <span className="ml-auto rounded-full bg-[var(--eu-yellow)]/10 px-2 py-0.5 font-mono text-[9px] text-[var(--eu-yellow)]">
            {label}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-3">
          {events.slice(0, visibleEvents).map((event, i) => (
            <EventCard key={i} event={event} />
          ))}
        </div>
      </div>

      <div className="col-span-full border-t border-white/[0.06] bg-[var(--landing-bg)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
          <Terminal className="size-3 text-[var(--landing-subtle)]" aria-hidden />
          <span className="font-mono text-[10px] text-[var(--landing-muted)]">Terminal</span>
        </div>
        <div className="min-h-[88px] overflow-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed">
          <p>
            <span className="text-[var(--eu-yellow)]">❯</span>{' '}
            <span className="text-[var(--landing-subtle)]">$ </span>
            <span className="text-[var(--landing-ink)]">{typedCmd}</span>
            {!showOut && (
              <span className="ml-0.5 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)] align-middle" />
            )}
          </p>
          {showOut && (
            <div className="mt-1.5 space-y-0.5">
              {terminalOut.map((line) => (
                <p key={line} className="text-emerald-500/90">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
