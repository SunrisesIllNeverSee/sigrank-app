import type { ActorRef, ContributionCommitment, ProposalAuthority } from './types'

export type ExecutionProviderId = 'internal' | 'direct_agent' | 'azzle' | 'custom'

export type ExternalExecutionState =
  | 'prepared'
  | 'posted'
  | 'claimed'
  | 'active'
  | 'provider_completed'
  | 'provider_disputed'
  | 'provider_resolved'
  | 'cancelled'
  | 'failed'
  | 'unknown'

export interface ExecutionBudget {
  amount: number
  currency: string
  source: 'explicit_execution_budget'
}

export interface ExecutionDisclosure {
  mode: 'public_task' | 'private_negotiation'
  task_description: string
  artifact_uris?: string[]
}

export interface ExecutionHandoff {
  version: '0.1'
  provider: ExecutionProviderId
  source: {
    protocol: 'Contribution Exchange'
    contribution_id: string
    terms_hash: string
    parent_lineage?: string[]
  }
  parties: {
    requester: ActorRef
    original_contributor: ActorRef
    original_recipient: ActorRef
  }
  task: {
    title: string
    disclosure: ExecutionDisclosure
    deliverable: string
    verification_criteria: string[]
    execution_budget: ExecutionBudget
  }
  authority_snapshot: ContributionCommitment['authorization']
  constraints: {
    authorization_required_before_provider_post: true
    provider_completion_is_local_verification: false
    provider_settlement_is_local_settlement: false
    rights_remain_governed_by_contribution_commitment: true
  }
  metadata?: Record<string, string | number | boolean | null>
}

export interface ExecutionReceipt {
  version: '0.1'
  provider: ExecutionProviderId
  contribution_id: string
  terms_hash: string
  external_id: string
  state: ExternalExecutionState
  actor?: {
    worker?: string
    verifier?: string
    arbitrator?: string
  }
  evidence?: Array<{
    type: 'transaction' | 'proof' | 'artifact' | 'message' | 'other'
    value: string
  }>
  provider_settlement?: {
    status: 'none' | 'pending' | 'settled' | 'failed' | 'disputed'
    reference?: string
  }
  observed_at: string
}

export interface ExternalExecutionDriver<Prepared = unknown, RawReceipt = unknown> {
  readonly provider: ExecutionProviderId
  prepare(handoff: ExecutionHandoff): Prepared
  normalizeReceipt(receipt: RawReceipt): ExecutionReceipt
}

export interface PrepareExecutionInput {
  provider: ExecutionProviderId
  requester: ActorRef
  title?: string
  taskDescription: string
  deliverable: string
  executionBudget: {
    amount: number
    currency: string
  }
  disclosureMode?: ExecutionDisclosure['mode']
  artifactUris?: string[]
  metadata?: Record<string, string | number | boolean | null>
}

export function prepareExecutionHandoff(
  commitment: ContributionCommitment,
  input: PrepareExecutionInput,
): ExecutionHandoff {
  const termsHash = commitment.provenance.terms_hash?.trim()
  if (!termsHash) throw new Error('Execution handoff requires a frozen Contribution Commitment terms_hash')
  if (!Number.isFinite(input.executionBudget.amount) || input.executionBudget.amount <= 0) {
    throw new Error('Execution handoff requires an explicit positive execution budget')
  }
  const currency = input.executionBudget.currency.trim().toUpperCase()
  if (!currency) throw new Error('Execution budget currency is required')
  if (!input.taskDescription.trim()) throw new Error('Execution task description is required')
  if (!input.deliverable.trim()) throw new Error('Execution deliverable is required')

  return {
    version: '0.1',
    provider: input.provider,
    source: {
      protocol: 'Contribution Exchange',
      contribution_id: commitment.contribution_id,
      terms_hash: termsHash,
      parent_lineage: commitment.contribution.artifact?.lineage,
    },
    parties: {
      requester: input.requester,
      original_contributor: commitment.parties.contributor,
      original_recipient: commitment.parties.recipient,
    },
    task: {
      title: input.title?.trim() || commitment.contribution.title,
      disclosure: {
        mode: input.disclosureMode ?? 'private_negotiation',
        task_description: input.taskDescription.trim(),
        artifact_uris: input.artifactUris,
      },
      deliverable: input.deliverable.trim(),
      verification_criteria: [...commitment.verification.criteria],
      execution_budget: {
        amount: input.executionBudget.amount,
        currency,
        source: 'explicit_execution_budget',
      },
    },
    authority_snapshot: { ...commitment.authorization },
    constraints: {
      authorization_required_before_provider_post: true,
      provider_completion_is_local_verification: false,
      provider_settlement_is_local_settlement: false,
      rights_remain_governed_by_contribution_commitment: true,
    },
    metadata: input.metadata,
  }
}

export function authoritySnapshotToProposalAuthority(
  authorization: ContributionCommitment['authorization'],
): ProposalAuthority {
  const scope = new Set(authorization.access_scope ?? [])
  return {
    inspect_public: authorization.inspect,
    sandbox_test: authorization.test,
    repository_read: scope.has('repository_read'),
    repository_write: authorization.modify && scope.has('repository_write'),
    private_data: scope.has('private_data'),
    credential_access: scope.has('credential_access'),
    production_modify: authorization.modify && scope.has('production_modify'),
    deploy: authorization.deploy,
    penetration_testing: scope.has('penetration_testing'),
  }
}
