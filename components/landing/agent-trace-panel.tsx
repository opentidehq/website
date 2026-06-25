'use client';

import { BookOpen, Bot, ChevronRight, Sparkles, Terminal, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

export type AgentEvent =
  | { kind: 'prompt'; text: string }
  | { kind: 'reasoning'; text: string }
  | { kind: 'skill'; skill: string; action: string; detail?: string }
  | { kind: 'mcp'; tool: string; input?: string; output: string }
  | { kind: 'cli'; command: string; output?: string };

export function EventCard({ event }: { event: AgentEvent }) {
  if (event.kind === 'prompt') {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-zinc-400" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Engineer prompt
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--landing-ink)]">{event.text}</p>
      </div>
    );
  }

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

  if (event.kind === 'skill') {
    return (
      <div className="rounded-lg border border-[var(--eu-yellow)]/25 bg-[var(--eu-yellow)]/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--eu-yellow)]">
            skill invoked
          </span>
          <Sparkles className="size-3 text-[var(--eu-yellow)]/70" aria-hidden />
        </div>
        <p className="mt-2 font-mono text-[10px] font-medium text-[var(--landing-ink)]">
          .agents/skills/{event.skill}/
        </p>
        <p className="mt-1 text-[10px] text-[var(--landing-muted)]">{event.action}</p>
        {event.detail && (
          <p className="mt-1 font-mono text-[9px] text-zinc-500">{event.detail}</p>
        )}
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
