# opentide brand assets

Synced from [OpenTideHQ/.github](https://github.com/OpenTideHQ/.github) `assets/`.

Pantone Reflex Blue `#001489` · EU Yellow `#FFCC00` · Inter SemiBold · Material Tsunami icon.

## Theme mapping (site)

| Mode | Surface | Logo |
|------|---------|------|
| Light | white | `logo-normal` (blue pill) / `icon-normal` / `badge-normal` |
| Dark | black | `logo-dark` (yellow pill) / `icon-dark` / `badge-dark` |

## Files

| Prefix | What it is |
|--------|------------|
| `logo-{normal\|inverse\|dark}` | Pill logo — circle icon + **opentide** |
| `icon-{normal\|inverse\|dark}` | Circle icon mark / favicon |
| `badge-{normal\|inverse\|dark}` | OTIDE ring seal badge |
| `site-pill-{normal\|inverse}` | Globe + **opentide.org** |
| `license-pill-{normal\|inverse}` | Gavel + **EUPL 1.2** |

- **normal** — blue fill, white accent
- **inverse** — white fill, blue accent
- **dark** — yellow fill, black accent (site dark companion; derived for website use)

PNGs: `{prefix}-{size}px.png` (height for pills/logo, square for badge/icon).

## Badge ring text

Upstream ships `badge-*.svg` with the full Inter face inline (~840 KB each). When re-syncing,
subset the embedded font to the ring glyphs before committing — the arc renders identically in
Chromium and WebKit at ~3.6 KB:

```bash
pyftsubset full.otf --text=' ACDEFGHIMNOPRT' --flavor=woff2 \
  --layout-features= --no-hinting --desubroutinize --output-file=sub.otf
```
