import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import { ScorePasteCard } from '@/components/score/ScorePasteCard'

/**
 * app/score/page.tsx — the anonymous first-step landing page.
 *
 * A stranger arriving from a launch post needs an actionable first step. This
 * page gives them two paths:
 *   1. Paste ccusage JSON → instant cascade preview (via /api/v1/ingest-parse,
 *      no auth, no persist). Shows projected Υ + class + compression.
 *   2. `npx sigrank me` → the local agent path (enroll + signed submit).
 *
 * The paste preview is a pure function over the request body — no DB write,
 * no auth required. To actually land on the leaderboard, the operator creates
 * an account and submits through the local agent (the signed path).
 */

export const metadata: Metadata = withOG({
  title: 'Score your cascade',
  description:
    'Paste your ccusage JSON to see your Υ Yield, class tier, and compression ratio instantly. No account needed — just run the numbers.',
  path: '/score',
})

export default function ScorePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          ◈ Score your cascade
        </span>
        <h1 className="font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          How much signal does your token cascade actually compound?
        </h1>
        <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
          Paste your <code className="font-mono text-text-primary">ccusage --json</code> output
          below. You&apos;ll get your Υ Yield, class tier, and compression ratio instantly —
          no account, no save, just the numbers.
        </p>
      </div>

      {/* Paste card (client island — calls /api/v1/ingest-parse for preview) */}
      <div className="mt-10">
        <ScorePasteCard />
      </div>

      {/* Local agent path */}
      <div className="mt-12 rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
          The signed path — land on the board
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          The paste preview shows your projected rank. To actually appear on the leaderboard,
          run the local agent — it reads your tokens automatically and submits a signed
          snapshot:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-bg-border bg-bg-base px-4 py-3 font-mono text-sm text-gold">
{`npx sigrank enroll   # create your operator + device key
npx sigrank me        # read tokens + submit signed snapshot`}
        </pre>
        <p className="mt-3 font-sans text-xs leading-relaxed text-text-muted">
          The agent signs your snapshot with an ed25519 keypair (per-device). Signed
          submissions are verified server-side and promoted to the board after review.
          The paste path is a calculator; the agent path is how you compete.
        </p>
      </div>
    </main>
  )
}
