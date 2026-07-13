/**
 * app/api/outreach-card/[codename]/route.ts — outreach profile card.
 *
 * A clean, punchy 1200×630 PNG designed for FIRST-TIME viewers — attached to
 * GitHub issues / DMs. NOT the OG link-preview (that's opengraph-image.tsx).
 * This is the "you're on the board, here's your card" image.
 *
 * Design:
 *   LEFT (gold, 480px) — identity: name, class glyph, yield hero, rank
 *   RIGHT (black, 720px) — 6 key metrics + Hall of Signal medals + CTA
 *
 * Data: getOperator (cascade + telemetry) + getLeaderboard (for Hall of
 * Signal computation, same pattern as OperatorRecords.tsx).
 */

import { ImageResponse } from "next/og";
import { getOperator, getLeaderboard } from "@/lib/data";
import { decodeCodename } from "@/lib/route-params";
import { sortValue } from "@/lib/data/sort-value";
import { recordValue } from "@/lib/hall/record-value";
import { DISPLAY_METRICS, DISPLAY_RAW, CLASS_TIERS, CLASS_NAME_TO_GLYPH } from "@/lib/canon/ids";
import type { LeaderboardRow } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

// ── Palette ─────────────────────────────────────────────────────────────────
const GOLD_BG = "#c4923a";
const INK = "#0a0a0a";
const C_GOLD = "#f0c862";
const C_GREEN = "#8ae89a";
const C_BONE = "#e0e0d0";
const C_DIM = "#5a8a5a";
const C_DULL = "#6e8a6e";
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const k = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(1);

// ── Hall of Signal computation (mirrors OperatorRecords.tsx) ────────────────
interface BoardEntry {
  canonId: string;
  name: string;
  ticker: string;
  rank: number;
  value: string;
}

const CASCADE_BOARDS = DISPLAY_METRICS.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));
const ALL_BOARDS = [...CASCADE_BOARDS, ...RAW_BOARDS];

function computeBoardEntries(
  codename: string,
  boardRows: LeaderboardRow[],
): BoardEntry[] {
  const entries: BoardEntry[] = [];
  for (const board of ALL_BOARDS) {
    const sorted = [...boardRows]
      .sort((a, z) => sortValue(z, board.sort) - sortValue(a, board.sort))
      .slice(0, 10);
    const rank = sorted.findIndex(
      (r) => r.operator.codename === codename,
    );
    if (rank === -1) continue;
    const row = sorted[rank];
    const value = recordValue(row, board.canonId);
    if (value === "—") continue;
    entries.push({
      canonId: board.canonId,
      name: board.name,
      ticker: board.ticker,
      rank: rank + 1,
      value,
    });
  }
  return entries.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}

// ── Metric tile (right panel) ───────────────────────────────────────────────
function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 6,
        border: `1px solid ${accent ? "rgba(240,200,98,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          color: C_DULL,
          fontFamily: MONO,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 900,
          color: accent ? C_GOLD : C_BONE,
          fontFamily: MONO,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codename: string }> },
) {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename);
  const row = await getOperator(codename);

  // Fallback: operator not found
  if (!row) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: INK,
          color: "#ededed",
          fontFamily: MONO,
        }}
      >
        <div style={{ display: "flex", fontSize: 80, fontWeight: 900, color: C_GOLD }}>
          SigRank
        </div>
        <div style={{ display: "flex", fontSize: 28, color: C_DIM, marginTop: 12 }}>
          Operator not found
        </div>
      </div>,
      { ...size },
    );
  }

  const { operator, snapshot, telemetry } = row;
  const c = snapshot.cascade;
  const ranked = c && !c.nonCompounding;
  const classTier = snapshot.class_tier;
  const classGlyph = CLASS_NAME_TO_GLYPH[classTier] ?? "·";
  const name = (operator.display_name ?? operator.codename).toUpperCase();

  const DASH = "—";
  const yieldStr = ranked
    ? c.yield_ >= 1000
      ? `${(c.yield_ / 1000).toFixed(1)}K`
      : c.yield_.toFixed(0)
    : DASH;
  const snrStr = ranked ? `${(c.snr * 100).toFixed(0)}%` : DASH;
  const levStr = ranked ? `${k(c.leverage)}×` : DASH;
  const velStr = ranked ? c.velocity.toFixed(1) : DASH;
  const devStr = ranked && c.dev10x != null ? c.dev10x.toFixed(2) : DASH;
  const effStr = ranked ? `${c.efficiency.toFixed(1)}×` : DASH;
  const cascadeStr = (ranked && c.cascadeStr) || DASH;

  const globalRank = row.global_rank;
  const topPct = Math.max(0, 100 - row.percentile);

  // ── Hall of Signal ────────────────────────────────────────────────────────
  const boardRows = await getLeaderboard();
  const hallEntries = computeBoardEntries(codename, boardRows);
  const gold = hallEntries.filter((e) => e.rank === 1).length;
  const silver = hallEntries.filter((e) => e.rank === 2).length;
  const bronze = hallEntries.filter((e) => e.rank === 3).length;
  const topTen = hallEntries.length;
  const top3Entries = hallEntries.slice(0, 3);

  // ── Name sizing ───────────────────────────────────────────────────────────
  const nameSize =
    name.length <= 12
      ? 44
      : name.length <= 18
        ? 36
        : name.length <= 26
          ? 28
          : 22;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: "#050605",
        fontFamily: MONO,
      }}
    >
      {/* ═══ LEFT — gold identity panel (480px) ═══ */}
      <div
        style={{
          width: 480,
          height: 630,
          background: GOLD_BG,
          display: "flex",
          flexDirection: "column",
          padding: "28px 26px",
        }}
      >
        {/* § logo + SIGRANK */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: `3px solid ${INK}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: INK,
            }}
          >
            {"§"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 800,
              color: INK,
              letterSpacing: 4,
              opacity: 0.7,
            }}
          >
            SIGRANK
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            display: "flex",
            fontSize: nameSize,
            fontWeight: 900,
            color: INK,
            letterSpacing: 1,
            lineHeight: 1.05,
            marginBottom: 8,
          }}
        >
          {name}
        </div>

        {/* Class glyph + tier + platform */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 900,
              color: INK,
            }}
          >
            {classGlyph}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              opacity: 0.85,
              letterSpacing: 0.5,
            }}
          >
            {classTier} · {(operator.primary_domain ?? DASH).toUpperCase()}
          </div>
        </div>

        {/* Yield hero — massive */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 14,
              fontWeight: 800,
              color: INK,
              letterSpacing: 2,
              opacity: 0.6,
              marginBottom: 4,
            }}
          >
            {"Υ YIELD"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 900,
              color: INK,
              lineHeight: 0.9,
              letterSpacing: -3,
            }}
          >
            {yieldStr}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 12,
              fontWeight: 700,
              color: INK,
              opacity: 0.7,
              marginTop: 6,
            }}
          >
            {cascadeStr}
          </div>
        </div>

        {/* Rank + percentile */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            marginTop: "auto",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 10,
                fontWeight: 800,
                color: INK,
                opacity: 0.5,
                letterSpacing: 1,
              }}
            >
              GLOBAL RANK
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 900,
                color: INK,
                lineHeight: 1,
              }}
            >
              #{globalRank}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 10,
                fontWeight: 800,
                color: INK,
                opacity: 0.5,
                letterSpacing: 1,
              }}
            >
              PERCENTILE
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 900,
                color: INK,
                lineHeight: 1,
              }}
            >
              TOP {topPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Divider + URL */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              background: INK,
              transform: "rotate(45deg)",
            }}
          />
          <div style={{ flexGrow: 1, height: 2, background: INK, opacity: 0.2 }} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 10,
            color: INK,
            opacity: 0.4,
            letterSpacing: 0.5,
          }}
        >
          signalaf.com/user/{operator.codename}
        </div>
      </div>

      {/* ═══ RIGHT — black metrics + hall panel (720px) ═══ */}
      <div
        style={{
          width: 720,
          height: 630,
          background: INK,
          display: "flex",
          flexDirection: "column",
          padding: "28px 30px",
        }}
      >
        {/* ── Metrics section ── */}
        <div
          style={{
            display: "flex",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            color: C_GREEN,
            marginBottom: 14,
          }}
        >
          CASCADE METRICS
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <MetricTile label="Υ YIELD" value={yieldStr} accent />
          <MetricTile label="LEVERAGE" value={levStr} />
          <MetricTile label="VELOCITY" value={velStr} />
          <MetricTile label="EFFICIENCY" value={effStr} />
          <MetricTile label="SNR" value={snrStr} />
          <MetricTile label="10×DEV" value={devStr} />
        </div>

        {/* ── Hall of Signal section ── */}
        {topTen > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                }}
              >
                🏆
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: C_GOLD,
                }}
              >
                HALL OF SIGNAL
              </div>
            </div>

            {/* Medal tracker */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 20 }}>🥇</div>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 900, color: C_GOLD }}>
                  {gold}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 20 }}>🥈</div>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 900, color: C_BONE }}>
                  {silver}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 20 }}>🥉</div>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 900, color: "#cd7f32" }}>
                  {bronze}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexGrow: 1,
                  justifyContent: "flex-end",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C_DULL,
                }}
              >
                {topTen} top-10 finishes
              </div>
            </div>

            {/* Top 3 records */}
            {top3Entries.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {top3Entries.map((e) => (
                  <div
                    key={e.canonId}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 14,
                        fontWeight: 900,
                        width: 28,
                      }}
                    >
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 13,
                        fontWeight: 700,
                        color: C_BONE,
                        flexGrow: 1,
                      }}
                    >
                      {e.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 14,
                        fontWeight: 900,
                        color: e.rank === 1 ? C_GOLD : C_BONE,
                      }}
                    >
                      {e.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No hall entries — show a teaser */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                color: C_DULL,
              }}
            >
              HALL OF SIGNAL
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 14,
                color: C_DIM,
                fontStyle: "italic",
              }}
            >
              No top-10 records yet — submit to climb the boards.
            </div>
          </div>
        )}

        {/* ── CTA footer ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 1,
              background: "rgba(255,255,255,0.08)",
            }}
          />
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
                color: C_GREEN,
                letterSpacing: 0.5,
              }}
            >
              npx sigrank
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 700,
                color: C_DULL,
              }}
            >
              verify · claim · or close this issue
            </div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
