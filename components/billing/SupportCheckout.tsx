'use client'

import React, { useState } from 'react'
import { startCheckout } from './CheckoutRedirect'

/**
 * components/billing/SupportCheckout.tsx — the "back the build" checkout button.
 *
 * Thin client island over startCheckout(): POSTs the chosen supporter tier to
 * /api/v1/billing/create-checkout-session and redirects to the Stripe-hosted
 * Checkout url. On a 503 (stripe_not_configured / price_not_configured) it shows
 * an honest "not live yet" note and NEVER falsely completes a sale — exactly the
 * graceful-degradation contract the API route guarantees.
 *
 * Tier choice maps to the existing Stripe tiers (patron is the early-supporter
 * default). No Pro price is invented here — Pro isn't ironed out yet.
 */

type Tier = 'patron' | 'pro' | 'circle_sponsor'

const TIER_LABEL: Record<Tier, { name: string; blurb: string }> = {
  patron: { name: 'Founding Supporter', blurb: 'Back the build · lifetime founder perks' },
  pro: { name: 'Pro (early)', blurb: 'First access when the precision tier ships' },
  circle_sponsor: { name: 'Circle Sponsor', blurb: 'Sponsor a circle + the build' },
}

export function SupportCheckout({ presetTier = 'patron' }: { presetTier?: Tier }) {
  const [tier, setTier] = useState<Tier>(presetTier)
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function onSupport() {
    setPending(true)
    setNote(null)
    const outcome = await startCheckout('/api/v1/billing/create-checkout-session', {
      tier,
      interval: 'monthly',
    })
    if (!outcome.ok) {
      setPending(false)
      setNote(
        outcome.reason === 'not_configured'
          ? "Backing isn't live just yet — checkout opens soon. Thanks for the support; check back shortly."
          : 'Something went wrong starting checkout. Please try again.',
      )
    }
    // ok: the browser is navigating to Stripe — leave pending true.
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface p-5">
      <div className="flex flex-col gap-2">
        {(Object.keys(TIER_LABEL) as Tier[]).map((t) => {
          const active = t === tier
          const meta = TIER_LABEL[t]
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={
                'flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors ' +
                (active
                  ? 'border-gold/50 bg-gold/10'
                  : 'border-bg-border bg-bg-surface hover:bg-bg-elevated')
              }
            >
              <span className="flex flex-col">
                <span className="font-mono text-sm font-semibold text-text-primary">
                  {meta.name}
                </span>
                <span className="font-sans text-[11px] text-text-muted">{meta.blurb}</span>
              </span>
              <span
                className={
                  'h-3.5 w-3.5 shrink-0 rounded-full border ' +
                  (active ? 'border-gold bg-gold' : 'border-bg-border')
                }
              />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onSupport}
        disabled={pending}
        className="w-full rounded-md bg-gold py-2.5 text-center font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? 'Opening checkout…' : 'Support the build →'}
      </button>

      {note && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 text-center font-sans text-xs text-text-secondary">
          {note}
        </p>
      )}
    </div>
  )
}
