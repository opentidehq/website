# AGENTS.md

opentide.org: a Next.js and Fumadocs site, exported statically to GitHub Pages. `README.md` has
the layout, the scripts and the deployment; this file has the rules an agent needs.

## Before a pull request

```bash
pnpm lint
pnpm test
pnpm types:check
SKIP_SYNC=1 pnpm build      # or: pnpm exec next build
pnpm verify:docs
```

CI (`.github/workflows/ci.yml`) runs the same on every pull request, plus `pnpm check:docs`.
The site's own code fails its own CI; it never waits for the hourly sync to find out.

## Upstream checks

`vendor/opentide` (branch `development`) and `vendor/specifications` (branch `main`) are synced
into `content/docs/` and committed. An upstream tree must never stop the site from updating, so
whether the site takes a tree is decided by one command:

```bash
pnpm check:upstream                # scripts/check-upstream.mjs
```

It runs, on the trees in `vendor/` as they are on disk, and stops at the first failure:

| Check | What it catches |
|-------|-----------------|
| `pnpm sync:content` | MDX the site refuses (`scripts/lib/mdx-safety.mjs`), a missing or incomplete tree |
| `pnpm test` (without the test that compares `content/docs` with HEAD's gitlinks) | A landing field or vocabulary the synced specs no longer have, sync rules |
| `pnpm types:check` | Frontmatter the docs schema rejects, route types |
| `pnpm exec next build` | A page that does not compile or render (an unknown component, a bad Callout) |
| `pnpm check:docs --worktree` | `content/docs` not synced from the trees on disk, a page left as `.md` |
| `pnpm verify:docs` | An exported page missing or empty |

`--report <file.json>` also writes which check failed and the end of its output.

**Who runs it.**

- The hourly "Sync docs and deploy" (`.github/workflows/sync-docs.yml`), through
  `scripts/sync-upstream.mjs`: both new tips first, then each new tip with the other source at its
  last good commit. It commits and deploys what passed and keeps the last good gitlinks and
  content for what failed, then fails the run so the `sync-docs-failure` issue names the tree
  and the check.
- The source repositories' PR guards (opentidehq/specifications `.github/workflows/website-sync.yml`,
  and opentide's), so a PR that would be held back fails in that PR.

**Running it from a source repository's PR guard.** Check out this repository (`main`), put the
PR's tree at `vendor/<repo>` and the other source at the branch `.gitmodules` names, install,
and run the script:

```yaml
- uses: actions/checkout@v4
  with: { repository: opentidehq/website, ref: main, path: website, submodules: false, persist-credentials: false }
- uses: actions/checkout@v4          # this PR's tree
  with: { path: website/vendor/specifications, persist-credentials: false }
- uses: actions/checkout@v4          # the other source; opentide needs only docs/
  with: { repository: opentidehq/opentide, ref: development, path: website/vendor/opentide, sparse-checkout: docs, persist-credentials: false }
- uses: pnpm/action-setup@v4
  with: { package_json_file: website/package.json }
- uses: actions/setup-node@v4
  with: { node-version: 22, cache: pnpm, cache-dependency-path: website/pnpm-lock.yaml }
- run: pnpm install --frozen-lockfile
  working-directory: website
- run: pnpm check:upstream
  working-directory: website
```

Each `vendor/<repo>` must be a git checkout (its `HEAD` is stamped into
`content/docs/.sync-stamp.json` and compared by `check:docs --worktree`). opentide needs only
`docs/`. Nothing else in the checkout matters: the checks read no gitlink and no network.

**Changing the checks.** Add or remove a check in `CHECKS` in `scripts/check-upstream.mjs`, and
in the table above. Never list the checks again anywhere else, in this repository or a guard:
the guards call the script, so they follow.

## Release notes

`/releases/` renders opentide's `docs/usage/releases.md` (synced with the docs) and the
`CHANGELOG.md` files `pnpm sync:changelogs` copies into `content/releases/`. `lib/releases.ts`
parses them strictly; a file it rejects keeps the committed copy. `README.md`, "Release notes",
has the format.
