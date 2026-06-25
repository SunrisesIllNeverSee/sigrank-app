import { NextResponse, type NextRequest } from 'next/server'
import { getSessionOperator } from '@/lib/supabase/auth-server'
import { getSupabaseServer } from '@/lib/supabase/server'

/**
 * POST /api/v1/profile — update the signed-in operator's own profile fields.
 *
 * AUTH_LAUNCH_DIRECTIVES D6 / AUTH_PROFILE_ROADMAP §3.4: auth-resolved +
 * column-allowlisted. Resolves the VERIFIED session (getUser) → operator_id and
 * UPDATEs ONLY owned, public-by-default columns (display_name, handle, bio, location,
 * links, operator_domains + derived primary_domain). It NEVER writes codename /
 * claimed / supporter tier / stripe ids / the auth email (P5). Service-role write,
 * scoped explicitly to the resolved operator_id.
 */
export const dynamic = 'force-dynamic'

const PLATFORMS = new Set(['claude', 'chatgpt', 'gemini', 'pi'])
const LINK_KEYS = ['github', 'site', 'x'] as const

/** Trim a string field; '' or non-string → null; capped defensively. */
function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

/**
 * GET /api/v1/profile — the signed-in operator's editable fields, for prefilling the
 * in-profile edit modal. Returns { operator: null } when logged out. `codename` lets the
 * client confirm ownership of the profile it's viewing before showing edit controls.
 */
export async function GET() {
  const op = await getSessionOperator()
  if (!op) return NextResponse.json({ operator: null })

  const svc = getSupabaseServer()
  if (!svc) return NextResponse.json({ operator: null })

  const { data } = await svc
    .from('operators')
    .select('display_name, handle, bio, location, links, operator_domains, avatar_url')
    .eq('operator_id', op.operatorId)
    .maybeSingle()
  const d = data as {
    display_name: string | null
    handle: string | null
    bio: string | null
    location: string | null
    links: { github?: string; site?: string; x?: string } | null
    operator_domains: string[] | null
    avatar_url: string | null
  } | null

  return NextResponse.json({
    operator: {
      codename: op.codename,
      display_name: d?.display_name ?? '',
      handle: d?.handle ?? '',
      bio: d?.bio ?? '',
      location: d?.location ?? '',
      links: d?.links ?? {},
      operator_domains: d?.operator_domains ?? [],
      avatar_url: d?.avatar_url ?? '',
    },
  })
}

export async function POST(req: NextRequest) {
  const op = await getSessionOperator()
  if (!op) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const svc = getSupabaseServer()
  if (!svc) return NextResponse.json({ error: 'Profiles are not configured.' }, { status: 503 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  // Links: keep only known keys, trimmed; drop empties. Stored as a JSONB map.
  const linksIn =
    body.links && typeof body.links === 'object' ? (body.links as Record<string, unknown>) : {}
  const links: Record<string, string> = {}
  for (const k of LINK_KEYS) {
    const v = str(linksIn[k], 400)
    if (v) links[k] = v
  }

  // Platforms: filter to the known set, dedup.
  const domainsIn = Array.isArray(body.operator_domains) ? body.operator_domains : []
  const operator_domains = [
    ...new Set(domainsIn.filter((d): d is string => typeof d === 'string' && PLATFORMS.has(d))),
  ]

  const update: Record<string, unknown> = {
    display_name: str(body.display_name, 80),
    handle: str(body.handle, 40),
    bio: str(body.bio, 2000),
    location: str(body.location, 120),
    links,
    operator_domains,
  }
  // Derive the display platform only when at least one is set (don't clobber an
  // existing primary_domain on an empty platform selection).
  if (operator_domains.length > 0) {
    update.primary_domain = operator_domains.length > 1 ? 'multi' : operator_domains[0]
  }

  // Lock-on-edit (0012): a non-empty value the user saves becomes hardlined, so the login
  // provider-resync skips it from here on. Clearing a field leaves it provider-managed.
  if (update.display_name) update.display_name_locked = true
  if (update.handle) update.handle_locked = true

  const { error } = await svc.from('operators').update(update).eq('operator_id', op.operatorId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, codename: op.codename })
}
