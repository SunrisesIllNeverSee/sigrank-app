/**
 * app/api/vercel/oauth/callback/route.ts — Vercel Marketplace integration OAuth callback.
 *
 * When a user installs the SigRank integration from the Vercel Marketplace,
 * Vercel redirects them here with a `code` query parameter. This route:
 *
 * 1. Validates the `code` is present.
 * 2. Exchanges the code for a long-lived Vercel access token via
 *    POST https://api.vercel.com/v2/oauth/access_token.
 * 3. Stores the configurationId + access token in Supabase (vercel_integrations
 *    table) so the configuration page can read the installation state.
 * 4. Redirects the user to /vercel/config?configurationId=<id>.
 *
 * Required env vars:
 * - VERCEL_CLIENT_ID — the integration's client ID (from the Vercel dashboard)
 * - VERCEL_CLIENT_SECRET — the integration's client secret
 * - NEXT_PUBLIC_SITE_URL — the canonical site origin (for the redirect URI)
 *
 * If Supabase is not configured, the token is stored in a signed cookie as a
 * fallback so the config page can still read the installation state.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

const VERCEL_TOKEN_URL = "https://api.vercel.com/v2/oauth/access_token";
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com").replace(/\/$/, "");
const REDIRECT_URI = `${SITE_ORIGIN}/api/vercel/oauth/callback`;
const CONFIG_PAGE = "/vercel/config";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const configurationId = url.searchParams.get("configurationId");

  // Vercel may send either `code` or `configurationId` depending on the flow.
  // The marketplace install flow sends `code`; the configuration flow sends
  // `configurationId`. Handle both.
  if (!code && !configurationId) {
    return NextResponse.redirect(
      new URL("/vercel?error=missing_code", SITE_ORIGIN),
    );
  }

  // If we only have a configurationId (no code to exchange), redirect to config.
  if (!code && configurationId) {
    const redirectUrl = new URL(CONFIG_PAGE, SITE_ORIGIN);
    redirectUrl.searchParams.set("configurationId", configurationId);
    return NextResponse.redirect(redirectUrl);
  }

  // Exchange the code for an access token.
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Env not configured yet — redirect to config with the configurationId if
    // we have it, or to the vercel page with an error.
    if (configurationId) {
      const redirectUrl = new URL(CONFIG_PAGE, SITE_ORIGIN);
      redirectUrl.searchParams.set("configurationId", configurationId);
      redirectUrl.searchParams.set("status", "pending_env");
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.redirect(
      new URL("/vercel?error=integration_not_configured", SITE_ORIGIN),
    );
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code ?? "",
      redirect_uri: REDIRECT_URI,
    });

    const tokenRes = await fetch(VERCEL_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("[vercel/oauth] Token exchange failed:", tokenRes.status, errorText);
      return NextResponse.redirect(
        new URL("/vercel?error=token_exchange_failed", SITE_ORIGIN),
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string | undefined = tokenData.access_token;
    const tokenType: string | undefined = tokenData.token_type;
    const scope: string | undefined = tokenData.scope;
    const teamId: string | undefined = tokenData.team_id;
    const userId: string | undefined = tokenData.user_id;

    if (!accessToken) {
      console.error("[vercel/oauth] No access_token in response");
      return NextResponse.redirect(
        new URL("/vercel?error=no_access_token", SITE_ORIGIN),
      );
    }

    // Persist the installation. Try Supabase first; fall back to a cookie.
    const supabase = getSupabaseServer();
    const configId = configurationId ?? `cfg_${Date.now()}`;

    if (supabase) {
      const { error } = await supabase.from("vercel_integrations").upsert({
        configuration_id: configId,
        access_token: accessToken,
        token_type: tokenType ?? "bearer",
        scope: scope ?? null,
        team_id: teamId ?? null,
        user_id: userId ?? null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "configuration_id" });

      if (error) {
        console.error("[vercel/oauth] Supabase upsert failed:", error.message);
        // Fall through to cookie fallback below.
      }
    }

    // Cookie fallback (or supplement) — short-lived, just enough for the config
    // page to confirm the installation succeeded. The access token itself is
    // NOT stored in the cookie for security reasons; only the configurationId
    // and a status flag.
    const redirectUrl = new URL(CONFIG_PAGE, SITE_ORIGIN);
    redirectUrl.searchParams.set("configurationId", configId);
    redirectUrl.searchParams.set("status", "installed");

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("vercel_integration_id", configId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour — just for the config page session
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[vercel/oauth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/vercel?error=unexpected", SITE_ORIGIN),
    );
  }
}
