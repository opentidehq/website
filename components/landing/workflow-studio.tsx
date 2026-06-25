'use client';

import { useEffect, useState } from 'react';
import { Bot, FileCode2, Terminal } from 'lucide-react';

const phases = [
  {
    id: 'edit',
    label: 'Edit',
    ideLine: 'metadata:\n  schema: rule::1.0\n  version: 1.0.0',
    cli: '$ opentide validate objects/rules/credential-dump.yaml',
    cliOut: '✓ schema · ✓ references · 0 errors',
  },
  {
    id: 'validate',
    label: 'Validate',
    ideLine: '# strict mode — platform honesty',
    cli: '$ opentide validate --strict',
    cliOut: '✓ 142 rules · sentinel query OK · dry-run ready',
  },
  {
    id: 'generate',
    label: 'Generate',
    ideLine: '.opentide/schemas/rule.1.0.schema.json',
    cli: '$ opentide generate',
    cliOut: '→ schemas · templates · IDE router',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    ideLine: 'platforms.sentinel.enabled: true',
    cli: '$ opentide deploy --platform sentinel --dry-run',
    cliOut: '✓ would deploy 38 rules · 0 blocked',
  },
] as const;

export function WorkflowStudio() {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState('');

  const current = phases[phase];

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTyped(current.cli);
      return;
    }
    setTyped('');
    let i = 0;
    const cmd = current.cli;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(cmd.slice(0, i));
      if (i >= cmd.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [phase, current.cli]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="landing-hero-shell overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
          <FileCode2 className="size-4 text-[var(--eu-yellow)]" aria-hidden />
          <span>IDE + CLI + agents</span>
        </div>
        <div className="flex gap-1">
          {phases.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhase(i)}
              className={`rounded-md px-2.5 py-1 font-mono text-[10px] transition ${
                phase === i
                  ? 'bg-[var(--eu-yellow)]/15 text-[var(--eu-yellow)]'
                  : 'text-[var(--landing-subtle)] hover:bg-white/[0.04]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-white/[0.06] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
            <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
            <span className="ml-1 font-mono text-[10px] text-zinc-500">objects/rules/credential-dump.yaml</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
            <span className="select-none text-zinc-600">1</span>
            <span className="text-zinc-300">name: &quot;Suspicious LSASS access&quot;</span>
            <span className="select-none text-zinc-600">2</span>
            <span className="text-[var(--eu-yellow)]">{current.ideLine.split('\n')[0]}</span>
            {current.ideLine.includes('\n') && (
              <>
                <span className="select-none text-zinc-600">3</span>
                <span className="text-zinc-400">{current.ideLine.split('\n')[1]}</span>
              </>
            )}
            <span className="select-none text-zinc-600">4</span>
            <span className="text-zinc-500"># MCP: validate_rule(uuid)</span>
          </div>
          <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2 text-[10px] text-zinc-500">
            <Bot className="size-3 text-[var(--eu-blue)]" aria-hidden />
            Agent skill · opentide-mcp connected
          </div>
        </div>

        <div className="bg-black">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
            <Terminal className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
            <span className="font-mono text-[10px] text-zinc-500">zsh · detection-repo</span>
          </div>
          <div className="min-h-[140px] p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
            <p className="text-zinc-500">
              <span className="text-[var(--eu-yellow)]">❯</span> {typed}
              <span className="animate-pulse text-[var(--eu-yellow)]">▌</span>
            </p>
            <p className="mt-3 text-emerald-500/90">{current.cliOut}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
