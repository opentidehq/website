/**
 * Pacing for the Workflow Studio demo, in milliseconds.
 *
 * Every timer in the studio reads from here so the whole scenario can be re-tuned
 * from one place. Raise `SPEED` to make the demo run faster, lower it to slow down.
 */
const SPEED = 1;

const beat = (base: number) => Math.round(base / SPEED);

export const TIMING = {
  /** Gap between agent-trace cards. */
  event: beat(680),
  /** Editor typewriter tick, and how many ticks a whole file takes to land. */
  typeTick: beat(30),
  typeTicks: 82,
  /** Pause after the agent finishes reasoning, before it starts writing the file. */
  beforeWrite: beat(520),
  /** How long the browser tab spends loading the advisory before the page paints. */
  pageLoad: beat(620),
  /** ⌘K prompt: per-character typing, then the hold before the engineer submits. */
  promptTick: beat(34),
  promptSubmit: beat(760),
  /** Terminal: per-character command typing, then the wait before output lands. */
  cliTick: beat(26),
  cliOutput: beat(560),
  /** CI pipeline: per-log-line streaming, then the pause before the merge lands. */
  ciLine: beat(150),
  ciMerge: beat(900),
  /** Settle beat at the end of a phase. */
  settle: beat(300),
  /** Hold on a finished step before advancing to the next one. */
  dwell: beat(1300),
  /** Longer hold when the viewer jumped here themselves. */
  dwellJumped: beat(3400),
  /** Reduced-motion: no animation, just enough to tick the scenario forward. */
  dwellReduced: 400,
} as const;
