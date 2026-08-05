---
title: opentide export
description: Export ATT&CK Navigator layers, object dumps, revision snapshots, and playbook maps for external tools.
---

# opentide export

Emit catalogue data in formats other tools consume — coverage visualisation, reporting, and integrations. Exports are read-only: they never modify your objects.

## When to use it

- **`navigator`** — visualise ATT&CK coverage in the [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/).
- **`objects`** — a full machine-readable dump of the catalogue for downstream tooling.
- **`revisions`** — a snapshot of object revisions for auditing or diffing over time.
- **`playbook-map`** — the mapping between detections and response playbooks.

## Usage

```bash
opentide export navigator
opentide export objects
opentide export revisions
opentide export playbook-map
```

## Subcommands

| Subcommand | Output | Typical consumer |
|------------|--------|------------------|
| `navigator` | ATT&CK Navigator layer JSON | ATT&CK Navigator |
| `objects` | Object catalogue export (JSON) | External tooling / BI |
| `revisions` | Revision snapshot (JSON) | Audit / change tracking |
| `playbook-map` | Playbook mapping | SOAR / response tooling |

These subcommands take no options beyond the [global options](./global-options.md); output locations are resolved from your configuration.

## Output

Files are written under the configured exports directory (`.opentide/exports/` by default), using the artifact names defined by the [workspace spec](/docs/specifications/specs/workspace/):

| Subcommand | Default artifact |
|------------|------------------|
| `navigator` | `attack-navigator.json` |
| `objects` | `objects.export.json` |
| `revisions` | `revisions.export.json` |

Override export paths in `.opentide/configurations/paths.toml` — see [Configuration](../usage/configuration.md#paths).

## Example

```bash
opentide export navigator
# → .opentide/exports/attack-navigator.json
# Load this file in the ATT&CK Navigator to see technique coverage.
```

## Related

- [Detection-as-code → exports and coverage](../usage/workflows/detection-as-code.md#exports-and-coverage).
- [`info`](./info.md) — quick coverage queries without exporting.

## Source

`src/opentide/cli/__init__.py`, `src/opentide/cli/services/export.py`
