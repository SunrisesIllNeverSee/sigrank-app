# Submission and snapshot

A submission is a payload sent for a defined time window. A snapshot is the stored, scored representation produced after parsing, integrity checks, and persistence.

A submission includes raw telemetry, a window, device context, and a claimed snapshot hash. The ingest chain checks plausibility, duplicates/replays, rate limits, hash/signature evidence, and an optional server-side verification battery before it can be scored or stored.

A submission may be accepted, flagged, or rejected. A verification tier describes integrity evidence; it is not proof of intent or correctness.

Source: `lib/ingest/gates.ts`.