# Measurement Boundaries and Known Limitations

SigRank is not a universal productivity score.

## The core standard does not inherently determine

- correctness;
- task success;
- code quality;
- model intelligence;
- human intelligence;
- creativity;
- employee productivity;
- hiring suitability;
- compensation;
- business value;
- financial ROI;
- causal impact.

## Correlation is not causation

Enterprise systems may correlate operator telemetry with external outcomes such as:

- merged PRs;
- code-review time;
- deployment cadence;
- bug rates;
- rollback rates;
- incidents;
- cost;
- cycle time.

Those should be presented as associations unless study design supports causal inference.

## Provider differences

Token and cache semantics vary by provider and tool. Full provider normalization is deferred beyond v0.1.

## Public ranking

Public rank is an application of the measurement system to a specific reference field and eligibility policy. It is not required by the base standard.
