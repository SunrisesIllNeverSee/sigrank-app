import { randomUUID } from 'node:crypto'
import type {
  ContributionCommitment,
  ExecutionAssessment,
  ExecutionAuthority,
  ExecutionCapabilities,
  ExecutionProvider,
  ExecutionReceipt,
  ExecutionReference,
  ExecutionRequest,
  ExecutionStatus,
} from '../types'

// ─── External Provider Adapter Scaffold ───
//
// This is a concrete adapter template for a real external execution provider.
// It implements the ExecutionProvider interface and enforces all
// architectural rules from EXECUTION_PROVIDER_PLAN.md and
// INTEROPERABILITY_PROOF_PLAN.md.
//
// The adapter performs exactly two translations:
//   1. ExecutionRequest  →  Provider-native task/request
//   2. Provider-native result  →  ExecutionReceipt
//
// Provider-specific API calls are marked with TODO comments. Once the owner
// selects a specific external provider, fill in:
//   - The provider's API base URL and endpoints
//   - The provider's native task creation format
//   - The provider's native status format
//   - The provider's native result/receipt format
//   - The provider's callback signature scheme (if not HMAC-SHA-256)
//
// The adapter MUST NOT:
//   - Expand authorization beyond what the commitment grants
//   - Forward private negotiation history or unrelated rights clauses
//   - Introduce provider-specific state names into canonical types
//   - Accept callbacks without cryptographic authentication
//   - Treat provider state as authoritative over the database

export interface ExternalProviderConfig {
  /** Unique provider ID used in the execution router and verifier registry. */
  providerId: string
  /** Base URL of the provider's API (e.g., https://api.provider.com/v1). */
  baseUrl: string
  /** API key or bearer token for authenticating outbound requests. */
  apiKey: string
  /** Capabilities this provider declares. Used by the router for selection. */
  capabilities: ExecutionCapabilities
}

/**
 * Derive the execution authority from a commitment's authorization.
 *
 * This is inlined here (rather than imported from execution-router.ts)
 * to keep the adapter self-contained for Node ESM test loading. The
 * router has its own copy; both must stay identical.
 */
function deriveExecutionAuthority(commitment: ContributionCommitment): ExecutionAuthority {
  return {
    inspect: commitment.authorization.inspect,
    test: commitment.authorization.test,
    modify: commitment.authorization.modify,
    deploy: commitment.authorization.deploy,
    access_scope: commitment.authorization.access_scope ?? [],
  }
}

/**
 * Create an external execution provider adapter.
 *
 * The adapter is registered with the execution router via
 * `registerProvider(adapter)` and its callback verifier is registered
 * via `registerProviderVerifier(providerId, credentials)` or env-based
 * bootstrap.
 */
export function createExternalProviderAdapter(config: ExternalProviderConfig): ExecutionProvider {
  return {
    id: config.providerId,

    capabilities(): ExecutionCapabilities {
      return { ...config.capabilities }
    },

    async canExecute(
      commitment: ContributionCommitment,
      request: ExecutionRequest,
    ): Promise<ExecutionAssessment> {
      // ─── Authorization non-expansion check ───
      // The provider's capabilities do not create authorization. The
      // execution authority is always a subset of the commitment's
      // authorization. This is enforced at the router level too, but
      // the adapter double-checks as a defense-in-depth measure.
      const commitmentAuthority = deriveExecutionAuthority(commitment)
      const requestAuthority = request.authority

      if (requestAuthority.deploy && !commitmentAuthority.deploy) {
        return {
          can_execute: false,
          reasons: ['adapter refuses to expand authorization: deploy not granted by commitment'],
        }
      }
      if (requestAuthority.modify && !commitmentAuthority.modify) {
        return {
          can_execute: false,
          reasons: ['adapter refuses to expand authorization: modify not granted by commitment'],
        }
      }

      // ─── Provider-specific capability assessment ───
      // TODO: Call the provider's API to check if it can handle this task.
      // For now, accept all work that fits within the declared capabilities.
      // Replace this with a real provider API call once the provider is selected.
      //
      // Example:
      //   const response = await fetch(`${config.baseUrl}/assess`, {
      //     method: 'POST',
      //     headers: { 'Authorization': `Bearer ${config.apiKey}` },
      //     body: JSON.stringify(mapToProviderTask(request)),
      //   })
      //   const assessment = await response.json()

      return {
        can_execute: true,
        reasons: [`${config.providerId} accepts work within declared capabilities`],
      }
    },

    async createExecution(request: ExecutionRequest): Promise<ExecutionReference> {
      // ─── Translation 1: ExecutionRequest → Provider-native task ───
      // TODO: Map the ExecutionRequest to the provider's native task format.
      // Only include what the executor requires (least disclosure).
      //
      // Example:
      //   const providerTask = {
      //     title: request.task.title,
      //     description: request.task.description,
      //     deliverables: request.task.deliverables,
      //     acceptance_criteria: request.task.acceptance_criteria,
      //     budget: request.budget,
      //     deadline: request.deadline,
      //     // Do NOT forward: private negotiation history, unrelated rights,
      //     // internal company policies, private participant info, credentials
      //   }
      //
      //   const response = await fetch(`${config.baseUrl}/tasks`, {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${config.apiKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(providerTask),
      //   })
      //   if (!response.ok) {
      //     throw new Error(`Provider createExecution failed: ${response.status}`)
      //   }
      //   const data = await response.json()
      //   return {
      //     execution_id: request.execution_id,
      //     provider: config.providerId,
      //     provider_reference: data.id,  // provider's native task ID
      //     created_at: data.created_at,
      //   }

      // Scaffold: return a synthetic reference until the provider API is wired
      const now = new Date().toISOString()
      return {
        execution_id: request.execution_id,
        provider: config.providerId,
        provider_reference: `ext_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        created_at: now,
      }
    },

    async getExecution(reference: ExecutionReference): Promise<ExecutionStatus> {
      // ─── Provider status polling (non-authoritative observation) ───
      // TODO: Call the provider's status endpoint and map the native state
      // to the normalized ExecutionState. The database remains canonical.
      //
      // Example:
      //   const response = await fetch(`${config.baseUrl}/tasks/${reference.provider_reference}`, {
      //     headers: { 'Authorization': `Bearer ${config.apiKey}` },
      //   })
      //   if (!response.ok) throw new Error(`Provider getExecution failed: ${response.status}`)
      //   const data = await response.json()
      //   return {
      //     reference,
      //     state: mapProviderStateToNormalized(data.status),
      //     updated_at: data.updated_at,
      //     provider_state: data.status,  // native state, kept for audit
      //     message: data.message,
      //   }

      // Scaffold: return a non-authoritative observation
      return {
        reference,
        state: 'created',
        updated_at: new Date().toISOString(),
        provider_state: 'unknown',
        message: 'external provider adapter scaffold — provider API not yet wired',
      }
    },

    async cancelExecution(_reference: ExecutionReference): Promise<void> {
      // TODO: Call the provider's cancellation endpoint.
      //
      // Example:
      //   await fetch(`${config.baseUrl}/tasks/${_reference.provider_reference}/cancel`, {
      //     method: 'POST',
      //     headers: { 'Authorization': `Bearer ${config.apiKey}` },
      //   })

      // Scaffold: no-op until the provider API is wired
    },

    async verifyExecution(_reference: ExecutionReference): Promise<ExecutionReceipt> {
      // ─── Translation 2: Provider-native result → ExecutionReceipt ───
      // TODO: Fetch the provider's result and map it to the normalized
      // ExecutionReceipt. The receipt becomes evidence attached to the
      // Contribution Commitment and its lineage.
      //
      // Example:
      //   const response = await fetch(`${config.baseUrl}/tasks/${_reference.provider_reference}/result`, {
      //     headers: { 'Authorization': `Bearer ${config.apiKey}` },
      //   })
      //   const data = await response.json()
      //   return {
      //     execution_reference: _reference,
      //     provider: config.providerId,
      //     provider_reference: _reference.provider_reference,
      //     status: mapProviderResultToReceiptStatus(data.result),
      //     executor: {
      //       id: data.worker_id,
      //       identity: data.worker_name,  // if available
      //       role: 'external',
      //     },
      //     artifact: data.artifact ? {
      //       uri: data.artifact.url,
      //       hash: data.artifact.hash,  // must be content-addressed
      //     } : undefined,
      //     verification: data.verification ? {
      //       status: data.verification.status,
      //       evidence: data.verification.evidence ?? [],
      //     } : undefined,
      //     settlement: data.settlement ? {
      //       status: data.settlement.status,
      //       amount: data.settlement.amount,
      //       currency: data.settlement.currency,
      //       receipt: data.settlement.receipt_id,
      //     } : undefined,
      //     timestamps: {
      //       created: data.created_at,
      //       started: data.started_at,
      //       delivered: data.delivered_at,
      //       verified: data.verified_at,
      //       settled: data.settled_at,
      //     },
      //     provider_metadata: {
      //       reference: data.provider_internal_id,
      //     },
      //   }

      // Scaffold: fail closed. A template that returns a positive receipt
      // status ('delivered') for an unimplemented verification call is a
      // footgun — if someone forgets this is a scaffold and wires the
      // adapter into the router without filling in the provider API, the
      // system would accept synthetic receipts as real delivery evidence.
      // Throwing makes accidental activation loud and immediate.
      //
      // Once the provider API is wired, replace this throw with the real
      // fetch + mapping logic shown in the example above.
      throw new Error(
        `External provider "${config.providerId}" verifyExecution not implemented — ` +
          'fill in the provider result fetch + ExecutionReceipt mapping before registering this adapter',
      )
    },
  }
}

// ─── Provider State Mapping Helper ───
//
// Each external provider maps its native state machine into the normalized
// execution lifecycle. Provider-specific state names never enter the
// canonical Contribution Exchange state machine.
//
// TODO: Replace this scaffold mapping with the actual provider's state names
// once the provider is selected.
//
// Normalized lifecycle:
//   created → offered → accepted → funded → executing → delivered → verified → settled
//   Branches: failed, cancelled, disputed, expired

export function mapProviderStateToNormalized(
  providerState: string,
): 'created' | 'offered' | 'accepted' | 'funded' | 'executing' | 'delivered' | 'verified' | 'settled' | 'failed' | 'cancelled' | 'disputed' | 'expired' {
  // TODO: Map the provider's native state names to the normalized lifecycle.
  // This is a scaffold mapping — replace with the actual provider's states.
  const lower = providerState.toLowerCase()
  if (lower.includes('creat') || lower.includes('pending')) return 'created'
  if (lower.includes('offer') || lower.includes('queued')) return 'offered'
  if (lower.includes('accept') || lower.includes('claim')) return 'accepted'
  if (lower.includes('fund') || lower.includes('escrow')) return 'funded'
  if (lower.includes('execut') || lower.includes('progress') || lower.includes('running')) return 'executing'
  if (lower.includes('deliver') || lower.includes('complete')) return 'delivered'
  if (lower.includes('verif') || lower.includes('review')) return 'verified'
  if (lower.includes('settl') || lower.includes('paid')) return 'settled'
  if (lower.includes('fail') || lower.includes('error')) return 'failed'
  if (lower.includes('cancel')) return 'cancelled'
  if (lower.includes('disput') || lower.includes('reject')) return 'disputed'
  if (lower.includes('expir') || lower.includes('timeout')) return 'expired'
  return 'created'
}

/**
 * Map a provider's native result status to the receipt status enum.
 * Fail-closed: unknown statuses return 'failed' rather than defaulting
 * to a positive state.
 */
export function mapProviderResultToReceiptStatus(
  providerResult: string,
): 'delivered' | 'verified' | 'failed' | 'cancelled' | 'disputed' {
  const lower = providerResult.toLowerCase()
  if (lower.includes('deliver') || lower.includes('complete') || lower.includes('success')) return 'delivered'
  if (lower.includes('verif') || lower.includes('review')) return 'verified'
  if (lower.includes('cancel')) return 'cancelled'
  if (lower.includes('disput') || lower.includes('reject')) return 'disputed'
  // Fail-closed on unknown
  return 'failed'
}
