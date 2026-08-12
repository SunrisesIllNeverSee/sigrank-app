---
type: article
title: "The Human in the Loop Is Unmeasured: The Case for AI Operator Evaluation"
description: Models are benchmarked constantly. Systems are safety-tested. But the humans driving the tools have no widely adopted public evaluation standard based on passive telemetry. SigRank is building one - from token cascades, not self-report.
tags: [article, sigrank, operator-evaluation, measurement, token-cascade, yield, ai-operators, category-creation, human-model-context]
timestamp: 2026-08-10T12:00:00Z
author: Deric (@SunrisesIllNeverSee)
hero: /blog-hero-human-loop.svg
---

AI evaluation has a missing unit of analysis.

We benchmark models. We test systems for safety and robustness. We evaluate applications against tasks.

But deployed AI capability is not produced by a model alone.

Someone decides what context enters the system. Someone decides what survives. Someone decides when to reuse prior state, when to reconstruct it, when to abandon a thread, how much generation to request, and how interaction is sequenced over time.

Those decisions leave a measurable trace.

Yet there is no widely adopted public framework for comparing individual AI operators from that trace.

That is the category SigRank is attempting to formalize:

**operator evaluation.**

Not another model benchmark.

Not another prompt contest.

Not a self-reported measure of whether someone is "good at AI."

A measurement layer for the human side of human-AI operation.

---

# 1. AI evaluation measures almost everything except the operator

The contemporary evaluation stack has three mature layers.

**Model evaluation** asks which model performs better.

Systems such as LMArena, HELM, HumanEval, SWE-bench, and other benchmark suites compare models by capability, preference, reasoning, coding performance, robustness, or task completion.

The unit is the **model**.

**System evaluation** asks whether an AI system is safe, robust, reliable, or aligned under expected and adversarial conditions.

The unit is the **system**.

**Application evaluation** asks whether an implementation succeeds at a particular job: code generation, extraction, retrieval, translation, agent completion, or another domain-specific task.

The unit is the **application or outcome**.

All three are necessary.

None makes the individual human operator its primary object of measurement.

This is not because humans have been ignored by research. Human-computer interaction, AI literacy, human-AI teaming, prompting behavior, productivity research, and behavioral telemetry already study parts of the human side.

The missing layer is narrower:

> **a public, comparable, cross-platform framework that treats the individual AI operator as a unit of analysis and derives workflow measurements from passive operational telemetry.**

SigRank is an attempt to build that layer.

---

# 2. The operator leaves a measurable structure behind

The starting point is empirical.

**Operator-associated token cascades vary enormously.**

SigRank analyzed an initial field of **1,628 human operator records** drawn from public AI coding-agent leaderboards.

A separate set of **130 statistical outliers** was removed from the primary analytic population and retained for separate analysis, leaving **1,498 operators** in the principal field.

Each record was reduced to four raw token pillars:

- **Input (I)** — fresh context entering the system
- **Output (O)** — generated tokens
- **Cache Write (W)** — context committed for later reuse
- **Cache Read (R)** — previously committed context retrieved during subsequent processing

Four integers.

No prompt interpretation is required.

From them, the operating cascade can be reconstructed.

![Population vs Yield — 1,625 operators sorted by yield (descending). The field concentrates at low yield with a long tail of elite operators. Colored by build archetype.](/population-vs-yield.png)

| Metric | Formula | Median | Top 1% |
|---|---|---:|---:|
| Yield (Υ) | `(R × O) / I²` | 1.68 | 10,000+ |
| Leverage | `R / I` | 18.6× | 1,000+ |
| Velocity | `O / I` | 0.09 | 10+ |
| SigRank SNR | `O / (I + O)` | 0.084 | 0.90+ |

At the median, the observed sessions reuse roughly **19 cache-read tokens for every token of fresh input**.

At the upper tail, that ratio exceeds **1,000 to 1**.

That is not a small difference in usage intensity.

It is a radically different operating composition.

And because Yield combines reuse and generation, differences in those dimensions compound.

The important finding is not that the operator with the larger number is necessarily better.

It is that:

> **human-associated operating structures differ dramatically, those differences are observable, and conventional model evaluation does not represent them.**

The dataset does not yet establish how much of that variance is caused by the operator.

Observed differences may also reflect:

- model
- platform
- task
- workload
- caching architecture
- project type
- session duration
- tool defaults
- scoring window
- model × operator interaction

Those variables need controlled experiments.

For now, the claim is narrower:

**the variation exists.**

**It is large.**

**It is measurable.**

What that variation predicts remains a research question.

---

# 3. The token cascade

Operator evaluation needs a measurement primitive that does not depend on reading the semantic contents of the work.

SigRank uses the **token cascade**:

```
I, O, W, R
```

measured over a defined scoring window.

At the content layer, these are counts rather than text.

The scoring system does not inherently require:

- prompt contents
- generated contents
- source files
- code contents
- document contents
- message semantics

In SigRank's native architecture, a local agent reads token telemetry and submits signed snapshots from which the server derives the cascade.

That does not make telemetry anonymous or privacy-free.

Metadata can still disclose information through timing, volume, cadence, identifiers, usage patterns, tool choice, and repeated activity.

The claim is therefore deliberately narrower:

> **SigRank can measure token flow without requiring semantic inspection of the work itself.**

From the four pillars, several public views are derived.

### Leverage

```
L = R / I
```

How much previously committed context is reused relative to fresh input.

### Velocity

```
V = O / I
```

How much generated output is produced relative to fresh input.

### Yield

```
Υ = (R × O) / I²
```

Because:

```
L = R / I
```

and:

```
V = O / I
```

then:

```
Υ = L × V
```

Yield is therefore not an independent signal.

It is the interaction between Leverage and Velocity.

### SigRank SNR

```
S = O / (I + O)
```

SigRank uses this as a bounded output-share measure.

It is not conventional engineering signal-to-noise ratio.

Because:

```
V = O / I
```

then:

```
S = V / (1 + V)
```

SNR is therefore an exact monotonic transformation of Velocity.

### 10xDEV

```
D = log₁₀(L)
```

A logarithmic representation of Leverage that makes very large differences easier to read.

### Construction

```
C = W / R
```

The amount of newly committed reusable state relative to reused state, where the denominator is defined.

These metrics are intentionally redundant views of a smaller underlying structure.

They should not be mistaken for six independent variables.

Some are transformations:

```
S = V / (1 + V)
D = log₁₀(L)
```

Others are compositions:

```
Υ = L × V
```

That matters because a measurement system should reveal its algebra rather than hide it behind a collection of branded scores.

SigRank can also be decomposed through a telescoping relationship.

For windows where:

```
I > 0, O > 0, W > 0
```

then:

```
(O/I) × (W/O) × (R/W) = R/I
```

or:

```
Transmission × Commitment × Reuse = Leverage
```

The intermediate terms cancel.

That provides an internal consistency test.

Derived metrics must agree with both the submitted pillars and the algebra connecting them.

If they do not, the row is invalid.

This does not prove that the submitted telemetry is genuine.

It proves something narrower but useful:

**the measurement system can detect internally inconsistent computation.**

Telemetry authenticity is a separate problem.

---

# 4. From numbers to operating shape

Raw ratios are useful.

Composition is more useful.

Using the current SigRank classification rules, the 1,498-person analytic field can be described through **10 build archetypes**.

These archetypes are not personality types.

They do not measure intelligence.

They do not establish work quality.

They describe the **shape of the observed token cascade**.

![The 10 Build Archetypes — deterministic classification of 1,586 operators by leverage, velocity, and construction. Each bar shows population share with median yield, leverage, and velocity.](/archetypes-10.svg)

## Convergence

### CONVERGENT

Leverage, Velocity, and active Construction are simultaneously elevated without the usual tradeoffs.

This is the rarest composition in the present field.

## Generation

### KINETIC

Generated output approaches or exceeds fresh input.

Transmission is the defining characteristic.

## Reuse Depth

### INPUT-BOUND  
### PRIMING  
### CONTEXTUAL  
### DEEP READER  
### ARCHIVIST

These represent increasing levels of context reuse, from low leverage through extreme dependence on previously accumulated state.

## Active Construction

### BUILDER  
### RECURSIVE  
### AMPLIFIER

These represent increasing levels of reusable-state construction, from early context formation through large-scale combinations of continued construction and reuse.

![The 24-Stage Experience Ladder — 8 tiers × 3 sub-stages, keyed on total tokens. Each stage shows its token floor and operator count.](/tier-ladder-24.svg)

The taxonomy separates three properties that are often collapsed into one.

**Archetype describes shape.**

What does this operator's current cascade look like?

**Class describes accumulated operating scale or qualification.**

How much qualifying activity has accumulated under the specification?

**Rank describes relative field position.**

Where does this operator sit against the comparison population under a selected metric and scoring window?

They are not interchangeable.

A highly experienced operator can exhibit an INPUT-BOUND cascade.

A newer operator can exhibit an AMPLIFIER composition.

Experience does not determine shape.

Shape does not determine rank.

And rank does not establish quality.

What operator evaluation reveals is something more basic:

> **the operating form through which fresh effort becomes output, retained context, and future leverage.**

That is the object SigRank is trying to measure.

---

# 5. What we know — and what we do not

A credible measurement system has to distinguish exact results from empirical evidence and from open questions.

SigRank currently has all three.

## What is known exactly

The metric dependencies are algebraic.

For valid domains:

```
Υ = Leverage × Velocity
SNR = Velocity / (1 + Velocity)
10xDEV = log₁₀(Leverage)
```

The telescoping decomposition also reduces exactly to Leverage.

These claims do not depend on statistical inference.

They are identities.

## What has been checked operationally

The field has been subjected to several statistical and operational checks.

First-digit distributions across the four raw pillars, together with aggregate token volume, are consistent with Benford's Law at the selected significance threshold.

That result has a narrow meaning.

It does not authenticate individual records.

It does not establish that the data is genuine.

It does not mean fabricated data could not reproduce similar distributions.

Benford analysis is one population-level screen against some obvious forms of manipulation.

Native SigRank telemetry adds another control:

**signed snapshots.**

An on-device Ed25519 signature can establish that a particular key signed a particular payload and that the payload was not altered after signing.

It cannot prove that the local telemetry was truthful before it was signed.

That requires a broader collection architecture.

The verification layer therefore includes:

- algebraic consistency
- provenance
- cadence analysis
- plausibility gates
- anomaly detection
- source-specific validation
- collection-path hardening

No single test establishes truth.

The system is deliberately layered because different attacks require different controls.

## What is not yet known

SigRank has not established whether cascade structure predicts:

- work quality
- reasoning quality
- task success
- professional skill
- team productivity
- business outcomes
- model-independent operator ability

Nor has it established how much observed variance belongs independently to the operator rather than to the model, task, platform, or interaction among them.

Those are not footnotes.

They are the research program.

---

# 6. The leaderboard is the surface, not the product

SigRank currently presents itself publicly as a leaderboard.

That makes the project easy to misunderstand.

![Archetype Radar — four workflow families compared across 6 dimensions (yield, leverage, velocity, SNR, construction, tokens/day). KINETIC dominates generation; Reuse Depth dominates construction; Convergence is balanced.](/archetype-radar.svg)

A leaderboard is useful because comparison forces a measurement system to become concrete.

There must be:

- a unit
- a scoring window
- a field
- a ranking rule
- a classification system
- a collection protocol
- a verification process

The board proves that those pieces can be assembled into a functioning system.

Operators can be measured.

Cascades can be reconstructed.

Derived values can be computed.

Workflow structures can be classified.

Field position can be calculated.

But the leaderboard is not the deeper product.

The deeper product is the **operator-evaluation layer** beneath it:

- measurement primitives
- metric specification
- telemetry protocol
- classification rules
- scoring windows
- provenance controls
- verification tests
- cross-platform ingestion
- reference distributions

And the leaderboard still does not establish construct validity.

A high-Yield operator has not yet been shown to produce better work than a low-Yield operator.

That requires independent outcome measurement.

The intended progression is therefore:

**Personal measurement → Benchmarking → Longitudinal tracking → Team analysis → Industry index**

Personal measurement reveals an operator's own composition.

Benchmarking compares that composition against a field.

Longitudinal tracking reveals how the operating form changes over time.

Team analysis asks whether meaningful patterns emerge across organizations.

And, if the measurements survive validation, an industry index could eventually provide a standardized way to describe human-AI operation across tools and environments.

The leaderboard is simply the first visible implementation.

---

# 7. Why this becomes possible now

A public operator-evaluation layer requires several pieces to exist at once.

### An observable primitive

There has to be a behavioral trace that can be captured without requiring the evaluator to read the work itself.

Token telemetry provides one candidate.

### An auditable metric system

Derived values should be reconstructible from their source measurements.

The algebra makes that possible.

### Collection at the operator level

The measurement has to follow the human through actual work rather than exist only inside controlled benchmark sessions.

### Cross-platform translation

The same conceptual specification has to survive across different AI systems, interfaces, and providers.

This is difficult because platform architecture itself changes the telemetry.

Caching behavior is especially important.

A cache-read token is partly a property of the operator's workflow and partly a property of how the platform implements context reuse.

That means cross-platform operator evaluation cannot simply assume all token events are equivalent.

It has to model the instrumentation layer explicitly.

### A reference field

Individual measurements become more interpretable when there is a population against which they can be compared.

SigRank currently has two distinct regimes.

**Seed field**

Public AI coding-agent leaderboard records used to establish an initial analytical distribution.

**Native SigRank field**

Operators who independently collect and submit telemetry through the native SigRank protocol.

Those populations should not be conflated.

They have different provenance, selection effects, and collection constraints.

That distinction is part of the specification, not an inconvenience to be hidden.

---

# 8. From implementation to standard

SigRank is pursuing an open-standard model.

The methodology is being published.

The current taxonomy dataset is available on Zenodo:

**DOI: 10.5281/zenodo.21875675**

The CLI is open source.

But an open-source implementation is not automatically a standard.

A real standard requires more:

- stable and versioned definitions
- reference implementations
- conformance tests
- governance
- licensing
- independent replication
- independent adoption

SigRank is not there yet.

The relevant distinction is simple:

**the specification can be opened before the standard is established.**

That is the current stage.

---

# 9. What operator evaluation could eventually make possible

If these measurements demonstrate construct validity, operator evaluation could become useful far beyond a public leaderboard.

## Training

Instead of asking whether someone "uses AI well," longitudinal telemetry could show how their operating composition changes.

Does fresh-input dependence fall?

Does context reuse increase?

Does active state construction emerge?

Does an operator move between recognizable build states over time?

The measurement does not tell us whether those changes are improvements.

Outcome validation has to answer that.

## Tool comparison

The same operator could be measured across multiple systems.

Does Claude produce one cascade and Codex another?

Does a workflow become more reuse-heavy in one environment?

Does active construction increase in another?

How much of the resulting difference comes from the operator, and how much from the platform?

This is a different question from model benchmarking.

It measures the **relationship between operator and system**.

## Teams

Once longitudinal individual measurements exist, team-level distributions become possible.

Organizations could examine how work is actually being structured across AI systems rather than relying solely on seat utilization, deployment counts, or survey responses.

## Hiring

This is the highest-risk application and therefore requires the strongest evidence.

A validated operator measurement could eventually supplement work samples and role-specific evaluation.

It should not replace them.

And today's SigRank metrics are not validated for employment decisions.

At present they describe operating structure, not professional value.

---

# 10. The experiment that matters

The strongest test of the operator-evaluation thesis is not another leaderboard.

It is a controlled experiment.

![Yield vs Leverage — each point is an operator. The field spreads across orders of magnitude, suggesting the interaction term between operator and model is worth measuring.](/scatter-yield-vs-leverage.svg)

Give multiple operators the same tasks.

Vary the models.

Measure the cascades.

Score the outcomes independently.

Then estimate how much outcome variation belongs to:

- model
- operator
- model × operator interaction
- residual factors

A basic formulation is:

```
Outcome = μ + α_model + β_operator + (αβ)_interaction + ε
```

If a stable operator effect survives controls, the case becomes substantially stronger.

If particular cascade structures predict outcomes across models and tasks, stronger still.

If the effect disappears, the measurement framework has learned something equally important about its own limits.

That is how SigRank should be judged.

Not by whether the leaderboard looks persuasive.

By whether the proposed unit of analysis survives falsification.

---

# 11. The deeper question

The larger question is not whether AI needs another leaderboard.

It is whether we have been measuring the wrong effective system.

![Velocity vs Leverage — operators distribute across the full plane, not along a single axis. Two dimensions, not one.](/scatter-velocity-vs-leverage.svg)

Most benchmark logic implicitly begins with:

```
Model
```

But deployed capability looks more like:

```
Human + Model + Context + Interaction
```

The model contributes capability.

The human determines what enters.

Context determines what survives.

Interaction determines how capability is repeatedly invoked, redirected, accumulated, and reused.

If two people using the same model on the same task consistently construct different operating forms — and those forms consistently produce different outcomes — then model capability alone is not enough to describe deployed capability.

The operator is part of the system.

The interaction is part of the system.

And the relevant object may be closer to:

```
Human × Model × Context
```

That is the intellectual center of SigRank.

The goal is not merely to rank people.

It is to determine whether human-AI operation itself can become a measurable object.

First descriptive.

Then reproducible.

Then longitudinal.

And, if the evidence supports it, predictive.

Before we can explain who operates AI systems well, we need to establish something more basic:

**what exactly an operator is doing.**

SigRank is building the measurement layer for that question.

---

## Field Summary

**Seed field:** 1,628 public operator records collected; 130 statistical outliers separated; 1,498 included in the primary analytic field.

**Raw pillars:** Input, Output, Cache Write, Cache Read.

**Derived views:** Yield, Leverage, Velocity, SigRank SNR, 10xDEV, Construction.

**Primary structural dimensions:** reuse, generation, and active context construction.

**Verification layers:** algebraic consistency, distributional checks, provenance controls, plausibility analysis, anomaly detection, and native signed telemetry.

**Native telemetry:** Ed25519 signed snapshots generated on-device.

**Tool:** `npx sigrank`

**Live board:** signalaf.com

**Taxonomy dataset:** DOI 10.5281/zenodo.21875675

---

## A Note on Commitment Theory

SigRank sits inside a broader research program on **Commitment Theory**: the study of what system structure can be recovered from observable traces of operation rather than from self-description alone.

SigRank applies that idea to human-AI interaction.

The claim at this stage is intentionally constrained:

> **before we can explain, compare, or evaluate how humans operate AI systems, we need a reproducible way to measure the structure of that operation.**

That is the layer SigRank is attempting to build.

— **Deric J. McHenry** · MO§ES™ · @burnmydays on X · GitHub · ORCID [0009-0002-9904-5390](https://orcid.org/0009-0002-9904-5390)

**Related:** Yield (Υ) Metric · Field Analysis · Methodology · Wiki · How to Improve Your Yield · [Interactive Dashboards](/blog/sigrank-dashboards)

---

## Reproducibility

The anonymized taxonomy dataset, methodology, provenance documentation, and analytics dashboards are published on Zenodo under CC-BY 4.0:

- **Dataset:** [10.5281/zenodo.21876660](https://doi.org/10.5281/zenodo.21876660)
- **Concept DOI:** [10.5281/zenodo.21875675](https://doi.org/10.5281/zenodo.21875675)
- **CLI:** `npx sigrank` (open source)
- **Interactive dashboards:** [signalaf.com/dashboards](/dashboards)

The package includes:

- Anonymized operator-level CSV (1,498 operators, 4 raw pillars + 6 derived metrics)
- 10-archetype classification reference
- 24-stage experience ladder distribution
- 6 interactive HTML dashboards (archetype, tier ladder, cross-metric, operator scatter, platform board, model board)
- Methodology and provenance documentation
- SHA-256 file hashes for integrity verification

Independent replication is encouraged. The metric definitions are algebraic and can be recomputed from the four raw pillars without access to the original collection infrastructure.

---

**Citation:**

McHenry, D. J. (2026). SigRank Two-Axis Operator Taxonomy: Finalized Datasets and Analytics Dashboards (v3.0) [Dataset]. Zenodo. https://doi.org/10.5281/zenodo.21876660

- **DOI:** [10.5281/zenodo.21876660](https://doi.org/10.5281/zenodo.21876660) · **Concept DOI:** [10.5281/zenodo.21875675](https://doi.org/10.5281/zenodo.21875675)
- **License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) · **ORCID:** [0009-0002-9904-5390](https://orcid.org/0009-0002-9904-5390)
- **Author:** Deric J. McHenry · [signalaf.com](https://signalaf.com) · [MO§ES™](https://github.com/SunrisesIllNeverSee)

```
@dataset{mchenry2026sigrank,
  author    = {McHenry, Deric J.},
  title     = {{SigRank Two-Axis Operator Taxonomy: Finalized Datasets and Analytics Dashboards (v3.0)}},
  year      = 2026,
  publisher = {Zenodo},
  version   = {3.0},
  doi       = {10.5281/zenodo.21876660},
  url       = {https://doi.org/10.5281/zenodo.21876660}
}
```
