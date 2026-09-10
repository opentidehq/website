---
name: opentide
description: DetectionOps engine — EU coastal precision on the marketing site; Fumadocs clarity in docs.
colors:
  eu-blue: "#001489"
  eu-yellow: "#ffcc00"
  eu-blue-muted: "#1a3a9e"
  yellow-lift: "#ffe566"
  white: "#ffffff"
  black: "#000000"
  landing-bg: "#000000"
  landing-surface-deep: "#050505"
  landing-surface: "#0a0a0a"
  landing-surface-raised: "#111111"
  landing-surface-hover: "#141414"
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
  section: "6rem"
  section-lg: "8rem"
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

opentide uses two registers on one codebase: an expressive **brand** landing (FLIP liquid ASCII hero, EU blue/yellow) and a restrained **product** docs shell (Fumadocs neutral theme). Typography is Inter everywhere; JetBrains Mono for code and terminal demos. Motion is intentional: one canvas liquid-ASCII hero, restrained section transitions - all gated by `prefers-reduced-motion`. Landing light mode is white+blue; dark is black+yellow.

Logo and logotype assets live in `public/brand/` (synced from OpenTideHQ/.github): Material Tsunami circle mark + **opentide** wordmark.

## Colors

**Theme rule:** light mode = white + blue; dark mode = black + yellow.

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Brand primary (light) | `eu-blue` | `#001489` | Pantone Reflex Blue — docs primary, light mark |
| Brand accent (dark) | `eu-yellow` | `#ffcc00` | Dark mark, landing CTAs, active nav |
| Yellow lift | `yellow-lift` | `#ffe566` | Primary button hover |
| Landing bg | `landing-bg` | `#000000` | Marketing base |
| Landing surface | `landing-surface` | `#0a0a0a` | Cards, panels |
| Landing raised | `landing-surface-raised` | `#111111` | Hover / featured |
| Landing ink | `landing-ink` | `#fafafa` | Headings on landing |
| Landing muted | `landing-muted` | `#a1a1aa` | Body on landing |

Docs: `--color-fd-primary` / `--brand-accent` map to blue in light mode and yellow in dark mode. No gradient text; solid accents only.

## Typography

- **Sans**: Inter for all UI and marketing headings (no separate display font).
- **Mono**: JetBrains Mono for CLI snippets, MCP demo, and prose code blocks.
- **Headlines**: `clamp(2.25rem, 5.5vw, 3.75rem)`, weight 700, tracking `-0.02em`, `text-wrap: balance`.
- **Body**: 1rem–1.25rem, max ~65ch in prose sections, `text-wrap: pretty` on long copy.

## Elevation

Landing uses flat tonal layering (borders `landing-border`, rings on brand yellow) — no drop-shadow stacks except a single `shadow-lg` on the hero terminal card. Docs rely on Fumadocs sidebar/card surfaces; avoid nested card grids on marketing sections.

## Components

- **Primary button** (`.landing-btn-primary`): yellow fill, black text, yellow ring, focus yellow outline.
- **Secondary button** (`.landing-btn-secondary`): raised surface, yellow border/text.
- **Surface card** (`.landing-surface-card`): 1rem radius, surface fill, `landing-border`.
- **Nav wordmark**: theme-aware tsunami mark + open/tide split (`--brand-accent`).
- **Docs root switcher**: Fumadocs popover; Usage default; accent focus ring.
- **MDX**: Callout, Cards, Steps, Tabs, TypeTable, Mermaid (Fumadocs UI + remark plugins).

## Do's and Don'ts

**Do**
- Use CSS variables under `.landing` for marketing colors.
- Use official brand SVGs from `public/brand/` (or theme-aware React mark).
- Register Fumadocs MDX components before authoring rich synced docs.
- Cross-link Usage pages to normative Specifications.
- Keep platform capability claims honest (CrowdStrike/HarfangLab: deploy only).

**Don't**
- Gradient text, glassmorphism heroes, or uppercase tracked eyebrows on every section.
- Invent PyPI extras that don't exist in `pyproject.toml`.
- Duplicate H1 from frontmatter title in synced markdown bodies.
- Wrap all content in an extra docs index folder — root dropdown only.
