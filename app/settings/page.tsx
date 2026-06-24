import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

/**
 * app/settings/page.tsx — operator settings.
 *
 * UI shell (server component). The account/identity sections that need a
 * logged-in session are rendered as labeled "sign-in required" states until the
 * Supabase auth client + session middleware land (terminal lane — see
 * SCRATCHPAD auth-batch spec). Theme controls work today (client island, no
 * auth). This page exists so AccountMenu → Settings is a real route, not a #.
 */

export const metadata: Metadata = {
  title: 'Settings · SigRank',
  description: 'Manage your SigRank operator account, appearance, and privacy.',
}

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
          {title}
        </h2>
        {desc && <p className="font-sans text-xs text-text-muted">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

/** A row that needs auth — shows a sign-in prompt until sessions land. */
function AuthGatedRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-bg-border bg-bg-base/40 px-3 py-2.5">
      <div className="flex flex-col">
        <span className="font-mono text-xs text-text-secondary">{label}</span>
        <span className="font-sans text-[11px] text-text-dim">{hint}</span>
      </div>
      <Link
        href="/login"
        className="shrink-0 rounded-md border border-gold/40 px-3 py-1 font-mono text-[11px] text-gold transition-colors hover:bg-gold/10"
      >
        Sign in
      </Link>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          ◈ Settings
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          Appearance works now. Account &amp; privacy controls unlock when you
          sign in.
        </p>
      </header>

      <Section title="Appearance" desc="Theme is saved to this browser.">
        <ThemeToggle />
      </Section>

      <Section
        title="Account"
        desc="Your operator identity, handle, and claimed profile."
      >
        <AuthGatedRow
          label="Operator handle"
          hint="Set a display name on your claimed profile"
        />
        <AuthGatedRow
          label="Claimed profile"
          hint="Link a leaderboard row to your account"
        />
      </Section>

      <Section
        title="Privacy"
        desc="SigRank only ever stores token counts — never conversation content."
      >
        <AuthGatedRow
          label="Data &amp; submissions"
          hint="Review or delete your submitted snapshots"
        />
        <p className="font-sans text-[11px] leading-relaxed text-text-dim">
          The free tier reads token counts, model ids, and content lengths
          locally. No transcripts leave your device. See{' '}
          <Link href="/about" className="text-text-muted underline hover:text-text-secondary">
            how it works
          </Link>
          .
        </p>
      </Section>

      <Section title="Support" desc="Back the build as a founding supporter.">
        <Link
          href="/upgrade"
          className="w-fit rounded-md bg-gold px-4 py-2 font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Support the build →
        </Link>
      </Section>
    </div>
  )
}
