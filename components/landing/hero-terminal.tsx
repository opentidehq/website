'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

type OutLine = { text: string; tone?: 'ok' | 'dim' | 'info' | 'warn' };

type Step =
  | { kind: 'type'; command: string }
  | { kind: 'pause'; ms: number }
  | { kind: 'output'; lines: OutLine[]; staggerMs?: number }
  | { kind: 'progress'; label: string; durationMs: number };

const STEPS: Step[] = [
  { kind: 'type', command: 'export OPENTIDE_REPO_ROOT=./detection-repo' },
  { kind: 'pause', ms: 400 },
  { kind: 'type', command: 'opentide setup --yes --platform sentinel' },
  { kind: 'output', lines: [
    { text: 'Scaffolding detection-repo…', tone: 'dim' },
    { text: '✓ objects/ · .opentide/ · docs/', tone: 'ok' },
    { text: '✓ sentinel platform linked', tone: 'ok' },
  ], staggerMs: 280 },
  { kind: 'pause', ms: 500 },
  { kind: 'type', command: 'opentide validate --strict' },
  { kind: 'progress', label: 'Validating 8 objects', durationMs: 1400 },
  { kind: 'output', lines: [
    { text: '  schema conformance', tone: 'dim' },
    { text: '  ✓ uuid-format · id-uniqueness', tone: 'ok' },
    { text: '  ✓ cross-object references', tone: 'ok' },
    { text: '  ✓ sentinel KQL honesty', tone: 'ok' },
    { text: '0 blocking · 0 warnings', tone: 'info' },
  ], staggerMs: 220 },
  { kind: 'pause', ms: 450 },
  { kind: 'type', command: 'opentide generate' },
  { kind: 'output', lines: [
    { text: '→ rule.1.0.schema.json', tone: 'info' },
    { text: '→ objective.1.0.schema.json', tone: 'info' },
    { text: '→ rule.1.0.template.yaml', tone: 'info' },
  ], staggerMs: 200 },
  { kind: 'pause', ms: 500 },
  { kind: 'type', command: 'opentide deploy --platform sentinel --dry-run' },
  { kind: 'output', lines: [
    { text: 'Plan: 1 rule · staging workspace', tone: 'dim' },
    { text: '✓ LSASS memory access → Sentinel', tone: 'ok' },
    { text: 'Dry-run complete — 0 blocked', tone: 'info' },
  ], staggerMs: 300 },
  { kind: 'pause', ms: 3200 },
];

type RenderLine =
  | { kind: 'cmd'; text: string; partial?: boolean }
  | { kind: 'out'; line: OutLine; opacity: number }
  | { kind: 'progress'; label: string; value: number };

function highlightCommand(cmd: string) {
  const parts: { text: string; className: string }[] = [];
  const tokens = cmd.match(/("[^"]+"|\S+)/g) ?? [cmd];
  tokens.forEach((tok, i) => {
    const prefix = i > 0 ? ' ' : '';
    if (tok === 'export' || tok === 'opentide') {
      parts.push({
        text: prefix + tok,
        className: tok === 'opentide' ? 'text-cyan-300/90' : 'text-violet-300/80',
      });
    } else if (tok.startsWith('--')) {
      parts.push({ text: prefix + tok, className: 'text-[var(--eu-yellow)]/80' });
    } else if (tok.startsWith('"')) {
      parts.push({ text: prefix + tok, className: 'text-amber-200/80' });
    } else if (tok === '=') {
      parts.push({ text: prefix + tok, className: 'text-zinc-500' });
    } else {
      parts.push({ text: prefix + tok, className: 'text-zinc-300' });
    }
  });
  return parts;
}

const REDUCED_LINES: RenderLine[] = [
  { kind: 'cmd', text: 'opentide validate --strict' },
  { kind: 'out', line: { text: '0 blocking · 0 warnings', tone: 'info' }, opacity: 1 },
  { kind: 'cmd', text: 'opentide deploy --platform sentinel --dry-run' },
  { kind: 'out', line: { text: '✓ LSASS memory access → Sentinel', tone: 'ok' }, opacity: 1 },
];

function toneClass(tone?: OutLine['tone']) {
  switch (tone) {
    case 'ok':
      return 'text-emerald-400/95';
    case 'dim':
      return 'text-zinc-500';
    case 'info':
      return 'text-sky-300/85';
    case 'warn':
      return 'text-amber-300/90';
    default:
      return 'text-zinc-400';
  }
}

export function HeroTerminal() {
  const reduced = usePrefersReducedMotion();
  const [lines, setLines] = useState<RenderLine[]>([]);
  const displayLines = reduced ? REDUCED_LINES : lines;
  const [cursorOn, setCursorOn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);

  const scrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (reduced) return;

    const id = ++runId.current;
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const typeCommand = async (command: string) => {
      setLines((prev) => [...prev, { kind: 'cmd', text: '', partial: true }]);
      for (let i = 1; i <= command.length; i++) {
        if (cancelled || runId.current !== id) return;
        const slice = command.slice(0, i);
        setLines((prev) => {
          const next = [...prev];
          const last = next.length - 1;
          if (last >= 0 && next[last].kind === 'cmd') {
            next[last] = { kind: 'cmd', text: slice, partial: i < command.length };
          }
          return next;
        });
        const ch = command[i - 1];
        const delay = ch === ' ' ? 28 : 14 + Math.random() * 18;
        await sleep(delay);
      }
      setLines((prev) => {
        const next = [...prev];
        const last = next.length - 1;
        if (last >= 0 && next[last].kind === 'cmd') {
          next[last] = { kind: 'cmd', text: command, partial: false };
        }
        return next;
      });
    };

    const showOutput = async (outLines: OutLine[], staggerMs: number) => {
      for (const line of outLines) {
        if (cancelled || runId.current !== id) return;
        setLines((prev) => [...prev, { kind: 'out', line, opacity: 0 }]);
        await sleep(40);
        setLines((prev) => {
          const next = [...prev];
          const last = next.length - 1;
          if (last >= 0 && next[last].kind === 'out') {
            next[last] = { ...next[last], opacity: 1 };
          }
          return next;
        });
        await sleep(staggerMs);
      }
    };

    const showProgress = async (label: string, durationMs: number) => {
      setLines((prev) => [...prev, { kind: 'progress', label, value: 0 }]);
      const start = performance.now();
      while (performance.now() - start < durationMs) {
        if (cancelled || runId.current !== id) return;
        const p = Math.min(1, (performance.now() - start) / durationMs);
        setLines((prev) => {
          const next = [...prev];
          const idx = next.findIndex((l, i) => l.kind === 'progress' && i === next.length - 1);
          if (idx >= 0 && next[idx].kind === 'progress') {
            next[idx] = { ...next[idx], value: p };
          }
          return next;
        });
        await sleep(32);
      }
      setLines((prev) => prev.filter((l, i) => !(l.kind === 'progress' && i === prev.length - 1)));
    };

    const run = async () => {
      while (!cancelled && runId.current === id) {
        setLines([]);
        for (const step of STEPS) {
          if (cancelled || runId.current !== id) return;
          if (step.kind === 'type') await typeCommand(step.command);
          else if (step.kind === 'pause') await sleep(step.ms);
          else if (step.kind === 'output') await showOutput(step.lines, step.staggerMs ?? 250);
          else if (step.kind === 'progress') await showProgress(step.label, step.durationMs);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  useEffect(() => {
    scrollEnd();
  }, [displayLines, scrollEnd]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setCursorOn((v) => !v), 530);
    return () => window.clearInterval(id);
  }, [reduced]);

  const last = displayLines[displayLines.length - 1];
  const showCursor = !reduced && last?.kind === 'cmd' && last.partial;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--landing-subtle)]">
        Try it out
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808] shadow-[0_32px_100px_-40px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a0a0a] px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-1 font-mono text-[11px] text-zinc-500">detection-repo</span>
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-zinc-600">
            <span className="size-1.5 rounded-full bg-emerald-500/80" />
            zsh
          </span>
        </div>
        <div
          ref={scrollRef}
          className="h-[min(22rem,42vh)] overflow-y-auto overflow-x-hidden p-4 font-mono text-[11px] leading-[1.75] sm:text-xs"
        >
          {displayLines.map((line, i) => {
            if (line.kind === 'cmd') {
              return (
                <p key={i} className="mb-1 text-zinc-300">
                  <span className="text-[var(--eu-yellow)]">❯</span>{' '}
                  <span className="text-zinc-600">$ </span>
                  {highlightCommand(line.text).map((p, j) => (
                    <span key={j} className={p.className}>
                      {p.text}
                    </span>
                  ))}
                  {showCursor && i === displayLines.length - 1 && (
                    <span
                      className={`ml-0.5 inline-block h-[1.05em] w-[7px] align-middle bg-[var(--eu-yellow)] transition-opacity duration-100 ${cursorOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                </p>
              );
            }
            if (line.kind === 'progress') {
              return (
                <div key={i} className="mb-2 pl-4">
                  <p className="text-[10px] text-zinc-500">{line.label}</p>
                  <div className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[var(--eu-yellow)]/70 transition-[width] duration-75 ease-out"
                      style={{ width: `${line.value * 100}%` }}
                    />
                  </div>
                </div>
              );
            }
            return (
              <p
                key={i}
                className={`mb-0.5 pl-4 transition-all duration-300 ease-out ${toneClass(line.line.tone)}`}
                style={{
                  opacity: line.opacity,
                  transform: line.opacity < 1 ? 'translateY(4px)' : 'translateY(0)',
                }}
              >
                {line.line.text}
              </p>
            );
          })}
          {displayLines.length === 0 && !reduced && (
            <span
              className={`inline-block h-[1.05em] w-[7px] bg-[var(--eu-yellow)] ${cursorOn ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-2 font-mono text-[9px] text-zinc-600">
          <span>opentide 0.1 · strict mode</span>
          <span className="text-zinc-500">8 objects indexed</span>
        </div>
      </div>
    </div>
  );
}
