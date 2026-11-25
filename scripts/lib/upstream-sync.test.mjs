import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CHECKS, GITLINK_TEST } from '../check-upstream.mjs';
import { describePins, heldBack, planCandidates, renderHeldBack } from './upstream-sync.mjs';

const OLD = { opentide: 'a'.repeat(40), specifications: 'b'.repeat(40) };
const NEXT = { opentide: 'c'.repeat(40), specifications: 'd'.repeat(40) };
const pins = ({ opentide, specifications }) => ({ opentide, specifications });
const pass = { ok: true, failed: null, steps: [], tail: '' };
const fail = (failed, tail = `${failed} output`) => ({ ok: false, failed, steps: [], tail });

test('both sources moved: both new, then each new alone', () => {
  const candidates = planCandidates({ old: OLD, next: NEXT });
  assert.deepEqual(candidates.map(pins), [
    NEXT,
    { opentide: NEXT.opentide, specifications: OLD.specifications },
    { opentide: OLD.opentide, specifications: NEXT.specifications },
  ]);
  assert.deepEqual(
    candidates.map((candidate) => candidate.label),
    ['new opentide, new specifications', 'new opentide only', 'new specifications only'],
  );
});

test('one source moved: only that candidate; the other stays at its last good commit', () => {
  const next = { ...OLD, specifications: NEXT.specifications };
  assert.deepEqual(planCandidates({ old: OLD, next }).map(pins), [next]);
});

test('the site’s own changes are tried last, on the last good trees', () => {
  const next = { ...OLD, opentide: NEXT.opentide };
  assert.deepEqual(planCandidates({ old: OLD, next, localChanges: true }).map(pins), [next, OLD]);
  assert.deepEqual(planCandidates({ old: OLD, next: OLD, localChanges: true }).map(pins), [OLD]);
  assert.deepEqual(planCandidates({ old: OLD, next: OLD }), []);
});

test('broken specifications: new opentide is taken, specifications held back with its own failure', () => {
  const [both, opentideOnly] = planCandidates({ old: OLD, next: NEXT });
  const attempts = [
    { candidate: both, report: fail('next build', 'MDX error in specs/x.mdx') },
    { candidate: opentideOnly, report: pass },
  ];
  const held = heldBack({ old: OLD, next: NEXT, accepted: pins(opentideOnly), attempts });
  assert.equal(held.length, 1);
  assert.equal(held[0].source, 'specifications');
  // Not tried alone (opentide alone passed first): the combined candidate's report says why.
  assert.equal(held[0].failed, 'next build');
  assert.match(held[0].tail, /MDX error/);
});

test('broken opentide: the report of the candidate that tried it alone wins', () => {
  const [both, opentideOnly, specsOnly] = planCandidates({ old: OLD, next: NEXT });
  const attempts = [
    { candidate: both, report: fail('types:check', 'both') },
    { candidate: opentideOnly, report: fail('sync:content', 'Refusing to publish MDX') },
    { candidate: specsOnly, report: pass },
  ];
  const held = heldBack({ old: OLD, next: NEXT, accepted: pins(specsOnly), attempts });
  assert.deepEqual(
    held.map(({ source, failed, tail }) => ({ source, failed, tail })),
    [{ source: 'opentide', failed: 'sync:content', tail: 'Refusing to publish MDX' }],
  );
});

test('nothing passes: both held back, and the site keeps both last good commits', () => {
  const attempts = planCandidates({ old: OLD, next: NEXT }).map((candidate) => ({ candidate, report: fail('test') }));
  const held = heldBack({ old: OLD, next: NEXT, accepted: null, attempts });
  assert.deepEqual(
    held.map((entry) => entry.source),
    ['opentide', 'specifications'],
  );
  const { annotations, summary } = renderHeldBack(held, { accepted: null, old: OLD });
  assert.equal(annotations.length, 2);
  assert.match(annotations[0], /^::error title=opentide held back::opentide@ccccccc fails `test`.*keeps opentide@aaaaaaa/);
  assert.match(summary, new RegExp(`published ${describePins(OLD).replaceAll('+', '\\+')}`));
});

test('nothing held back when every new tree is taken', () => {
  const attempts = [{ candidate: { ...NEXT, label: 'x' }, report: pass }];
  assert.deepEqual(heldBack({ old: OLD, next: NEXT, accepted: NEXT, attempts }), []);
});

test('a log cannot close the summary’s code fence', () => {
  const held = [{ source: 'opentide', old: OLD.opentide, next: NEXT.opentide, failed: 'test', tail: '```\n# injected', candidate: null }];
  const { summary } = renderHeldBack(held, { accepted: null, old: OLD });
  assert.equal(summary.includes('```\n# injected'), false);
});

test('check:upstream runs every check the sync guards against, in order', () => {
  assert.deepEqual(
    CHECKS.map((check) => check.name),
    ['sync:content', 'test', 'types:check', 'next build', 'check:docs', 'verify:docs'],
  );
  // A candidate is not committed yet: freshness is checked against the trees on disk.
  assert.deepEqual(CHECKS.find((check) => check.name === 'check:docs')?.command, ['pnpm', 'check:docs', '--worktree']);
  assert.match(CHECKS.find((check) => check.name === 'test')?.env?.NODE_OPTIONS ?? '', new RegExp(GITLINK_TEST));
  const suite = readFileSync(new URL('./docs-sync.test.mjs', import.meta.url), 'utf8');
  assert.equal(suite.includes(`test('${GITLINK_TEST}`), true, 'the skipped test still exists under that name');
});

test('the sync job decides through check:upstream, and AGENTS.md documents it', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/sync-docs.yml', import.meta.url), 'utf8');
  assert.match(workflow, /node scripts\/sync-upstream\.mjs/);
  assert.equal(/pnpm (lint|build|types:check|verify:docs)\b/.test(workflow), false, 'no second list of checks');
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['check:upstream'], 'node scripts/check-upstream.mjs');
  const agents = readFileSync(new URL('../../AGENTS.md', import.meta.url), 'utf8');
  assert.match(agents, /pnpm check:upstream/);
});
