import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginButtons } from '@/components/auth/LoginButtons'

/**
 * app/login/page.tsx — sign-in page.
 *
 * UI shell around the LoginButtons client island (GitHub OAuth + X/Twitter OAuth +
 * email magic-link). Honors a same-origin `?next=` hop (e.g. /login?next=/me) so the
 * post-login callback returns the user where they started. The leaderboard stays free
 * to browse without an account.
 */

export const metadata: Metadata = {
  title: 'Sign in · SigRank',
  description: 'Sign in to claim your operator profile and back the build.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : undefined

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">
          SIGRANK
        </span>
        <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
          Sign in
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Claim your operator profile, set your handle, and back the build.
          The leaderboard is free to browse without an account.
        </p>
      </header>

      <LoginButtons next={safeNext} />

      <p className="text-center font-sans text-[11px] leading-relaxed text-text-dim">
        SigRank stores token counts only — never conversation content. By signing
        in you agree to the{' '}
        <Link href="/about" className="text-text-muted underline hover:text-text-secondary">
          terms &amp; privacy
        </Link>
        .
      </p>
    </div>
  )
}
