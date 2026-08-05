---
title: opentide extract
description: Import existing detection rules from Microsoft Sentinel and Defender into OpenTide object format.
---

# opentide extract

Bring detections that already live on a platform into your OpenTide repository as objects. Use this to bootstrap a repo from an existing deployment, then curate and chain the imported rules.

## When to use it

- Onboarding: you have rules in Sentinel or Defender and want them under detection-as-code.
- Reconciliation: you want to compare what is deployed against what is in the repo.

Imported content is a **starting point** — review, chain to objectives, and validate before treating it as source of truth.

## Prerequisites

`extract` reads from a live platform, so it needs credentials for that platform, configured under `.opentide/configurations/platforms/`. See [Configuration → credentials](../usage/configuration.md#credentials). Set the environment variables the platform expects before running.

## Usage

```bash
opentide extract sentinel
opentide extract defender
```

## Subcommands

| Subcommand | Imports from | Query language |
|------------|--------------|----------------|
| `sentinel` | Microsoft Sentinel | KQL |
| `defender` | Microsoft Defender for Endpoint | KQL |

These subcommands take no options beyond the [global options](./global-options.md); connection details come from the platform configuration and environment.

## After importing

Imported rules land as YAML in your objects tree. Always review and validate before committing:

```bash
opentide extract sentinel
opentide validate --strict          # check the imported objects
git diff                            # review what was created
```

Then chain each imported rule to an objective (`detection_model`) so it is not an [orphan](../usage/concepts/object-model.md#anti-patterns-to-avoid).

## Troubleshooting

- **Authentication error** — credentials missing or wrong; confirm the platform's environment variables are set. See [Troubleshooting → deploy auth](../usage/troubleshooting.md#deploy-fails-with-an-authentication-error).
- **Nothing imported** — the account may lack access to the analytics rules, or there are none to import.

## Related

- [Migration guide](../usage/migration/index.md) — moving a whole program to OpenTide.
- [`validate`](./validate.md) — validate what you imported.

## Source

`src/opentide/cli/__init__.py`, `src/opentide/cli/services/extraction.py`
