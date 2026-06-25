import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/auth-server'
import { getSupabaseServer } from '@/lib/supabase/server'

/**
 * GET /auth/callback — OAuth (GitHub) + magic-link return point.
 *
 * Callback URL is LOCKED to https://signalaf.com/auth/callback (roadmap §2). Flow:
 *   1. exchange the `?code` for a session (sets the auth cookie),
 *   2. the FREE CLAIM — ensure an operator + operator_accounts link exists for this
 *      verified user (mint a fresh operator on first login; no payment),
 *   3. redirect: new user → /me/edit (profile fill-out, optional depth); returning
 *      user → /me; or a same-origin `?next` hop when present.
 *
 * Degrades safely: with no creds or no code, it honors the seam and routes onward
 * without faking a session.
 */

function safeNext(raw: string | null): string | null {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
}

/** Mint a stable, unique public codename. The user personalizes display via
 *  display_name/handle later — codename stays the immutable URL key. */
function mintCodename(): string {
  return `signal-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
}

/** PUBLIC identity fields an OAuth provider exposes in user_metadata (GitHub + X carry
 *  these; magic-link carries none → all undefined, a graceful no-op). Email is excluded
 *  on purpose — it's PII (P5) and never leaves auth.users. */
function providerProfile(meta: unknown): {
  display_name?: string
  avatar_url?: string
  handle?: string
} {
  const m = (meta ?? {}) as Record<string, unknown>
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined
  const out: { display_name?: string; avatar_url?: string; handle?: string } = {}
  const name = str(m.full_name) ?? str(m.name)
  const avatar = str(m.avatar_url) ?? str(m.picture)
  const handle = (str(m.user_name) ?? str(m.preferred_username))?.replace(/^@+/, '')
  if (name) out.display_name = name
  if (avatar) out.avatar_url = avatar
  if (handle) out.handle = handle
  return out
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const code = req.nextUrl.searchParams.get('code')
  const next = safeNext(req.nextUrl.searchParams.get('next'))

  const sb = await createServerClient()
  // Unconfigured / no code → route onward, never fake a session.
  if (!sb || !code) {
    return NextResponse.redirect(new URL(next ?? '/me/edit', origin))
  }

  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(new URL('/login?error=auth', origin))
  }

  // Verified identity (getUser validates the JWT with Supabase).
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=auth', origin))
  }

  // PROVIDER SYNC (owner 2026-06-25): the OAuth provider is the source of truth for the
  // PUBLIC identity — display_name + avatar_url + handle are force-resynced from it on
  // every login (see the returning-login branch). The auth EMAIL is NEVER copied to any
  // operator column (P5); it lives in auth.users, shown only to the user in their /settings.
  const { handle: providerHandle, ...publicCore } = providerProfile(user.user_metadata)

  // FREE CLAIM: create/link the operator via the service role (privileged, idempotent
  // on the operator_accounts user_id PK).
  const svc = getSupabaseServer()
  if (svc) {
    const { data: existing } = await svc
      .from('operator_accounts')
      .select('operator_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      // First login → mint the operator, prefilled with the provider's public name/avatar.
      let operatorId: string | null = null
      for (let attempt = 0; attempt < 3 && !operatorId; attempt++) {
        const { data: op, error: opErr } = await svc
          .from('operators')
          .insert({
            codename: mintCodename(),
            claimed: true,
            claimed_at: new Date().toISOString(),
            ...publicCore,
          })
          .select('operator_id')
          .single()
        if (!opErr && op) operatorId = (op as { operator_id: string }).operator_id
      }
      if (operatorId) {
        await svc.from('operator_accounts').insert({ user_id: user.id, operator_id: operatorId })
        // handle is UNIQUE — set it best-effort so a collision can never block the claim.
        if (providerHandle) {
          await svc.from('operators').update({ handle: providerHandle }).eq('operator_id', operatorId)
        }
      }
    } else {
      // FORCE-RESYNC (owner 2026-06-25): the provider owns the public identity — overwrite
      // display_name/avatar/handle with whatever THIS provider supplies on every login.
      // Present fields only, so a magic-link login (no metadata) never nulls a value.
      // bio/location/links stay user-owned (untouched).
      const opId = (existing as { operator_id: string }).operator_id
      if (Object.keys(publicCore).length > 0) {
        await svc.from('operators').update(publicCore).eq('operator_id', opId)
      }
      // handle is UNIQUE → best-effort; a collision with another operator just no-ops.
      if (providerHandle) {
        await svc.from('operators').update({ handle: providerHandle }).eq('operator_id', opId)
      }
    }
  }

  // Login lands on the operator's own profile (/me → /user/[codename]); they edit
  // in-place via the profile's "Edit profile" modal (AUTH_LAUNCH_DIRECTIVES D6).
  const dest = next ?? '/me'
  return NextResponse.redirect(new URL(dest, origin))
}
