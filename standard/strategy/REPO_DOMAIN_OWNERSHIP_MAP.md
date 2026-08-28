# Repository and Domain Ownership Map

**Status date:** 2026-08-28

**Purpose:** define where authority, product behavior, public proof, category distribution, and enterprise conversion belong

**Rule:** repository location does not automatically grant normative authority.

## Current-to-target map

| Repository or surface | Current public surface | Current responsibility | Target responsibility | Must not own |
|---|---|---|---|---|
| `SunrisesIllNeverSee/sigrank-app` | `signalaf.com` | SignalAF web app, SigRank board, Standard draft distribution, remote HTTP MCP, Upsilon product introduction | SignalAF umbrella host; Upsilon reference application; SigRank public proof; human-readable Standard distribution | Independent conformance authority by default; MO§ES umbrella-hub redesign; private enterprise controls without an explicit boundary |
| `SunrisesIllNeverSee/sigrank-mcp` | npm `sigrank`; local stdio MCP | local collection, CLI, portable-record production, SigRank submission, MCP tools | Upsilon-compatible local instrument and reference producer for the stable `sigrank` protocol | Public leaderboard governance; enterprise cohort methodology; unilateral protocol renaming |
| `SunrisesIllNeverSee/sigarena` | `sigeconomy.com` | category explanation, ecosystem discovery, hosted public MCP | neutral category interpretation, generic-query capture, benchmark-layer education, and distribution into SignalAF/Upsilon/SigRank | normative Standard definitions; duplicate formulas; enterprise product authority |
| `SunrisesIllNeverSee/moses` | `mos2es.org` | public enterprise pilot marketing and qualification | Upsilon's public commercial enterprise-pilot face, governed by MO§ES™, with its own professional terminology and a versioned translation/lineage boundary | claiming the website itself is private; forcing SigRank public language into sales copy; becoming the mos2es.com umbrella hub |
| existing Upsilon enterprise platform | controlled/private deployment surface | substantial pilot implementation requiring direct audit | tenant-scoped pilot operations, private dashboards, workflow joins, controlled reporting, and enterprise derivations | redefining the portable Standard; mixing enterprise derivations into the portable namespace |
| `SunrisesIllNeverSee/sigrank-standard` authority candidate | public GitHub repository; archive/DOI pending | created on `main` at `3a150f4` from the superseded handoff; 12/12 conformance fixtures pass; not yet designated by the owner | after Gate C, normative spec releases, schemas, fixtures, conformance runner, RFC/governance, citation, and compatibility marks | declaring its own authority; leaderboard data; enterprise customer data; hidden anti-gaming logic; product sales |
| SigRank public board and Reference Field | `signalaf.com/board/*`, field/research surfaces | ranking, field analysis, public evidence | proof surface fed by eligible Upsilon/compatible observations under explicit field governance | being sold as the enterprise measurement engine; proving employment fitness or output quality |
| mos2es.com / MO§ES hub | separate conversation | umbrella/ecosystem concept not governed by this program | future constitutional ecosystem hub if separately designed and approved | blocking the Standard or Upsilon pilot program; being silently redesigned inside these PRs |

## Normative source ownership

| Artifact | Present source | Target authority | Distribution copies |
|---|---|---|---|
| portable telemetry and five formulas | `sigrank-app/standard` and shared implementation code | standalone Standard authority after Gate C | SignalAF, npm/CLI/MCP, SigEconomy, enterprise adapters |
| JSON Schema and conformance fixtures | `sigrank-app/standard/schema` and examples | standalone Standard authority after Gate C | all producers and consumers pinned by version |
| product-role architecture | `standard/strategy` plus owner decision | owner-approved architecture record | all four repositories |
| MO§ES™ governance and methodology | MO§ES authority/canon | MO§ES™ | Upsilon and SigRank surfaces reference it without duplicating authority |
| Upsilon product behavior | application, CLI/MCP, and enterprise platform | Upsilon product owners | SignalAF and mos2es.org commercial surfaces |
| SigRank field eligibility and rank policy | SignalAF application | SigRank governance under MO§ES™ | public board, field reports, citations |
| category and generic-query interpretation | SigEconomy plus canonical SignalAF hubs | product/growth editorial governance | partner and comparison pages |
| pilot sales terminology and qualification | mos2es.org | Upsilon enterprise commercial owner | proposals, SOWs, pilot collateral |

## Existing authority candidate

The standalone repository is useful work that arrived before the governing decision:

- repository: [`SunrisesIllNeverSee/sigrank-standard`](https://github.com/SunrisesIllNeverSee/sigrank-standard);
- current commit: `3a150f4` on `main`;
- evidence: 12/12 executable fixtures pass and the Python example reproduces the canonical Yield value of 18436.98;
- governance status: candidate, not owner-designated authority;
- alignment gap: the repository description and README use “AI operator performance,” which should be narrowed to the approved token-processing/efficiency construct before designation;
- process gap: the initial implementation was pushed directly to `main` under the now-superseded handoff rather than passing through the course and authority gates.

Do not create a second standalone repository. Audit, align, and either designate or explicitly decline this one.

## Data movement boundary

```text
local/provider telemetry
        ↓
content-independent I/O/W/R observation
        ↓
Upsilon measurement and validation
        ├── private enterprise namespace
        │     MO§ES-governed derivations, cohorts, workflow context, reports
        │
        └── eligible portable record
              sigrank/0.1-draft + provenance
                      ↓
              SigRank public proof
              field/board/research, subject to consent and governance
```

The arrow into SigRank is not automatic. Public participation, identity, field eligibility, verification, coverage, and ranking are separate governed decisions.

## Naming and compatibility map

| Concern | Public/product name | Stable technical name |
|---|---|---|
| commercial engine and pilot | Upsilon | may emit `sigrank/0.1-draft` records |
| public leaderboard/proof | SigRank | existing board, API, and ranking surfaces |
| local package and CLI | Upsilon-compatible SigRank instrument | npm package and command `sigrank` |
| portable record | SigRank Standard draft | `sigrank/0.1-draft` |
| governance/methodology | MO§ES™ | separately versioned governance artifacts |

Product naming does not require a breaking wire migration. If a future technical rename is desired, it needs a separately approved version, dual-read/dual-write period, migration guide, and retirement criteria.

## Cross-repository change rules

1. Normative formulas or schema semantics change first in the designated Standard authority.
2. Producers and consumers pin and validate the same released fixture pack.
3. Product terminology may change without rewriting historical records.
4. Enterprise derivations use a separate namespace and definition version.
5. Category pages import or link to canon; they do not restate independent formulas.
6. Public proof requires provenance and field-governance evidence beyond schema validity.
7. Any change spanning two or more repositories must name one source repository and downstream consumers in its PR description.

## Current Phase 0 evidence

| Repository | Draft PR | Head at time of map | Role of the PR |
|---|---|---|---|
| `sigrank-app` | [#78](https://github.com/SunrisesIllNeverSee/sigrank-app/pull/78) | `845cd5e` before this strategy update | HTTP bridge, Standard resources, Upsilon surface, role separation, strategy handoff |
| `sigrank-mcp` | [#42](https://github.com/SunrisesIllNeverSee/sigrank-mcp/pull/42) | `8c0e6cb` | Upsilon product identity with stable package/protocol compatibility |
| `sigarena` | [#7](https://github.com/SunrisesIllNeverSee/sigarena/pull/7) | `af8246b` | category and distribution role propagation |
| `moses` | [#2](https://github.com/SunrisesIllNeverSee/moses/pull/2) | `7a429f9` | public Upsilon enterprise-pilot positioning and contracts |

All four PRs are draft and mergeable. GitHub checks are green where configured. The `moses` repository has no configured GitHub check suite; its local contracts and Cloudflare dry-run passed.
