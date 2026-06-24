import type { Metadata } from 'next'
import Link from 'next/link'
import { ProfileEditForm } from '@/components/auth/ProfileEditForm'

/**
 * app/me/edit/page.tsx — the profile fill-out surface (AUTH_PROFILE_ROADMAP §3.4).
 *
 * Login flows here straight after /auth/callback (per §2: "into the profile
 * fill-out, /me in edit mode"). It lives at /me/edit rather than /me for now so
 * it does NOT clobber the owner's TEMP /me seed-review preview; fold it into /me
 * edit-mode when that preview hack is retired (owner's call).
 *
 * UI shell, zero backend. The form never fakes a save. Once auth lands this page
 * resolves the session and prefills from the operator row.
 *
 * TODO(AUTH.WIRE): gate + prefill once the auth client exists —
 *   import { getSessionOperator } from '@/lib/supabase/auth'
 *   const op = await getSessionOperator()
 *   if (!op) redirect('/login?next=/me/edit')
 *   // pass op's current display_name/handle/bio/links/location/platforms as defaults
 */

export const metadata: Metadata = {
  title: 'Edit profile · SigRank',
  description: 'Set up your SigRank operator profile — display name, handle, links, and more.',
}

export default function EditProfilePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          ◈ Your profile
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Fill in as much or as little as you want — nothing here is required.
          Everything you add is public on your profile and board row. Your sign-in
          email is never shown.
        </p>
      </header>

      <ProfileEditForm />

      <p className="font-sans text-[11px] leading-relaxed text-text-dim">
        Your permanent codename and rank stay as they are.{' '}
        <Link href="/me" className="text-text-muted underline hover:text-text-secondary">
          Back to my profile
        </Link>
        .
      </p>
    </div>
  )
}
