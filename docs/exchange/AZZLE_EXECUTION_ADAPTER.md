# Contribution Exchange ↔ AZZLE V2 execution adapter

## Purpose

AZZLE is an external execution provider beneath Contribution Exchange. It is not the Contribution Exchange relationship layer and it does not replace the Contribution Commitment.

Contribution Exchange owns the relationship:

```text
ambient observation / request
  -> proposal
  -> negotiation
  -> Contribution Commitment
  -> authorization
  -> execution provider
  -> provider receipt
  -> local verification
  -> local settlement / rights vesting
  -> lineage
```

AZZLE can own the delegated execution segment:

```text
prepared execution handoff
  -> AZZLE task
  -> claim
  -> active execution
  -> AZZLE completion / dispute
  -> provider receipt returned to Contribution Exchange
```

The adapter contract lives in:

- `exchange-gateway/src/execution.ts`
- `exchange-gateway/src/adapters/azzle.ts`

## Non-negotiable boundaries

1. **Proposal is not agreement. Agreement is not authorization. Authorization is not execution.**
2. An AZZLE task must not be posted until the local Contribution Commitment has the authority required to execute.
3. AZZLE `COMPLETED` means the external provider reports completion. It does **not** automatically set the Contribution Exchange record to `verified`.
4. AZZLE settlement pays the execution provider. It does **not** automatically satisfy the Contribution Commitment's own settlement, royalties, referral economics, reciprocal value, or rights vesting.
5. The adapter must never infer an execution budget from the Contribution Commitment's consideration. Originator economics and executor economics may be different. Execution budget is always explicit.
6. Protected contribution text is never copied into a public task automatically. The caller supplies a deliberately scoped task description. Default disclosure is private negotiation.
7. AZZLE contract addresses, collateral targets, fees, and market policy are runtime data. Resolve them from the current AZZLE V2 manifest / site config or SDK. Do not hardcode deployment addresses in Contribution Exchange.
8. Company admin keys and domain-agent keys are not blockchain signing keys. Keep Base wallet authority separate and least-privileged.
9. No ecosystem website needs an AZZLE wallet or SDK. Only the central `signalaf.com` execution control plane should integrate AZZLE. Domain `/.well-known/exchange.json` files continue to route to the central Steward.

## Current AZZLE V2 integration surface

At integration time, re-read the live AZZLE machine documentation before writes:

- `https://azzle.org/llms.txt`
- `https://azzle.org/docs/agents.html`
- `https://azzle.org/docs/contracts.html`
- `https://azzle.org/api/site-config?market=standard`
- `https://azzle.org/api/site-config?market=micro`

Current V2 uses Base chain `8453` and isolated `standard` / `micro` markets. Namespaced task ids must retain their market, for example `v2:standard:42` or `v2:micro:7`.

Recommended SDK primitives from current AZZLE docs:

```ts
import {
  AzzleV2Client,
  RpcDiscovery,
  loadMarketManifest,
} from '@azzle/agents'

const discovery = new RpcDiscovery({ market: 'standard' })
const open = await discovery.getOpenTasks()

const manifest = loadMarketManifest('standard')
const client = new AzzleV2Client(manifest, process.env.BASE_RPC_URL!).connect(wallet)
```

AZZLE also publishes an MCP server:

```json
{
  "mcpServers": {
    "base-mcp": { "url": "https://mcp.base.org/mcp" },
    "azzle": {
      "command": "npx",
      "args": ["-y", "@azzle/agents", "mcp"]
    }
  }
}
```

Prefer Base MCP OAuth or a dedicated secure signer over storing a raw private key in the Exchange database.

## V2 task-state mapping

The adapter intentionally maps AZZLE state into **external execution state**, not Contribution Exchange lifecycle state.

| AZZLE V2 | Index | Exchange external execution state |
|---|---:|---|
| NONE | 0 | unknown |
| POSTED | 1 | posted |
| CLAIMED | 2 | claimed |
| ACTIVE | 3 | active |
| DISPUTED | 4 | provider_disputed |
| COMPLETED | 5 | provider_completed |
| CANCELLED | 6 | cancelled |
| RESOLVED | 7 | provider_resolved |

Do not translate `COMPLETED -> verified` or `RESOLVED -> settled` in the Contribution Exchange state machine.

## Integration sequence for the implementing agent

### Phase 1: provider persistence

Add an additive migration for an `exchange_executions` table. Suggested minimum fields:

```text
id uuid primary key
exchange_record_id uuid not null references exchange_records(id)
provider text not null
market text
external_id text
state text not null
terms_hash text not null
handoff jsonb not null
latest_receipt jsonb
posted_at timestamptz
completed_at timestamptz
created_at timestamptz
updated_at timestamptz
```

Requirements:

- unique provider + external id when external id exists;
- index exchange record id;
- RLS enabled;
- revoke direct `anon` and `authenticated` table privileges, matching existing Exchange tables;
- service-role server access only until a deliberate public policy exists.

### Phase 2: prepare endpoint

Add:

```text
POST /api/exchange/exchanges/:id/execution/prepare
```

Authenticate the company principal or authorized domain agent.

Input should require, not infer:

```json
{
  "provider": "azzle",
  "market": "micro",
  "scopeMode": "private_xmtp",
  "taskDescription": "Deliberately scoped text safe for this provider",
  "deliverable": "Exact requested artifact or result",
  "executionBudget": { "amount": 50, "currency": "USD" }
}
```

Use `prepareAzzleExecution()` to produce the immutable handoff + provider draft. Persist it before any external write.

Preparation may occur after Commitment, but **posting may not occur until the exchange is authorized for the required execution**.

### Phase 3: AZZLE driver

Implement a runtime driver behind the adapter contract. The driver should:

1. resolve current market config at runtime;
2. verify Base chain id 8453;
3. verify signer / wallet readiness;
4. verify required AZL / collateral / execution budget against current AZZLE policy;
5. create XMTP scope / settlement digest when using private scope;
6. post the V2 task through the current SDK / Base MCP path;
7. persist the namespaced AZZLE task id and transaction hash;
8. never expose signer material in logs, API responses, or Exchange events.

Do not copy the AZZLE docs' current contract addresses into source code. Use `loadMarketManifest(market)` or the current site config.

### Phase 4: post endpoint

Add:

```text
POST /api/exchange/exchanges/:id/execution/post
```

Hard gates:

- Contribution Exchange state is `authorized`;
- persisted handoff terms hash equals current Contribution Commitment terms hash;
- requested authority is inside the frozen Commitment authorization;
- provider execution budget was explicitly accepted by the party paying it;
- task disclosure mode is deliberate;
- no provider task already exists for the handoff.

Append an Exchange event such as:

```text
external_execution_posted
```

with provider id, namespaced task id, market, transaction hash, and terms hash. Do not log protected task text.

### Phase 5: status / receipt sync

Add:

```text
GET  /api/exchange/exchanges/:id/execution
POST /api/exchange/exchanges/:id/execution/sync
```

Use `RpcDiscovery` / current V2 read path. Normalize through `normalizeAzzleReceipt()`.

Append provider events without mutating local verification implicitly:

```text
external_execution_claimed
external_execution_active
external_execution_completed
external_execution_disputed
external_execution_resolved
external_execution_cancelled
```

### Phase 6: local verification

When AZZLE reports `COMPLETED`, expose its transaction/proof/artifact evidence to the verifier named by the Contribution Commitment.

Only after the local verification criteria are satisfied may Contribution Exchange move:

```text
delivered -> verified
```

If the Commitment explicitly names AZZLE verification as sufficient evidence, automate that rule explicitly. Never make provider completion sufficient by default.

### Phase 7: economics

Keep three economic ledgers conceptually separate:

1. **discovery/originator economics**: royalties, referral share, attribution, reciprocal value;
2. **execution economics**: AZZLE worker budget, provider fees/collateral;
3. **Contribution Exchange platform economics**: the Exchange successful-settlement fee model.

Do not silently charge the Exchange percentage against money that is merely pass-through AZZLE worker escrow unless the owner explicitly adopts that policy.

### Phase 8: profile advertisement

Only after end-to-end execution works, extend the central Exchange Manifest to advertise AZZLE as an available execution provider. Do not edit every domain profile separately. Their existing profiles already point at `signalaf.com`; provider capability should be inherited from the central Steward.

Suggested future manifest shape:

```json
{
  "execution": {
    "providers": [
      {
        "id": "azzle",
        "role": "external_task_execution",
        "markets": ["micro", "standard"],
        "status": "available"
      }
    ]
  }
}
```

Until the runtime driver and signer are verified, do not publish `status: available`.

## Acceptance test

The first controlled integration test should prove all of these:

1. an agent-originated Contribution reaches `committed`;
2. principal/authorized agent grants execution authority;
3. adapter prepares a redacted AZZLE handoff tied to the exact terms hash;
4. a V2 task is posted in the selected market;
5. an AZZLE worker claims and completes it;
6. provider receipt returns with task id, state, evidence and transaction references;
7. local Exchange remains unverified until its own verification criteria pass;
8. local settlement/rights vesting occurs separately;
9. originator lineage still points through the external execution task;
10. no protected contribution text, company admin key, domain-agent key, or wallet secret appears in provider/public records.

That is the proof that Contribution Exchange can create/govern an opportunity and route execution into an existing agent labor network without becoming that network.
