export const DEFAULT_PLATFORM_FEE_BPS = 500

export function platformFeeBps(): number {
  const raw = Number(process.env.EXCHANGE_PLATFORM_FEE_BPS ?? DEFAULT_PLATFORM_FEE_BPS)
  if (!Number.isFinite(raw)) return DEFAULT_PLATFORM_FEE_BPS
  return Math.min(2500, Math.max(0, Math.round(raw)))
}

export function referralCommissionBps(): number {
  const raw = Number(process.env.EXCHANGE_REFERRAL_BPS ?? 0)
  if (!Number.isFinite(raw)) return 0
  return Math.min(platformFeeBps(), Math.max(0, Math.round(raw)))
}

export function calculateFees(grossCents: number, feeBps = platformFeeBps(), referralBps = referralCommissionBps()) {
  const safeGross = Math.max(0, Math.round(grossCents))
  const platformFeeCents = Math.round((safeGross * feeBps) / 10_000)
  const referralCommissionCents = Math.round((safeGross * Math.min(referralBps, feeBps)) / 10_000)
  return {
    grossCents: safeGross,
    platformFeeBps: feeBps,
    platformFeeCents,
    referralCommissionBps: Math.min(referralBps, feeBps),
    referralCommissionCents,
    contributorNetCents: safeGross - platformFeeCents,
  }
}
