import { randomUUID } from 'node:crypto'
import type {
  ContributionCommitment,
  ExecutionAssessment,
  ExecutionCapabilities,
  ExecutionProvider,
  ExecutionReference,
  ExecutionRequest,
  ExecutionStatus,
  ExecutionReceipt,
} from '../types'

/**
 * Internal provider — the default no-op/self-executed provider.
 *
 * This provider does not route work to any external system.
 * It records the execution reference and returns a synthetic
 * "delivered" status so the exchange lifecycle can proceed
 * when no external execution is needed.
 *
 * The contributor (or domain agent) is expected to perform
 * the work themselves. The receipt must be submitted manually
 * via the receipt API route.
 */
const INTERNAL_CAPABILITIES: ExecutionCapabilities = {
  task_execution: true,
  worker_discovery: false,
  escrow: false,
  collateral: false,
  verification: false,
  arbitration: false,
  agent_messaging: false,
  programmable_splits: false,
  fiat_settlement: false,
  crypto_settlement: false,
}

// In-memory store for internal executions (cleared on restart)
const internalExecutions = new Map<string, { reference: ExecutionReference; request: ExecutionRequest; state: ExecutionStatus['state'] }>()

export const internalProvider: ExecutionProvider = {
  id: 'internal',

  capabilities(): ExecutionCapabilities {
    return { ...INTERNAL_CAPABILITIES }
  },

  async canExecute(_commitment: ContributionCommitment, _request: ExecutionRequest): Promise<ExecutionAssessment> {
    return {
      can_execute: true,
      reasons: ['internal provider accepts all self-executed work'],
    }
  },

  async createExecution(request: ExecutionRequest): Promise<ExecutionReference> {
    const now = new Date().toISOString()
    const reference: ExecutionReference = {
      execution_id: request.execution_id,
      provider: 'internal',
      provider_reference: `int_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      created_at: now,
    }
    internalExecutions.set(reference.execution_id, {
      reference,
      request,
      state: 'created',
    })
    return reference
  },

  async getExecution(reference: ExecutionReference): Promise<ExecutionStatus> {
    const record = internalExecutions.get(reference.execution_id)
    return {
      reference,
      state: record?.state ?? 'created',
      updated_at: new Date().toISOString(),
      provider_state: record?.state,
      message: record ? undefined : 'execution not found in memory (may have been after restart)',
    }
  },

  async cancelExecution(reference: ExecutionReference): Promise<void> {
    const record = internalExecutions.get(reference.execution_id)
    if (record) record.state = 'cancelled'
  },

  async verifyExecution(reference: ExecutionReference): Promise<ExecutionReceipt> {
    const record = internalExecutions.get(reference.execution_id)
    const now = new Date().toISOString()
    return {
      execution_reference: reference,
      provider: 'internal',
      provider_reference: reference.provider_reference,
      status: 'delivered',
      executor: {
        id: record?.request.provenance.originator ?? 'unknown',
        role: 'self',
      },
      timestamps: {
        created: reference.created_at,
        delivered: now,
      },
    }
  },
}

/**
 * Update an internal execution's state (called when a receipt is submitted).
 */
export function updateInternalExecutionState(executionId: string, state: ExecutionStatus['state']): void {
  const record = internalExecutions.get(executionId)
  if (record) record.state = state
}
