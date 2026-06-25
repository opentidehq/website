'use client';

import { useMemo, useState } from 'react';

type Token = { text: string; className: string; field?: string };

const FIELD_DOCS: Record<string, string> = {
  name: 'Human-readable title for the object instance.',
  'metadata.schema': 'Structural revision — selects Pydantic model and JSON Schema (e.g. rule::1.0).',
  'metadata.version': 'Business semver for this instance, independent of schema revision.',
  'metadata.uuid': 'Stable identifier used for chaining and registry lookup.',
  'metadata.tlp': 'Traffic Light Protocol classification (clear, green, amber, red).',
  schema: 'Structural revision identifier (threat::1.0, objective::1.0, rule::1.0).',
  version: 'Business version of the object instance.',
  uuid: 'Unique identifier — referenced by chains_to in downstream objects.',
  tlp: 'TLP marking governing sharing boundaries.',
  chains_to: 'Cross-object references forming the detection graph.',
  threat: 'UUID of parent threat vector this objective or rule traces to.',
  objective: 'UUID of detection objective this rule satisfies.',
  techniques: 'MITRE ATT&CK technique IDs covered by this threat.',
  assets: 'Asset classes in scope (endpoints, gateways, identity, etc.).',
  signals: 'Observable behaviours that indicate the objective is met.',
  platforms: 'Per-SIEM deploy configuration — query, schedule, enabled flag.',
  sentinel: 'Microsoft Sentinel / Defender XDR KQL configuration block.',
  defender: 'Microsoft Defender for Endpoint advanced hunting block.',
  query: 'Platform-native query text — validated only where honestly supported.',
  enabled: 'Whether this platform config is active on deploy.',
  source: 'Provenance of intel feed (CISA, vendor, internal).',
  type: 'Intel category: cve_advisory, threat_actor, sector_brief, etc.',
  cves: 'CVE identifiers linked to this intelligence item.',
  sectors: 'Industry verticals affected — informs objective prioritisation.',
  severity: 'Intel severity rating driving threat urgency.',
  feeds_threat: 'Threat object UUIDs this intel item informs.',
  ttps: 'Tactics and techniques attributed to this actor cluster.',
  motivation: 'Actor motivation (financial, espionage, hacktivism).',
  narrative: 'Free-text threat narrative for analysts and documentation output.',
};

function tokenizeYaml(yaml: string): Token[][] {
  return yaml.split('\n').map((line) => {
    if (line.trim().startsWith('#') || line.trim() === '') {
      return [{ text: line, className: 'text-zinc-600' }];
    }

    const tokens: Token[] = [];
    const indent = line.match(/^(\s*)/)?.[1] ?? '';
    if (indent) tokens.push({ text: indent, className: '' });

    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      const inner = trimmed.slice(2);
      if (inner.includes(':')) {
        const ci = inner.indexOf(':');
        const k = inner.slice(0, ci);
        const v = inner.slice(ci + 1);
        tokens.push({ text: '- ', className: 'text-zinc-600' });
        tokens.push({ text: `${k}:`, className: 'text-[var(--eu-yellow)]', field: k });
        if (v) tokens.push({ text: v, className: 'text-emerald-400/85' });
      } else {
        tokens.push({ text: `- ${inner}`, className: 'text-amber-200/90' });
      }
      return tokens;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx >= 0) {
      const keyPart = line.slice(indent.length, colonIdx + 1);
      const valPart = line.slice(colonIdx + 1);
      const keyPath = keyPart.replace(':', '').trim();

      tokens.push({ text: keyPart, className: 'text-[var(--eu-yellow)]', field: keyPath });
      if (valPart) {
        const v = valPart.trim();
        let valClass = 'text-zinc-300';
        if (v.startsWith('"') || v.startsWith("'")) valClass = 'text-amber-200/90';
        else if (v === 'true' || v === 'false') valClass = 'text-emerald-400/90';
        else if (/^\d/.test(v) || v.includes('::')) valClass = 'text-sky-300/80';
        else if (v.startsWith('[')) valClass = 'text-zinc-400';
        tokens.push({ text: valPart, className: valClass });
      }
      return tokens;
    }

    return [{ text: line, className: 'text-zinc-300' }];
  });
}

export function YamlPreview({
  yaml,
  path,
  className,
}: {
  yaml: string;
  path: string;
  className?: string;
}) {
  const lines = useMemo(() => tokenizeYaml(yaml), [yaml]);
  const [hint, setHint] = useState<string | null>(null);

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-black ${className ?? ''}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-[10px] text-zinc-500">{path}</span>
        <span className="font-mono text-[9px] text-zinc-600">hover keys for field docs</span>
      </div>
      <pre className="flex-1 overflow-auto p-4 font-mono text-[10px] leading-[1.7] sm:text-[11px]">
        {lines.map((lineTokens, li) => (
          <div key={li}>
            {lineTokens.map((tok, ti) => {
              if (!tok.field) {
                return (
                  <span key={ti} className={tok.className}>
                    {tok.text}
                  </span>
                );
              }
              const doc = FIELD_DOCS[tok.field];
              return (
                <span
                  key={ti}
                  className={`${tok.className} cursor-help border-b border-dotted border-[var(--eu-yellow)]/30`}
                  onMouseEnter={() => doc && setHint(doc)}
                  onMouseLeave={() => setHint(null)}
                  tabIndex={0}
                  role="button"
                >
                  {tok.text}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
      <div className="min-h-[2.5rem] border-t border-white/[0.06] px-3 py-2">
        <p className="font-mono text-[9px] leading-relaxed text-zinc-500">
          {hint ?? 'Hover a highlighted key to see field documentation.'}
        </p>
      </div>
    </div>
  );
}
