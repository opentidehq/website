---
title: Specifications
description: Normative OpenTide specifications — versioning, objects, vocabularies, and governance.
---

# OpenTide Specifications

Normative specifications define the contract between OpenTide implementations, detection repositories, and agent tooling. Each spec is independently versioned.

## Start here

| Document | Purpose |
|----------|---------|
| [Spec index](./SPECS.md) | One-page index of active spec versions |
| [Governance](./GOVERNANCE.md) | Change process and authority model |
| [Agent guide](./AGENTS.md) | How agents should read and apply specs |

## Object specs

- [Threat](./specs/objects/threat-1.0.md) — `threat::1.0`
- [Objective](./specs/objects/objective-1.0.md) — `objective::1.0`
- [Rule](./specs/objects/rule-1.0.md) — `rule::1.0` (exemplar spec)

Implementation lives in the [opentide](https://github.com/OpenTideHQ/opentide) Python package. JSON Schema is generated from Pydantic models — specs are the source of truth.
