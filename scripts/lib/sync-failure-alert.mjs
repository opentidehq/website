// Make "Sync docs and deploy" failures visible without any extra secrets.
//
// On failure: write the failing step and error to the job summary, then open one
// `sync-docs-failure` issue (or comment on the open one, once per run).
// On success: close the open issue with a comment linking the green run.
//
// All GitHub access goes through the injected `api(method, path, body)` function so the
// logic can be unit tested without a network.

export const LABEL = 'sync-docs-failure';
const LABEL_COLOR = 'b60205';
const LABEL_DESCRIPTION = 'The hourly docs sync workflow is failing';
const MAX_ERROR_CHARS = 3000;

const runMarker = (runId) => `<!-- sync-docs-failure run:${runId} -->`;

/** A code fence longer than any backtick run inside `text`, so logs cannot break out of it. */
export function fence(text) {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const ticks = '`'.repeat(longest + 1);
  return `${ticks}\n${text}\n${ticks}`;
}

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const TIMESTAMP = /^\d{4}-\d\d-\d\dT[\d:.]+Z /;

/** Job log lines with timestamps and ANSI colours removed. */
export function cleanLog(log) {
  return log
    .replace(ANSI, '')
    .split(/\r?\n/)
    .map((l) => l.replace(TIMESTAMP, ''))
    .filter((l) => l.trim() !== '');
}

/**
 * The most useful error text from a failed job's log: its `##[error]` lines (this includes
 * `::error::` messages and "Process completed with exit code N"), else the last lines.
 * The job stops at its first failing step, so these come from that step.
 */
export function summariseError(log) {
  const lines = cleanLog(log);
  const errors = lines.filter((l) => l.startsWith('##[error]')).map((l) => l.slice('##[error]'.length));
  const text = (errors.length > 0 ? errors : lines.slice(-20)).join('\n').trim();
  return text.length <= MAX_ERROR_CHARS ? text : `…${text.slice(text.length - MAX_ERROR_CHARS)}`;
}

export function failedStep(job) {
  return (job?.steps ?? []).find((s) => s.conclusion === 'failure') ?? null;
}

export function renderReport({ runUrl, stepName, error }) {
  return [
    `**Failing step:** ${stepName ? `\`${stepName}\`` : 'unknown (see the run)'}`,
    `**Run:** ${runUrl}`,
    '',
    error ? fence(error) : '_No error output could be retrieved; open the run for the full log._',
  ].join('\n');
}

async function ensureLabel(api, repo) {
  try {
    await api('GET', `/repos/${repo}/labels/${LABEL}`);
  } catch (e) {
    if (e.status !== 404) throw e;
    await api('POST', `/repos/${repo}/labels`, {
      name: LABEL,
      color: LABEL_COLOR,
      description: LABEL_DESCRIPTION,
    });
  }
}

/** The open alert issue, if any (the issues endpoint also returns PRs; skip those). */
export async function findOpenIssue(api, repo) {
  const issues = await api('GET', `/repos/${repo}/issues?labels=${LABEL}&state=open&per_page=100`);
  return issues.filter((i) => !i.pull_request).sort((a, b) => a.number - b.number)[0] ?? null;
}

export async function reportFailure({ api, repo, runId, runUrl, stepName, error }) {
  const body = `${renderReport({ runUrl, stepName, error })}\n\n${runMarker(runId)}`;
  await ensureLabel(api, repo);
  const open = await findOpenIssue(api, repo);
  if (!open) {
    const created = await api('POST', `/repos/${repo}/issues`, {
      title: 'Sync docs and deploy is failing',
      body: `The hourly docs sync failed. This issue closes itself when a run succeeds.\n\n${body}`,
      labels: [LABEL],
    });
    return { action: 'created', number: created.number };
  }
  const comments = await api('GET', `/repos/${repo}/issues/${open.number}/comments?per_page=100`);
  if (comments.some((c) => c.body?.includes(runMarker(runId))) || open.body?.includes(runMarker(runId))) {
    return { action: 'skipped', number: open.number };
  }
  await api('POST', `/repos/${repo}/issues/${open.number}/comments`, { body });
  return { action: 'commented', number: open.number };
}

export async function reportSuccess({ api, repo, runUrl }) {
  const open = await findOpenIssue(api, repo);
  if (!open) return { action: 'none' };
  await api('POST', `/repos/${repo}/issues/${open.number}/comments`, {
    body: `Sync docs and deploy is green again: ${runUrl}`,
  });
  await api('PATCH', `/repos/${repo}/issues/${open.number}`, { state: 'closed', state_reason: 'completed' });
  return { action: 'closed', number: open.number };
}

/** Work out which step failed and why, from the run's job and (best effort) its log. */
export async function describeFailure({ api, repo, runId, jobName }) {
  const { jobs } = await api('GET', `/repos/${repo}/actions/runs/${runId}/jobs?filter=latest`);
  const job = jobs.find((j) => j.name === jobName) ?? jobs[0];
  const step = failedStep(job);
  let error = '';
  if (job && step) {
    try {
      error = summariseError(await api('GET', `/repos/${repo}/actions/jobs/${job.id}/logs`, undefined, 'text'));
    } catch {
      // Logs of a still-running job are not always available; the report says so.
    }
  }
  return { stepName: step?.name ?? '', error };
}
