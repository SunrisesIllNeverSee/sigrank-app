---
type: Coordination
title: Micro Coordination Bus
description: Append-only working coordination bus for agents operating inside this repository.
tags: [repo-standard, coordination, scratchpad]
timestamp: 2026-08-26
---


# Micro Coordination Bus

## Protocol

- Read the tail before beginning material work.
- Append assignments, blockers, decisions, and completion reports.
- Do not use this as durable product documentation; promote durable knowledge into the appropriate repo document.

## Log

### 2026-08-26 — Devin (GTM 1 / build-coordinator)

- Assignment: complete MCP infrastructure for SignalAF — OperatorEvaluation, prompts, share cards, /mcp page, server card, x402 fix, cascade rewire + cleanup.
- Scope:
  - OperatorEvaluation wired into rank_paste, benchmark_me, compare_to_field, who_operates_like_me, operator_signature (commit 4236d5fc)
  - 5 MCP prompts: benchmark-my-operator, how-do-i-reach-top-10, explain-my-signature, diagnose-inefficiency, field-anomaly-report (commit 4236d5fc)
  - /share/mcp route with visual share cards + OG image (commit 4236d5fc, fix f8d86743)
  - Prompts added to mcp.json server card (commit ab147a57)
  - /mcp page updated with Resources + Prompts sections (commit ab147a57)
  - x402 build fix — lazy initialization of facilitator client (commit ab147a57)
  - Rewired to import from @sigrank/cascade npm package (commit a129a660)
  - Deleted local lib/cascade/index.ts — no longer imported (commit 94e7a4a4)
- Decision: shareable() truncation removed (encoded.slice(0,200) could break JSON). OG image route needed force-dynamic to prevent Vercel prerender crash.
- Tests: 11/11 canonical pass, MOSES yield 18436.98 verified.
- Deployed via Vercel (auto-deploy on push to main). All live-verified.
- Status: complete. Signed out.
