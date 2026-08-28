# Execution Handoff

**Status date:** 2026-08-28

**Purpose:** dependency-ordered build brief for the next implementation owner

**Starting condition:** Course of Ship is approved or the owner supplies explicit revisions

**Merge rule:** do not merge, publish, or deploy without separate explicit approval.

## Mission

Turn the Phase 0 technical foundation into the complete two-part Standard operating system:

1. preserve and validate the portable `sigrank/0.1-draft` contract;
2. build the conformance, governance, methodology, security, enterprise-lineage, proof, and distribution layers required to operate it responsibly.

Do not restart the completed MCP transport renovation. Do not rebuild the enterprise platform before auditing it.

## Read first, in order

1. `standard/strategy/COURSE_OF_SHIP.md`
2. `standard/strategy/REPO_DOMAIN_OWNERSHIP_MAP.md`
3. `standard/strategy/90_DAY_RECONCILED_ROADMAP.md`
4. `standard/SPEC.md`
5. `standard/CONFORMANCE.md`
6. `standard/ARCHETYPE_STATUS.md`
7. `standard/RS05_STATUS.md`
8. `standard/reference/IMPLEMENTATION_MAP.md`

If any implementation request conflicts with the first three documents or explicit owner direction, stop and surface the conflict. Do not resolve it through copy changes alone.

## Foundation PRs

| Repository | Branch | Draft PR | Verified role |
|---|---|---|---|
| `sigrank-app` | `feat/sigrank-phase-0-bridge` | [#78](https://github.com/SunrisesIllNeverSee/sigrank-app/pull/78) | SignalAF/Upsilon reference app, HTTP Standard bridge, SigRank proof surface |
| `sigrank-mcp` | `feat/upsilon-product-architecture` | [#42](https://github.com/SunrisesIllNeverSee/sigrank-mcp/pull/42) | local Upsilon-compatible producer with stable `sigrank` package/protocol identity |
| `sigarena` | `feat/sigrank-phase-0-distribution-hygiene` | [#7](https://github.com/SunrisesIllNeverSee/sigarena/pull/7) | category and distribution layer |
| `moses` | `feat/upsilon-pilot-architecture` | [#2](https://github.com/SunrisesIllNeverSee/moses/pull/2) | public Upsilon enterprise-pilot commercial face |

All remain draft. All are mergeable at the status date. Configured GitHub checks are green; `moses` has no configured GitHub check suite and passed repository-native contracts plus a Cloudflare dry-run.

## Locked implementation boundaries

- Core telemetry: I/O/W/R.
- Core metrics: Yield, Leverage, Velocity, SNR, 10xDEV.
- Construction is excluded pending canon reconciliation.
- Build Archetypes are an optional 10-type SignalAF reference extension.
- RS05 is an optional 24-stage SignalAF reference extension.
- Upsilon is product/pilot; SigRank is public proof; MO§ES™ is governance/methodology; SignalAF is umbrella/host.
- mos2es.org is public commercial frontage; controlled/private deployment may sit behind it.
- mos2es.com hub work is out of scope.
- Measurement does not prove cognition, quality, productivity, employment fitness, or business value.

## Task sequence

### Task 0 — Confirm gates and release posture

Deliver:

- a short decision record showing Gate A status;
- a list of any owner revisions;
- explicit confirmation that current work is build-only, review-only, or authorized for merge/release.

Stop if no course decision exists. Do not infer merge approval from approval to build.

### Task 1 — Audit the foundation, do not refactor it

For each PR:

- update from its remote branch;
- run its native install, typecheck, test, build, contract, and packaged-artifact commands;
- compare implementation with the repository ownership map;
- fix only failures caused by the Phase 0 changes;
- produce a merge-readiness matrix.

Do not modify unrelated user files. In particular, preserve untracked or dirty-worktree artifacts unless their ownership is established.

### Task 2 — Establish Standard authority and conformance

After Gate C:

- create/designate the authority repository;
- transfer normative documents with attribution and history notes;
- implement fixture pack and conformance runner;
- validate real installed producer outputs against the authoritative schema;
- add compatibility/conformance mark rules;
- keep `signalaf.com/standard` as the recommended stable human URL unless the owner decides otherwise.

First PR scope: repository skeleton, normative draft, schema, fixtures, runner interface, CI, governance, and citation metadata only.

### Task 3 — Build trust package and enterprise lineage in parallel

Trust lane:

- methodology/fairness/uncertainty/reliability;
- provenance and evidence labels;
- anti-gaming threat/control map, appeals, and field governance;
- Security, Privacy Modes, Responsible Use, and review-pack artifacts.

Enterprise lane:

- audit existing Upsilon platform;
- version portable-observation intake;
- preserve null/zero/source/window/version semantics;
- separate portable metrics from enterprise derivations;
- validate pilot manifests;
- test tenant, identity, access, audit, retention/deletion, small-cell, and reporting controls.

### Task 4 — Complete category architecture

Only after the contract and page-intent ledger are frozen:

- finish the six canonical hubs;
- consolidate or redirect duplicates;
- add answer blocks, boundaries, sources, structured data, citations, and one CTA per intent;
- test canonical URLs, sitemap truth, crawl access, and internal links;
- start versioned query/citation/referral monitoring.

### Task 5 — Prove the operating model

- run synthetic end to end;
- pass Day-60 trust and privacy gates;
- recruit a live design partner only after approval;
- run the cohort under a frozen plan;
- publish only evidence-appropriate SigRank proof and reports;
- measure results against versioned baselines.

## Repository-native verification

### `sigrank-app`

```bash
fnm exec --using=22.23.1 npx tsc --noEmit
npm run test:canonical
npm test
npm run test:ui
fnm exec --using=22.23.1 npm run build
```

### `sigrank-mcp`

```bash
npm test
npm run test:packaged
```

### `sigarena`

```bash
npm run typecheck
npm test
npx vitest run
npm run lint
npm run build
```

### `moses`

```bash
node --test tests/upsilon-architecture.test.mjs
wrangler deploy --dry-run
```

## Required evidence in every handoff

- repository, branch, commit, and PR;
- exact authority files used;
- tests run and results;
- schema/fixture versions;
- unresolved decisions and who owns them;
- claims added or changed and their evidence level;
- merge/release/deploy status stated separately;
- next dependency, not merely the next available ticket.

## Decisions retained for owner approval

1. standalone Standard authority: recommended yes;
2. license and marks: recommended Apache-2.0 for executable code and CC BY 4.0 for specification text, subject to legal/owner review;
3. canonical human URL: recommended retain `signalaf.com/standard`;
4. pilot compatibility: recommended allow non-SigRank MO§ES pilots, but require a conforming declaration whenever compatibility is claimed;
5. release path: keep `0.1-draft`, earn intermediate `0.x` releases, reserve `0.9` for the pre-stability maturity gate;
6. exact timing and scope of any live design-partner recruitment;
7. every merge, package publication, stable release, and production deployment.

## Definition of successful handoff

The next builder should be able to answer, before changing code:

- which layer owns this work;
- which repository is authoritative;
- which gate permits it;
- which fixture or control proves it;
- which claims are allowed;
- what remains explicitly out of scope;
- whether build approval, merge approval, release approval, and deployment approval have each been granted.
