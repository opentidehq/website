import { VOCABULARIES } from '@/lib/landing/vocabularies';

/**
 * What an agent needs from detection tooling, and what opentide gives it. One list for the
 * landing strip and the blog's then-and-now table, so the two cannot drift apart.
 */
export const AGENT_NEEDS = [
  {
    need: 'A contract it can read',
    before: 'JSON Schemas generated in-tree; no separate spec',
    now: `Normative specs, generated JSON Schema, ${VOCABULARIES.length} versioned vocabularies`,
    artefact: 'objective::1.0',
  },
  {
    need: 'Feedback it can act on',
    before: 'Scripts and logs to interpret',
    now: '--json results, exit codes, file:line findings',
    artefact: 'exit 0 · 1 · 2',
  },
  {
    need: 'Tools it can call',
    before: 'None: shell out to scripts',
    now: 'MCP: search, chaining, coverage, validation, dry-run deploy',
    artefact: 'opentide mcp start',
  },
  {
    need: 'Knowledge it can load',
    before: 'Skills and an AGENTS.md in a separate repo, copied in by hand',
    now: 'The same skills and an agent entry point (AGENTS.md or CLAUDE.md), installed by opentide setup skills',
    artefact: 'opentide setup skills',
  },
  {
    need: 'Gates it cannot skip',
    before: 'CI glue rewritten per instance',
    now: 'setup ci: strict validate and lint, live query checks, staging first',
    artefact: 'opentide setup ci',
  },
] as const;
