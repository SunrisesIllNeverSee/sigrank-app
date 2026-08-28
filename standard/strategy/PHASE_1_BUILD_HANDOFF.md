# Phase 1 Build Handoff — Superseded

**Superseded:** 2026-08-28

**Reason:** the original handoff moved directly from the Phase 0 technical bridge into implementation before the course, authority, repository ownership, and complete 90-day checklist were reconciled.

Use these documents instead, in order:

1. [`COURSE_OF_SHIP.md`](./COURSE_OF_SHIP.md)
2. [`REPO_DOMAIN_OWNERSHIP_MAP.md`](./REPO_DOMAIN_OWNERSHIP_MAP.md)
3. [`90_DAY_RECONCILED_ROADMAP.md`](./90_DAY_RECONCILED_ROADMAP.md)
4. [`EXECUTION_HANDOFF.md`](./EXECUTION_HANDOFF.md)

The historical content below is retained as implementation context. It is not the governing execution sequence. No merge, publication, or deployment is authorized by either version of this handoff.

## Objective

Build the independent Standard authority and executable conformance layer on top of the frozen Phase 0 foundation. Do not rename existing compatibility surfaces or rebuild the enterprise platform.

## Locked product architecture

```text
SignalAF
umbrella brand
        ↓
MO§ES™
constitutional governance + methodology
        ↓
Upsilon
commercial measurement engine + enterprise pilot
        ↓
SigRank
public leaderboard + proof surface
```

Naming rules:

- Use **Upsilon** for the measurement engine, diagnostic product, and enterprise pilot.
- Use **SigRank** for the public leaderboard, public Reference Field, and proof surface.
- Use **MO§ES™** for governance, commitment conservation, methodology, and enforcement.
- Keep **SignalAF** as the umbrella brand and current application host.
- The EKG metaphor describes observable token-processing rhythm. It does not establish cognition, work quality, employee productivity, or business outcomes.

## Frozen portable core

Base telemetry contains four non-negative integer primitives:

- `input` (`I`)
- `output` (`O`)
- `cache_write` (`W`)
- `cache_read` (`R`)

The five portable metrics are:

| Metric | Formula |
|---|---|
| Yield | `(R × O) / I²` |
| Leverage | `R / I` |
| Velocity | `O / I` |
| SNR | `O / (I + O)` |
| 10xDEV | `log10(R / I)` |

Do not change these formulas or their null semantics during Phase 1.

Explicit exclusions:

- Construction is not a base metric pending canon reconciliation.
- Build Archetypes are a 10-type SignalAF reference extension.
- RS05 is a 24-stage SignalAF reference extension.
- Neither extension is required for `SigRank Compatible — v0.1-draft`.

## Compatibility boundary

The Upsilon product migration does not authorize renaming:

- the `sigrank/0.1-draft` wire identifier;
- the `sigrank` npm package or CLI command;
- existing MCP tool names or resource URIs;
- public API routes;
- stored records or signed payloads.

A future protocol rename requires a separately versioned migration with dual-read/dual-write compatibility.

## Phase 0 branches and draft PRs

| Repository | Branch and commit | Draft PR | State |
|---|---|---|---|
| `SunrisesIllNeverSee/sigrank-app` | `feat/sigrank-phase-0-bridge` at `af04d6a` | [#78](https://github.com/SunrisesIllNeverSee/sigrank-app/pull/78) | All configured checks passed; Vercel preview passed |
| `SunrisesIllNeverSee/sigrank-mcp` | `feat/upsilon-product-architecture` at `8c0e6cb` | [#42](https://github.com/SunrisesIllNeverSee/sigrank-mcp/pull/42) | All configured checks passed |
| `SunrisesIllNeverSee/sigarena` | `feat/sigrank-phase-0-distribution-hygiene` at `af8246b` | [#7](https://github.com/SunrisesIllNeverSee/sigarena/pull/7) | All configured checks passed |
| `SunrisesIllNeverSee/moses` | `feat/upsilon-pilot-architecture` at `7a429f9` | [#2](https://github.com/SunrisesIllNeverSee/moses/pull/2) | Local contracts and Cloudflare dry-run passed; repository has no GitHub CI |

These PRs are reviewable foundation branches, not authorization to merge.

## What Phase 0 delivered

### SignalAF application

- HTTP MCP tool for portable Standard records.
- Machine-readable Standard identity, schema, metadata, and discovery resources.
- `/upsilon` product surface plus sitemap and footer distribution.
- Explicit Upsilon/SigRank product-role separation.
- Stable legacy record and tool compatibility.

### CLI and MCP package

- Upsilon product identity across CLI, MCP, package metadata, and policy resources.
- Machine-readable architecture identity while retaining `sigrank` command and protocol names.
- Packaged-artifact and architecture regression tests.

### SigArena / SigEconomy

- Shared portable-core and product-role definitions.
- Category-first operator-metric and Standard discovery pages.
- Sitemap, LLM, MCP, and internal-link distribution.
- Explicit optional-extension labeling.

### Public Upsilon pilot site

- mos2es.org positioned as Upsilon's public commercial pilot front face.
- MO§ES™ retained as governance and methodology.
- Home, product, pilot, developer docs, OpenAPI, MCP, LLM, and manifest identity aligned.
- EKG claim paired with interpretation limits.

## Phase 1 build scope

### 1. Establish independent Standard authority

- Create or designate the standalone Standard repository.
- Move normative specification, schemas, examples, governance, privacy, limitations, and changelog into that authority.
- Preserve `signalaf.com/standard` as a stable human-readable distribution URL.
- Document release ownership, change control, compatibility policy, and deprecation policy.

### 2. Build executable conformance

Create a language-neutral fixture pack and a runnable conformance command covering:

1. schema validity;
2. exact primitive semantics;
3. alias translation;
4. canonical reference vector;
5. zero input/output/cache cases;
6. missing-cache telemetry;
7. null and warning semantics;
8. metric rounding;
9. version declaration;
10. content-independence;
11. provenance for field-dependent claims;
12. exclusion of Construction, Build Archetypes, and RS05 from the base record.

Keep `SigRank Conformant` reserved until this suite exists and passes independently. Phase 1 may continue using `SigRank Compatible — v0.1-draft` under the published requirements.

### 3. Add cross-repository conformance gates

- Validate CLI/MCP output against the authoritative schema and fixture pack.
- Validate the SignalAF HTTP MCP record against the same fixtures.
- Validate SigArena's shared definitions against the authority.
- Add an enterprise adapter fixture without forcing Upsilon's enterprise derivations into the portable namespace.

### 4. Publish the open/proprietary boundary

Open layer:

- telemetry semantics;
- five formulas and null policy;
- interchange record;
- schema and fixtures;
- conformance runner;
- privacy/content-independence requirements.

Product/reference layer:

- private or signed identity systems;
- public ranking and field membership;
- anti-gaming implementation details;
- enterprise cohort data and derived methodology;
- Build Archetypes and RS05 implementations;
- credentials and proprietary benchmark corpora.

## Acceptance criteria

Phase 1 is complete only when:

- a clean checkout can run the conformance suite without the SignalAF application;
- both SignalAF and `sigrank-mcp` pass the same authoritative fixtures;
- a third-party implementation can understand compatibility without private code;
- the canonical vector and every null/zero fixture have deterministic expected output;
- no base-compatible payload requires prompt text, code, files, or response content;
- Construction, Build Archetypes, and RS05 cannot leak into base compatibility;
- governance and versioning describe how changes are proposed, reviewed, released, deprecated, and reversed;
- every public claim distinguishes measurement from cognition, quality, productivity, and business outcomes.

## Native verification commands

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

## Release sequencing

If the owner later authorizes Phase 0 merges, use this order:

1. Merge `sigrank-mcp` PR #42.
2. Wait for automatic npm patch publication, MCP Registry publication, and application version sync.
3. Refresh and re-verify `sigrank-app` PR #78 against the updated `main` branches.
4. Merge the application only after its configured checks pass again.
5. Merge SigArena and the public Upsilon pilot site independently after their final checks.

Merging `sigrank-mcp` to `main` is a release action: its workflow automatically bumps the patch version, publishes npm and MCP Registry artifacts, and pushes a version commit.

## Do not do

- Do not merge or publish without owner approval.
- Do not rename the wire protocol during the product migration.
- Do not add Construction to the portable core.
- Do not make Build Archetypes or RS05 compatibility requirements.
- Do not describe Upsilon telemetry as proof of cognition, work quality, employee productivity, or business outcomes.
- Do not force SigRank terminology into the Upsilon enterprise sales experience.
- Do not redesign mos2es.com or the broader MO§ES umbrella hub in this phase.
- Do not rebuild the enterprise platform before auditing the existing implementation.

## Recommended first pull request for Phase 1

Start with the standalone authority and conformance skeleton only:

- repository structure;
- copied normative v0.1-draft documents with preserved history attribution;
- authoritative schema and fixture directory;
- conformance runner interface;
- CI that exercises the canonical vector and null/zero cases;
- governance and compatibility documents.

Do not combine category-site expansion, enterprise-platform changes, credentials, or protocol renaming into that first pull request.
