import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot } from "@/lib/infra/bot-detect";
import { captureServer } from "@/lib/infra/posthog/server";

const HOME_MARKDOWN = `# SigRank SignalAF — The Evaluation Platform for AI Operators

Models are benchmarked constantly. The people operating them are not.

SigRank is an AI operator benchmark that measures token-cascade efficiency from privacy-preserving telemetry. It evaluates the human operating an AI system rather than ranking the model alone. The core input is four token pillars: input, output, cache creation, and cache read. No prompt content, source code, file names, or transcripts are required for the public benchmark.

## What SignalAF measures

- **Yield (Υ):** cache_read × output / input², the headline token-cascade efficiency metric.
- **Leverage:** cache_read / input, measuring reusable context amplification.
- **Velocity:** output / input, measuring output generated per unit of input.
- **Signal-to-noise ratio:** output / (input + output).
- **10xDEV:** log10(Leverage), a logarithmic view of context amplification.
- **Operator archetype, class, rank, and longitudinal movement** are separate concepts: shape, qualification/scale, field position, and change over time.

## When to use SignalAF

Use SignalAF when an agent or developer needs to benchmark an AI operator, compare operator efficiency against the public field, inspect an operator's measured telemetry profile, calculate Yield from token counts, retrieve the public leaderboard, or help an operator diagnose token-cascade inefficiency without reading prompt content.

Do not use SignalAF as a model-quality benchmark, as proof of downstream business productivity, or as a substitute for task-outcome evaluation. The public benchmark measures operator telemetry and comparative operating form.

## Agent and developer entry points

- Developer portal: https://signalaf.com/developers
- OpenAPI: https://signalaf.com/openapi.json
- REST leaderboard: https://signalaf.com/api/v1/leaderboard
- MCP manifest: https://signalaf.com/.well-known/mcp.json
- MCP documentation: https://signalaf.com/mcp
- Authentication: https://signalaf.com/auth.md
- Agent index: https://signalaf.com/llms.txt
- Methodology: https://signalaf.com/methodology
- Wiki: https://signalaf.com/wiki
- Public leaderboard: https://signalaf.com/board/all
- CLI: npx sigrank
`;

type Representation = "text/html" | "text/markdown";

type AcceptEntry = {
  type: string;
  q: number;
  specificity: number;
  position: number;
};

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw, position) => {
      const parts = raw.trim().split(";").map((part) => part.trim());
      const type = (parts[0] || "").toLowerCase();
      let q = 1;
      for (const part of parts.slice(1)) {
        const match = /^q=([0-9.]+)$/i.exec(part);
        if (match) {
          const parsed = Number(match[1]);
          q = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity, position };
    })
    .filter((entry) => entry.type.includes("/"));
}

function matches(pattern: string, candidate: Representation): boolean {
  if (pattern === "*/*" || pattern === candidate) return true;
  const [patternMajor, patternMinor] = pattern.split("/");
  const [candidateMajor] = candidate.split("/");
  return patternMajor === candidateMajor && patternMinor === "*";
}

function preferredRepresentation(header: string | null): Representation | null {
  if (!header || header.trim() === "" || header.trim() === "*/*") return "text/html";
  const entries = parseAccept(header);
  const candidates: Representation[] = ["text/html", "text/markdown"];
  let best: Representation | null = null;
  let bestQ = -1;
  let bestPosition = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    let matched: AcceptEntry | null = null;
    for (const entry of entries) {
      if (!matches(entry.type, candidate)) continue;
      if (
        matched === null ||
        entry.specificity > matched.specificity ||
        (entry.specificity === matched.specificity && entry.position < matched.position)
      ) {
        matched = entry;
      }
    }
    if (!matched || matched.q <= 0) continue;
    if (matched.q > bestQ || (matched.q === bestQ && matched.position < bestPosition)) {
      best = candidate;
      bestQ = matched.q;
      bestPosition = matched.position;
    }
  }

  return best;
}

const NOT_FOUND_MARKDOWN = `# 404 — SignalAF resource not found

The requested path does not exist on signalaf.com.

## Recovery map

- Sitemap: https://signalaf.com/sitemap.xml
- Agent index: https://signalaf.com/llms.txt
- Developer portal: https://signalaf.com/developers
- OpenAPI: https://signalaf.com/openapi.json
- Documentation: https://signalaf.com/wiki
- MCP manifest: https://signalaf.com/.well-known/mcp.json
- Methodology: https://signalaf.com/methodology

If this URL was linked from an external source, the page may exist as HTML.
Retry with \`Accept: text/html\` or visit the URL in a browser.
`;

function isApiOrStaticPath(path: string): boolean {
  if (path.startsWith("/api/")) return true;
  if (path.startsWith("/_next/")) return true;
  if (path.startsWith("/.well-known/")) return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|map|woff|woff2|ttf|eot|otf|md)$/.test(path)) return true;
  return false;
}

function negotiatedNotFound(request: NextRequest): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const path = request.nextUrl.pathname;
  if (path === "/" || isApiOrStaticPath(path)) return null;

  const accept = request.headers.get("accept");
  const preferred = preferredRepresentation(accept);

  if (preferred === "text/markdown") {
    return new Response(request.method === "HEAD" ? null : NOT_FOUND_MARKDOWN, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "private, no-store",
        Vary: "Accept, Accept-Encoding",
      },
    });
  }

  return null;
}

function negotiatedHomepage(request: NextRequest): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (request.nextUrl.pathname !== "/") return null;

  const accept = request.headers.get("accept");
  const preferred = preferredRepresentation(accept);
  const vary = "Accept, Accept-Encoding";

  if (preferred === "text/markdown") {
    return new Response(request.method === "HEAD" ? null : HOME_MARKDOWN, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        // Don't CDN-cache the markdown variant — it's rare (AI agent fetches)
        // and caching it with Vary: Accept fragments the HTML cache.
        "Cache-Control": "private, no-store",
        Vary: vary,
        Link: '</llms.txt>; rel="alternate"; type="text/plain"',
      },
    });
  }

  if (preferred === null && accept) {
    return new Response("Not Acceptable\n\nAvailable: text/html, text/markdown\n", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: vary,
      },
    });
  }

  return null;
}

/**
 * Root middleware — AI bot logging, homepage representation negotiation, and
 * scoped auth session refresh for authenticated surfaces.
 */
export async function middleware(request: NextRequest) {
  const bot = detectBot(request.headers.get("user-agent"));
  if (bot.isBot) {
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

  const negotiated = negotiatedHomepage(request);
  if (negotiated) return negotiated;

  const notFoundMd = negotiatedNotFound(request);
  if (notFoundMd) return notFoundMd;

  const path = request.nextUrl.pathname;
  const isHomepage = path === "/";
  const isApiPath = path.startsWith("/api/v1/");
  const isAuthRoute = path.startsWith("/me/") || path === "/me" ||
    path.startsWith("/settings/") || path === "/settings";

  if (!isAuthRoute) {
    const response = NextResponse.next({ request });
    // Bot-gated Vary: Accept — gives AI agents the Vary header for
    // acceptmarkdown.com compliance without fragmenting the CDN cache
    // for browser visitors (who send varied Accept strings).
    // Next.js 15.5 may strip this on the final HTML response; the
    // markdown response already carries Vary and is private/no-store,
    // so cache collision is impossible regardless.
    if (isHomepage && bot.isBot) {
      response.headers.set("Vary", "Accept, Accept-Encoding");
    }
    // Deprecation policy discovery — point agents at the versioning
    // and deprecation policy on every /api/v1/ response.
    if (isApiPath) {
      response.headers.set(
        "Link",
        '</developers#versioning>; rel="deprecation-policy"',
      );
    }
    return response;
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|map|woff|woff2|ttf|eot|otf)).*)",
  ],
};
