/**
 * app/.well-known/oauth-authorization-server/route.ts
 *
 * OAuth Authorization Server Metadata (RFC 8414).
 *
 * Proxies Supabase's OIDC discovery document as OAuth AS metadata so scanners
 * can verify the issuer chain: PRM → authorization_servers → AS metadata.
 *
 * Supabase publishes OIDC discovery at /auth/v1/.well-known/openid-configuration
 * but not the OAuth standard /auth/v1/.well-known/oauth-authorization-server.
 * This route bridges that gap by serving the same metadata with the correct
 * issuer at the path scanners expect on the resource server.
 */

import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const metadata = {
    issuer: "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1",
    authorization_endpoint:
      "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/authorize",
    token_endpoint:
      "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/token",
    jwks_uri:
      "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/.well-known/jwks.json",
    userinfo_endpoint:
      "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/userinfo",
    scopes_supported: ["openid", "profile", "email", "phone", "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256", "HS256", "ES256"],
    code_challenge_methods_supported: ["S256", "plain"],
    require_pushed_authorization_requests: false,
    auth_md: "https://signalaf.com/auth.md",
    registration_endpoint: "https://signalaf.com/login",
    agent_auth: {
      skill:
        "Submit token telemetry snapshots on behalf of an authenticated operator. Read public leaderboard, operator profiles, and metrics without auth.",
      register_uri: "https://signalaf.com/login",
      methods: [
        {
          type: "oauth_2.0",
          flow: "authorization_code",
          authorization_endpoint:
            "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/authorize",
          token_endpoint:
            "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/token",
          callback: "https://signalaf.com/auth/callback",
          providers: ["github", "twitter", "email_magic_link"],
          scopes: ["openid", "profile", "email", "offline_access"],
          session_check: "GET https://signalaf.com/api/auth/session",
        },
      ],
    },
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
