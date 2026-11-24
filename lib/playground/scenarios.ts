/**
 * Guided edits on the demo rule. Each is a pair of texts: applying swaps `from` for `to` everywhere,
 * undoing swaps it back, so a scenario is a toggle and its state is read from the text itself.
 */
export type Scenario = {
  id: string;
  label: string;
  /** What the playground shows answering: opentide's checks, or the deploy. */
  shows: string;
  from: RegExp;
  to: string;
  /** The text `to` leaves, to undo it. */
  undo: RegExp;
  back: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'kql',
    label: 'Break the KQL',
    shows: 'kql_unknown_operator, live',
    from: /\| where FileName =~/g,
    to: '| wher FileName =~',
    undo: /\| wher FileName =~/g,
    back: '| where FileName =~',
  },
  {
    id: 'vocab',
    label: 'Misspell a severity',
    shows: 'a vocabulary check',
    from: /^severity: High$/gm,
    to: 'severity: Hihg',
    undo: /^severity: Hihg$/gm,
    back: 'severity: High',
  },
  {
    id: 'ref',
    label: 'Break the objective link',
    shows: 'a UUID that resolves to nothing',
    from: /^detection_model: 00000000-0000-4000-8002-000000000001$/gm,
    to: 'detection_model: 00000000-0000-4000-8002-0000000000ff',
    undo: /^detection_model: 00000000-0000-4000-8002-0000000000ff$/gm,
    back: 'detection_model: 00000000-0000-4000-8002-000000000001',
  },
  {
    id: 'prod',
    label: 'Promote to production',
    shows: 'the release tenant, without the staging modifier',
    from: /status: STAGING/g,
    to: 'status: PRODUCTION',
    undo: /status: PRODUCTION/g,
    back: 'status: STAGING',
  },
];

export type TextChange = { from: number; to: number; insert: string };

/** Whether the scenario is in effect in `text`. */
export const isApplied = (scenario: Scenario, text: string) => new RegExp(scenario.undo.source, scenario.undo.flags).test(text);

/** The changes that toggle the scenario on `text`: apply it, or undo it when it is in effect. */
export function toggleScenario(scenario: Scenario, text: string): TextChange[] {
  const [pattern, insert] = isApplied(scenario, text) ? [scenario.undo, scenario.back] : [scenario.from, scenario.to];
  return [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((m) => ({
    from: m.index,
    to: m.index + m[0].length,
    insert,
  }));
}
