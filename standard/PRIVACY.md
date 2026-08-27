# Privacy and Content Independence

## Base invariant

The SigRank core is designed to compute operator metrics from token telemetry without requiring semantic payloads.

A base-compatible implementation MUST NOT require:

- prompt text;
- response text;
- source code;
- repository contents;
- files;
- credentials; or
- proprietary semantic work product

to compute the normative core metrics.

## Optional enrichment

A system MAY combine SigRank measurements with external metadata or outcomes, including:

- model;
- provider;
- tool;
- timestamps;
- workflow stage;
- task result;
- PR / deployment data;
- cost;
- incident data;
- business KPIs.

Such enrichment MUST remain distinguishable from the core SigRank metric layer.

## Identity

The standard does not require public real-world identity.

Implementations MAY support anonymous, pseudonymous, private, cohort-only, or identified participation.

## Enterprise

Private enterprise deployment SHOULD NOT require public leaderboard participation.
