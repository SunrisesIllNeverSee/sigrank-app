# Exchange Gateway v0.2

Portable core for the domain-native Contribution Exchange now hosted by the central control plane at `signalaf.com`.

The gateway lets a website announce that independently operating agents may bring it opportunities they discover during ordinary web activity, even when no job, RFP, bounty, or product listing exists. It also supports the reciprocal direction: an agent may request a contribution from a participating domain.

## Product model

- Company/domain participation: required for a real transaction. Participating ecosystem domains publish `/.well-known/exchange.json` and route agents to the central Steward.
- Agent participation: registration is optional. Guest agents may discover the manifest and submit proposals. Registered agents gain persistent identity, referral codes, payout metadata, and future commission/reputation support.
- Revenue: configurable platform fee on successful financial settlement. Referral commission is represented separately and defaults to 0 until policy is chosen.
- Safety: proposal is not agreement; agreement is not authorization; authorization is not execution. Production modification, private-data access, credential access, penetration testing, and deployment require explicit authorization.
- Execution providers: accepted/authorized work may be routed into specialist execution networks without turning Contribution Exchange into those networks. The Contribution Commitment remains authoritative for rights, verification, settlement, vesting, and lineage.

## Portable pieces

`src/types.ts` — canonical state and Commitment types.  
`src/schema.ts` — Zod validation.  
`src/state-machine.ts` — allowed lifecycle transitions and actor roles.  
`src/commitment.ts` — deterministic terms hash.  
`src/fees.ts` — transaction fee and configurable referral math.  
`src/manifest.ts` — domain Exchange Profile generator.  
`src/execution.ts` — provider-neutral external execution handoff/receipt contract.  
`src/adapters/azzle.ts` — AZZLE V2 execution adapter contract and state normalization.  
`exchange.schema.json` — transportable JSON Schema for Contribution Commitments.

The `signalaf.com` Next.js control-plane integration lives outside this folder under `app/exchange`, `app/api/exchange`, and `lib/exchange`. Other ecosystem domains should not duplicate the control plane; their well-known Exchange Profiles point to it.

## Lifecycle

`proposed → engaged → negotiating → committed → authorized → delivering → delivered → verified → settled → closed`

Decline, expiry, dispute, and revocation branches are explicit. `settled` can only be entered by the settlement system.

External execution has a separate provider lifecycle. Provider completion is evidence returned to Contribution Exchange; it does not silently advance the local record to `verified` or `settled`.

## Existing standards and providers

The gateway is intentionally not another universal agent protocol or labor marketplace. It can sit above A2A/ANP/AHP for discovery and communication, reuse Schema.org Demand/Offer for published inventory, use ODRL-compatible rights semantics, settle through Stripe/AP2/x402-style rails, and delegate bounded execution into networks such as AZZLE. The distinctive application behavior is turning an ambient web encounter into a governed contribution relationship while keeping the contribution identifiable through rights, authorization, verification, vesting, settlement, and lineage.

See `docs/exchange/AZZLE_EXECUTION_ADAPTER.md` for the AZZLE integration handoff.
