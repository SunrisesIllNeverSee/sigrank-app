'use client'

import React, { useState } from 'react'

/**
 * ClaimButton — shared claim CTA (G4-owned, imported by other groups).
 *
 * Contract (OPERATOR OVERRIDE): props { operatorId, claimed, priceLabel? }.
 *  - When `claimed` is true → renders null (claimed operators show ClaimedBadge).
 *  - When `claimed` is false → a "Claim this operator" button that POSTs
 *    { operator_id } to /api/v1/claim and redirects to the returned Checkout url.
 *
 * On a 503 (stripe_not_configured) the button shows "Try again later" and never
 * pretends a claim succeeded.
 */

interface Props {
  operatorId: string
  claimed: boolean
  priceLabel?: string
}

export function ClaimButton({ operatorId, claimed, priceLabel }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (claimed) return null

  async function onClaim() {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId }),
      })
      if (res.status === 503) {
        setError('Try again later')
        setPending(false)
        return
      }
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      setError('Try again later')
      setPending(false)
    } catch {
      setError('Try again later')
      setPending(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClaim}
        disabled={pending}
        aria-busy={pending}
        aria-label={pending ? 'Claiming operator, redirecting to checkout' : undefined}
        className="inline-flex items-center gap-1.5 rounded-md border border-text-gold/40 bg-text-gold/10 px-3 py-1.5 font-sans text-xs font-semibold text-text-gold transition-colors hover:bg-text-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Redirecting…' : 'Claim this operator'}
        {priceLabel ? <span className="text-text-muted">· {priceLabel}</span> : null}
      </button>
      {error ? <span className="font-sans text-[11px] text-text-muted">{error}</span> : null}
    </span>
  )
}
