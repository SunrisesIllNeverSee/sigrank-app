import type { ExchangeState } from './types'

export const EXCHANGE_TRANSITIONS: Record<ExchangeState, readonly ExchangeState[]> = {
  observed: ['proposed', 'closed'],
  proposed: ['engaged', 'declined', 'expired', 'revoked'],
  engaged: ['negotiating', 'declined', 'expired'],
  negotiating: ['committed', 'declined', 'disputed', 'revoked'],
  committed: ['authorized', 'disputed', 'revoked'],
  authorized: ['delivering', 'disputed', 'revoked'],
  delivering: ['delivered', 'disputed', 'revoked'],
  delivered: ['verified', 'disputed'],
  verified: ['settled', 'disputed'],
  settled: ['closed', 'disputed'],
  disputed: ['negotiating', 'closed', 'revoked'],
  closed: [],
  declined: [],
  expired: [],
  revoked: [],
}

export function canTransition(from: ExchangeState, to: ExchangeState): boolean {
  return EXCHANGE_TRANSITIONS[from].includes(to)
}

export function transitionRoleAllowed(role: 'company' | 'proposer' | 'system', to: ExchangeState): boolean {
  if (to === 'settled') return role === 'system'
  if (['engaged', 'authorized', 'verified', 'declined'].includes(to)) return role === 'company'
  if (['delivering', 'delivered', 'revoked'].includes(to)) return role === 'proposer'
  return role === 'company' || role === 'proposer'
}
