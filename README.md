# opentide Website

Source for the opentide web presence — deployed on GitHub Pages at [opentide.org](https://opentide.org).

Built with [Next.js](https://nextjs.org/) and [Fumadocs](https://fumadocs.dev/), exported as a static site for GitHub Pages.

## What's here

| Section | Source | Path |
|---------|--------|------|
| Landing page | This repo | `/` |
| Documentation | Synced at build time | `/docs` |
| Specifications | [specifications](https://github.com/OpenTideHQ/specifications) repo | `/docs/specifications` |
| Usage, CLI, MCP, SDK | [opentide](https://github.com/OpenTideHQ/opentide) `docs/` | `/docs/{usage,cli,mcp,sdk}` |
| Blog | This repo `content/blog/` | `/blog/` |

Documentation prose is synced from the opentide and specifications repos via `pnpm sync:content` and **committed** under `content/docs/` as `.mdx` so Fumadocs can compile JSX and private-repo CI can build without cross-repository access. `content/docs/.sync-stamp.json` records the vendor SHAs; `pnpm check:docs` fails if those gitlinks moved without a refresh. A GitHub Actions workflow (`sync-docs.yml`) does this on a schedule and on `repository_dispatch`, then deploys — you do not need to run sync by hand after a package release.

## Local development

### Prerequisites

- Node.js 22+
- pnpm 10+

### Monorepo layout (recommended)

If you clone opentide repos as siblings:

```
opentide/
├── opentide/
├── specifications/
└── website/    ← you are here
```

```bash
pnpm install
OPENTIDE_DOCS_PATH=../opentide/docs SPECIFICATIONS_PATH=../specifications pnpm dev
```

### Submodule layout (CI / production)

```bash
git submodule update --init --recursive
pnpm install
pnpm dev
```

Environment overrides (first match wins):

| Variable | Default candidates |
|----------|-------------------|
| `OPENTIDE_DOCS_PATH` | `vendor/opentide/docs`, `../opentide/docs` |
| `SPECIFICATIONS_PATH` | `vendor/specifications`, `../specifications` |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Sync docs + start dev server |
| `pnpm fetch:pypi` | Snapshot the current PyPI version for local/dev first paint |
| `pnpm sync:content` | Copy opentide + specifications docs into `content/docs/` as `.mdx` |
| `pnpm check:docs` | Fail if `content/docs` does not match the pinned vendor gitlinks |
| `pnpm test` | Unit tests for sync, freshness, and GitHub source URLs |
| `pnpm build` | Snapshot PyPI + sync docs + static export to `out/` |
| `pnpm lint` | ESLint |
| `pnpm types:check` | TypeScript + Fumadocs MDX types |

## Writing a blog post

Add an MDX file under `content/blog/`:

```mdx
---
title: Your post title
description: One sentence summary for listings and SEO.
author: Your Name
date: 2026-06-25
tags:
  - detectionops
---

Your content here.
```

Open a pull request. Posts appear at `/blog/<filename-without-extension>/`.

## Deployment

### Prerequisites

1. **opentide** submodule tracks the `development` branch (Fumadocs-formatted docs under `docs/`).
2. **specifications** content must exist in the [specifications](https://github.com/OpenTideHQ/specifications) repository — until published, local builds fall back to `../specifications` when the vendor submodule is empty.

Pushes to `main` deploy to **GitHub Pages** via `.github/workflows/deploy.yml`. Custom domain is `opentide.org` (`public/CNAME`, `siteUrl` in `lib/shared.ts`, and the Pages custom-domain field). Apex DNS is four GitHub A records plus AAAA; `www` CNAMEs to `OpenTideHQ.github.io`. Do not attach `blog.opentide.org` to this Pages site — forward it to `/blog/` at the registrar.

### Package releases

The landing page reads the current `opentide` version from the PyPI JSON API in the browser. Publishing a wheel does **not** require a website rebuild for that number to update.

Docs, changelog pages, and specs **do** need a rebuild. `.github/workflows/sync-docs.yml` handles that without a human:

1. Hourly (and on `repository_dispatch` / `workflow_dispatch`) bump `vendor/opentide` + `vendor/specifications`
2. Run `pnpm sync:content` and commit `content/docs/` (including `.sync-stamp.json`)
3. Lint, test, typecheck, and build
4. Fail if the stamp does not match the new gitlinks, or if built HTML still contains escaped `<Tabs>`
5. Push the verified commit to `main` and dispatch GitHub Pages deploy

To notify the site immediately after a PyPI publish (optional, from `OpenTideHQ/opentide`):

```bash
gh api repos/OpenTideHQ/website/dispatches -f event_type=opentide-released
```

That call needs a token with `repo` scope on this repository. If it is not wired, the hourly schedule still picks the change up.

## Related repositories

- **[opentide](https://github.com/OpenTideHQ/opentide)** — DetectionOps engine (PyPI)
- **[specifications](https://github.com/OpenTideHQ/specifications)** — Normative specs
- **[library](https://github.com/OpenTideHQ/library)** — Public detection objects
- **[explorer](https://github.com/OpenTideHQ/explorer)** — Browse published objects
- **[skills](https://github.com/OpenTideHQ/skills)** — Agent skills for detection engineering

## License

Licensed under the [European Union Public Licence v. 1.2](LICENSE) (EUPL-1.2).
