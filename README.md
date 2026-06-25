# OpenTide Website

Source for the OpenTide web presence — deployed on GitHub Pages ([congenial-winner-o8y3gq9.pages.github.io](https://congenial-winner-o8y3gq9.pages.github.io); [opentide.org](https://opentide.org) DNS later).

Built with [Next.js](https://nextjs.org/) and [Fumadocs](https://fumadocs.dev/), exported as a static site for GitHub Pages.

## What's here

| Section | Source | Path |
|---------|--------|------|
| Landing page | This repo | `/` |
| Documentation | Synced at build time | `/docs` |
| Specifications | [specifications](https://github.com/OpenTideHQ/specifications) repo | `/docs/specifications` |
| Usage, CLI, MCP, SDK | [opentide](https://github.com/OpenTideHQ/opentide) `docs/` | `/docs/{usage,cli,mcp,sdk}` |
| Blog | This repo `content/blog/` | `/blog` |

Documentation prose is synced from the opentide and specifications repos via `pnpm sync:content` and **committed** under `content/docs/` so private-repo CI can build without cross-repository access. After upstream doc changes, run sync and commit the diff.

## Local development

### Prerequisites

- Node.js 22+
- pnpm 10+

### Monorepo layout (recommended)

If you clone OpenTide repos as siblings:

```
OpenTide/
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
| `pnpm sync:content` | Copy opentide + specifications docs into `content/docs/` |
| `pnpm build` | Sync + static export to `out/` |
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

1. **opentide** submodule tracks the `docs/fumadocs-ready` branch (Fumadocs-formatted docs).
2. **specifications** content must exist in the [specifications](https://github.com/OpenTideHQ/specifications) repository — until published, local builds fall back to `../specifications` when the vendor submodule is empty.

Pushes to `main` deploy to **GitHub Pages** via `.github/workflows/deploy.yml`.

### Custom domain (opentide.org) — later

When DNS is ready: add `public/CNAME` with `opentide.org`, set the custom domain in GitHub Pages settings, and update `siteUrl` in `lib/shared.ts`.

## Related repositories

- **[opentide](https://github.com/OpenTideHQ/opentide)** — DetectionOps engine (PyPI)
- **[specifications](https://github.com/OpenTideHQ/specifications)** — Normative specs
- **[ShareTide](https://github.com/OpenTideHQ/ShareTide)** — Community detection objects

## License

Licensed under the [European Union Public Licence v. 1.2](LICENSE) (EUPL-1.2).
