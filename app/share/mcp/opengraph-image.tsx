/**
 * app/share/mcp/opengraph-image.tsx — dynamic OG image for /share/mcp.
 *
 * Next.js file-convention: placing opengraph-image.tsx in the /share/mcp
 * segment auto-injects the og:image / twitter:image meta tags for that route,
 * overriding the site-wide /og-v2.png. Uses next/og ImageResponse (Satori) —
 * the same approach as app/user/[codename]/opengraph-image.tsx.
 *
 * Reads the `t` + `d` search params, re-runs the MCP tool via the shared
 * buildShareCard helper, and renders a 1200×630 card mirroring the on-page
 * share card: tool title, headline metrics, interpretation, SignalAF branding.
 */

import { ImageResponse } from "next/og";
import { buildShareCard } from "@/lib/share/mcp-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SigRank MCP tool result — SignalAF";

// ── Palette (mirrors the operator OG card + ProfileShareCard) ──────────────
const GOLD = "#c4923a";
const INK = "#0a0a0a";
const C_GOLD = "#f0c862";
const C_GREEN = "#8ae89a";
const C_BONE = "#e0e0d0";
const C_DULL = "#6e8a6e";
const C_DIM = "#5a8a5a";
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

type SearchParams = Promise<{ t?: string; d?: string }>;

function metricCell(
  label: string,
  value: string,
  accent: boolean,
): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        background: "rgba(20,30,20,0.6)",
        border: "1px solid rgba(106,138,106,0.4)",
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.5,
          color: C_DULL,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 38,
          fontWeight: 900,
          color: accent ? C_GOLD : C_BONE,
          marginTop: 4,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default async function ShareMcpOG({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { t, d } = await searchParams;
  const card = await buildShareCard(t, d);

  // ── Error / fallback card ────────────────────────────────────────────────
  if (!card.ok) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#050605",
          color: C_BONE,
          fontFamily: MONO,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 3,
            color: GOLD,
            textTransform: "uppercase",
          }}
        >
          MCP Tool Result
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 900,
            color: C_BONE,
            marginTop: 12,
          }}
        >
          SigRank · SignalAF
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: C_DULL,
            marginTop: 16,
          }}
        >
          Share link could not be loaded
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: C_DIM,
            marginTop: 10,
          }}
        >
          {card.error}
        </div>
      </div>,
      { ...size },
    );
  }

  const m = card;
  const metrics: { label: string; value: string; accent: boolean }[] = [];
  if (m.yield) metrics.push({ label: "Υ YIELD", value: m.yield, accent: true });
  if (m.leverage)
    metrics.push({ label: "LEVERAGE", value: m.leverage, accent: false });
  if (m.velocity)
    metrics.push({ label: "VELOCITY", value: m.velocity, accent: false });
  if (m.snr) metrics.push({ label: "SNR", value: m.snr, accent: false });

  const identityBits = [
    m.signalClass,
    m.percentile ? `${m.percentile} pct` : null,
    m.rank ? `Rank ${m.rank}` : null,
  ].filter(Boolean);
  const identity = identityBits.join(" · ");

  const titleSize =
    m.toolTitle.length <= 28 ? 44 : m.toolTitle.length <= 44 ? 36 : 30;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#050605",
        fontFamily: MONO,
        padding: "48px 56px",
        justifyContent: "space-between",
      }}
    >
      {/* ── Header zone ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 3,
              color: GOLD,
              textTransform: "uppercase",
            }}
          >
            MCP Tool Result
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                border: `3px solid ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                color: GOLD,
              }}
            >
              {"§"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 800,
                color: GOLD,
                letterSpacing: 3,
                opacity: 0.8,
              }}
            >
              SIGRANK
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 900,
            color: C_BONE,
            marginTop: 14,
            lineHeight: 1.1,
          }}
        >
          {m.toolTitle}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            fontWeight: 700,
            color: C_GREEN,
            marginTop: 8,
            letterSpacing: 0.5,
          }}
        >
          {m.toolName}
        </div>

        {identity.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 12,
              marginTop: 14,
            }}
          >
            {m.signalClass && (
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 800,
                  color: INK,
                  background: GOLD,
                  borderRadius: 999,
                  padding: "6px 16px",
                }}
              >
                {m.signalClass}
              </div>
            )}
            {m.percentile && (
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 700,
                  color: C_BONE,
                  border: "1px solid rgba(106,138,106,0.5)",
                  borderRadius: 999,
                  padding: "6px 16px",
                }}
              >
                {m.percentile} percentile
              </div>
            )}
            {m.rank && (
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 700,
                  color: C_BONE,
                  border: "1px solid rgba(106,138,106,0.5)",
                  borderRadius: 999,
                  padding: "6px 16px",
                }}
              >
                Rank {m.rank}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Metric row ── */}
      {metrics.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
          }}
        >
          {metrics.map((mt) => metricCell(mt.label, mt.value, mt.accent))}
        </div>
      )}

      {/* ── Interpretation + footer ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {m.interpretation && (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: C_BONE,
              lineHeight: 1.35,
              borderTop: "1px solid rgba(106,138,106,0.3)",
              paddingTop: 18,
            }}
          >
            {m.interpretation.length > 180
              ? `${m.interpretation.slice(0, 177)}…`
              : m.interpretation}
          </div>
        )}

        {/* Footer divider + url */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 7,
              height: 7,
              background: GOLD,
              transform: "rotate(45deg)",
              marginRight: 8,
            }}
          />
          <div
            style={{
              display: "flex",
              flexGrow: 1,
              height: 2,
              background: GOLD,
              opacity: 0.25,
              marginRight: 8,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 1,
            }}
          >
            signalaf.com/share/mcp
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
