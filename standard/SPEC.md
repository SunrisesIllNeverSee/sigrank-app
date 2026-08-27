# SigRank Standard v0.1-draft

## 1. Status

This is a proposed open measurement specification.

It is **not** a claim that SigRank has already achieved universal or formal industry-standard adoption.

Normative terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** indicate requirement strength.

## 2. Purpose

SigRank defines a common measurement vocabulary for human operation of generative AI systems across tools, providers, models, and workflows.

## 3. Scope

The v0.1 core standard covers:

1. telemetry primitives;
2. core derived metrics;
3. undefined/null arithmetic;
4. portable interchange records;
5. privacy/content-independence requirements;
6. version declaration;
7. compatibility;
8. comparative terminology; and
9. longitudinal terminology.

## 4. Non-goals

SigRank does not inherently determine:

- model capability;
- task correctness;
- task success;
- code quality;
- employee productivity;
- employment suitability;
- creativity;
- business value;
- financial ROI; or
- causal impact.

External outcome systems MAY be analyzed alongside SigRank measurements.

## 5. Operator-layer model

```text
Human operator
      ↓
AI tool / interface
      ↓
I / O / W / R
      ↓
core SigRank metrics
      ↓
operator signature / state
      ↓
field / cohort context
      ↓
longitudinal analysis
      ↓
organizational extensions
```

## 6. Primitive telemetry

### 6.1 Input (`I`)

A non-negative quantity of fresh input tokens attributed to the measured interaction or aggregation window.

Normative wire name: `input`.

### 6.2 Output (`O`)

A non-negative quantity of output tokens attributed to the measured interaction or aggregation window.

Normative wire name: `output`.

### 6.3 Cache Write / Cache Creation (`W`)

A non-negative quantity of tokens written into a provider/tool cache where such telemetry exists.

Normative wire name: `cache_write`.

Implementations MAY expose aliases such as `cacheCreate` or `tokens_cache_creation`.

### 6.4 Cache Read (`R`)

A non-negative quantity of tokens read from a provider/tool cache where such telemetry exists.

Normative wire name: `cache_read`.

Implementations MAY expose aliases such as `cacheRead` or `tokens_cache_read`.

### 6.5 Missing telemetry

An implementation MUST NOT fabricate missing cache telemetry.

If a source does not expose cache-write or cache-read counts, the portable record SHOULD represent the unavailable value as `null`.

## 7. Core metrics

### 7.1 Yield (Υ)

`Υ = (R × O) / I²`

Equivalent:

`Υ = Leverage × Velocity`

Undefined when `I = 0`.

### 7.2 Leverage

`L = R / I`

Undefined when `I = 0`.

### 7.3 Velocity

`V = O / I`

Undefined when `I = 0`.

### 7.4 SNR

`S = O / (I + O)`

Undefined when `I + O = 0`.

### 7.5 10xDEV

Mathematical identity:

`10xDEV = log10(R / I) = log10(Leverage)`

Current reference implementation policy:

- compute only when `I > 0`, `O > 0`, `W > 0`, and `R > 0`;
- otherwise return `null` plus an explanatory warning.

A v0.1-compatible implementation SHOULD preserve this reference policy so results remain comparable.

## 8. Reserved and unresolved derived terminology

### 8.1 Construction

`Construction` is **not a v0.1 core metric** and MUST NOT appear in a v0.1 portable record as though one formula were standardized.

Standardization work found two existing product usages:

- the canonical SignalAF Build Archetype classifier uses `construction = W / R`;
- the current `@sigrank/cascade.operatorSignature()` convenience implementation derives a separate ratio equivalent to `W / O`.

Until that naming conflict is resolved under product canon, the word `Construction` is reserved outside the normative v0.1 metric set.

### 8.2 Depth

`Depth` MUST NOT be presented as the normative name for `log10(Leverage)` in v0.1-draft. The current canonical metric name is `10xDEV`.

### 8.3 Cache Ratio

`Cache Ratio` is not part of the normative v0.1 core.

## 9. Null semantics

Undefined values MUST NOT be silently converted into arbitrary zeroes, infinities, or NaNs.

A portable implementation SHOULD return `null` and MAY attach machine-readable warnings.

## 10. Operator states and classifications

The base standard distinguishes:

- **Metric** — quantitative measurement;
- **Signature** — compact measurement fingerprint;
- **Build Archetype** — descriptive composition classification;
- **Class Tier** — reference implementation scale/qualification stage;
- **Rank** — relative position in a defined field;
- **Credential** — externally verifiable assertion;
- **Outcome** — external task/business measurement.

Build Archetype and RS05 Class Tier are SignalAF reference extensions, not base v0.1 compatibility requirements.

See:

- `ARCHETYPE_STATUS.md`
- `RS05_STATUS.md`

## 11. Comparative context

### 11.1 Reference Field

A defined population of compatible operator measurements used for comparative distributions.

### 11.2 Field Percentile

Relative position within a named field.

A percentile claim MUST identify the field or field version.

### 11.3 Cohort Position

Relative position inside a defined comparison cohort.

A cohort claim MUST identify cohort membership criteria.

## 12. Longitudinal context

### Movement

Change in a metric, signature, state, or relative position across a defined interval.

### Stability

Persistence of measurement characteristics across repeated observations.

### Divergence

Degree to which measurements move apart across time, tools, models, workflows, or cohorts.

Longitudinal claims SHOULD disclose the observation window and aggregation method.

## 13. Organizational extensions

The following terms are informative in v0.1-draft:

- AI Operating Structure
- Operator Topology
- Capability Concentration
- Model Dependency
- Workflow Fit
- Learning Curve

See `strategy/ENTERPRISE_EXTENSION_MAP.md`.

## 14. Privacy / content independence

A base-compatible implementation MUST NOT require semantic payloads to calculate the core metrics.

Semantic payloads include prompt text, response text, source code, repository contents, or proprietary work product.

Optional enrichment MAY exist but MUST be distinguishable from the base SigRank layer.

## 15. Interchange

Compatible portable records SHOULD conform to:

`schema/sigrank-operator-record-v0.1.schema.json`

Every record MUST declare its SigRank specification version.

## 16. Compatibility

A system MAY claim:

`SigRank Compatible — v0.1-draft`

when it:

1. preserves primitive semantics;
2. computes the normative core equations correctly;
3. preserves null semantics;
4. emits a portable versioned record;
5. does not require semantic content for core measurement; and
6. identifies mappings when implementation field names differ from standard wire names.

## 17. Conformance

`SigRank Conformant` is reserved for a later machine-executable conformance suite and MUST NOT be used as a v0.1-draft certification claim.

## 18. Reference implementation

`@sigrank/cascade` is the current pure-math reference implementation for the core metric equations.

SignalAF is the public reference platform.

`sigrank-mcp` is the portable measurement instrument.

Reference-product classifications and convenience outputs are not automatically normative merely because they are currently emitted by a reference package.

## 19. Reference field

The SignalAF public field is the current reference field for public comparative measurements.

Field membership, eligibility, anti-gaming, and public ranking logic are not defined by the base standard.

## 20. Versioning

Proposed draft sequence:

- `0.1` — primitives, core metrics, privacy, interchange
- `0.2` — provider-normalization rules
- `0.3` — executable conformance suite
- `0.4` — longitudinal definitions
- `0.5` — organizational extension
- `1.0` — stable core

Breaking semantic changes require a version increment.
