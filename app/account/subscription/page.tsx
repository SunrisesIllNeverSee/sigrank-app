import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'

export const metadata: Metadata = withOG({
  title: 'Subscription',
  description: 'Manage your SigRank supporter subscription.',
  path: '/account/subscription',
})

/**
 * Stripe Billing Portal return_url target.
 * Stub for the token-only launch — the live subscription panel
 * (components/billing/ManageSubscription) wires in at billing finalize (Gate-2).
 */
export default function AccountSubscriptionPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Subscription</h1>
      <p className="opacity-70">
        Your billing changes have been saved. Manage your plan from the Stripe
        billing portal any time.
      </p>
      <Link href="/" className="rounded-md border px-4 py-2 text-sm hover:opacity-80">
        Back to the board
      </Link>
    </main>
  )
}
