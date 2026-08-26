import type { ExecutionState } from './types'

// ─── Execution State Transition Rules ───
//
// Defines the allowed transitions for the normalized execution lifecycle.
// Stale events, invalid regressions, and terminal-state updates are rejected.
// Rejected/stale observations can be stored for audit but cannot regress
// canonical execution state.

const TERMINAL_STATES: Set<ExecutionState> = new Set([
  'failed',
  'cancelled',
  'disputed',
  'expired',
  'settled',
])

/**
 * The forward progression of the execution lifecycle.
 * Index represents the ordinal position in the lifecycle.
 */
const STATE_ORDER: Record<ExecutionState, number> = {
  created: 0,
  offered: 1,
  accepted: 2,
  funded: 3,
  executing: 4,
  delivered: 5,
  verified: 6,
  settled: 7,
  failed: 100,
  cancelled: 101,
  disputed: 102,
  expired: 103,
}

/**
 * Allowed transitions from each state.
 * A state can transition to itself (idempotent duplicate).
 *
 * Note: `verified` cannot transition directly to `failed`. Once work is
 * verified, overturning that verification requires the dispute path
 * (verified → disputed → failed), not a silent failure declaration.
 */
const ALLOWED_TRANSITIONS: Record<ExecutionState, Set<ExecutionState>> = {
  created: new Set(['offered', 'accepted', 'funded', 'executing', 'delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired']),
  offered: new Set(['accepted', 'funded', 'executing', 'delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired', 'offered']),
  accepted: new Set(['funded', 'executing', 'delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired', 'accepted']),
  funded: new Set(['executing', 'delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired', 'funded']),
  executing: new Set(['delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired', 'executing']),
  delivered: new Set(['verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired', 'delivered']),
  verified: new Set(['settled', 'disputed', 'verified']),
  settled: new Set(['disputed', 'settled']),
  failed: new Set(['disputed', 'failed']),
  cancelled: new Set(['cancelled']),
  disputed: new Set(['settled', 'failed', 'disputed']),
  expired: new Set(['expired']),
}

export interface TransitionResult {
  allowed: boolean
  reason: string
  is_duplicate: boolean
}

/**
 * Check if a transition from currentState to newState is allowed.
 *
 * Rules:
 * - Terminal states (except disputed) cannot be left except to disputed
 * - Forward transitions are always allowed
 * - Duplicate transitions (same state) are idempotent
 * - Regressions (going backward) are rejected
 * - Dispute can be raised after delivery, verification, settlement, or failure
 */
export function validateTransition(
  currentState: ExecutionState,
  newState: ExecutionState,
): TransitionResult {
  // Same state = idempotent duplicate
  if (currentState === newState) {
    return { allowed: true, reason: 'duplicate transition (idempotent)', is_duplicate: true }
  }

  // Check if this transition is in the allowed set
  const allowed = ALLOWED_TRANSITIONS[currentState]
  if (!allowed || !allowed.has(newState)) {
    // Check if it's a regression
    if (STATE_ORDER[newState] < STATE_ORDER[currentState] && !TERMINAL_STATES.has(currentState)) {
      return {
        allowed: false,
        reason: `stale event: cannot regress from '${currentState}' to '${newState}'`,
        is_duplicate: false,
      }
    }
    return {
      allowed: false,
      reason: `invalid transition from '${currentState}' to '${newState}'`,
      is_duplicate: false,
    }
  }

  return { allowed: true, reason: 'valid forward transition', is_duplicate: false }
}

/**
 * Check if a state is terminal (no further forward transitions possible,
 * except dispute).
 */
export function isTerminalState(state: ExecutionState): boolean {
  return TERMINAL_STATES.has(state)
}

/**
 * Map a receipt status to a normalized execution state.
 * Returns null for unknown statuses so the caller can reject fail-closed
 * instead of defaulting to a positive state.
 */
export function receiptStatusToState(status: string): ExecutionState | null {
  switch (status) {
    case 'delivered': return 'delivered'
    case 'verified': return 'verified'
    case 'failed': return 'failed'
    case 'cancelled': return 'cancelled'
    case 'disputed': return 'disputed'
    default: return null
  }
}
