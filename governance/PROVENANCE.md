---
type: Spec
title: Provenance
description: Provenance requirements for observations and releases, including source, window, transformations, and layered verification. Active.
tags: [sigrank, provenance, verification, ingest, dataset-provenance, spec]
timestamp: 2026-07-21
---

# Provenance

Every observation and release should preserve enough context to answer: where did it come from, when was it observed, what window does it represent, what transformations were applied, and what verification evidence exists?

Submission provenance includes the raw telemetry payload, declared window, device context, snapshot hash, and available signature evidence. The ingest chain records accept/flag/reject reasons and verification tier. Dataset provenance includes source, extraction date, inclusion rules, method version, and anonymization process.

Verification is layered: structural plausibility, duplicate/replay checks, throttling, hash/signature checks, and server-side battery analysis. Passing a layer raises confidence within its scope; it never guarantees truth or intent. The signature is ed25519 over the canonical bytes of the payload (recursively sorted keys, compact separators, UTF-8), with `agent.signature` and `agent.snapshot_hash` stripped before serialization; it is carried in the `x-agent-signature` header. `agent.snapshot_hash` holds `"sha256:" + hex(sha256(canonical_bytes))` — the digest of the canonical bytes, not the signature.

Source: `lib/ingest/gates.ts`.