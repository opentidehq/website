---
title: opentide mutate
description: Bulk object mutations — promote status, rename, fix references, and update security domains, across the whole catalogue.
---

# opentide mutate

Apply bulk, catalogue-wide edits to your detection objects. Mutations **modify YAML files in place**, so run them on a clean working tree and review the diff before committing.

## When to use it

Reach for `mutate` when a change spans many objects and would be tedious or error-prone by hand:

- Promoting a batch of rules to the next status.
- Renaming an object and updating every reference to it.
- Repairing or normalising cross-object references after refactoring.
- Rolling a security-domain field across the catalogue.

For single-object edits, just edit the YAML.

## Usage

```bash
opentide mutate                    # run all configured mutation actions
opentide mutate promote            # promote eligible rules to the configured target
opentide mutate rename             # rename objects and update references
opentide mutate references         # fix or normalise cross-object references
opentide mutate security-domain    # update security domain fields
```

## Subcommands

| Subcommand | What it does |
|------------|--------------|
| *(default)* | Runs all configured mutation actions in sequence |
| `promote` | Advances rule status toward the `promotion_target` in `deployment.toml` |
| `rename` | Renames objects and rewrites references that point at them |
| `references` | Fixes or normalises cross-object references |
| `security-domain` | Updates security-domain fields across objects |

Each subcommand is **driven by configuration**, not command-line flags — there are no per-subcommand options beyond the [global options](./global-options.md). Promotion targets, for example, come from `[promotion]` in `deployment.toml` (see [Configuration → promotion](../usage/configuration.md#promotion)).

## Example

```bash
# Promote staged rules once they pass acceptance
opentide validate --strict
opentide mutate promote
git diff                     # review the in-place edits
git add -A && git commit -m "chore: promote accepted rules"
```

## Output

`mutate` reports which files it changed. Run against a clean tree so `git diff` shows exactly what the mutation did. With `--json`, the result payload lists the mutated objects.

## Troubleshooting

- **Nothing changed** — the objects may not meet the mutation's criteria (e.g. no rules eligible for promotion). Check status values and `deployment.toml`.
- **Too much changed** — you ran the default `opentide mutate` (all actions). Run a specific subcommand instead.
- Always commit or stash first; mutations are not reversible except through VCS.

## Related

- [Detection-as-code → promotion](../usage/workflows/detection-as-code.md#promotion) — where promotion fits the workflow.
- [Configuration → deployment statuses](../usage/configuration.md#deployment-statuses-and-strategies) — the statuses promotion moves between.
- [Exit codes](./exit-codes.md).

## Source

`src/opentide/cli/__init__.py`, `src/opentide/cli/services/mutate.py`
