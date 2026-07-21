---
type: Design
title: Architecture
description: System architecture for the SignalAF app, ingest gate chain, and data layer. Active.
tags: [sigrank, architecture, ingest, supabase, nextjs, design]
timestamp: 2026-07-21
---

# Architecture

```text
Operator tools / MCP client
          |
          v
  App API: enrollment and snapshots
          |
          v
Ingest: parse -> validate -> sign/verify -> integrity gates -> persistence
          |                                      |
          v                                      v
Supabase data layer                     verification tier / reasons
          |
          +--> App board, profiles, comparisons, field pages
          +--> Versioned datasets and research releases
```

The Next.js app is the public application and API surface. MCP tooling collects locally available telemetry and submits a snapshot through the API. The data layer stores operator identity links, devices, snapshots, and derived board views. Server-side authentication verifies the Supabase JWT with `getUser()` and resolves the linked operator; it does not trust an unverified cookie session.

The ingest gate chain runs before scoring or persistence and can accept, flag, or reject a submission. It separates public diagnostics from server-only integrity controls. Sources: `lib/ingest/gates.ts`, `lib/supabase/auth-server.ts`.