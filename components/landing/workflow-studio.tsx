'use client';

import { Bot, GitBranch, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AgentEvent, EventCard } from '@/components/landing/agent-trace-panel';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';

const WORKFLOW_EVENTS: AgentEvent[] = [
  {
    kind: 'prompt',
    text: 'Turn CISA AA24-073A into deployable Sentinel + Defender detections for our MSP fleet. Use strict validation and dry-run deploy.',
  },
  {
    kind: 'skill',
    skill: 'detection-engineering',
    action: 'Load TVM → DOM → MDR sequencing and PR scope discipline',
    detail: 'SKILL.md · OpenTideHQ/skills',
  },
  {
    kind: 'reasoning',
    text: 'ScreenConnect auth bypass (CVE-2024-1709) maps to gateway exploitation threat. Follow-on is credential access via LSASS — chain intel → threat → objective → rule.',
  },
  {
    kind: 'skill',
    skill: 'opentide-detection-rule',
    action: 'Apply rule::1.0 schema, detection_model UUID, platform configs',
    detail: 'normative MDR object contract',
  },
  {
    kind: 'mcp',
    tool: 'read_file',
    input: 'intel/advisories/cve-2024-1709.md',
    output: 'parsed CVE-2024-1709 · T1190 · T1003.001',
  },
  {
    kind: 'skill',
    skill: 'microsoft-sentinel',
    action: 'KQL patterns for process access to LSASS',
    detail: 'DeviceProcessEvents · honest query validation',
  },
  {
    kind: 'mcp',
    tool: 'write_file',
    input: 'objects/threats/gateway-exploitation.yaml',
    output: 'threat::1.0 · uuid …010 · schema valid',
  },
  {
    kind: 'cli',
    command: 'opentide validate --file objects/threats/gateway-exploitation.yaml',
    output: '✓ threat::1.0 · 0 errors',
  },
  {
    kind: 'skill',
    skill: 'entra-id',
    action: 'Cross-check identity telemetry for gateway foothold scenarios',
    detail: 'sign-in logs · non-interactive patterns',
  },
  {
    kind: 'mcp',
    tool: 'write_file',
    input: 'objects/objectives/credential-access.yaml',
    output: 'objective links threat …010 · 1 signal',
  },
  {
    kind: 'skill',
    skill: 'defender-for-endpoint',
    action: 'DeviceProcessEvents KQL for LSASS access objective',
    detail: 'pairs with Sentinel config on same rule',
  },
  {
    kind: 'mcp',
    tool: 'write_file',
    input: 'objects/rules/lsass-memory-access.yaml',
    output: 'rule links objective …001 · sentinel + defender',
  },
  {
    kind: 'reasoning',
    text: 'Run strict validation across registry — schema, UUID v4, cross-object refs, and honest Sentinel KQL check before merge.',
  },
  {
    kind: 'mcp',
    tool: 'validate',
    input: 'strict=true',
    output: '8 objects · 0 blocking · sentinel KQL passed',
  },
  {
    kind: 'cli',
    command: 'opentide validate --strict',
    output: '✓ uuid-format · cross-object · id-uniqueness',
  },
  {
    kind: 'skill',
    skill: 'github-actions',
    action: 'Align generated workflow with setup ci discovery',
    detail: 'validate query jobs per enabled platform TOML',
  },
  {
    kind: 'mcp',
    tool: 'generate',
    output: 'schemas · templates · docs · exports refreshed',
  },
  {
    kind: 'cli',
    command: 'opentide generate',
    output: '→ .opentide/schemas/ · docs/ · templates/',
  },
  {
    kind: 'reasoning',
    text: 'Human approved — dry-run deploy LSASS rule to Sentinel staging workspace. Promotion handled in deploy, not CI promote job.',
  },
  {
    kind: 'skill',
    skill: 'crowdstrike-falcon',
    action: 'Skip query validation — platform honesty flag (can_validate=false)',
    detail: 'deploy-only adapter · no fake syntax check',
  },
  {
    kind: 'mcp',
    tool: 'deploy',
    input: 'dry_run=true, platform=sentinel',
    output: '1 rule would deploy · staging plan ready',
  },
  {
    kind: 'cli',
    command: 'opentide deploy --platform sentinel --dry-run',
    output: '✓ LSASS memory access → Sentinel · 0 blocked',
  },
];

type CiLine = { style: 'dim' | 'cmd' | 'ok' | 'header' | 'gh'; text: string };

const CI_LINES: CiLine[] = [
  { style: 'header', text: 'GitHub Actions · .github/workflows/opentide.yml' },
  { style: 'gh', text: 'on: pull_request · push to main' },
  { style: 'dim', text: '────────────────────────────────────────' },
  { style: 'dim', text: 'Job: validate (ubuntu-latest · Python 3.14)' },
  { style: 'cmd', text: 'pip install opentide[sentinel,cli]' },
  { style: 'cmd', text: 'opentide generate' },
  { style: 'ok', text: '✓ schemas · templates · docs generated' },
  { style: 'cmd', text: 'opentide validate --strict' },
  { style: 'ok', text: '✓ 8 objects · 0 blocking · 0 warnings' },
  { style: 'cmd', text: 'opentide validate query --platform sentinel' },
  { style: 'ok', text: '✓ KQL syntax honest · sentinel workspace dry check' },
  { style: 'dim', text: '────────────────────────────────────────' },
  { style: 'dim', text: 'Job: deploy-staging (needs: validate)' },
  { style: 'cmd', text: 'opentide deploy --platform sentinel --dry-run' },
  { style: 'ok', text: '✓ 1 rule staged · LSASS memory access' },
  { style: 'gh', text: 'Workflow passed · 42s · detection-repo@feat/gateway-detections' },
];

const EVENT_MS = 420;
const CI_CHAR_MS = 14;
const PAUSE_BEFORE_CI_MS = 2200;
const LOOP_PAUSE_MS = 4000;

export function WorkflowStudio() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<'agent' | 'ci'>(reduced ? 'ci' : 'agent');
  const [visibleEvents, setVisibleEvents] = useState(reduced ? WORKFLOW_EVENTS.length : 0);
  const [ciIndex, setCiIndex] = useState(reduced ? CI_LINES.length : 0);
  const [ciChar, setCiChar] = useState(reduced ? CI_LINES[CI_LINES.length - 1]?.text.length ?? 0 : 0);
  const traceRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;

    if (phase === 'agent') {
      if (visibleEvents >= WORKFLOW_EVENTS.length) {
        const t = window.setTimeout(() => setPhase('ci'), PAUSE_BEFORE_CI_MS);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setVisibleEvents((n) => n + 1), EVENT_MS);
      return () => window.clearTimeout(t);
    }

    const line = CI_LINES[ciIndex];
    if (!line) {
      const t = window.setTimeout(() => {
        setPhase('agent');
        setVisibleEvents(0);
        setCiIndex(0);
        setCiChar(0);
      }, LOOP_PAUSE_MS);
      return () => window.clearTimeout(t);
    }

    if (ciChar < line.text.length) {
      const t = window.setTimeout(() => setCiChar((c) => c + 1), CI_CHAR_MS);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => {
      setCiIndex((i) => i + 1);
      setCiChar(0);
    }, line.style === 'cmd' ? 280 : 120);
    return () => window.clearTimeout(t);
  }, [reduced, phase, visibleEvents, ciIndex, ciChar]);

  useEffect(() => {
    const el = phase === 'agent' ? traceRef.current : termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase, visibleEvents, ciIndex, ciChar]);

  const ciLineStyle = (style: CiLine['style']) => {
    switch (style) {
      case 'header':
        return 'text-[var(--eu-yellow)] font-semibold';
      case 'gh':
        return 'text-zinc-300';
      case 'cmd':
        return 'text-zinc-300';
      case 'ok':
        return 'text-emerald-400/90';
      default:
        return 'text-zinc-600';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_12px_48px_-16px_rgba(0,0,0,0.85)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[var(--landing-bg)]/80 px-3 py-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
        <span className="ml-2 truncate font-mono text-[11px] text-[var(--landing-muted)]">
          detection-repo — agent workflow
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[9px] ${
            phase === 'ci'
              ? 'bg-[var(--eu-yellow)]/15 text-[var(--eu-yellow)]'
              : 'bg-white/5 text-[var(--landing-subtle)]'
          }`}
        >
          {phase === 'ci' ? 'GitHub Actions' : 'Agent + skills'}
        </span>
      </div>

      <div className="grid min-h-[480px] grid-rows-[1fr_200px]">
        <div
          className={`flex min-h-0 flex-col bg-black transition-opacity duration-500 ${
            phase === 'agent' ? 'opacity-100' : 'pointer-events-none opacity-25'
          }`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <Bot className="size-4 text-[var(--eu-yellow)]" aria-hidden />
            <span className="font-mono text-[11px] font-medium text-[var(--landing-ink)]">
              Agent trace
            </span>
            <span className="ml-auto font-mono text-[9px] text-[var(--landing-subtle)]">
              {visibleEvents}/{WORKFLOW_EVENTS.length} events
            </span>
          </div>
          <div ref={traceRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-width:thin]">
            {WORKFLOW_EVENTS.slice(0, visibleEvents).map((event, i) => (
              <EventCard key={`${event.kind}-${i}`} event={event} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.06] bg-[var(--landing-bg)]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
            {phase === 'ci' ? (
              <GitBranch className="size-3.5 text-[var(--eu-yellow)]" aria-hidden />
            ) : (
              <Terminal className="size-3 text-[var(--landing-subtle)]" aria-hidden />
            )}
            <span className="font-mono text-[10px] text-[var(--landing-muted)]">
              {phase === 'ci' ? 'GitHub Actions · opentide.yml' : 'Terminal — waiting for CI…'}
            </span>
          </div>
          <div
            ref={termRef}
            className="h-[calc(200px-2rem)] overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed [scrollbar-width:thin]"
          >
            {phase === 'ci' ? (
              <div className="space-y-0.5">
                {CI_LINES.slice(0, ciIndex).map((line, i) => (
                  <p key={i} className={ciLineStyle(line.style)}>
                    {line.style === 'cmd' && <span className="text-[var(--eu-yellow)]">$ </span>}
                    {line.text}
                  </p>
                ))}
                {CI_LINES[ciIndex] && (
                  <p className={ciLineStyle(CI_LINES[ciIndex].style)}>
                    {CI_LINES[ciIndex].style === 'cmd' && (
                      <span className="text-[var(--eu-yellow)]">$ </span>
                    )}
                    {CI_LINES[ciIndex].text.slice(0, ciChar)}
                    <span className="ml-0.5 inline-block h-[1em] w-[6px] animate-pulse bg-[var(--eu-yellow)] align-middle" />
                  </p>
                )}
              </div>
            ) : (
              <p className="text-zinc-600">
                Agent drafting complete — CI pipeline will run validate → query → deploy-staging…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
