// Run by .github/workflows/sync-docs.yml after the sync steps.
//   node scripts/sync-failure-alert.mjs failure   (if: failure())
//   node scripts/sync-failure-alert.mjs success   (if: success())
// Uses only the workflow's GITHUB_TOKEN (needs issues: write).
import { appendFileSync } from 'node:fs';
import { describeFailure, renderReport, reportFailure, reportSuccess } from './lib/sync-failure-alert.mjs';

const mode = process.argv[2];
const env = process.env;
const repo = env.GITHUB_REPOSITORY;
const runId = env.GITHUB_RUN_ID;
const runUrl = `${env.GITHUB_SERVER_URL ?? 'https://github.com'}/${repo}/actions/runs/${runId}`;
const apiBase = env.GITHUB_API_URL ?? 'https://api.github.com';

async function api(method, path, body, as = 'json') {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw Object.assign(new Error(`${method} ${path} -> ${res.status}`), { status: res.status });
  }
  return as === 'text' ? res.text() : res.json();
}

if (mode === 'failure') {
  let found = { stepName: '', error: '' };
  try {
    found = await describeFailure({ api, repo, runId, jobName: env.GITHUB_JOB });
  } catch (e) {
    console.log(`::warning::Could not read the failed step: ${e.message}`);
  }
  const { stepName, error } = found;
  const report = renderReport({ runUrl, stepName, error });
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `## Sync docs and deploy failed\n\n${report}\n`);
  }
  console.log(report);
  // The run is already red; if alerting itself breaks, say so loudly but keep that red.
  console.log(JSON.stringify(await reportFailure({ api, repo, runId, runUrl, stepName, error })));
} else if (mode === 'success') {
  try {
    console.log(JSON.stringify(await reportSuccess({ api, repo, runUrl })));
  } catch (e) {
    // A green sync must stay green even if we cannot tidy up the issue.
    console.log(`::warning::Could not close the sync-docs-failure issue: ${e.message}`);
  }
} else {
  console.error('usage: sync-failure-alert.mjs failure|success');
  process.exit(2);
}
