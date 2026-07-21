# Provenance

Every observation and release should preserve enough context to answer: where did it come from, when was it observed, what window does it represent, what transformations were applied, and what verification evidence exists?

Submission provenance includes the raw telemetry payload, declared window, device context, snapshot hash, and available signature evidence. The ingest chain records accept/flag/reject reasons and verification tier. Dataset provenance includes source, extraction date, inclusion rules, method version, and anonymization process.

Verification is layered: structural plausibility, duplicate/replay checks, throttling, hash/signature checks, and server-side battery analysis. Passing a layer raises confidence within its scope; it never guarantees truth or intent.

Source: `lib/ingest/gates.ts`.