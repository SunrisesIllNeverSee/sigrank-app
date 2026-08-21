import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot } from "@/lib/infra/bot-detect";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * Root middleware — two responsibilities:
 *
 * 1. AI bot logging (ALL routes): detects AI crawlers / fetchers from the
 *    User-Agent and logs a server-side PostHog event. This is the ONLY way
 *    to see AI bots (GPTBot, ClaudeBot, CCBot, PerplexityBot, etc.) because
 *    they don't execute client-side JS, so the PostHog browser SDK never
 *    fires for them. The event is best-effort and never blocks the request.
 *
 * 2. Auth session refresh (SCOPED to /me + /settings): the Supabase session
 *    cookie refresh runs ONLY on authenticated surfaces. Public board, API,
 *    wiki, and every other route are NEVER processed for auth. This preserves
 *    the AUTH_PROFILE_ROADMAP §2 constraint — anonymous board reads stay
 *    completely untouched.
 */
export async function middleware(request: NextRequest) {
  // --- 1. Bot detection (all routes, best-effort, never blocks) ---
  const bot = detectBot(request.headers.get("user-agent"));
  if (bot.isBot) {
    // Fire-and-forget — never let analytics break the request
    void captureServer("ai-bot", "ai_bot_detected", {
      bot_name: bot.botName,
      bot_operator: bot.botOperator,
      bot_category: bot.category,
      bot_allowed: bot.allowed,
      path: request.nextUrl.pathname,
      url: request.nextUrl.href,
      method: request.method,
    });
  }

  // --- 2. Auth session refresh (only /me + /settings) ---
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/me/") || path === "/me" ||
    path.startsWith("/settings/") || path === "/settings";

  if (!isAuthRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // No creds → nothing to refresh; let the request through unchanged.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates + refreshes the session. Nothing must run between client
  // creation and this call (@supabase/ssr requirement).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on all routes EXCEPT static assets and Next internals.
  // Bot logging needs all routes; auth refresh is gated by path check inside.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|map|woff|woff2|ttf|eot|otf)).*)",
  ],
};
