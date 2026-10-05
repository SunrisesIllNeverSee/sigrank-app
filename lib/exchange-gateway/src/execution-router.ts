import { randomUUID } from 'node:crypto'
import type {
  ContributionCommitment,
  ExecutionAuthority,
  ExecutionCapabilities,
  ExecutionMode,
  ExecutionProvider,
  ExecutionRequest,
  ExecutionRouterResult,
  ExchangePolicy,
} from './types'
import { internalProvider } from './providers/internal'

const providers = new Map<string, ExecutionProvider>()
providers.set('internal', internalProvider)

export function registerProvider(provider: ExecutionProvider): void {
  providers.set(provider.id, provider)
}

export function getProvider(id: string): ExecutionProvider | undefined {
  return providers.get(id)
}

export function listProviderIds(): string[] {
  return Array.from(providers.keys())
}

export function deriveExecutionAuthority(commitment: ContributionCommitment): ExecutionAuthority {
  return {
    inspect: commitment.authorization.inspect,
    test: commitment.authorization.test,
    modify: commitment.authorization.modify,
    deploy: commitment.authorization.deploy,
    access_scope: commitment.authorization.access_scope ?? [],
  }
}

export function authorityWithinPolicy(auth: ExecutionAuthority, policy: ExchangePolicy): boolean {
  const allowed = policy.external_execution?.allowed_authority
  if (!allowed) return true
  if (auth.inspect && !allowed.inspect) return false
  if (auth.test && !allowed.test) return false
  if (auth.modify && !allowed.modify) return false
  if (auth.deploy && !allowed.deploy) return false
  if (auth.access_scope.some((scope) => !allowed.access_scope.includes(scope))) return false
  return true
}

export function budgetRequiresHuman(budget: { amount: number } | undefined, policy: ExchangePolicy): boolean {
  if (!budget) return false
  const configured = policy.external_execution
  if (!configured) return true
  const limits = [configured.max_autonomous_budget, configured.human_approval_above].filter((value) => value > 0)
  if (limits.length === 0) return budget.amount > 0
  return budget.amount > Math.min(...limits)
}

export function determineMode(
  _commitment: ContributionCommitment,
  policy: ExchangePolicy,
  requestedProviderId?: string,
): ExecutionMode {
  if (!requestedProviderId) return 'self_executed'
  if (!policy.external_execution?.enabled) return 'human'
  if (!policy.external_execution.allowed_providers.includes(requestedProviderId)) return 'human'
  return 'external_provider'
}

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
  const termsHash = commitment.provenance.terms_hash
  if (!termsHash) throw new Error('Contribution Commitment must have a finalized terms hash before execution')

  return {
    execution_id: `exec_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    contribution_id: commitment.contribution_id,
    source_commitment_hash: termsHash,
    task: {
      title: options?.task_title ?? commitment.contribution.title,
      description: options?.task_description ?? commitment.contribution.description,
      deliverables: options?.deliverables ?? ['Work as described in the contribution'],
      acceptance_criteria: options?.acceptance_criteria ?? commitment.verification.criteria,
    },
    budget: options?.budget,
    authority: deriveExecutionAuthority(commitment),
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

export async function routeExecution(
  commitment: ContributionCommitment,
  policy: ExchangePolicy,
  options?: {
    provider_id?: string
    mode?: ExecutionMode
    principal_approved?: boolean
    task_title?: string
    task_description?: string
    deliverables?: string[]
    acceptance_criteria?: string[]
    budget?: { amount: number; currency: string; maximum?: number }
    deadline?: string
  },
): Promise<ExecutionRouterResult> {
  if (!commitment.provenance.terms_hash) {
    return {
      mode: 'human',
      reason: 'Contribution Commitment is missing a finalized terms hash; execution is blocked',
    }
  }

  const mode = options?.mode ?? determineMode(commitment, policy, options?.provider_id)

  if (mode === 'no_execution_required') {
    return { mode, reason: 'no execution required for this commitment' }
  }

  if (mode === 'human') {
    const providerReason = options?.provider_id
      ? `external provider '${options.provider_id}' is disabled or outside the domain allowlist`
      : 'human execution required by policy or request'
    return { mode, reason: providerReason }
  }

  if (policy.human_required_for_execution && !options?.principal_approved) {
    return {
      mode: 'human',
      reason: 'domain policy requires principal approval before execution routing',
    }
  }

  if (mode === 'external_provider') {
    const external = policy.external_execution
    if (!external?.enabled) {
      return { mode: 'human', reason: 'external execution is disabled by domain policy' }
    }
    if (!options?.provider_id || !external.allowed_providers.includes(options.provider_id)) {
      return { mode: 'human', reason: 'requested execution provider is outside the domain allowlist' }
    }
    if (!external.autonomous_task_creation && !options?.principal_approved) {
      return { mode: 'human', reason: 'domain policy requires principal approval to create an external execution task' }
    }
  }

  const request = buildExecutionRequest(commitment, options)

  if (!authorityWithinPolicy(request.authority, policy)) {
    return {
      mode: 'human',
      reason: 'execution authority exceeds policy allowed_authority; principal review required',
    }
  }

  if (budgetRequiresHuman(request.budget, policy) && !options?.principal_approved) {
    return {
      mode: 'human',
      reason: 'execution budget exceeds autonomous policy limits; principal review required',
    }
  }

  const providerId = mode === 'external_provider' ? options!.provider_id! : 'internal'
  const provider = providers.get(providerId)

  if (!provider) {
    return {
      mode: 'human',
      reason: `provider '${providerId}' is not registered; no fallback execution was created`,
    }
  }

  let assessment
  try {
    assessment = await provider.canExecute(commitment, request)
  } catch (err) {
    return {
      mode: 'human',
      reason: `provider '${providerId}' assessment failed; no fallback execution was created: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (!assessment.can_execute) {
    return {
      mode: 'human',
      assessment,
      reason: `provider '${providerId}' cannot execute; no fallback execution was created: ${assessment.reasons.join('; ')}`,
    }
  }

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
      mode: 'human',
      assessment,
      reason: `provider '${providerId}' failed to create execution; no fallback execution was created: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export function allProviderCapabilities(): Array<{ id: string; capabilities: ExecutionCapabilities }> {
  return Array.from(providers.entries()).map(([id, p]) => ({ id, capabilities: p.capabilities() }))
}
