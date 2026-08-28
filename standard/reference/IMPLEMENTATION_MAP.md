# Reference Implementation Map

## `sigrank-cascade`

Role: **reference math implementation**

Current package: `@sigrank/cascade`

Responsibilities:

- canonical core equations;
- null semantics;
- test vectors;
- field rank / percentile helpers;
- normalized OperatorEvaluation;
- reference signature implementation.

The future standalone standard repo should not duplicate production math. It should test and specify it.

## `sigrank-mcp`

Role: **instrument**

Responsibilities:

- local extraction;
- provider/tool adapters;
- CLI/TUI;
- MCP tool surface;
- signed submission;
- dry-run payload inspection;
- local privacy boundary.

Required standard integration:

- emit `spec: sigrank/0.1-draft`;
- expose a standard-record tool/output;
- publish primitive alias mapping;
- link the standard in README and MCP server description;
- keep metric implementation sourced from `@sigrank/cascade`.

## `sigrank-app`

Role: **SignalAF public reference implementation**

Responsibilities:

- public HTTP MCP;
- ingest authority;
- verified submissions;
- field;
- profiles;
- public ranking;
- API;
- wiki / methodology / category pages.

Required standard integration:

- canonical `/standard`;
- machine-readable schema;
- reference field definition;
- public "what is open / what is proprietary" boundary;
- standard version in relevant API/MCP output;
- standard link from docs / wiki / metric pages.

## `sigeconomy.com` / `sigarena`

Role: **read-only discovery and category-distribution surface**

Verified current architecture:

- consumes signalaf.com public API;
- no accounts / DB / auth;
- SEO/AEO satellite;
- operator-eval explainers;
- multiple metric leaderboards and comparison pages.

Required standard integration:

- never become a second source of metric truth;
- link all definitions to canonical SignalAF/standard pages;
- add category-definition pages for `AI operator standard`, `AI operator metrics`, and `model vs agent vs operator evals`;
- update stale class/taxonomy copy when canon is reconciled;
- use the standard as citation/distribution infrastructure.

## `mos2es.org`

Role: **public commercial enterprise pilot front face**

The public website markets, explains, and converts MO§ES™ enterprise pilots using its own professional terminology. A private or controlled telemetry and deployment environment may sit behind the engagement; mos2es.org itself is not the private deployment surface.

Required `mos2es.org` integration:

- public enterprise offer for private or controlled pilot deployments;
- 25–100 operator, 30-day baseline;
- cohort/field comparison;
- workflow fit;
- organizational topology;
- capability concentration;
- model dependency;
- learning curves;
- privacy modes;
- governance boundary;
- outcome correlation with explicit no-causality overclaim guardrail.
- preserve MO§ES™ enterprise terminology and maintain internal lineage rather than mechanically replacing it with Upsilon Standard copy.

## `mos2es.com`

Role: **governance-framework context**

This describes the current surface only. A broader mos2es.com/MO§ES™ umbrella-hub redesign is a separate ecosystem conversation and is outside this standard package.

The connected `mos2es-site` repo is an 11ty static site for mos2es.com and describes MO§ES as a governance framework.

Standard integration should be conceptual:

- operator measurement can feed governed enterprise analysis;
- MO§ES does not redefine SigRank metrics;
- governance consumes state/measurement rather than manufacturing metric truth.
