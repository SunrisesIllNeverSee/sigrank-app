---
type: Reference
title: Submission and Snapshot
description: Defines submissions as windowed payloads and snapshots as stored, scored representations after ingest checks. Active.
tags: [sigrank, submission, snapshot, ingest, verification, reference]
timestamp: 2026-07-21
---

# Submission and snapshot

A submission is a payload sent for a defined time window. A snapshot is the stored, scored representation produced after parsing, integrity checks, and persistence.

A submission includes raw telemetry, a window, device context, and a claimed snapshot hash. The ingest chain checks plausibility, duplicates/replays, rate limits, hash/signature evidence, and an optional server-side verification battery before it can be scored or stored.

Signed submissions arrive at `POST /api/v1/snapshots`; the ed25519 signature travels in the `x-agent-signature` header. Devices enroll via `POST /api/v1/devices/enroll`, which requires a connect code issued on signalaf.com and binds the device public key to the operator.

A submission may be accepted, flagged, or rejected. A verification tier describes integrity evidence; it is not proof of intent or correctness.

Source: `lib/ingest/gates.ts`.