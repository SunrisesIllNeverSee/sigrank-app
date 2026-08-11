---
type: article
title: "The Human in the Loop Is Unmeasured: The Case for AI Operator Evaluation"
description: Models are benchmarked constantly. Systems are safety-tested. But the humans driving the tools have no widely adopted public evaluation standard based on passive telemetry. SigRank is building one - from token cascades, not self-report.
tags: [article, sigrank, operator-evaluation, measurement, token-cascade, yield, ai-operators, category-creation, human-model-context]
timestamp: 2026-08-10T12:00:00Z
author: Deric (@SunrisesIllNeverSee)
---

# The Human in the Loop Is Unmeasured: The Case for AI Operator Evaluation

> [1] AI evaluation has a blind spot the size of an entire profession. Model leaderboards rank systems. Safety frameworks test alignment. Benchmark suites measure accuracy, robustness, and reasoning. All of it targets the AI-side artifact or its output. None treats the human operator as the primary unit of comparison. That operator is the unmeasured layer.

---

## 1. The missing unit of analysis

[2] The current AI evaluation stack has three layers, each well-established:

1. **Model evaluation** — LMSYS Arena, HELM, Open LLM Leaderboard, HumanEval. They rank models by accuracy, reasoning, coding ability, and human preference. The unit of analysis is the model. The question is "which system is better?"

2. **System evaluation** — Safety benchmarks, alignment tests, red-teaming, robustness suites. They test whether an AI system behaves reliably under stress. The unit of analysis is the system. The question is "is it safe and reliable?"

3. **Application evaluation** — Task-specific metrics: pass@k for code, BLEU for translation, F1 for extraction, RAG evaluation, agent orchestration testing. They measure whether the AI produces correct outputs for a specific use case. The unit of analysis is the task. The question is "does it work for this?"

[3] All three primarily evaluate the AI-side artifact or its output. The operator — the human deciding what to prompt, when to reuse context, how to structure a session, when to break and restart — is not absent from research. Human-computer interaction, human-AI teaming, AI literacy, and productivity measurement all study the human side. But the operator is largely absent from the benchmark stack. There is no widely adopted public standard that measures how an individual operator structures real AI work from passive telemetry and makes that behavior comparable across a field. That is the gap this article addresses.

[4] The proposed name for that gap: **operator evaluation**. And the measurement framework that makes it possible.

## 2. The variance model benchmarks cannot see

![Yield vs Leverage — 1,532 operators on log-log scale. The compounding cloud shows that yield (Υ) rises with leverage (cache reuse), not with raw token volume. Colored by build archetype.](/scatter-yield-vs-leverage.svg)

[5] The case for operator evaluation starts with an empirical observation. Even within the same broad AI coding-agent ecosystem, operator token cascades diverge by orders of magnitude.

[6] SigRank analyzed 1,498 human operators from public AI coding agent leaderboards. Each operator was measured on four token pillars: input (fresh context provided), output (tokens generated), cache-write (context committed for reuse), and cache-read (context retrieved on subsequent turns). These four integers are the raw material. Everything else is derived.

[7] The derived metrics tell the story:

| Metric | Formula | Median | Top 1% |
|--------|---------|--------|--------|
| Yield (Υ) | (cache_read × output) / input² | 1.68 | 10,000+ |
| Leverage | cache_read / input | 18.6× | 1,000+ |
| Velocity | output / input | 0.09 | 10+ |
| SNR | output / (input + output) | 0.084 | 0.90+ |

[8] The median operator reads 19 tokens of cached context for every 1 token of fresh input. The top 1% reads 1,000 or more. That is not a 10% difference. It is a 50× difference in leverage alone. When you multiply leverage by velocity to get Yield, the gap compounds: the median operator scores 1.68. The top operator (MOSES) scores 18,436.98. That is a 10,000× spread within the same broad ecosystem of AI coding agents.

[9] The field shows large operator-level variation that model leaderboards do not represent. The next question — and the one that matters most — is how much of that variance persists when model, platform, and task are controlled. That is a future experiment, not a current claim. What the field data does establish is that the variation is real, it is large, and it is invisible to every existing evaluation layer.

> **What SigRank does not yet claim to know:** which operator compositions produce better work. It claims something more basic: the operator is a measurable part of the AI system, the variation is large enough to matter, and we now have a way to study it. What the cascade predicts is a research question, not a marketing claim.

## 3. The measurement system

[10] Operator evaluation requires a measurement primitive — a unit of analysis that captures operator behavior without capturing operator content. SigRank's primitive is the **token cascade**: the flow of tokens through four pillars (input, output, cache-write, cache-read), measured per scoring window.

[11] The cascade is content-private at the content layer by construction. The four pillars are integer counts. They contain no prompt text, no generated content, no file contents, no code. The operator's agent reads token counts locally and submits signed snapshots. The server derives the cascade from four integers. No content leaves the machine. This does not eliminate all privacy considerations — telemetry can still leak behavioral information through timing, volumes, identifiers, and metadata. But it does mean the measurement is content-free: you can measure the flow without measuring the substance.

[12] From the four pillars, every derived metric follows algebraically:

- **Yield** (Υ) = (cache_read × output) / input² — the headline cascade metric. Yield captures the interaction of cache leverage and output velocity per unit of fresh input.
- **Leverage** = cache_read / input — how much you reuse vs re-type
- **Velocity** = output / input — how much you generate vs take in
- **SNR** = output / (input + output) — signal vs overhead
- **10xDEV** = log₁₀(Leverage) — leverage on a readable scale
- **Construction** = cache_write / cache_read — how much new context you build per read

[13] These metrics are not independent. They compose through the **telescoping identity**:

```
(O/I) × (W/O) × (R/W) = R/I = Leverage
```

Transmission × commitment × reuse = leverage. The intermediate terms cancel. The identities make the derived layer internally auditable: Yield, Leverage, Velocity, SNR, and 10xDEV must agree with the submitted pillars and with one another. A derived row that violates those relationships is internally invalid. Coherently fabricated pillars require separate provenance and plausibility controls — the telescoping identity catches inconsistent calculations, not coherent fabrications.

## 4. What the signal reveals

[14] Once you measure the cascade, structure emerges that is invisible to model evaluation. The 1,498 operators in the SigRank field separate into **10 build archetypes** — composition types that describe how an operator works, not how much.

![The 10 Build Archetypes — deterministic classification of 1,586 operators by leverage, velocity, and construction. Each bar shows population share with median yield, leverage, and velocity.](/archetypes-10.svg)

[15] The archetypes fall into four families:

- **Convergence** — CONVERGENT: all three operating axes (leverage, velocity, construction) elevated without the usual tradeoffs. The rare composition.
- **Generation** — KINETIC: output approaches or exceeds input. Transmission is the defining feature.
- **Reuse Depth** — INPUT-BOUND, PRIMING, CONTEXTUAL, DEEP READER, ARCHIVIST: the passive reuse axis, from almost no leverage to extreme leverage.
- **Active Construction** — BUILDER, RECURSIVE, AMPLIFIER: the active construction axis, from early cache-building to deep reuse + active construction at scale.

[16] An archetype describes shape. A class tier describes qualification (total tokens accumulated). A rank describes position (yield relative to the field). All three are recomputed every scoring window. An experienced operator (ARCH+) can be INPUT-BOUND (deep experience but currently burning fresh input). A new operator (IGNITER) can be an AMPLIFIER (new but already compounding cache). The three axes are independent, and measuring all three gives a richer picture than any single label.

![The 24-Stage Experience Ladder — 8 tiers × 3 sub-stages, keyed on total tokens. Equal-population calibration (Option C). Each stage shows its token floor and operator count.](/tier-ladder-24.svg)

![Velocity vs Leverage — the operating plane. Each point is one operator. The position reveals workflow shape: high-velocity operators generate more than they take in; high-leverage operators reuse more than they retype. Colored by archetype.](/scatter-velocity-vs-leverage.svg)

[17] This is what operator evaluation reveals that model evaluation does not: the structure of how someone works with AI. Not whether the model is good, but how the operator is using it. Not whether the result is correct, but whether the workflow is fresh-input-heavy, context-reusing, output-heavy, or actively constructing reusable state. The archetype is a workflow signature — a description of composition, not a verdict on quality.

## 5. What is proven and what isn't

[18] A measurement framework is only credible if the data can be trusted and the claims are precisely bounded. SigRank separates three levels:

**Proven (algebraically).** The telescoping identity. The four pillars compose. Derived metrics cannot be altered independently of the pillars they are derived from. This is a mathematical identity, not a heuristic.

**Verified (operationally).** The first-digit distributions of all four raw pillars plus total-token volume are consistent with Benford's Law at the chosen significance threshold. That does not authenticate individual records — Benford can be consistent with organic data, fabricated data can follow Benford, and a failure to reject at p=0.05 does not establish the null as true. But it provides one population-level check against obvious synthetic or manually fabricated distributions. Additional operational controls: signed snapshots (ed25519 on-device, verified server-side) authenticate origin and prevent post-signature alteration. Provenance tracking, cadence analysis, and plausibility gates address whether the underlying telemetry is credible. Signatures prove this device/key signed this payload; they do not by themselves prove the local source data were genuine unless the entire collection path is strongly attested.

**Under evaluation.** Whether a cascade predicts work quality. Whether it predicts team performance. Whether it predicts better reasoning or outcomes. Whether the same model produces systematically different operating structures across operators. These are open questions, not established claims.

[19] The honesty of this separation is the point. Operator evaluation is a new category. It should be held to the standard of any new measurement framework: prove what you can prove, verify what you can verify, and label the rest as open.

## 6. The leaderboard demonstrates that measurement can operate on a real field

[20] The SigRank leaderboard is the visible surface. It ranks operators by Yield across 7-day, 30-day, 90-day, and all-time windows. It shows the cascade, the archetype, the class tier, and the rank for every operator. It is live, it is public, and it is the thing people see first.

[21] But the leaderboard is not the product. The product is the **operator-evaluation standard**: the methodology, the metrics, the signed telemetry protocol, and the verification battery that make operator performance measurable and comparable. The leaderboard demonstrates that the measurement system can operate on a real field — collection works, derivation works, comparison works, ranking can be instantiated. It does not yet demonstrate construct validity. That requires external outcome validation, which is the first item on the research roadmap.

**Interactive dashboards** (embedded data, Chart.js CDN):

- [Archetype Analytics](/field#archetype-dashboard) — 9-chart breakdown of the 10 build archetypes
- [Tier-Ladder Analytics](/field#tier-dashboard) — 6-chart experience-ladder distribution
- [Cross-Metric Analytics](/field#cross-metric-dashboard) — yield vs leverage vs velocity vs SNR
- [Operator Scatterplots](/field#operator-scatter) — 1,598 operators across 9 metric pairs

[22] The strategic path:

```
Personal measurement → benchmark → trend tracking → team evaluation → industry index
```

Each step compounds. Personal measurement gives an operator their cascade. Benchmarking places them against the field. Trend tracking shows whether they're improving. Team evaluation aggregates operators within an organization. The industry index is the eventual goal: a standard measurement layer for human-AI collaboration, the way model leaderboards are the standard measurement layer for AI systems. The leaderboard is the first step, not the destination.

## 7. Why this category doesn't exist yet

[23] Operator evaluation hasn't been built before because the prerequisites didn't exist. You need:

1. **A measurement primitive** that captures operator behavior without capturing content. Token telemetry provides this — the four pillars are content-free integers.
2. **A derived metric set** that is internally auditable, so inconsistent derived values are detectable. The telescoping identity provides this.
3. **A verification battery** that addresses inconsistency, manipulation, and anomalous telemetry at the algebraic, statistical, and operational levels. Benford + telescoping + signed telemetry provide this.
4. **A platform-agnostic ingest layer** that works across Claude, Cursor, Copilot, Gemini, and 15+ other tools. The sigrank CLI provides this.
5. **A field large enough to establish norms.** 1,498 human operators provide a first Human Center of Mass for this AI coding-agent population — the median, the IQR, the archetype distribution. This is not the center of mass of all AI users; it is the center of mass of operators who install a token scanner and submit signed telemetry. That selection effect matters and is studied explicitly in the field analysis.

[24] All five prerequisites now exist. The category is buildable. SigRank is pursuing an open-standard model — the methodology is published, the two-axis taxonomy dataset is on Zenodo ([DOI: 10.5281/zenodo.21875675](https://doi.org/10.5281/zenodo.21875675)), and the CLI is open-source. A full open standard requires a versioned specification, governance, a reference implementation, conformance rules, licensing, and independent adoption. Those are the milestones; the ambition is stated, the status is early.

## 8. What this changes

[25] If operator evaluation becomes a standard layer, it changes three things:

1. **Hiring and training.** A verifiable workflow signal that supplements work samples and outcomes — not a replacement for judgment, and subject to validation for the specific role and task domain. Signed snapshots mean the numbers are verifiable. The signal describes workflow structure, not work quality.

2. **Tooling decisions.** Enterprise teams can quantify how effectively their operators use a given tool, not just whether the tool is deployed. The cascade reveals whether the workflow is reusing context or repeatedly starting fresh — information that no tool analytics dashboard provides.

3. **AI-assisted work as a discipline.** GitHub measures commits. Stack Overflow measured reputation. Kaggle measures competitions. None of them measure how humans operate AI models. Operator evaluation creates the measurement layer for a category of work now used by millions of people — a category that didn't exist five years ago.

## 9. The research program

[26] The immediate roadmap, in priority order:

1. **External outcome validation.** Pair SigRank telemetry with independently scored tasks to test how much variance is attributable to the model, the operator, and their interaction. Formally:

```
Outcome = μ + α_model + β_operator + (αβ)_interaction + ε
```

This is the experiment that could turn the category thesis into a serious research result. Until this is done, the cascade is a measured signal whose predictive value is not yet established.

2. **Dataset release.** The two-axis taxonomy (10 build archetypes + 24-stage experience ladder) is published on Zenodo ([DOI: 10.5281/zenodo.21875675](https://doi.org/10.5281/zenodo.21875675)). The full operator-level dataset will follow.

3. **Longitudinal analysis.** How operators move between archetypes over time. Does a BUILDER become an AMPLIFIER? Does an INPUT-BOUND operator develop leverage with experience?

4. **Cross-platform comparison.** Does a CONVERGENT operator on Claude look the same as one on Cursor? Do platform differences in caching architecture affect the cascade shape?

5. **The paper.** "Benford's Law and Token Ratio Analysis for Outlier Detection in AI Coding Agent Leaderboards." The data is done. The analysis is done. It's writing time.

[27] The deeper question — the one that makes this more than "AI users need a leaderboard" — is whether the model itself becomes a measurably different effective system depending on who operates it. Operator evaluation does not end with ranking people. It creates a way to study the interaction term between human and model. If the same model produces systematically different operating structures and outcomes across operators, then "model capability" is not sufficient to describe deployed capability. The effective unit becomes the human + model + context system. That is newer and bigger than a ranking surface. That is the intellectual center of this work.

---

*Data: 1,498 human operators (1,628 scraped, 130 outliers separated) from public AI coding agent leaderboards*
*Metrics: Yield (Υ = cache_read × output / input²), Leverage, Velocity, SNR, 10xDEV, Construction*
*Verification: Benford chi-square (consistency check, not authentication), telescoping identity (algebraic), signed telemetry (ed25519)*
*Tool: SigRank, `npx sigrank` on npm*
*Live board: [signalaf.com](https://signalaf.com) · [Field analysis](/field) · [Methodology](/methodology) · [Wiki](/wiki)*

---

*This work is part of a broader research program on [Commitment Theory](https://github.com/SunrisesIllNeverSee/Commitment_Theory) — a 34-paper investigation into how governance structures emerge from measurable behavior in autonomous systems. SigRank applies the same principle to AI operators: you don't measure trust by asking, you measure it by observing the cascade.*

*- djm · [MO§ES™](https://github.com/SunrisesIllNeverSee)*
*[@burnmydays on X](https://x.com/burnmydays) · [GitHub](https://github.com/SunrisesIllNeverSee)*

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
