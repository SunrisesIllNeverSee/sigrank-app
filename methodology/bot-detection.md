# Bot detection and Benford validation

Benford's Law expects leading digit `d` with probability `log10(1 + 1/d)`. SignalAF's aggregate check extracts leading digits from positive finite token counts, compares observed and expected counts, and calculates chi-squared.

The default aggregate check does not run below `n = 30`. It flags when chi-squared is greater than `15.5`, the documented 95% critical value for eight degrees of freedom. The implementation says per-session Benford over four pillars is statistically vacuous; aggregate analysis is the meaningful use.

A Benford flag is evidence for review, not proof of fabrication. It must be considered with data coverage, independence, collection behavior, and other ingest reasons. The production gate may include server-only battery checks whose precise logic is not public.

Sources: `lib/ingest/aggregate-benford.ts`, `lib/ingest/gates.ts`.