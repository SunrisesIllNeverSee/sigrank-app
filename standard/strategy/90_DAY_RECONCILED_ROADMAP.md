# Reconciled 90-Day Roadmap

**Status date:** 2026-08-28

**Checklist authority:** the 37 opportunities in the SignalAF AI Strategic Opportunities plan

**Architecture authority:** Course of Ship and explicit owner decisions

**Execution rule:** gates are dependencies; elapsed days do not waive them.

## How to read this roadmap

The original plan remains the complete opportunity checklist. This roadmap changes its sequence and ownership to match the August 28 architecture:

- **Upsilon** owns measurement product and enterprise pilot outcomes.
- **SigRank** owns public benchmark and proof outcomes.
- **MO§ES™** owns governance, methodology, interpretation limits, and enforcement.
- **SignalAF** remains the umbrella and application host.

The first 90 days are now a gated program with one critical path and several parallel lanes. “Day 30” means the Day-30 gate is satisfied, not merely that 30 calendar days elapsed.

## Critical path

```text
Course approval
    ↓
Phase 0 foundation release decision
    ↓
Standard authority + executable conformance
    ↓
methodology/security/pilot controls
    ↓
synthetic Upsilon pilot
    ↓
live design-partner cohort
    ↓
SigRank public proof + category distribution
```

Category research, the URL audit, security-document inventory, and enterprise-platform audit may run in parallel once the course is approved. Public claims and broad distribution may not outrun their evidence gates.

## Phase 0A — Course alignment

**Outcome:** one approved architecture, authority order, repository map, and release policy.

- [ ] Approve or revise `COURSE_OF_SHIP.md`.
- [ ] Approve or revise `REPO_DOMAIN_OWNERSHIP_MAP.md`.
- [ ] Confirm the two-part Standard model.
- [ ] Confirm that the original 37 items remain the completion checklist.
- [ ] Decide whether the existing standalone authority candidate at `3a150f4` is designated after its course-alignment audit.
- [ ] Record licensing, canonical-URL, and pilot-compatibility decisions.

**Gate A:** owner approves the course. This does not authorize merge.

## Phase 0B — Technical foundation candidate

**Outcome:** four compatible, reviewable PRs establish the Upsilon/SigRank/MO§ES™ roles without breaking the wire contract.

- [x] SignalAF HTTP MCP and Standard-resource bridge.
- [x] Upsilon product identity in the local CLI/MCP package.
- [x] SigEconomy distribution and extension-boundary hygiene.
- [x] mos2es.org Upsilon public-pilot positioning and machine-readable identity.
- [x] Native test/build checks pass where configured.
- [ ] Owner reviews and explicitly authorizes, revises, or rejects the merge sequence.

**Gate B:** explicit release authorization. Merging `sigrank-mcp` triggers package publication and must be treated as a release.

## Days 1–30 — Freeze authority, contract, and pilot prerequisites

### Standard and conformance

- Audit the existing `sigrank-standard` candidate, narrow its “AI operator performance” wording, and either designate it or explicitly retain authority in `sigrank-app`.
- Publish an earned draft release path, changelog, RFC/change control, contribution policy, compatibility policy, and citation metadata.
- Build the executable fixture pack for schema, aliases, canonical vector, zero/missing/null behavior, warnings, rounding, version, privacy separation, and provenance.
- Make installed npm/CLI/MCP output and SignalAF HTTP output validate against the same authoritative schema and fixtures.
- Reserve `SigRank Conformant`; retain `SigRank Compatible — v0.1-draft` until independent conformance exists.

### Category architecture

- Inventory all current public URLs and classify each as canonical hub, supporting evidence, conversion page, redirect, retire, or protected intentional surface.
- Freeze the six target hubs and their unique search intent.
- Repair duplicate canonical/sitemap/internal-link issues before creating a page factory.
- Freeze the AI-query monitoring panel and evidence-safe page template.

### Trust and enterprise readiness

- Audit the existing Upsilon enterprise platform; do not rebuild it from assumptions.
- Freeze the pilot data allowlist, never-collected fields, tenant boundary, pseudonym policy, access purposes, retention/deletion, and prohibited uses.
- Inventory existing SOW, DPA, participant notice, data dictionary, analysis plan, dashboard, report, and security materials.
- Define the pilot manifest and portable-record lineage contract.

### Day-30 gate

- one designated Standard authority, with the existing candidate either approved or explicitly declined;
- identical producer/consumer contract tests;
- no unresolved base-versus-extension ambiguity;
- one URL/intent ledger covering the current public footprint;
- enterprise-platform audit and privacy/security gap report complete;
- synthetic pilot plan approved;
- no unsupported productivity, quality, cognition, employment, or business-impact claims.

## Days 31–60 — Prove trust and run the synthetic operating model

### Standard and governance

- Publish conformance runner and language-neutral fixtures.
- Add TypeScript, Python, JSON, CLI, HTTP MCP, and stdio MCP implementation examples.
- Publish methodology, reliability, uncertainty, missingness, fairness, provenance, anti-gaming, appeal, and change-control packages.
- Define compatible/conformant mark rules and independent implementation requirements.

### Upsilon enterprise product

- Implement or verify the enterprise adapter from portable observations into a separate MO§ES-governed derivation namespace.
- Exercise tenant isolation, pseudonymous identity, RBAC, immutable audit events, retention/deletion, workflow joins, small-cell suppression, and private reporting.
- Run synthetic data from collection through data-quality dashboard, cohort analysis, executive readout, analyst appendix, intervention backlog, and 60-day follow-up plan.
- Complete the public mos2es.org review path and controlled-deployment documentation behind it.

### Category and authority distribution

- Complete priority canonical hubs with server-rendered answer blocks, boundaries, sources, structured data, citation blocks, and one intent-matched action.
- Publish neutral benchmark-layer and privacy-preserving telemetry resources.
- Establish monthly query/citation/referral monitoring.
- Scope independent methodology/security review.

### Day-60 gate

- a clean third-party checkout passes the conformance suite;
- installed npm and both remote/local reference outputs pass the authoritative fixtures;
- synthetic Upsilon pilot is reproducible end to end;
- security/privacy reviewer can complete a first-pass review from the pack;
- public pages state measurement and non-inference boundaries consistently;
- at least one independent review or implementation has a defined scope.

## Days 61–90 — Run the first governed cohort and publish proof

### Enterprise pilot

- Recruit only after the Day-60 gate.
- Enroll a 25–100-operator design-partner cohort under approved purpose, access, notice, and analysis controls.
- Freeze the analysis plan and reference-cohort version before observation.
- Report data quality, coverage, missingness, and connector health weekly.
- Deliver evidence-labeled executive and analyst reports with two to four responsible interventions or experiments.
- Decide expansion within 30 days of readout.

### SigRank proof and governance

- Implement field eligibility, provenance tiers, confidence/coverage indicators, pseudonymous/private participation, appeals, and sanction rules.
- Keep rank as discovery and longitudinal comparison, not proof of quality or employment fitness.
- Publish a reproducible field report and data/citation artifact only when evidence and consent permit it.

### Distribution and ecosystem

- Publish at least one partner-hosted integration page and one independent implementation result.
- Release the first off-site research/citation artifact.
- Measure share of voice against the frozen baseline; treat 5% as a target unless observed.
- Define Operator Path alpha only after measurement and interpretation controls are stable.
- Keep credentials in design until scope, verification, expiration, revocation, and employer interpretation are ready.

### Day-90 gate

- first cohort completed reproducibly and expansion decided;
- no report contains unsupported causal claims;
- Standard, conformance, methodology, privacy, security, and responsible-use assets are versioned;
- SigRank proof controls are operational;
- at least one external implementation or review has verifiable evidence;
- all 37 opportunities have a shipped artifact, governed backlog item, or explicit non-action.

## The 37-opportunity reconciliation checklist

| # | Original opportunity | Architecture owner | Current evidence | Reconciled action | Target gate |
|---:|---|---|---|---|---|
| 1 | Clarify what is open | Standard authority | open/proprietary draft and standalone candidate exist | designate authority, then independently version every open and closed component | Day 30 |
| 2 | Benchmark map against leaders | SigEconomy + SignalAF | layer language exists | publish neutral model/task/system/operator/team/outcome map | Day 60 |
| 3 | Move from private to trusted | Upsilon + MO§ES™ | privacy boundary and pilot mapping exist | complete assurance pack and controlled deployment evidence | Day 60 |
| 4 | Documentation that generalizes | SigEconomy + SignalAF | generic explainers seeded | enforce unique intent, answer blocks, evidence, and canonical links | Day 60 |
| 5 | Complement rather than replace | architecture governance | limitations state boundary | add measured-alongside templates to product, pilot, and partner docs | Day 60 |
| 6 | Expose differentiated proposition | SignalAF + Upsilon | architecture and `/upsilon` surface exist | lead with private systems-intelligence measurement and bounded EKG metaphor | Day 30 |
| 7 | Invest in reach, not sentiment repair | distribution | initial pages exist | fixed-panel monitoring, partners, citations, and integrations | Day 90 |
| 8 | Own AI-operator metric niche | Standard + SigRank | portable core and proof surface exist | earn independent conformance and adoption | Day 90 |
| 9 | Separate open standard from leaderboard moat | Standard + SigRank | draft boundary exists | encode source, license, conformance, and field-governance separation | Day 30 |
| 10 | Benchmark map against leaders | SigEconomy + SignalAF | duplicate of 2 | combine with item 2; do not create duplicate program work | Day 60 |
| 11 | Documentation that generalizes | SigEconomy + SignalAF | duplicate of 4 | combine with item 4 | Day 60 |
| 12 | Move from named to default | distribution | four category pages seeded | own generic questions through six canonical hubs and citations | Day 90 |
| 13 | Privacy slot beside observability | Upsilon + partners | privacy explainer exists | publish architecture and OpenTelemetry/observability examples | Day 90 |
| 14 | Move share of voice toward 5% | SignalAF growth | baseline reported | freeze panel, measure monthly, never declare unobserved result | Day 90 |
| 15 | Neutral non-brand documentation | SigEconomy | initial category-first copy exists | reusable definitions, trade-offs, evidence, and decision guidance | Day 60 |
| 16 | Leverage privacy story | Upsilon + MO§ES™ | content-independent boundary exists | convert narrative into reviewable controls and data flow | Day 60 |
| 17 | Build canonical explainers | SignalAF + SigEconomy | partial hubs exist | complete six-hub architecture after URL ledger | Day 60 |
| 18 | Enter generic benchmark answers | SigEconomy | operator/model distinction exists | neutral benchmark-stack comparisons and sources | Day 60 |
| 19 | Cross-brand/category material | partnerships | insufficient evidence | partner-hosted pages and co-authored technical resources | Day 90 |
| 20 | Clarify what is open | Standard authority | duplicate of 1 | combine with item 1 | Day 30 |
| 21 | Convert privacy into institutional trust | Upsilon + MO§ES™ | public claims exist | independent review, review pack, retention, access, deletion evidence | Day 60 |
| 22 | Leaderboard without vanity | SigRank | limitations exist | confidence, coverage, provenance, consent, appeals, anti-gaming | Day 90 |
| 23 | Own niche, not broad enterprise suite | architecture governance | layer separation now explicit | preserve operator layer while Upsilon integrates with adjacent systems | Gate A |
| 24 | Protect favorable sentiment with constrained claims | MO§ES™ | boundary language exists | claim-risk taxonomy and approval controls across surfaces | Day 60 |
| 25 | Position SigRank as principled but limited | SigRank | Standard limitations exist | product-wide non-inference and measured-alongside UX | Day 60 |
| 26 | Security reviews and deployment guides | Upsilon + MO§ES™ | partial mapping | assurance pack, VPC/on-prem guide, findings and remediation | Day 60 |
| 27 | Reproducibility and anti-gaming | Standard + SigRank | formulas reproducible | conformance, uncertainty, threat mapping, protected controls | Day 60/90 |
| 28 | Govern gaming and proof | SigRank | partial architecture | eligibility, flags, appeals, sanctions, independent audit | Day 90 |
| 29 | Preserve power-user identity with enterprise exports | Upsilon + SigRank | CLI/API/MCP/export exist | warehouse recipes and privacy-safe identity translation | Day 90 |
| 30 | Reframe vanity leaderboard as live benchmark | SigRank | proof-surface role defined | versioned field method, coverage, report, governance | Day 90 |
| 31 | Make SigRank explain itself | Standard + SigRank | core spec exists | full methods, error bounds, provenance, citations, audits | Day 60 |
| 32 | Sell AI ROI safely | Upsilon + MO§ES™ | enterprise platform requires audit | evidence ladder, uncertainty, decision model, controlled experiments | Day 90 |
| 33 | Skills and improvement ecosystem | Upsilon/education | not started as program | Operator Path after measurement/governance stability | after Day 60 |
| 34 | Trusted live benchmark | SigRank | foundation exists | independent proof, case study, field governance, bounded claims | Day 90 |
| 35 | Methodology and anti-gaming central | MO§ES™ + SigRank | basic methods exist | publish and operationalize fairness, failure modes, review | Day 60/90 |
| 36 | Privacy Modes and enterprise review pack | Upsilon + MO§ES™ | architectural language exists | implement Modes A/B/C and complete review pack | Day 60 |
| 37 | ROI and workflow-impact analytics | Upsilon | existing platform requires audit | preserve lineage and evidence levels through reproducible pilot | Day 90 |

## Workstream ownership after reconciliation

| Workstream | Accountable layer | 90-day outcome |
|---|---|---|
| W1 category / SEO / GEO / AEO | SignalAF + SigEconomy | one URL/intent ledger, six canonical hubs, frozen monitoring panel |
| W2 Standard / methods / fairness / research | Standard authority + MO§ES™ | executable conformance and versioned methodology/trust evidence |
| W3 security / privacy | Upsilon + MO§ES™ | review pack, Privacy Modes, tested operating controls |
| W4 enterprise pilot | Upsilon | reproducible 25–100-operator, 30-day operating model |
| W5 integrations | Upsilon + Standard authority | conformance-preserving adapters and first external consumer |
| W6 learning / credentials | Upsilon education + SigRank proof | Operator Path alpha; credentials remain gated by interpretation controls |

## Explicit deferrals

- mos2es.com/MO§ES hub redesign;
- protocol renaming;
- Construction in the portable core;
- required Build Archetypes or RS05 conformance;
- broad credential launch;
- connectors without a named pilot or distribution path;
- public claims of certification, independent adoption, productivity lift, or business causation without evidence.
