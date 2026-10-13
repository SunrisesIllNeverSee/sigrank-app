> **Canonical source:** technical-index `docs/FOUR-PASS-ARCHITECTURE-RECOVERY-PROTOCOL.md` — edit there; copies are distribution snapshots.

# Four-Pass Architecture Recovery Protocol

**Purpose:** Prevent product/system reviews from flattening, erasing, or misclassifying meaningful architecture during redesign, consolidation, or control-surface work.

**Use when:** inspecting a repo, product, operating system, agent system, marketplace, governance stack, control board, or any multi-surface product before redesign or consolidation.

**Core rule:** Do not begin by asking what should merge. First determine what exists, what each surface represents, how systems transition into one another, and what latent/gated architecture must survive.

## Status taxonomy

Every discovered item must receive exactly one primary lifecycle state:

- **CURRENT** — implemented and presently usable.
- **PARTIAL** — implemented in part; important contract or path is incomplete.
- **GATED** — intentionally staged behind another capability, policy, qualification, or dependency.
- **CONCEPTUAL** — documented idea or model without implementation commitment.
- **ROADMAP** — explicitly intended future system or capability.
- **RETIRED** — deliberately superseded or removed with evidence.

**Never infer RETIRED from:** empty UI, placeholder copy, lack of navigation prominence, low usage, WIP status, or a missing implementation edge.

**Key distinction:** **GATED ≠ DEFUNCT.**

# Pass 1 — Surface Pass

## Question
**What actually exists?**

Inventory the observable and addressable product surface before interpreting it.

Inspect routes/page shells, APIs, MCP/plugin/tool surfaces, workers/jobs, state stores, config-driven IA, authenticated/public/admin/operator/agent surfaces, hidden routes, aliases, WIP/empty/building surfaces, docs/manifests/well-known endpoints, prototypes, websockets/events, and economic/governance/provenance/audit endpoints.

### Required output — Surface Inventory

| Surface | Route / Location | Runtime state | Owner system | Auth / authority | Lifecycle state | Evidence |
|---|---|---|---|---|---|---|

Rules:
1. Record what is present before deciding whether it is important.
2. Do not collapse aliases until their semantics are checked.
3. Do not exclude empty/WIP/gated surfaces.
4. Separate rendered UI state from production backend capability.
5. If source and UI disagree, record the disagreement.

**Exit:** every known human-facing and machine-facing surface has an evidence-backed state.

# Pass 2 — System Pass

## Question
**What distinct system does each surface represent?**

Move from pages to product semantics.

For each surface determine: authoritative objects, reads, writes, decisions, outputs, downstream consumers, authority boundary, and whether it is authoritative, derived, projected, or merely navigational.

### Required output — System Registry

| System | Purpose | Authoritative objects | Writes | Reads | Outputs | Surfaces | Lifecycle state |
|---|---|---|---|---|---|---|---|

### Do-Not-Collapse Register

Maintain distinctions that must survive consolidation, for example:

```text
Personal workflow ≠ shared execution
Execution ≠ tactical planning
Tactical planning ≠ strategic portfolio
Evidence ≠ interpretation
Interpretation ≠ routing
Governance standing ≠ financial standing
Discovery ≠ algorithmic routing
Discussion ≠ formal governance
Entity ≠ ecosystem projection
```

Require affirmative evidence before conceptually merging similar systems.

**Exit:** every important surface belongs to a named system with a clear purpose and authority boundary.

# Pass 3 — Edge Pass

## Question
**What authoritative contract makes System A become System B?**

For every transition determine:
1. triggering action
2. acting principal
3. required authority/governance
4. input object IDs
5. created/mutated object
6. authoritative endpoint/handler
7. state transition
8. receipt/resulting IDs
9. economic consequence
10. provenance/audit consequence
11. failure/retry/duplicate behavior
12. destination surface

### Required output — Transition Contract Matrix

| From | Action | Principal | Preconditions | Authoritative write | Produced IDs/state | Evidence | To | Status |
|---|---|---|---|---|---|---|---|---|

### Gap classes

- **UI GAP**
- **CONTEXT GAP**
- **CONTRACT GAP**
- **STATE GAP**
- **AUTHORITY GAP**
- **PROVENANCE GAP**
- **ECONOMIC GAP**
- **OBSERVABILITY GAP**

Mandatory challenge for every canonical arrow:

> **Show me the exact object, endpoint, state mutation, and resulting identifier that makes this arrow true.**

If that cannot be answered, the arrow is not yet an implemented contract.

**Exit:** no canonical flow contains an unlabeled or hand-waved transition.

# Pass 4 — Latent-Intent Pass

## Question
**What intended architecture is at risk of being erased because it is gated, underbuilt, hidden, old, or poorly surfaced?**

Search specifically for: `empty`, `wip`, `building`, `requires X`, roadmap notes, old architecture docs, future-pipeline comments, gated routes, feature flags, dormant named systems, prototype-only concepts, real backends with weak navigation, systems represented only as child tabs, and “do not collapse/future/later/after X” language.

### Required output — Latent Architecture Register

| System / concept | Evidence of intent | Current implementation | Dependency / gate | Risk if omitted | Lifecycle state | Preserve? |
|---|---|---|---|---|---|---|

Promote a latent system back into the canonical map when it has an explicit architectural role, completes a meaningful loop, is intentionally gated rather than abandoned, or its omission makes another system incoherent.

**Exit:** the canonical architecture shows both operational present and intentional future, explicitly labeled.

# Cross-pass synthesis

Only after all four passes should consolidation or redesign begin.

Required canonical artifacts:
1. Surface Inventory
2. System Registry
3. Transition Contract Matrix
4. Latent Architecture Register
5. Do-Not-Collapse Register
6. Canonical system map derived from those five artifacts

# Consolidation decision test

Before merging, hiding, or retiring anything, ask:

1. Same system or merely adjacent surfaces?
2. Same authoritative state?
3. Same acting principal?
4. Same authority/governance semantics?
5. Same outputs?
6. Can one disappear without breaking a system loop?
7. Is one intentionally gated or roadmap-staged?
8. Is the merge navigation-only, or does it alter system semantics?

If #8 alters system semantics, require an owner/architecture decision — presented per the owner-decision rules below.

# Owner-decision presentation rules

Whenever a pass produces items that require an owner/architecture ruling (merge calls, lifecycle disputes, canonical-vs-latent conflicts), present them under these rules:

1. **Neutral options until chosen.** Present verbatim data and original wording — actual code, actual numbers, actual quotes with file + line + date. No summaries, no recommendations, no leading phrasing. A recommendation may be given only when the owner explicitly asks for one, and must be labeled as such.
2. **One number, everywhere.** Every decision item carries a single number. The index, the question, and its evidence blocks all carry the same number in the same top-to-bottom order. No cross-referencing by name across scattered documents.
3. **Tier label on every item.** **CRUCIAL** — blocks or contradicts a live/canonical claim; decide before proceeding. **MID** — a real gap, but nothing wrong is currently shipping. **LOOSE END** — bookkeeping, ratification, or cleanup.
4. **Check the register before asking.** If a durable record already answers the question, cite the standing answer and ask only for confirmation or correction — never re-pose a settled question as if open.
5. **Archive on decision.** A decided item leaves the active surface immediately and goes to a collapsed archive for record. The open list contains only genuinely undecided items.
6. **A ruling replaces the framing.** When the owner rules on how something is framed, the ruling replaces the framing — do not restate the owner's position with a residual qualifier attached.
7. **Lineage is the answer trail.** Present each item's provenance: where the number/wording came from, when, and why it was used in that context. The owner resolves most items by lineage, not by fresh analysis.
8. **Evidence on demand.** Every item offers inline evidence or an explicit evidence-request mechanism; the owner should never have to match a question in one window to information in another.

# Architecture review anti-patterns

Reject:
- “No current activity, therefore obsolete.”
- “Placeholder page, therefore dead.”
- “Same rail mode, therefore same system.”
- “Same data source, therefore same authority.”
- “Score, trust, reputation, standing, and qualification are interchangeable.”
- “The UI can carry an ID, therefore the backend transition exists.”
- “A generated ID proves an authoritative object exists.”
- “A Seed/audit write after a mutation is equivalent to atomic provenance.”
- “More disclosure means better work.”
- “A derived projection can create authority.”
- “Consolidation means retirement.”

# Hub-ready operating prompt

> **Run the Four-Pass Architecture Recovery Protocol before proposing redesign or consolidation.**
>
> **Pass 1 — Surface:** inventory all routes, pages, APIs, tools, machine-facing surfaces, hidden/WIP/gated surfaces, state stores, and navigation.
>
> **Pass 2 — System:** identify the distinct systems those surfaces represent, their authoritative objects, writes, reads, outputs, authority boundaries, and whether each is authoritative or derived. Maintain a Do-Not-Collapse Register.
>
> **Pass 3 — Edge:** verify every canonical transition by naming the triggering action, principal, preconditions, authoritative endpoint/write, produced IDs/state, economic/provenance effects, failure semantics, and destination. Classify missing arrows as UI, context, contract, state, authority, provenance, economic, or observability gaps.
>
> **Pass 4 — Latent Intent:** inspect roadmap docs, gated/WIP/empty surfaces, old architecture, feature flags, dependency language, and dormant systems. Distinguish GATED from RETIRED. Restore architecturally meaningful latent systems to the canonical map with explicit lifecycle labels.
>
> **Required lifecycle states:** CURRENT / PARTIAL / GATED / CONCEPTUAL / ROADMAP / RETIRED.
>
> **Required outputs:** Surface Inventory, System Registry, Transition Contract Matrix, Latent Architecture Register, Do-Not-Collapse Register, and a canonical map derived only after all four passes.
>
> **Do not redesign first. Do not invent missing contracts. Do not retire by omission. Preserve source-of-truth boundaries and distinguish verified current capability from proposed behavior.**

# Acceptance checklist

Complete only when:
- every known surface has a lifecycle state;
- every surface maps to a named system;
- every system has an authority/source-of-truth classification;
- every canonical arrow has a verified transition contract or explicit gap;
- gated/WIP/empty systems were reviewed for architectural intent;
- no system is marked retired without explicit evidence;
- a Do-Not-Collapse Register exists;
- current capability and intended future architecture are separately visible;
- owner/architecture decisions are presented neutrally, numbered, tiered, and evidence-backed per the presentation rules;
- no settled question is re-posed as open — standing answers are cited for confirmation instead;
- redesign/consolidation recommendations come after the evidence.
