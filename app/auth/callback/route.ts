import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/auth-server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { captureServer } from "@/lib/posthog/server";

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
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

/** Mint a stable, unique public codename. The user personalizes display via
 *  display_name/handle later — codename stays the immutable URL key. */
function mintCodename(): string {
  return `signal-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** PUBLIC identity fields an OAuth provider exposes in user_metadata (GitHub + X carry
 *  these; magic-link carries none → all undefined, a graceful no-op). Email is excluded
 *  on purpose — it's PII (P5) and never leaves auth.users. */
function providerProfile(meta: unknown): {
  display_name?: string;
  avatar_url?: string;
  handle?: string;
} {
  const m = (meta ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const out: { display_name?: string; avatar_url?: string; handle?: string } =
    {};
  const name = str(m.full_name) ?? str(m.name);
  const avatar = str(m.avatar_url) ?? str(m.picture);
  const handle = (str(m.user_name) ?? str(m.preferred_username))?.replace(
    /^@+/,
    "",
  );
  if (name) out.display_name = name;
  if (avatar) out.avatar_url = avatar;
  if (handle) out.handle = handle;
  return out;
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));

  const sb = await createServerClient();
  // Unconfigured / no code → route onward, never fake a session.
  if (!sb || !code) {
    return NextResponse.redirect(new URL(next ?? "/me/edit", origin));
  }

  const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // Verified identity (getUser validates the JWT with Supabase).
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // PROVIDER SYNC + LOCK-ON-EDIT (owner 2026-06-25): the OAuth provider is the DEFAULT
  // source of truth for the PUBLIC identity — display_name + avatar_url + handle are
  // resynced from it on every login, EXCEPT any field the user has edited (the *_locked
  // flags, migration 0012), which stays hardlined to their value (see returning-login
  // branch). The auth EMAIL is NEVER copied to any operator column (P5); it lives in
  // auth.users, shown only to the user in their /settings.
  const { handle: providerHandle, ...publicCore } = providerProfile(
    user.user_metadata,
  );

  // FREE CLAIM: create/link the operator via the service role (privileged, idempotent
  // on the operator_accounts user_id PK).
  const svc = getSupabaseServer();
  if (svc) {
    const { data: existing } = await svc
      .from("operator_accounts")
      .select("operator_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      // First login → mint the operator, prefilled with the provider's public name/avatar.
      let operatorId: string | null = null;
      let mintedCodename: string | null = null;
      for (let attempt = 0; attempt < 3 && !operatorId; attempt++) {
        const codename = mintCodename();
        const { data: op, error: opErr } = await svc
          .from("operators")
          .insert({
            codename,
            claimed: true,
            claimed_at: new Date().toISOString(),
            ...publicCore,
          })
          .select("operator_id")
          .single();
        if (!opErr && op) {
          operatorId = (op as { operator_id: string }).operator_id;
          mintedCodename = codename;
        }
      }
      if (operatorId) {
        await svc
          .from("operator_accounts")
          .insert({ user_id: user.id, operator_id: operatorId });
        // handle is UNIQUE — set it best-effort so a collision can never block the claim.
        if (providerHandle) {
          await svc
            .from("operators")
            .update({ handle: providerHandle })
            .eq("operator_id", operatorId);
        }
        // Fire operator_claimed event for trend tracking (best-effort, never blocks).
        if (mintedCodename) {
          await captureServer(mintedCodename, "operator_claimed", {
            codename: mintedCodename,
            had_handle: !!providerHandle,
            claim_path: "auth_callback",
          });
        }
      }
    } else {
      // RESYNC EXCEPT LOCKED (owner 2026-06-25): overwrite display_name/avatar/handle from
      // THIS provider, but SKIP any field the user has edited (*_locked, 0012) — their edit
      // is hardlined. Present fields only, so a magic-link login (no metadata) never nulls a
      // value. bio/location/links stay user-owned.
      const opId = (existing as { operator_id: string }).operator_id;
      const { data: cur } = await svc
        .from("operators")
        .select("display_name_locked, avatar_locked, handle_locked")
        .eq("operator_id", opId)
        .maybeSingle();
      const lock = (cur ?? {}) as {
        display_name_locked?: boolean;
        avatar_locked?: boolean;
        handle_locked?: boolean;
      };
      const patch: Record<string, string> = {};
      if (publicCore.display_name && !lock.display_name_locked) {
        patch.display_name = publicCore.display_name;
      }
      if (publicCore.avatar_url && !lock.avatar_locked)
        patch.avatar_url = publicCore.avatar_url;
      if (Object.keys(patch).length > 0) {
        await svc.from("operators").update(patch).eq("operator_id", opId);
      }
      // handle is UNIQUE → best-effort; resync only when the user hasn't locked it.
      if (providerHandle && !lock.handle_locked) {
        await svc
          .from("operators")
          .update({ handle: providerHandle })
          .eq("operator_id", opId);
      }
    }
  }

  // Login lands on the operator's own profile (/me → /user/[codename]); they edit
  // in-place via the profile's "Edit profile" modal (AUTH_LAUNCH_DIRECTIVES D6).
  const dest = next ?? "/me";
  return NextResponse.redirect(new URL(dest, origin));
}
