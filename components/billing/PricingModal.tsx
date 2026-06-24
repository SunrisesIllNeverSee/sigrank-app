'use client'

import React, { useState } from 'react'
import { startCheckout, type CheckoutOutcome } from './CheckoutRedirect'

/**
 * components/billing/PricingModal.tsx — the supporter-tier pricing surface.
 *
 * Three tiers (D6 / REWARD_TIERS.md):
 *   - Patron  $5/mo   (RW.16–RW.18)
 *   - Pro     $19/mo · $190/yr  ← FEATURED (yearly = ~2 months free, D6)
 *   - Circle Sponsor $99/mo  (RW.25–RW.27)
 * Founder tier is OFF (D7) — intentionally not offered.
 *
 * Monthly / yearly toggle (default monthly). Yearly only changes Pro's price +
 * the interval sent to the API; Patron + Circle Sponsor bill monthly. On a 503
 * (stripe_not_configured) the CTA shows "Try again later" and never sells.
 *
 * Can render inline (`inline`) or as a centered modal with a backdrop (default).
 */

export type CheckoutTier = 'patron' | 'pro' | 'circle_sponsor'
type Interval = 'monthly' | 'yearly'

interface TierDef {
  tier: CheckoutTier
  name: string
  monthly: string
  yearly?: string
  featured?: boolean
  /** Whether the yearly toggle changes this tier's displayed price. */
  yearlyEligible: boolean
  blurb: string
  features: string[]
}

const TIERS: TierDef[] = [
  {
    tier: 'patron',
    name: 'Patron',
    monthly: '$5',
    yearlyEligible: false,
    blurb: 'Back the board.',
    features: ['🍻 Patron badge (BG.14)', 'Ad-free site', 'Supporter carousel'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthly: '$19',
    yearly: '$190',
    featured: true,
    yearlyEligible: true,
    blurb: 'Precision scoring + full history.',
    features: [
      'All Patron rewards',
      'sig_army Pro audit (precision tier)',
      'Drift Ratio (E.02) computed',
      'Score decomposition view',
      'Unlimited history depth',
      'API access (read + submit)',
    ],
  },
  {
    tier: 'circle_sponsor',
    name: 'Circle Sponsor',
    monthly: '$99',
    yearlyEligible: false,
    blurb: 'Sponsor a Circle.',
    features: [
      'Circle logo in supporter carousel',
      'All members get Patron rewards',
      'Recruitment policy flag',
    ],
  },
]

interface Props {
  /** Operator id to attach to the checkout session (anonymous if omitted). */
  operatorId?: string
  /** Render inline (no modal chrome / backdrop). */
  inline?: boolean
  /** Modal close handler (only used when not inline). */
  onClose?: () => void
}

export function PricingModal({ operatorId, inline = false, onClose }: Props) {
  const [interval, setInterval] = useState<Interval>('monthly')
  const [pendingTier, setPendingTier] = useState<CheckoutTier | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSelect(tier: CheckoutTier) {
    setPendingTier(tier)
    setNotice(null)
    const sendInterval: Interval =
      tier === 'pro' && interval === 'yearly' ? 'yearly' : 'monthly'
    const outcome: CheckoutOutcome = await startCheckout(
      '/api/v1/billing/create-checkout-session',
      { tier, interval: sendInterval, operator_id: operatorId },
    )
    if (outcome.ok) return // navigating away
    setNotice('Try again later')
    setPendingTier(null)
  }

  const grid = (
    <div className="flex flex-col gap-5">
      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-2">
        <ToggleBtn active={interval === 'monthly'} onClick={() => setInterval('monthly')}>
          Monthly
        </ToggleBtn>
        <ToggleBtn active={interval === 'yearly'} onClick={() => setInterval('yearly')}>
          Yearly <span className="text-class-seeker">· save ~2mo</span>
        </ToggleBtn>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => {
          const showYearly = interval === 'yearly' && t.yearlyEligible && t.yearly
          const price = showYearly ? t.yearly! : t.monthly
          const period = showYearly ? '/yr' : '/mo'
          return (
            <div
              key={t.tier}
              className={
                'flex flex-col gap-3 rounded-lg border p-4 ' +
                (t.featured
                  ? 'border-text-accent/60 bg-text-accent/[0.06] ring-1 ring-text-accent/25'
                  : 'border-bg-border bg-bg-surface')
              }
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm font-bold tracking-wide text-text-primary">
                  {t.name}
                </span>
                {t.featured ? (
                  <span className="rounded-sm bg-text-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-accent">
                    POPULAR
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold text-text-primary">{price}</span>
                <span className="font-sans text-xs text-text-muted">{period}</span>
              </div>
              <p className="font-sans text-xs text-text-secondary">{t.blurb}</p>
              <ul className="flex flex-col gap-1.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-1.5 font-sans text-[11px] text-text-secondary"
                  >
                    <span className="text-class-seeker">▸</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onSelect(t.tier)}
                disabled={pendingTier === t.tier}
                className={
                  'mt-auto rounded-md px-3 py-2 font-sans text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
                  (t.featured
                    ? 'border border-text-accent/50 bg-text-accent/15 text-text-accent hover:bg-text-accent/25'
                    : 'border border-bg-border bg-bg-elevated text-text-secondary hover:text-text-primary')
                }
              >
                {pendingTier === t.tier ? 'Redirecting…' : `Choose ${t.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {notice ? (
        <p className="text-center font-sans text-xs text-text-gold">
          {notice} — payments are not available right now.
        </p>
      ) : null}
    </div>
  )

  if (inline) return grid

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-bg-border bg-bg-base p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-lg font-bold text-text-primary">Support SigRank</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="font-mono text-sm text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          ) : null}
        </div>
        {grid}
      </div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors ' +
        (active
          ? 'border border-text-accent/50 bg-text-accent/15 text-text-accent'
          : 'border border-bg-border bg-bg-surface text-text-secondary hover:text-text-primary')
      }
    >
      {children}
    </button>
  )
}
