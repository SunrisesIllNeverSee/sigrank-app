# SigRank Glossary

## AI Operator
A human who directs, configures, supervises, iterates with, or otherwise operates a generative AI system.

## AI Operator Performance
Measured characteristics of how a human operates AI. It does not inherently mean productivity, correctness, intelligence, or business value.

## AI Operator Metric
A quantitative measurement defined at the human-operator layer.

## Operator Evaluation
Measurement and interpretation of operator-layer telemetry and derived metrics.

## Operator Telemetry
Machine-observable usage measurements associated with operation of AI systems.

## Input (`I`)
Fresh input-token quantity.

## Output (`O`)
Output-token quantity.

## Cache Write / Cache Creation (`W`)
Token quantity written to a cache when exposed by the source.

## Cache Read (`R`)
Token quantity read from a cache when exposed by the source.

## Yield (`Υ`)
`(R × O) / I²`

## Leverage (`L`)
`R / I`

## Velocity (`V`)
`O / I`

## SNR (`S`)
`O / (I + O)`

## 10xDEV
Reference SigRank logarithmic amplification metric: `log10(R / I)`, subject to reference implementation null policy.

## Construction
Reference signature component: `W / O` when output is positive. Informative in v0.1-draft.

## Operator Signature
A compact fingerprint assembled from standardized measurements.

## Archetype
A descriptive classification derived from measurement structure. Non-normative in v0.1-draft.

## RS05 Class
A SignalAF/SigRank reference taxonomy currently implemented as a 24-stage total-token progression. Not part of the base v0.1 standard.

## Field
A defined reference population.

## SignalAF Reference Field
The public comparison population used by the SignalAF implementation.

## Cohort
A defined subset used for comparison.

## Field Percentile
Position relative to a named field.

## Cohort Position
Position relative to a named cohort.

## Movement
Change across a defined interval.

## Stability
Persistence across repeated measurements.

## Divergence
Degree of separation across time, tools, models, workflows, or groups.

## AI Operating Structure
Measured pattern by which AI-operating characteristics manifest within an organization.

## Operator Topology
Distribution and relationships of operator characteristics across a cohort.

## Capability Concentration
Degree to which measured AI-operating characteristics are concentrated among a subset of operators.

## Model Dependency
Degree to which observed operator measurements vary with model/provider choice.

## Workflow Fit
Relationship between operator measurements and the workflow contexts in which they occur.

## Learning Curve
Longitudinal change in standardized operator measurements.

## Rank
Relative ordering in a defined field. Rank is not itself a base metric.

## Credential
A verifiable assertion based on measurements or status.

## Outcome
An external task, quality, workflow, financial, or business result.
