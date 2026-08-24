import { randomUUID } from 'node:crypto'
import type {
  ContributionCommitment,
  ExecutionAssessment,
  ExecutionAuthority,
  ExecutionCapabilities,
  ExecutionMode,
  ExecutionProvider,
  ExecutionRequest,
  ExecutionRouterResult,
  ExchangePolicy,
} from './types'
import { internalProvider } from './providers/internal'

/**
 * Execution Router
 *
 * After a Contribution Commitment is authorized, the router determines
 * how the work should be executed. It selects a provider based on:
 * - the domain's external_execution policy
 * - the provider's capabilities
 * - the commitment's authorization scope
 *
 * The router NEVER expands authorization. The execution authority
 * is always a subset of the commitment's authorization.
 */

const providers = new Map<string, ExecutionProvider>()
providers.set('internal', internalProvider)

/**
 * Register an external execution provider.
 */
export function registerProvider(provider: ExecutionProvider): void {
  providers.set(provider.id, provider)
}

/**
 * Get a registered provider by ID.
 */
export function getProvider(id: string): ExecutionProvider | undefined {
  return providers.get(id)
}

/**
 * List all registered provider IDs.
 */
export function listProviderIds(): string[] {
  return Array.from(providers.keys())
}

/**
 * Derive the execution authority from the commitment's authorization.
 * This is always a subset — never an expansion.
 */
export function deriveExecutionAuthority(commitment: ContributionCommitment): ExecutionAuthority {
  return {
    inspect: commitment.authorization.inspect,
    test: commitment.authorization.test,
    modify: commitment.authorization.modify,
    deploy: commitment.authorization.deploy,
    access_scope: commitment.authorization.access_scope ?? [],
  }
}

/**
 * Check if execution authority exceeds the policy's allowed authority.
 */
export function authorityWithinPolicy(auth: ExecutionAuthority, policy: ExchangePolicy): boolean {
  const allowed = policy.external_execution?.allowed_authority
  if (!allowed) return true // no restriction if not configured
  if (auth.inspect && !allowed.inspect) return false
  if (auth.test && !allowed.test) return false
  if (auth.modify && !allowed.modify) return false
  if (auth.deploy && !allowed.deploy) return false
  return true
}

/**
 * Check if the budget exceeds the autonomous limit.
 */
export function budgetRequiresHuman(budget: { amount: number } | undefined, policy: ExchangePolicy): boolean {
  if (!budget) return false
  const limit = policy.external_execution?.human_approval_above ?? 0
  return budget.amount > limit
}

/**
 * Determine the execution mode for a commitment.
 *
 * Default routing logic:
 * 1. If external_execution is not enabled → self_executed
 * 2. If a specific provider_id is requested and allowed → external_provider
 * 3. If no provider is specified → self_executed (internal)
 */
export function determineMode(
  commitment: ContributionCommitment,
  policy: ExchangePolicy,
  requestedProviderId?: string,
): ExecutionMode {
  if (!policy.external_execution?.enabled) return 'self_executed'
  if (!requestedProviderId) return 'self_executed'
  if (!policy.external_execution.allowed_providers.includes(requestedProviderId)) return 'self_executed'
  return 'external_provider'
}

/**
 * Build an ExecutionRequest from a ContributionCommitment.
 *
 * Uses least disclosure — only includes what the executor needs.
 * Strips private negotiation history, unrelated rights clauses,
 * internal company policies, and private participant information.
 */
export function buildExecutionRequest(
  commitment: ContributionCommitment,
  options?: {
    task_title?: string
    task_description?: string
    deliverables?: string[]
    acceptance_criteria?: string[]
    budget?: { amount: number; currency: string; maximum?: number }
    deadline?: string
  },
): ExecutionRequest {
  const authority = deriveExecutionAuthority(commitment)
  return {
    execution_id: `exec_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    contribution_id: commitment.contribution_id,
    source_commitment_hash: commitment.provenance.terms_hash ?? '',
    task: {
      title: options?.task_title ?? commitment.contribution.title,
      description: options?.task_description ?? commitment.contribution.description,
      deliverables: options?.deliverables ?? ['Work as described in the contribution'],
      acceptance_criteria: options?.acceptance_criteria ?? commitment.verification.criteria,
    },
    budget: options?.budget,
    authority,
    verification: {
      criteria: commitment.verification.criteria,
      evidence_required: commitment.verification.evidence ?? [],
    },
    deadline: options?.deadline,
    provenance: {
      originator: commitment.parties.contributor.id,
      contribution_lineage: commitment.provenance.parent ? [commitment.provenance.parent] : [],
    },
  }
}

/**
 * Route an authorized commitment to an execution provider.
 *
 * This is the main entry point after authorization.
 * It determines the mode, selects a provider, and creates the execution.
 */
export async function routeExecution(
  commitment: ContributionCommitment,
  policy: ExchangePolicy,
  options?: {
    provider_id?: string
    mode?: ExecutionMode
    task_title?: string
    task_description?: string
    deliverables?: string[]
    acceptance_criteria?: string[]
    budget?: { amount: number; currency: string; maximum?: number }
    deadline?: string
  },
): Promise<ExecutionRouterResult> {
  const mode = options?.mode ?? determineMode(commitment, policy, options?.provider_id)
  const request = buildExecutionRequest(commitment, options)

  // Check policy constraints
  if (!authorityWithinPolicy(request.authority, policy)) {
    return {
      mode: 'human',
      reason: 'execution authority exceeds policy allowed_authority — human approval required',
    }
  }

  if (budgetRequiresHuman(request.budget, policy)) {
    return {
      mode: 'human',
      reason: `budget exceeds autonomous limit (${policy.external_execution?.human_approval_above}) — human approval required`,
    }
  }

  if (mode === 'no_execution_required') {
    return { mode, reason: 'no execution required for this commitment' }
  }

  if (mode === 'human') {
    return { mode, reason: 'human execution required by policy or request' }
  }

  // Select provider
  const providerId = mode === 'external_provider' ? (options?.provider_id ?? 'internal') : 'internal'
  const provider = providers.get(providerId)

  if (!provider) {
    return {
      mode: 'self_executed',
      reason: `provider '${providerId}' not registered — falling back to internal self-execution`,
    }
  }

  // Assess
  const assessment = await provider.canExecute(commitment, request)
  if (!assessment.can_execute) {
    return {
      mode: 'self_executed',
      assessment,
      reason: `provider '${providerId}' cannot execute: ${assessment.reasons.join('; ')}`,
    }
  }

  // Create execution
  try {
    const reference = await provider.createExecution(request)
    return {
      mode,
      provider_id: providerId,
      reference,
      assessment,
      reason: `execution created via ${providerId}`,
    }
  } catch (err) {
    return {
      mode: 'self_executed',
      assessment,
      reason: `provider '${providerId}' failed to create execution: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Get the capabilities of all registered providers.
 */
export function allProviderCapabilities(): Array<{ id: string; capabilities: ExecutionCapabilities }> {
  return Array.from(providers.entries()).map(([id, p]) => ({ id, capabilities: p.capabilities() }))
}
