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
 * It creates an execution reference and returns it. The canonical
 * execution state lives in the database (exchange_executions),
 * NOT in this provider's memory.
 *
 * The contributor (or domain agent) is expected to perform
 * the work themselves. The receipt must be submitted manually
 * via the receipt API route.
 *
 * P0.3: In-memory state has been removed. The DB is the canonical
 * source of execution state. getExecution returns a synthetic
 * observation labeled as non-authoritative.
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
    return {
      execution_id: request.execution_id,
      provider: 'internal',
      provider_reference: `int_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      created_at: now,
    }
  },

  async getExecution(reference: ExecutionReference): Promise<ExecutionStatus> {
    // The internal provider does not own durable state.
    // Return a non-authoritative observation. The caller (status endpoint)
    // must use the DB as the canonical source.
    return {
      reference,
      state: 'created',
      updated_at: new Date().toISOString(),
      provider_state: 'created',
      message: 'internal provider does not own durable state; database is canonical',
    }
  },

  async cancelExecution(_reference: ExecutionReference): Promise<void> {
    // No-op — state transitions go through the DB
  },

  async verifyExecution(reference: ExecutionReference): Promise<ExecutionReceipt> {
    const now = new Date().toISOString()
    return {
      execution_reference: reference,
      provider: 'internal',
      provider_reference: reference.provider_reference,
      status: 'delivered',
      executor: {
        id: 'internal',
        role: 'self',
      },
      timestamps: {
        created: reference.created_at,
        delivered: now,
      },
    }
  },
}
