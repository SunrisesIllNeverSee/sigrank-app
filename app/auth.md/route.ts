/**
 * app/auth.md/route.ts — Auth.md agent registration discovery.
 *
 * Serves /auth.md as Markdown per the Auth.md standard. Documents the agent
 * audience, registration methods, and credential use for signalaf.com.
 *
 * Public read API needs no auth. User-authenticated write endpoints (snapshot
 * submission, profile editing) use Supabase OAuth (GitHub, X/Twitter, magic link).
 *
 * OAuth Protected Resource Metadata: /.well-known/oauth-protected-resource
 * OAuth Authorization Server (Supabase): /.well-known/oauth-authorization-server
 */

import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const body = `# auth.md — SigRank SignalAF Agent Authentication

This service supports agentic access. SignalAF (signalaf.com) provides both
public read-only endpoints and user-authenticated write endpoints.

## Agent Audience

- **Audience:** all AI agents, crawlers, and MCP clients
- **Resource server:** https://signalaf.com
- **Authorization server:** https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1
- **Scopes supported:** openid, profile, email, offline_access
- **Bearer methods supported:** header (Authorization: Bearer <token>)

## Public Endpoints (No Auth Required)

All read endpoints are public and require no credentials:

- **Leaderboard:** GET https://signalaf.com/api/v1/leaderboard
- **Operator detail:** GET https://signalaf.com/api/v1/operators/{codename}
- **Operator history:** GET https://signalaf.com/api/v1/operators/{codename}/history
- **Operator records:** GET https://signalaf.com/api/v1/operators/{codename}/records
- **Metric leaders:** GET https://signalaf.com/api/v1/metrics/leaders
- **Challenges:** GET https://signalaf.com/api/v1/challenges
- **Submissions:** GET https://signalaf.com/api/v1/submissions
- **Hall of Signal:** GET https://signalaf.com/api/v1/hall-of-signal
- **Methodology:** GET https://signalaf.com/methodology
- **Science:** GET https://signalaf.com/science
- **Metrics:** GET https://signalaf.com/metrics
- **llms.txt:** GET https://signalaf.com/llms.txt

## Protected Endpoints (User Auth Required)

Write endpoints require a Supabase session cookie obtained via OAuth:

- **Submit snapshot:** POST https://signalaf.com/api/v1/snapshots
- **Ingest parse:** POST https://signalaf.com/api/v1/ingest-parse
- **Update profile:** POST https://signalaf.com/api/v1/profile
- **Set codename:** POST https://signalaf.com/api/v1/profile/codename
- **Upload avatar:** POST https://signalaf.com/api/v1/profile/avatar
- **Delete account:** POST https://signalaf.com/api/v1/account/delete
- **Opt out:** POST https://signalaf.com/api/v1/account/data-opt-out
- **Contact:** POST https://signalaf.com/api/v1/contact

## Agent Workflow

The full agent loop for an operator's AI assistant (via sigrank-mcp):

1. **ENROLL** — bind your device with \`npx sigrank-mcp enroll <code>\`
   (get the code at signalaf.com → Settings → New key)
2. **SUBMIT** — publish verified snapshots with the \`submit_verified\` tool
   (pulls local token logs, signs with ed25519, POSTs to /api/v1/snapshots)
3. **DISCOVER** — find mentors and peers with the \`discover_peers\` tool
   (uses your enrolled identity — no codename needed. Returns operators
   1-2 class tiers above with similar cascade shapes + pillar deltas, same-tier
   peers, and complementary operators whose strength is your weakness)
4. **IMPROVE** — run \`self_improve\` for actionable suggestions
   (diagnose cascade leaks, simulate changes, get ranked improvements)
5. **REPEAT** — submit again after making changes to track your progress

The discover → improve → submit loop is the core cycle. Each submission
updates your yield on the board; each discover_peers call finds new mentors
as you climb tiers.

For browser-based agents: sigeconomy.com (the satellite site) exposes the
same discover_peers capability via WebMCP (\`navigator.modelContext\`).

## Agent Registration

### Registration Methods

- **Method:** OAuth 2.0 Authorization Code flow
- **register_uri:** https://signalaf.com/login
- **callback_uri:** https://signalaf.com/auth/callback
- **session_endpoint:** GET https://signalaf.com/api/auth/session
- **token_exchange:** https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/token
- **authorization_endpoint:** https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/authorize

### agent_auth

\`\`\`json
{
  "skill": "Submit token telemetry snapshots on behalf of an authenticated operator. Read public leaderboard, operator profiles, and metrics without auth.",
  "register_uri": "https://signalaf.com/login",
  "methods": [
    {
      "type": "oauth_2.0",
      "flow": "authorization_code",
      "authorization_endpoint": "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/authorize",
      "token_endpoint": "https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/oauth/token",
      "callback": "https://signalaf.com/auth/callback",
      "providers": ["github", "twitter", "email_magic_link"],
      "scopes": ["openid", "profile", "email", "offline_access"],
      "session_check": "GET https://signalaf.com/api/auth/session"
    }
  ]
}
\`\`\`

### Credential Use

Agents acting on behalf of a user must:

1. Redirect the user to https://signalaf.com/login to authenticate via GitHub,
   X/Twitter, or email magic link.
2. The OAuth callback at /auth/callback exchanges the code for a session cookie.
3. The session cookie must be included in all subsequent requests to protected
   endpoints.
4. Check session state via GET /api/auth/session — returns { operator, signedIn }.
5. Tokens are managed by Supabase Auth. Refresh is handled automatically via
   the session cookie.

Agents reading public data (leaderboard, profiles, metrics) need no credentials.

## OAuth Metadata

- **Protected Resource Metadata:** https://signalaf.com/.well-known/oauth-protected-resource
- **Authorization Server Metadata:** https://signalaf.com/.well-known/oauth-authorization-server
- **Supabase OIDC Discovery:** https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/.well-known/openid-configuration
- **JWKS:** https://copqtaqzsdvpdbhpwjmt.supabase.co/auth/v1/.well-known/jwks.json

## Rate Limiting

Public endpoints are cached via ISR (60-300s revalidate depending on route).
High-frequency scraping is unnecessary — leaderboard data refreshes every
5 minutes. MCP clients should use the sigrank-mcp package for structured access.

## Content Signals

- search: yes (search engines may index and return results)
- ai-input: yes (AI agents may use content for real-time answers)
- ai-train: no (training on this content is not permitted)
- use: reference (index, excerpt, and link back)

## Contact

- GitHub: https://github.com/SunrisesIllNeverSee
- X/Twitter: https://x.com/burnmydays
- MCP Server: https://github.com/SunrisesIllNeverSee/sigrank-mcp
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
