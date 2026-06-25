import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionOperator } from '@/lib/supabase/auth-server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { ProfileEditForm, type ProfileInitial } from '@/components/auth/ProfileEditForm'

/**
 * app/me/edit/page.tsx — the editable profile surface (AUTH_LAUNCH_DIRECTIVES D6:
 * identity editing lives in the profile). Auth-gated + prefilled from the operator
 * row; writes go through POST /api/v1/profile. force-dynamic so it always reads the
 * live session + current values.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit profile · SigRank',
  description: 'Set up your SigRank operator profile — display name, handle, links, and more.',
}

const EMPTY: ProfileInitial = {
  display_name: '',
  handle: '',
  location: '',
  bio: '',
  links: {},
  operator_domains: [],
}

export default async function EditProfilePage() {
  const op = await getSessionOperator()
  if (!op) redirect('/login?next=/me/edit')

  // Prefill from the operator row (service-role read, scoped to the owner).
  let initial = EMPTY
  const svc = getSupabaseServer()
  if (svc) {
    const { data } = await svc
      .from('operators')
      .select('display_name, handle, location, bio, links, operator_domains')
      .eq('operator_id', op.operatorId)
      .maybeSingle()
    const d = data as {
      display_name: string | null
      handle: string | null
      location: string | null
      bio: string | null
      links: { github?: string; site?: string; x?: string } | null
      operator_domains: string[] | null
    } | null
    if (d) {
      initial = {
        display_name: d.display_name ?? '',
        handle: d.handle ?? '',
        location: d.location ?? '',
        bio: d.bio ?? '',
        links: d.links && typeof d.links === 'object' ? d.links : {},
        operator_domains: Array.isArray(d.operator_domains) ? d.operator_domains : [],
      }
    }
  }

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

      <ProfileEditForm initial={initial} />

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
