/**
 * app/s/[codename]/card.png/route.tsx — the OG/share card PNG for the
 * canonical share surface (Phase-2B WS-5).
 *
 * `GET /s/<codename>/card.png` renders the frozen SC-01 rank card
 * (components/share/OperatorSignalCard.tsx) through next/og ImageResponse —
 * the same Satori pipeline as app/user/[codename]/opengraph-image.tsx and
 * app/share/mcp/opengraph-image.tsx. This is the URL emitted as `og:image` /
 * `twitter:image` by the sibling page, and the image the share page itself
 * shows, so the preview surface and the social render can never diverge.
 *
 * Route-handler params arrive already URL-decoded (lib/route-params.ts), so
 * the codename goes to getOperator verbatim — no decodeCodename here.
 *
 * Caching: the handler stays dynamic (force-static would fight the
 * `no-store` fetches inside the Supabase data layer on a cache miss), and
 * instead emits explicit `s-maxage`/`stale-while-revalidate` headers — the
 * Vercel-CDN cache convention for route handlers. 3600s matches the
 * live-board cadence; `/s/` is intentionally NOT in revalidateTouched-
 * Windows()' bust set, so this TTL is the freshness bound. The data layer
 * (getOperator 90s / getOperatorHistory 150s / getIndexableOperatorRows 300s
 * unstable_cache) bounds DB cost independently of the image TTL.
 *
 * Retired / unknown / privacy-suppressed operators resolve to a generic
 * dark fallback card (same contract as the profile OG image) — the route
 * must never throw on a bad slug; crawlers hit it directly.
 */

import { ImageResponse } from "next/og";

import {
  getIndexableOperatorRows,
  getOperator,
  getOperatorHistory,
} from "@/lib/board";
import {
  OperatorSignalCard,
  signalCardData,
} from "@/components/share/OperatorSignalCard";

export const revalidate = 3600;

const SIZE = { width: 1200, height: 630 };

// s-maxage: Vercel CDN caches the rendered PNG per URL; swr keeps serving the
// last good card while a fresh one renders in the background.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

/** Live-field denominator: claimed operators with at least one snapshot —
 *  the same population signal the sitemap/indexing policy uses. Non-fatal:
 *  a failure just drops the "/ N" fragment from the rank line. */
async function liveFieldCount(): Promise<number | null> {
  try {
    const rows = await getIndexableOperatorRows();
    const n = rows.filter((r) => r.has_metric_snapshot).length;
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Generic fallback card — mirrors the profile OG fallback so a bad/expired
 *  slug still returns a valid 1200×630 PNG instead of a 500. */
function fallbackCard(message: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(150deg,#151b20,#0b0e12)",
        color: "#eef6f4",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        SigRank
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 34,
          color: "#7e8f96",
          marginTop: 16,
          letterSpacing: 2,
        }}
      >
        {message}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#7e8f96",
          marginTop: 40,
          letterSpacing: 1.5,
        }}
      >
        signalaf.com
      </div>
    </div>,
    { ...SIZE, headers: CACHE_HEADERS },
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codename: string }> },
) {
  try {
    // Route handlers receive params already decoded — use verbatim
    // (lib/route-params.ts: decodeCodename is for PAGE components only).
    const { codename } = await params;
    const row = await getOperator(codename);
    // Retired (opt-out) or unknown → generic card. getOperator already returns
    // null for retired operators; no identity leaks through this surface.
    if (!row) return fallbackCard("OPERATOR NOT FOUND");

    // History (sparklines) + the live-field denominator are enrichment — a
    // failure on either must not kill the card render.
    const [history, population] = await Promise.all([
      getOperatorHistory(codename, { limit: 12 }).catch(() => null),
      liveFieldCount(),
    ]);

    return new ImageResponse(
      <OperatorSignalCard data={signalCardData(row, history, population)} />,
      { ...SIZE, headers: CACHE_HEADERS },
    );
  } catch {
    return fallbackCard("OPERATOR CARD UNAVAILABLE");
  }
}
