/**
 * app/.well-known/oauth-protected-resource/route.ts
 *
 * OAuth Protected Resource Metadata (RFC 9728).
 *
 * Tells agents and scanners that signalaf.com is a protected resource
 * with Supabase as the authorization server. Public read endpoints need
 * no auth; protected write endpoints require a Supabase session.
 */

import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const metadata = {
    resource: "https://signalaf.com",
    authorization_servers: [
      "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1",
    ],
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    bearer_methods_supported: ["header"],
    auth_md: "https://signalaf.com/auth.md",
    public_endpoints: [
      "https://signalaf.com/api/v1/leaderboard",
      "https://signalaf.com/api/v1/operators",
      "https://signalaf.com/api/v1/metrics/leaders",
      "https://signalaf.com/api/v1/challenges",
      "https://signalaf.com/api/v1/submissions",
      "https://signalaf.com/api/v1/hall-of-signal",
      "https://signalaf.com/llms.txt",
      "https://signalaf.com/methodology",
      "https://signalaf.com/science",
      "https://signalaf.com/metrics",
    ],
    protected_endpoints: [
      "https://signalaf.com/api/v1/snapshots",
      "https://signalaf.com/api/v1/ingest-parse",
      "https://signalaf.com/api/v1/profile",
      "https://signalaf.com/api/v1/profile/codename",
      "https://signalaf.com/api/v1/profile/avatar",
      "https://signalaf.com/api/v1/account/delete",
      "https://signalaf.com/api/v1/account/data-opt-out",
      "https://signalaf.com/api/v1/contact",
    ],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
