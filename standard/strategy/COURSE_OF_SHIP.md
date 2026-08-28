# Course of Ship

**Decision date:** 2026-08-28

**Status:** proposed governing direction for owner approval

**Applies to:** the SigRank Standard program, Upsilon product program, public proof surfaces, and the reconciled 90-day implementation plan

**Release rule:** no merge, publication, or production deployment follows from this document without explicit owner approval.

## The course

Build one privacy-preserving systems-intelligence measurement system with four clearly separated layers:

```text
SignalAF
umbrella brand and public application host
        ↓
MO§ES™
constitutional governance, methodology, and enforcement
        ↓
Upsilon
commercial measurement engine and enterprise pilot
        ↓
SigRank
public benchmark, leaderboard, and proof surface
```

The program does not need four competing products. It needs four layers that make one system legible:

- **SignalAF** tells the market where the ecosystem lives.
- **MO§ES™** establishes what is allowed, how evidence is governed, and how claims are bounded.
- **Upsilon** performs measurement and delivers the enterprise diagnostic experience.
- **SigRank** demonstrates the measurement publicly through a benchmark and leaderboard.

## The two-part Standard

The new Standard is not complete when the five formulas are published. It has two parts.

### Part I — Portable measurement contract

Part I defines what any compatible producer can exchange without sending prompts, code, files, or response content:

- four non-negative integer primitives: input (`I`), output (`O`), cache write (`W`), and cache read (`R`);
- Yield, Leverage, Velocity, SNR, and 10xDEV;
- version, timestamp, source, warning, null, and provenance semantics;
- JSON Schema, examples, canonical vectors, and compatibility language.

The stable draft wire identifier is `sigrank/0.1-draft`.

Part I excludes:

- Construction, pending canon reconciliation;
- the 10-type Build Archetype taxonomy, which is a SignalAF reference extension;
- the 24-stage RS05 ladder, which is a SignalAF reference extension;
- rank, percentile, cohort membership, credentials, employment inference, work quality, and business outcomes.

### Part II — Governed operating and evidence system

Part II makes Part I trustworthy and commercially usable:

- independent release authority and executable conformance;
- methodology, uncertainty, fairness, provenance, anti-gaming, and appeals;
- Privacy Modes, security review materials, retention/deletion, and responsible use;
- Upsilon enterprise lineage from portable observations to separately versioned enterprise derivations;
- SigRank field governance, confidence/coverage, public proof, and citation artifacts;
- partner adapters, reproducible pilot reporting, and evidence-level controls.

Part I answers **“Can systems exchange the same measurement?”**

Part II answers **“Can people trust, govern, deploy, and interpret it correctly?”**

## North-star outcome

At the end of the first 90-day program, a skeptical third party should be able to:

1. produce a content-independent `sigrank/0.1-draft` record;
2. validate it without private SignalAF code;
3. trace how Upsilon turns those observations into a controlled enterprise diagnostic;
4. verify what MO§ES™ permits and prohibits;
5. understand how SigRank converts eligible evidence into public proof;
6. distinguish every measurement claim from cognition, quality, productivity, employment fitness, and business impact;
7. run or review a 25–100-operator, 30-day pilot reproducibly.

## Program invariants

These decisions remain fixed unless the owner explicitly changes them:

1. Upsilon is the commercial measurement product and pilot.
2. SigRank is the public benchmark, leaderboard, and proof surface.
3. MO§ES™ is the constitutional governance and methodology layer.
4. SignalAF is the umbrella brand and current application host.
5. `sigrank/0.1-draft`, the `sigrank` package/command, existing MCP tool names, routes, and stored records remain compatible during the product-name migration.
6. The portable core contains only I/O/W/R plus five metrics.
7. Construction, Build Archetypes, RS05, rank, and percentile are not base-compatibility requirements.
8. Content-free telemetry is not the same claim as zero metadata risk.
9. The EKG metaphor describes observable token-processing rhythm, not cognition or medical diagnosis.
10. No score is proof of work quality, talent, employee productivity, or business value.
11. mos2es.org is the public commercial face for the Upsilon enterprise pilot and may use its own professional terminology.
12. A private or controlled deployment may sit behind mos2es.org.
13. The mos2es.com/MO§ES umbrella-hub redesign is a separate product and design conversation.
14. No merge, release, or deployment occurs without explicit owner approval.

## Authority order

When sources conflict, use this order:

1. explicit owner architecture decisions and approved canon;
2. normative Standard specification, schemas, and accepted decision records;
3. executable tests and current shipped repository behavior;
4. the original 37-opportunity plan as the program checklist;
5. generated roadmaps, handoffs, briefs, and marketing copy.

Lower layers may expose a conflict. They may not silently redefine a higher layer.

## Decision gates before scale

### Gate A — approve the course

Approve this layer model, the two-part Standard, the invariants, and repository ownership map. Until Gate A is approved, existing Phase 0 PRs remain reviewable technical foundations.

### Gate B — authorize the foundation release

Review the four Phase 0 draft PRs as one architecture release. Approve, revise, or reject their merge sequence explicitly. Merging `sigrank-mcp` is also a package release action.

### Gate C — designate Standard authority

Choose whether the existing [`SunrisesIllNeverSee/sigrank-standard`](https://github.com/SunrisesIllNeverSee/sigrank-standard) candidate becomes the normative release authority. Recommended default: approve it after a course-alignment audit, while `signalaf.com/standard` remains the canonical human distribution URL.

### Gate D — freeze conformance and interpretation

Require one schema, one fixture pack, cross-repository validation, missing/zero semantics, evidence labels, and the extension boundary before expanding category pages or partner integrations.

### Gate E — approve pilot readiness

Require the security/privacy review pack, responsible-use controls, pilot manifest, tenant boundary evidence, and synthetic end-to-end report before recruiting a live cohort.

### Gate F — permit public proof and scale

Require field eligibility, confidence/coverage, provenance, appeal, anti-gaming, citation, and monitoring controls before presenting SigRank as external proof at scale.

## What happens now

1. Treat the four current Phase 0 PRs as the technical foundation candidate.
2. Treat the standalone `sigrank-standard` repository at `3a150f4` as a technically working authority candidate, not as approved authority merely because it exists on `main`.
3. Use the repository ownership map to stop domain and product-role drift.
4. Use the reconciled 90-day roadmap as the only program backlog derived from the original plan.
5. Give builders the execution handoff only after Gate A; give merge instructions only after Gate B.
6. Audit the existing Upsilon enterprise platform before authorizing any rebuild.

## What is deliberately not happening now

- no MO§ES umbrella-hub redesign;
- no protocol rename;
- no Construction reconciliation by implication;
- no credential launch;
- no broad SEO page factory before the URL/intent ledger;
- no enterprise-platform rebuild before audit;
- no claims of independent adoption, certification, productivity lift, or medical-grade diagnosis;
- no merge or deployment through this planning work.

## Approval record

The owner may approve this course without approving any merge. Record the decision in the governing PR before execution advances beyond Phase 0.
