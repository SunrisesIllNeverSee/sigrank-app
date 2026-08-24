import type { ExecutionHandoff, ExecutionReceipt, ExternalExecutionState } from '../execution'
import type { ContributionCommitment } from '../types'
import { prepareExecutionHandoff } from '../execution'

export type AzzleMarket = 'standard' | 'micro'
export type AzzleScopeMode = 'public_onchain' | 'private_xmtp'

export type AzzleV2TaskState =
  | 'NONE'
  | 'POSTED'
  | 'CLAIMED'
  | 'ACTIVE'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESOLVED'

export const AZZLE_V2_STATE_INDEX: Readonly<Record<AzzleV2TaskState, number>> = {
  NONE: 0,
  POSTED: 1,
  CLAIMED: 2,
  ACTIVE: 3,
  DISPUTED: 4,
  COMPLETED: 5,
  CANCELLED: 6,
  RESOLVED: 7,
}

export interface AzzleExecutionDraft {
  provider: 'azzle'
  protocol_version: 'v2'
  chain_id: 8453
  market: AzzleMarket
  scope_mode: AzzleScopeMode
  source: {
    contribution_id: string
    terms_hash: string
  }
  task: {
    title: string
    description: string
    deliverable: string
    verification_criteria: string[]
    execution_budget: {
      amount: number
      currency: string
    }
  }
  runtime: {
    manifest_resolution: 'runtime_required'
    site_config_url: string
    sdk_package: '@azzle/agents'
    sdk_manifest: 'loadMarketManifest'
    rpc_env: 'BASE_RPC_URL'
  }
  invariants: {
    authorization_required_before_post: true
    provider_completion_is_local_verification: false
    provider_settlement_is_local_settlement: false
    protected_contribution_text_is_not_auto_disclosed: true
  }
}

export interface PrepareAzzleExecutionInput {
  requester: ExecutionHandoff['parties']['requester']
  market: AzzleMarket
  scopeMode?: AzzleScopeMode
  taskDescription: string
  deliverable: string
  executionBudget: {
    amount: number
    currency: string
  }
  title?: string
  artifactUris?: string[]
  metadata?: ExecutionHandoff['metadata']
}

export interface AzzleReceiptInput {
  contributionId: string
  termsHash: string
  taskId: string
  state: AzzleV2TaskState | number
  worker?: string
  verifier?: string
  arbitrator?: string
  transactionHashes?: string[]
  proofUris?: string[]
  artifactUris?: string[]
  settlementReference?: string
  observedAt?: string
}

export function prepareAzzleExecution(
  commitment: ContributionCommitment,
  input: PrepareAzzleExecutionInput,
): { handoff: ExecutionHandoff; draft: AzzleExecutionDraft } {
  const scopeMode = input.scopeMode ?? 'private_xmtp'
  const handoff = prepareExecutionHandoff(commitment, {
    provider: 'azzle',
    requester: input.requester,
    title: input.title,
    taskDescription: input.taskDescription,
    deliverable: input.deliverable,
    executionBudget: input.executionBudget,
    disclosureMode: scopeMode === 'public_onchain' ? 'public_task' : 'private_negotiation',
    artifactUris: input.artifactUris,
    metadata: input.metadata,
  })

  return {
    handoff,
    draft: {
      provider: 'azzle',
      protocol_version: 'v2',
      chain_id: 8453,
      market: input.market,
      scope_mode: scopeMode,
      source: {
        contribution_id: handoff.source.contribution_id,
        terms_hash: handoff.source.terms_hash,
      },
      task: {
        title: handoff.task.title,
        description: handoff.task.disclosure.task_description,
        deliverable: handoff.task.deliverable,
        verification_criteria: [...handoff.task.verification_criteria],
        execution_budget: {
          amount: handoff.task.execution_budget.amount,
          currency: handoff.task.execution_budget.currency,
        },
      },
      runtime: {
        manifest_resolution: 'runtime_required',
        site_config_url: `https://azzle.org/api/site-config?market=${input.market}`,
        sdk_package: '@azzle/agents',
        sdk_manifest: 'loadMarketManifest',
        rpc_env: 'BASE_RPC_URL',
      },
      invariants: {
        authorization_required_before_post: true,
        provider_completion_is_local_verification: false,
        provider_settlement_is_local_settlement: false,
        protected_contribution_text_is_not_auto_disclosed: true,
      },
    },
  }
}

export function normalizeAzzleV2State(state: AzzleV2TaskState | number): AzzleV2TaskState {
  if (typeof state === 'string') {
    if (state in AZZLE_V2_STATE_INDEX) return state
    return 'NONE'
  }
  const match = (Object.entries(AZZLE_V2_STATE_INDEX) as Array<[AzzleV2TaskState, number]>).find(([, index]) => index === state)
  return match?.[0] ?? 'NONE'
}

export function mapAzzleV2State(state: AzzleV2TaskState | number): ExternalExecutionState {
  switch (normalizeAzzleV2State(state)) {
    case 'POSTED': return 'posted'
    case 'CLAIMED': return 'claimed'
    case 'ACTIVE': return 'active'
    case 'DISPUTED': return 'provider_disputed'
    case 'COMPLETED': return 'provider_completed'
    case 'CANCELLED': return 'cancelled'
    case 'RESOLVED': return 'provider_resolved'
    case 'NONE': return 'unknown'
  }
}

export function normalizeAzzleReceipt(input: AzzleReceiptInput): ExecutionReceipt {
  const state = mapAzzleV2State(input.state)
  const evidence: NonNullable<ExecutionReceipt['evidence']> = []
  for (const value of input.transactionHashes ?? []) evidence.push({ type: 'transaction', value })
  for (const value of input.proofUris ?? []) evidence.push({ type: 'proof', value })
  for (const value of input.artifactUris ?? []) evidence.push({ type: 'artifact', value })

  return {
    version: '0.1',
    provider: 'azzle',
    contribution_id: input.contributionId,
    terms_hash: input.termsHash,
    external_id: input.taskId,
    state,
    actor: {
      worker: input.worker,
      verifier: input.verifier,
      arbitrator: input.arbitrator,
    },
    evidence: evidence.length ? evidence : undefined,
    provider_settlement: {
      status: state === 'provider_completed' || state === 'provider_resolved'
        ? 'settled'
        : state === 'provider_disputed'
          ? 'disputed'
          : 'pending',
      reference: input.settlementReference,
    },
    observed_at: input.observedAt ?? new Date().toISOString(),
  }
}
