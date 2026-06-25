---
name: OpenTide
description: DetectionOps engine — EU coastal precision on the marketing site; Fumadocs clarity in docs.
colors:
  eu-blue: "#003399"
  eu-yellow: "#ffcc00"
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
    backgroundColor: "{colors.eu-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-accent:
    backgroundColor: "{colors.eu-yellow}"
    textColor: "{colors.abyss}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
---

## Overview

OpenTide uses two registers on one codebase: an expressive **brand** landing (pixel tide hero, EU blue/yellow) and a restrained **product** docs shell (Fumadocs neutral theme). Typography is Inter everywhere; JetBrains Mono for code and terminal demos. Motion is intentional: one canvas hero animation, CSS wave dividers, staggered card reveals — all gated by `prefers-reduced-motion`.

## Colors

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Brand primary | `eu-blue` | `#003399` | CTAs, wave SVG, docs primary |
| Brand accent | `eu-yellow` | `#ffcc00` | Highlights, icons, active nav |
| Background | `abyss` | `#000814` | Landing page base |
| Surface | `surface` | `#001028` | Cards, panels |
| Raised surface | `surface-raised` | `#001a4d` | Hover states, featured cards |
| Body text | `ink` | `#e8f0ff` | Headings, primary copy |
| Muted text | `muted` | `#b8cce8` | Body paragraphs (≥4.5:1 on abyss) |
| Subtle text | `subtle` | `#8fa8d4` | Secondary copy, marquee |
| Foam | `foam` | `#7ec8e3` | Code labels, links on dark |

Docs light mode uses Fumadocs `--color-fd-primary` mapped to EU blue. No gradient text; solid accents only.

## Typography

- **Sans**: Inter for all UI and marketing headings (no separate display font).
- **Mono**: JetBrains Mono for CLI snippets, MCP demo, and prose code blocks.
- **Headlines**: `clamp(2.25rem, 5.5vw, 3.75rem)`, weight 700, tracking `-0.02em`, `text-wrap: balance`.
- **Body**: 1rem–1.25rem, max ~65ch in prose sections, `text-wrap: pretty` on long copy.

## Elevation

Landing uses flat tonal layering (borders `white/10`, rings on brand blue) — no drop-shadow stacks except a single `shadow-lg` on the hero terminal card. Docs rely on Fumadocs sidebar/card surfaces; avoid nested card grids on marketing sections.

## Components

- **Primary button** (`.landing-btn-primary`): EU blue fill, white text, ring border, focus yellow outline.
- **Secondary button** (`.landing-btn-secondary`): raised surface, yellow border/text.
- **Surface card** (`.landing-surface-card`): 1rem radius, surface fill, white/10 border.
- **Docs root switcher**: Fumadocs popover; Usage default; yellow focus ring.
- **MDX**: Callout, Cards, Steps, Tabs, TypeTable, Mermaid (Fumadocs UI + remark plugins).

## Do's and Don'ts

**Do**
- Use CSS variables under `.landing` for marketing colors.
- Register Fumadocs MDX components before authoring rich synced docs.
- Cross-link Usage pages to normative Specifications.
- Keep platform capability claims honest (CrowdStrike/HarfangLab: deploy only).

**Don't**
- Gradient text, glassmorphism heroes, or uppercase tracked eyebrows on every section.
- Invent PyPI extras that don't exist in `pyproject.toml`.
- Duplicate H1 from frontmatter title in synced markdown bodies.
- Wrap all content in an extra docs index folder — root dropdown only.
