'use client';

import { Fragment, useEffect, useRef, useState, type ReactElement } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const INSTALL_CMD = 'pip install opentide==0.1.0';
const TICK_MS = 42;

function TerminalAnimation() {
  const reduced = usePrefersReducedMotion();
  const exportCmd = 'export OPENTIDE_REPO_ROOT=./detection-repo';
  const setupCmd = 'opentide setup --yes --platform sentinel';
  const validateCmd = 'opentide validate --strict';
  const deployCmd = 'opentide deploy --platform sentinel --dry-run';

  const tExport = exportCmd.length;
  const tSetup = tExport + 3 + setupCmd.length;
  const tSetupOut = tSetup + 4;
  const tValidate = tSetupOut + 3 + validateCmd.length;
  const tValidateOut = tValidate + 6;
  const tDeploy = tValidateOut + 3 + deployCmd.length;
  const tDeployOut = tDeploy + 4;
  const tEnd = tDeployOut + 2;

  const [tick, setTick] = useState(reduced ? tEnd : 0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setTick((p) => (p >= tEnd ? 0 : p + 1));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [reduced, tEnd]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [tick]);

  const cursor = (on: boolean) =>
    on ? <span className="inline-block h-3.5 w-[7px] animate-pulse bg-[var(--landing-accent)] align-middle" /> : null;

  const typeCmd = (cmd: string, start: number, end: number) => {
    if (tick < start) return null;
    const len = Math.min(cmd.length, tick - start);
    return (
      <>
        {cmd.slice(0, len)}
        {len < cmd.length && cursor(true)}
      </>
    );
  };

  const lines: ReactElement[] = [];

  if (tick >= 1) {
    lines.push(
      <span key="export" className="text-zinc-300">
        <span className="text-zinc-600">$ </span>
        {typeCmd(exportCmd, 1, tExport)}
      </span>,
    );
  }

  if (tick >= tExport + 1) {
    lines.push(
      <span key="setup" className="text-zinc-300">
        <span className="text-zinc-600">$ </span>
        {typeCmd(setupCmd, tExport + 1, tSetup)}
      </span>,
    );
  }

  if (tick > tSetup) {
    lines.push(
      <Fragment key="setup-out">
        {tick > tSetup + 1 && <span className="text-zinc-500">Scaffolding detection-repo…</span>}
        {tick > tSetup + 2 && <span className="text-emerald-400/90">✓ objects/ · .opentide/ · docs/</span>}
        {tick > tSetup + 3 && <span className="text-emerald-400/90">✓ sentinel platform linked</span>}
      </Fragment>,
    );
  }

  if (tick >= tSetupOut) {
    lines.push(
      <span key="validate" className="text-zinc-300">
        <span className="text-zinc-600">$ </span>
        {typeCmd(validateCmd, tSetupOut, tValidate)}
      </span>,
    );
  }

  if (tick > tValidate) {
    lines.push(
      <Fragment key="validate-out">
        {tick > tValidate + 1 && <span className="text-zinc-500">◇ Validating 8 objects</span>}
        {tick > tValidate + 2 && <span className="text-emerald-400/90">│ ✓ uuid-format · id-uniqueness</span>}
        {tick > tValidate + 3 && <span className="text-emerald-400/90">│ ✓ cross-object references</span>}
        {tick > tValidate + 4 && <span className="text-emerald-400/90">│ ✓ sentinel KQL honesty</span>}
        {tick > tValidate + 5 && <span className="text-[var(--landing-accent)]/80">0 blocking · 0 warnings</span>}
      </Fragment>,
    );
  }

  if (tick >= tValidateOut) {
    lines.push(
      <span key="deploy" className="text-zinc-300">
        <span className="text-zinc-600">$ </span>
        {typeCmd(deployCmd, tValidateOut, tDeploy)}
      </span>,
    );
  }

  if (tick > tDeploy) {
    lines.push(
      <Fragment key="deploy-out">
        {tick > tDeploy + 1 && <span className="text-zinc-500">Plan: 1 rule · staging workspace</span>}
        {tick > tDeploy + 2 && (
          <span className="text-emerald-400/90">✓ LSASS memory access → Sentinel</span>
        )}
        {tick > tDeploy + 3 && <span className="text-[var(--landing-accent)]/80">Dry-run complete: 0 blocked</span>}
      </Fragment>,
    );
  }

  if (tick > tDeployOut) {
    lines.push(
      <LaunchToast key="toast" className="absolute bottom-4 right-4 z-10 animate-in fade-in slide-in-from-top-4 duration-500" />,
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => tick >= tEnd && setTick(0)}
    >
      <div
        ref={scrollRef}
        className="h-[260px] overflow-y-auto overflow-x-hidden p-3 text-[var(--landing-muted)] [scrollbar-width:thin]"
      >
        <pre className="font-mono text-[11px] leading-[1.85] sm:text-xs">
          <code className="grid gap-0.5">{lines}</code>
        </pre>
      </div>
    </div>
  );
}

function LaunchToast({ className }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--landing-border)] bg-black/90 shadow-lg backdrop-blur-sm ${className ?? ''}`}
    >
      <p className="border-b border-[var(--landing-border)] px-3 py-1.5 text-center font-mono text-[10px] text-zinc-500">
        detection-repo
      </p>
      <p className="px-3 py-2 text-xs text-zinc-300">Pipeline ready · 0 blocking</p>
    </div>
  );
}

function CopyInstallButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="shrink-0 rounded-lg border border-[var(--landing-border)] p-2 text-zinc-500 transition hover:border-[var(--landing-accent)]/30 hover:text-[var(--landing-accent)]"
      aria-label="Copy install command"
      onClick={() => {
        void navigator.clipboard.writeText(INSTALL_CMD);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function HeroTerminal() {
  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="rounded-2xl border border-[var(--landing-border)] bg-black p-2 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <h2 className="flex shrink-0 items-center justify-center rounded-xl border-2 border-[var(--landing-accent)]/45 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--landing-accent)] sm:text-xs">
            Try it out
          </h2>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--landing-border)] bg-white/[0.03] px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300 sm:text-xs">
              {INSTALL_CMD}
            </code>
            <CopyInstallButton />
          </div>
        </div>

        <div className="relative mt-2 overflow-hidden rounded-xl border border-[var(--landing-border)] bg-white/[0.02] shadow-md">
          <div className="flex items-center gap-2 border-b border-[var(--landing-border)] px-3 py-2 text-zinc-500">
            <Terminal className="size-4" aria-hidden />
            <span className="text-xs font-medium">Terminal</span>
            <span className="ms-auto size-2 rounded-full bg-red-400/90" aria-hidden />
          </div>
          <TerminalAnimation />
        </div>
      </div>
    </div>
  );
}
