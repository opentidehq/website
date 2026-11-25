import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  describeFailure,
  fence,
  LABEL,
  reportFailure,
  reportSuccess,
  summariseError,
} from './sync-failure-alert.mjs';

const repo = 'o/r';

/** A tiny in-memory GitHub: labels, issues and comments. */
function fakeGithub({ labels = [], issues = [], comments = {} } = {}) {
  const state = { labels: [...labels], issues: issues.map((i) => ({ ...i })), comments: { ...comments }, calls: [] };
  const notFound = () => Object.assign(new Error('404'), { status: 404 });
  async function api(method, path, body) {
    state.calls.push(`${method} ${path.split('?')[0]}`);
    let m;
    if (method === 'GET' && (m = path.match(/\/labels\/(.+)$/))) {
      if (!state.labels.includes(m[1])) throw notFound();
      return { name: m[1] };
    }
    if (method === 'POST' && path.endsWith('/labels')) {
      state.labels.push(body.name);
      return body;
    }
    if (method === 'GET' && path.includes('/issues?')) {
      return state.issues.filter((i) => i.state === 'open' && i.labels.includes(LABEL));
    }
    if (method === 'POST' && path.endsWith('/issues')) {
      const issue = { number: state.issues.length + 1, state: 'open', ...body };
      state.issues.push(issue);
      return issue;
    }
    if ((m = path.match(/\/issues\/(\d+)\/comments/))) {
      const list = (state.comments[m[1]] ??= []);
      if (method === 'GET') return list;
      list.push({ body: body.body });
      return {};
    }
    if (method === 'PATCH' && (m = path.match(/\/issues\/(\d+)$/))) {
      Object.assign(state.issues.find((i) => i.number === Number(m[1])), body);
      return {};
    }
    throw new Error(`unexpected ${method} ${path}`);
  }
  return { api, state };
}

const base = (n) => ({ repo, runId: String(n), runUrl: `https://x/runs/${n}`, stepName: 'Sync published docs', error: 'boom' });

test('first failure creates the label and one labelled issue with run link and error', async () => {
  const gh = fakeGithub();
  const r = await reportFailure({ api: gh.api, ...base(1) });
  assert.equal(r.action, 'created');
  assert.deepEqual(gh.state.labels, [LABEL]);
  assert.equal(gh.state.issues.length, 1);
  const [issue] = gh.state.issues;
  assert.deepEqual(issue.labels, [LABEL]);
  assert.match(issue.body, /https:\/\/x\/runs\/1/);
  assert.match(issue.body, /boom/);
  assert.match(issue.body, /Sync published docs/);
});

test('does not recreate an existing label', async () => {
  const gh = fakeGithub({ labels: [LABEL] });
  await reportFailure({ api: gh.api, ...base(1) });
  assert.ok(!gh.state.calls.includes('POST /repos/o/r/labels'));
});

test('later failures comment on the open issue, once per run, never a second issue', async () => {
  const gh = fakeGithub();
  await reportFailure({ api: gh.api, ...base(1) });
  assert.equal((await reportFailure({ api: gh.api, ...base(2) })).action, 'commented');
  assert.equal((await reportFailure({ api: gh.api, ...base(2) })).action, 'skipped'); // retried alert step
  assert.equal((await reportFailure({ api: gh.api, ...base(3) })).action, 'commented');
  assert.equal(gh.state.issues.length, 1);
  assert.equal(gh.state.comments[1].length, 2);
});

test('a re-run of the run that opened the issue does not comment again', async () => {
  const gh = fakeGithub();
  await reportFailure({ api: gh.api, ...base(1) });
  assert.equal((await reportFailure({ api: gh.api, ...base(1) })).action, 'skipped');
});

test('pull requests carrying the label are not treated as the alert issue', async () => {
  const gh = fakeGithub({ labels: [LABEL], issues: [{ number: 9, state: 'open', labels: [LABEL], pull_request: {} }] });
  assert.equal((await reportFailure({ api: gh.api, ...base(1) })).action, 'created');
});

test('success closes the open issue with a comment linking the green run', async () => {
  const gh = fakeGithub();
  await reportFailure({ api: gh.api, ...base(1) });
  const r = await reportSuccess({ api: gh.api, repo, runUrl: 'https://x/runs/5' });
  assert.deepEqual(r, { action: 'closed', number: 1 });
  assert.equal(gh.state.issues[0].state, 'closed');
  assert.match(gh.state.comments[1].at(-1).body, /https:\/\/x\/runs\/5/);
  // A later failure opens a fresh issue.
  assert.equal((await reportFailure({ api: gh.api, ...base(6) })).action, 'created');
});

test('success with no open issue does nothing', async () => {
  const gh = fakeGithub({ labels: [LABEL] });
  assert.deepEqual(await reportSuccess({ api: gh.api, repo, runUrl: 'u' }), { action: 'none' });
  assert.deepEqual(gh.state.calls, ['GET /repos/o/r/issues']);
});

test('summariseError prefers ##[error] lines, strips timestamps/ANSI, and truncates', () => {
  const log = [
    '2026-11-24T10:00:00.1234567Z ##[group]Run something',
    '2026-11-24T10:00:01.0000000Z \u001b[36;1mnoise\u001b[0m',
    '2026-11-24T10:00:02.0000000Z ##[error]Missing secret DOCS_SUBMODULES_SSH_KEYS',
    '2026-11-24T10:00:02.0000001Z ##[error]Process completed with exit code 1.',
  ].join('\n');
  assert.equal(summariseError(log), 'Missing secret DOCS_SUBMODULES_SSH_KEYS\nProcess completed with exit code 1.');
  assert.match(summariseError('a\nb\nc'), /^a\nb\nc$/);
  assert.ok(summariseError(`##[error]${'x'.repeat(10000)}`).length < 3100);
});

test('fence cannot be closed by backticks inside the log', () => {
  const out = fence('before ``` after');
  assert.ok(out.startsWith('````\n') && out.endsWith('\n````'));
});

test('describeFailure names the failed step and pulls the error from the log', async () => {
  const api = async (method, path) => {
    if (path.includes('/jobs?')) {
      return { jobs: [{ id: 7, name: 'sync', steps: [{ name: 'Set up job', conclusion: 'success' }, { name: 'Sync published docs', conclusion: 'failure' }] }] };
    }
    assert.match(path, /\/actions\/jobs\/7\/logs$/);
    return '##[error]nope';
  };
  assert.deepEqual(await describeFailure({ api, repo, runId: '1', jobName: 'sync' }), { stepName: 'Sync published docs', error: 'nope' });
});

test('describeFailure survives unavailable logs', async () => {
  const api = async (method, path) => {
    if (path.includes('/jobs?')) return { jobs: [{ id: 7, name: 'sync', steps: [{ name: 'X', conclusion: 'failure' }] }] };
    throw Object.assign(new Error('404'), { status: 404 });
  };
  assert.deepEqual(await describeFailure({ api, repo, runId: '1', jobName: 'sync' }), { stepName: 'X', error: '' });
});
