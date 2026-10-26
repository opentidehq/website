---
name: opentide
description: Spec-driven development for detection engineering — EU coastal precision on the marketing site; Fumadocs clarity in docs.
colors:
  eu-blue: "#001489"
  eu-yellow: "#ffcc00"
  eu-blue-muted: "#1a3a9e"
  yellow-lift: "#ffe566"
  white: "#ffffff"
  black: "#000000"
  landing-bg: "#000000"
  landing-band: "#0a0a0b"
  landing-panel: "#0e0e10"
  landing-surface-deep: "#000000"
  landing-surface: "#000000"
  landing-surface-raised: "#000000"
  landing-ink: "#fafafa"
  landing-muted: "#c4c4cc"
  landing-subtle: "#9a9aa3"
  landing-dim: "#52525b"
  landing-border: "rgb(255 255 255 / 0.1)"
  landing-border-subtle: "rgb(255 255 255 / 0.08)"
  abyss: "#000814"
  surface-deep: "#000b1f"
  surface: "#001028"
  surface-raised: "#001a4d"
  ink: "#e8f0ff"
  muted: "#b8cce8"
  subtle: "#8fa8d4"
  foam: "#7ec8e3"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  full: "9999px"
spacing:
  chapter: "5rem"
  chapter-md: "6.5rem"
  block: "6rem"
  card: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.eu-yellow}"
    textColor: "{colors.black}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-accent:
    backgroundColor: "{colors.eu-yellow}"
    textColor: "{colors.black}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
---

## Overview

opentide uses two registers on one codebase: an expressive **brand** landing (a WebGL sea of query in the hero, EU blue/yellow) and a restrained **product** docs shell (Fumadocs neutral theme). Typography is Inter everywhere; JetBrains Mono for code and terminal demos. Motion is intentional: one hero sea, restrained section transitions - all gated by `prefers-reduced-motion`.

The hero sea (`tide-sea.tsx`, `components/landing/sea/`) is real detection content laid on water in perspective — one detection idea in every language opentide deploys to (KQL, SPL, S1QL, Lucene, CrowdStrike event search, Sigma, YARA) between opentide's object fields, so neighbouring rows rarely share a language: rows of glyph sprites in the page's JetBrains Mono, drawn far to near with WebGL2, receding to a horizon behind the headline and hazing out before it. The camera sits low over the water, so the swells loom and the near rows read large. Swells roll toward the reader, faces turned toward the light carry it while troughs fall dark, the reader rides the swell (a slow bob and a third-of-a-degree roll), the sea rises out of haze behind the headline, rows drift like a current, the pointer is a lantern that lifts the text under it and leaves ripples, and now and then a detection fires: a flash and a ring of light in `--landing-sea-glow` (amber on white, yellow on black) running out across the water. The camera math is tested (`sea/geometry.test.ts`). It starts once the page is idle, links its shaders in the background (`KHR_parallel_shader_compile`) and fades in with its first frame, so it never holds up hydration. It caps at 60 fps, pauses off screen and in background tabs, keeps one still frame with reduced motion or where the browser draws WebGL on the CPU (with a lighter grid at 1x), and leaves the hero without water where WebGL2 is missing. Landing light mode is white+blue; dark is black+yellow.

The landing is seven chapters (`components/landing/chapters.ts`), each one idea: a chapter head, then the one or two artefacts that prove it. Chapters alternate between the page and a tinted band, so where one ends and the next begins reads at a glance. Every section composes the same few parts from `components/landing/ui.tsx`; nothing scroll-pins, and nothing hides content behind tabs except alternative views of one artefact (the CLI · SDK · MCP showcase).

### Illustrations

Each chapter carries one illustration built from real artefacts, never a stock icon grid:

- **Ontology map** (`ontology-map.tsx`, data in `lib/landing/ontology.ts`): threat, objective, its signals and rule in `objects/`, threats chained to threats (a loop on the threat), and the environment from `visibility.toml` and `platforms/*.toml` they land in: assets on a surface, log sources, detectors, integrations. Edges are labelled with the field that makes the link; solid edges are UUID references that `opentide validate` resolves, dashed ones are names or vocabulary values. Each node has a type icon and carries the demo objects it stands for: names and values from the files, with the threat card showing the chain itself. The map is a fixed canvas scaled to its column; past 80% it scrolls sideways instead, and the tour pans to each node. A guided tour walks the nodes; the detail panel shows one view at a time, chosen once and kept through the tour: every link a node holds or receives, with what it means, its value in the demo file and the object it resolves to, or the real file with the linking lines marked. That keeps the panel no taller than the map, and every node's detail shares one grid cell, so it keeps its height through the tour.
- **Coverage figure**: an ATT&CK heatmap beside an attack path: chained threats, each on one of your assets through its surface, each step covered by an objective and its rules or flagged as a gap. A replay walks the path; four questions under it light up the part of the graph that answers them. A click, tap or keypress pins a question; a mouse hover previews one.
- **Integration fan**: one rule's `configurations` keys wired to each integration; each tile names what `opentide deploy` creates there, and a check lands as its wire arrives.
- **CLI · SDK · MCP showcase**: typed commands with output captured from the released opentide against the demo repository (a broken reference, a vocabulary error, the `--json` report, a dry-run plan); the promise each run demonstrates lights up beside it.
- **Pipeline, north star, get started**: the pipeline runs like CI, a pulse rides the north-star track, and the repository tree grows as the setup commands play.

The studio's demo objects pass `opentide validate --strict`, `lint --strict` and a dry-run deploy in `pnpm verify:demos`, against the released package. The ontology map's excerpts, records and link values and the showcase's transcripts are checked against those same files by `pnpm test` (`lib/landing/*.test.ts`), as is the taxonomy ribbon against the synced vocabulary catalog. The coverage figure's attack path is illustrative.

### Motion

Highlights are fills, never a bar on the left edge. Content reveals as it scrolls in (`RevealOnScroll`, `data-reveal`, `data-reveal-group` for staggered children); content is never hidden without JavaScript. Diagrams draw their edges once (`.landing-draw`), and the links that matter carry a moving dash (`.landing-flow`). Demos idle off screen and stop for `prefers-reduced-motion`, which shows each finished state instead.

### Copy

Say opentide, the CLI, the SDK or the MCP server, never "the engine". Integrations are integrations: do not lead with how many there are. The landing does not tell the re-release story; the blog does.

Logo and logotype assets live in `public/brand/` (synced from opentidehq/.github): Material Tsunami circle mark + **opentide** wordmark.

## Colors

**Theme rule:** light mode = white + blue; dark mode = black + yellow.

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Brand primary (light) | `eu-blue` | `#001489` | Pantone Reflex Blue — docs primary, light mark |
| Brand accent (dark) | `eu-yellow` | `#ffcc00` | Dark mark, landing CTAs, active nav |
| Yellow lift | `yellow-lift` | `#ffe566` | Primary button hover |
| Landing bg | `landing-bg` | `#ffffff` / `#000000` | Marketing base (light / dark) |
| Landing band | `landing-band` | `#f5f6fa` / `#0a0a0b` | Every other chapter |
| Landing panel | `landing-panel` | `#ffffff` / `#0e0e10` | Panels, tiles, the ecosystem directory |
| Landing surface | `landing-surface` | `#f2f2f5` / `#000000` | Workflow studio chrome |
| Landing ink | `landing-ink` | `#fafafa` | Headings on landing |
| Landing muted | `landing-muted` | `#a1a1aa` | Body on landing |

Docs: `--color-fd-primary` / `--brand-accent` map to blue in light mode and yellow in dark mode. No gradient text; solid accents only.

## Typography

- **Sans**: Inter for all UI and marketing headings (no separate display font).
- **Mono**: JetBrains Mono for CLI snippets, MCP tool calls, the workflow studio, and prose code blocks.
- **Hero**: `clamp(2.4rem, 5.4vw, 4.4rem)`, weight 700, tracking `-0.045em`, centred, under a release badge.
- **Chapter heads** (h2): `clamp(2rem, 4vw, 3rem)`, weight 700, tracking `-0.035em`, `text-wrap: balance`. **Block heads** (h3): 1.5–1.75rem. Smaller h3s only title cells in a grid (pipeline stages) and the ontology map's detail panel.
- **Mono**: 12px for labels and captions, 12.5–13px in code panels, 11px for tags and diagram labels.
- **Body**: 1rem–1.25rem, max ~65ch in prose sections, `text-wrap: pretty` on long copy.

## Elevation

Landing uses flat tonal layering: chapters alternate page and `landing-band`, content that needs a frame sits in one panel style (`.landing-panel`: 1rem radius, `landing-border`, `landing-panel` fill), and grids of cells share one panel with 1px dividers rather than becoming separate cards. Drop shadows are kept for what floats above the page: the header pill once scrolled, the workflow studio, the two terminals, the active map node and the chapter dock. Code panels are deep-tide navy (`--landing-code-*`) in both themes, as content. Docs rely on Fumadocs sidebar/card surfaces; avoid nested card grids on marketing sections.

## Components

- **Primary button** (`.landing-btn-primary`): accent fill, accent-foreground text, accent ring and focus outline.
- **Secondary button** (`.landing-btn-secondary`): transparent, accent border and text.
- **Chapter** (`Chapter`, `ChapterHead`, `BlockHead` in `components/landing/ui.tsx`): lowercase mono label with the chapter number, h2, at most one lead; blocks inside a chapter are spaced by `block`. Component classes live in `@layer components` so utilities can override them.
- **Panel** (`.landing-panel`) and **surface card** (`.landing-surface-card`, unfilled, for blog embeds).
- **Tag** (`Tag`): four tones, used the same way everywhere — `solid` (accepted), `accent` (supported, in progress), `outline` (planned, gated), `dashed` (proposed, not implemented). No green or red outside code panels and the workflow studio.
- **Header** (`SiteHeader`): a floating glass pill (`.landing-pill`) over the landing, the blog and the releases — wordmark, links centred, GitHub, theme toggle and a Get started button. It tightens and lifts once the page scrolls, slips away while reading down and returns on the way up (never while it holds focus or its menu is open), and a highlight slides under the hovered link; the current page sits in an accent-tinted nested pill, the height of the icons beside it. Below `md` the links move into a menu inside the pill.
- **Closing seal** (`ClosingSeal`): the page ends on the seal pressed onto the name. The name is the logotype's own letters (baked from `logo-normal.svg`) at the width of the page, tinted with the hero's sea ink and strongest around the seal; the seal, a tilt card, overlaps the foot of their x-height so every letter still reads. Rings run out from the seal and light the letters as they pass, in the accent. With reduced motion the rings and the light stay off.
- **Footer** (`SiteFooter`): a quiet band — what opentide is, the latest release and both licences as chips, product, specification and ecosystem columns, and a bottom bar with Back to top.
- **Chapter navigation**: a floating dock (`ChapterNav`) between the hero and the footer — every chapter at `xl` with the current one filled and a thin progress line, one pill with a menu below `xl`. Blocks keep their old anchors (`#pipeline`, `#platforms`, `#doors`).
- **Workflow studio**: plays its six-step scenario in a fixed frame and idles off screen; it never pins or resizes with scroll.
- **Docs root switcher**: Fumadocs popover; Usage default; accent focus ring.
- **MDX**: Callout, Cards, Steps, Tabs, TypeTable, Mermaid (Fumadocs UI + remark plugins).

## Do's and Don'ts

**Do**
- Use CSS variables under `.landing` for marketing colors.
- Use official brand SVGs from `public/brand/` (or theme-aware React mark).
- Register Fumadocs MDX components before authoring rich synced docs.
- Cross-link Usage pages to normative Specifications.
- Keep integrations about detection-as-code and deployment: what each one deploys as, never which checks it lacks. Capability nuances (live query checks, deploy-only integrations) belong in the docs' capability matrix, stated as facts, not on the landing.

**Don't**
- Gradient text, glassmorphism heroes, or uppercase tracked eyebrows on every section — section labels are lowercase mono.
- Invent PyPI extras that don't exist in `pyproject.toml`.
- Duplicate H1 from frontmatter title in synced markdown bodies.
- Wrap all content in an extra docs index folder — root dropdown only.
