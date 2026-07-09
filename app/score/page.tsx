import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { CopyButton } from '@/components/marketing/CopyButton'
import { JsonLd } from '@/components/seo/JsonLd'
import { scoreCalculator, scoreHowTo, cliTool } from '@/lib/jsonld'

/**
 * app/score/page.tsx — the "Measure" page.
 *
 * This is a LANDING PAGE for cold traffic from GitHub/HN. The README links
 * here with "See your projected rank in 60 seconds." The page must deliver
 * that — one command, one outcome — not a technical doc.
 *
 * Primary: one command (`npx sigrank`) that does everything.
 * Secondary: how it works + privacy (below the fold for people who want details).
 * Backup: paste calculator link at the bottom.
 */

export const metadata: Metadata = withOG({
  title: 'See your AI operator rank',
  description:
    'Run one command. See where you rank against every other AI operator. Token counts only — never your prompts.',
  path: '/score',
})

export default function ScorePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* JSON-LD: WebApplication (the calculator) + HowTo (the flow) + SoftwareApplication (the CLI) */}
      <JsonLd data={[scoreCalculator(), scoreHowTo(), cliTool()]} />

      {/* Hero — one screen, one action */}
      <div className="flex flex-col gap-6 text-center">
        <h1 className="font-mono text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          See your rank
        </h1>
        <p className="mx-auto max-w-lg font-sans text-base leading-relaxed text-text-secondary">
          How efficiently do you use AI compared to everyone else? Run one command.
          Get your rank in 60 seconds.
        </p>

        {/* One command — the entire action */}
        <div className="mx-auto mt-2 flex w-full max-w-lg items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-4">
          <code className="flex-1 overflow-x-auto font-mono text-lg font-semibold text-text-accent">
            npx sigrank
          </code>
          <CopyButton text="npx sigrank" />
        </div>

        <p className="font-sans text-sm leading-relaxed text-text-muted">
          That&apos;s it. It reads your local AI session logs, counts your tokens,
          and shows your rank.{' '}
          <Link href="/board/all" className="text-text-accent underline-offset-2 hover:underline">
            See the leaderboard →
          </Link>
        </p>
      </div>

      {/* What you get — below the fold */}
      <div className="mt-16 flex flex-col gap-4">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
          What you see
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">→</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Your rank on the board</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                Where you stand against every other AI operator. Updated every time you submit.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">→</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Your yield score</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                How much signal you compound from every token. Not how much you spend — how efficiently you use what you spend.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">→</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Your class tier</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                Bronze, Silver, Gold, Platinum, or Diamond — based on your cascade efficiency, not your token volume.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works — for people who want details */}
      <div className="mt-12 flex flex-col gap-4">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
          How it works
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">01</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Reads your local logs</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                sigrank reads session logs from Claude Code, Codex, Cursor, and 15+ other platforms.
                It counts tokens — never reads your prompts or outputs.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">02</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Scores you on-device</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                Your yield, class tier, and rank are computed locally. You see your full score before anything leaves your machine.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-sm font-bold text-gold">03</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">Submit to the board</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                <code className="font-mono text-text-primary">npx sigrank submit</code> posts your four token counts
                (input, output, cache create, cache read) to the leaderboard. Signed with a per-device key. No spoofing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy — one line, not a wall */}
      <div className="mt-12 rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-gold">
          ⊙ Privacy
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Token counts only. Never your prompts, never your outputs, never your code.
          The agent reads local logs on-device and submits four integers. Signed with ed25519.
          Read-only by design — it measures without disturbing what it measures.
        </p>
        <p className="mt-3 font-mono text-xs text-text-muted">
          Token counts only. Never your prompts.
        </p>
      </div>

      {/* Paste — backup link at the bottom */}
      <div className="mt-12 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Can&apos;t install the agent? Just want a quick preview?{' '}
          <Link
            href="/score/paste"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Paste four token counts →
          </Link>
        </p>
        <p className="mt-1 font-sans text-xs leading-relaxed text-text-muted">
          The paste calculator is a backup — no account, no save, just the numbers.
        </p>
      </div>
    </main>
  )
}
