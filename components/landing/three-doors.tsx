import type { ReactNode } from 'react';

const UUID = 'c8f282eb-…';

const k = (text: string) => <span className="text-[#7ec8e3]">{text}</span>;
const dim = (text: string) => <span className="text-[#8fa8d4]">{text}</span>;
const str = (text: string) => <span className="text-[#ffe566]">{text}</span>;

const DOORS: { name: string; audience: string; panel: string; code: ReactNode }[] = [
  {
    name: 'CLI',
    audience: 'humans and CI pipelines',
    panel: 'terminal',
    code: (
      <>
        {dim('$ ')}opentide validate {k('--uuid')} {UUID} {k('--strict')}
        {'\n'}
        <span className="text-emerald-300">OK</span> Validation passed{'\n'}
        {dim('# exit 0 success · 1 error · 2 usage')}
      </>
    ),
  },
  {
    name: 'SDK',
    audience: 'Python tools and tests',
    panel: 'python',
    code: (
      <>
        {k('from')} opentide {k('import')} OpenTide{'\n\n'}
        OpenTide.initialise(){'\n'}
        rule = OpenTide.Rules[{str(`"${UUID}"`)}]{'\n'}
        objective = OpenTide.Objectives[rule.detection_model]{'\n'}
        print(rule.name, {str('"→"')}, objective.name)
      </>
    ),
  },
  {
    name: 'MCP',
    audience: 'AI agents in the editor',
    panel: 'tool call',
    code: (
      <>
        validation_report(uuid={str(`"${UUID}"`)}){'\n'}
        {dim('→ ')}
        {'{ '}
        {k('"ok"')}: true, {k('"issues"')}: [], {k('"warnings"')}: []{' }'}
        {'\n'}
        {dim('# the same report CI gates on')}
      </>
    ),
  },
];

/** Three ways in, one engine underneath: the CLI, the Python SDK and the MCP server. */
export function ThreeDoors() {
  return (
    <div className="mt-12">
      <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-3">
        {DOORS.map((door) => (
          <li key={door.name} className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[var(--landing-ink)]">{door.name}</p>
              <p className="font-mono text-xs text-[var(--landing-subtle)]">{door.audience}</p>
            </div>
            <figure className="m-0 mt-4 flex flex-1 flex-col overflow-hidden rounded-2xl bg-[#000b1f] text-[#e8f0ff] ring-1 ring-[var(--landing-border)]">
              <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-[11px] text-[#8fa8d4]">
                {door.panel}
              </figcaption>
              <pre className="landing-code-scroll m-0 flex-1 overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
                <code>{door.code}</code>
              </pre>
            </figure>
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
