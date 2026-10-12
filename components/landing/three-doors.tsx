import type { ReactNode } from 'react';
import { CodePanel, tok } from '@/components/landing/code-panel';

const UUID = 'c8f282eb-…';

const DOORS: { name: string; audience: string; panel: string; code: ReactNode }[] = [
  {
    name: 'CLI',
    audience: 'humans and CI pipelines',
    panel: 'terminal',
    code: (
      <>
        {tok.dim('$ ')}opentide validate {tok.key('--uuid')} {UUID} {tok.key('--strict')}
        {'\n'}
        {tok.ok('OK')} Validation passed{'\n'}
        {tok.dim('# exit 0 success · 1 error · 2 usage')}
      </>
    ),
  },
  {
    name: 'SDK',
    audience: 'Python tools and tests',
    panel: 'python',
    code: (
      <>
        {tok.key('from')} opentide {tok.key('import')} OpenTide{'\n\n'}
        OpenTide.initialise(){'\n'}
        rule = OpenTide.Rules[{tok.str(`"${UUID}"`)}]{'\n'}
        objective = OpenTide.Objectives[rule.detection_model]{'\n'}
        print(rule.name, {tok.str('"→"')}, objective.name)
      </>
    ),
  },
  {
    name: 'MCP',
    audience: 'AI agents in the editor',
    panel: 'tool call',
    code: (
      <>
        validation_report(uuid={tok.str(`"${UUID}"`)}){'\n'}
        {tok.dim('→ ')}
        {'{ '}
        {tok.key('"ok"')}: true, {tok.key('"issues"')}: [], {tok.key('"warnings"')}: []{' }'}
        {'\n'}
        {tok.dim('# the same report CI gates on')}
      </>
    ),
  },
];

/** Three ways in, one engine underneath: the CLI, the Python SDK and the MCP server. */
export function ThreeDoors() {
  return (
    <div className="mt-12">
      <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-3">
        {DOORS.map((door) => (
          <li key={door.name} className="flex min-w-0 flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[var(--landing-ink)]">{door.name}</p>
              <p className="font-mono text-xs text-[var(--landing-subtle)]">{door.audience}</p>
            </div>
            <CodePanel caption={door.panel} className="mt-4 flex-1">
              {door.code}
            </CodePanel>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl bg-[var(--landing-accent)] px-6 py-4 text-[var(--brand-accent-foreground)]">
        <p className="font-semibold">
          opentide engine{' '}
          <span className="ml-2 font-mono text-xs font-normal opacity-80">
            objects · validate · generate · deploy · document · 7 platform adapters
          </span>
        </p>
        <p className="font-mono text-xs opacity-80">one package · pip install opentide</p>
      </div>
    </div>
  );
}
