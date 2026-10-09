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
import { getOperator, getLeaderboard } from "@/lib/board";
import { decodeCodename } from "@/lib/route-params";
import { sortValue } from "@/lib/analytics/sort-value";
import { recordValue } from "@/lib/analytics/record-value";
import { DISPLAY_METRICS, DISPLAY_RAW, glyphFor } from "@/lib/identity/canon-ids";
import type { LeaderboardRow } from "@/lib/board";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

// ── Palette ─────────────────────────────────────────────────────────────────
/* PRISM treatment (share-card visual system): coral identity panel,
   aqua phosphor accents; C_GOLD stays gold because it paints medal
   hardware in the hall section — hardware semantics, not decoration. */
const GOLD_BG = "#ff7087";
const INK = "#0a0a0a";
const C_GOLD = "#f0c862";
const C_GREEN = "#36e6c2";
const C_BONE = "#e6ecea";
const C_DIM = "#5f6e75";
const C_DULL = "#7e8f96";
const C_CORAL = "#ff7087";
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Terminal printout rows (the flip card's static language) ────────────────
function PrintRow({
  ticker,
  label,
  value,
  accent,
}: {
  ticker: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  /* split-flap row: TICKER glyph · phosphor label · bone value, right-aligned */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        gap: 16,
        padding: "9px 4px",
        borderBottom: "1px solid rgba(62,70,76,0.55)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 52,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1,
          color: accent ? C_CORAL : C_GREEN,
          textShadow: accent
            ? "0 0 8px rgba(255,112,135,0.5)"
            : "0 0 8px rgba(54,230,194,0.45)",
          flexShrink: 0,
        }}
      >
        {ticker}
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1.4,
          color: C_DULL,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          fontWeight: 900,
          color: accent ? C_CORAL : C_BONE,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Canonical class mark as SVG ─────────────────────────────────────────────
/* Satori's bundled font lacks the geometric class glyphs (◈ ▲ ▽ ⬡ ◎ ⟳ ◇);
   a missing glyph renders as a box. Draw the canonical mark as a shape so the
   tier identity survives on the PNG. */
function ClassMark({ glyph, size = 20, color = INK }: { glyph: string; size?: number; color?: string }) {
  const c = color;
  const m = size / 2;
  const body = (() => {
    switch (glyph) {
      case "◈": // TRANSMITTER — diamond + center
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <polygon points="10,1 19,10 10,19 1,10" fill={c} />
            <polygon points="10,6.5 13.5,10 10,13.5 6.5,10" fill={GOLD_BG} />
          </svg>
        );
      case "▲":
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <polygon points="10,2 18,17 2,17" fill={c} />
          </svg>
        );
      case "▽":
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <polygon points="2,3 18,3 10,18" fill={c} />
          </svg>
        );
      case "⬡": // POWER — hexagon
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <polygon points="10,1.5 17.3,5.75 17.3,14.25 10,18.5 2.7,14.25 2.7,5.75" fill={c} />
          </svg>
        );
      case "◎": // SEEKER — ring + center dot
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke={c} strokeWidth="2.4" />
            <circle cx="10" cy="10" r="3.2" fill={c} />
          </svg>
        );
      case "⟳": // REFINER — circular arrow
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <path d="M 15.5 10 A 5.5 5.5 0 1 1 14.2 4.9" fill="none" stroke={c} strokeWidth="2.2" />
            <polygon points="16.5,1.5 16.8,7.4 12.6,4.4" fill={c} />
          </svg>
        );
      case "◇": // BEARER — diamond outline
        return (
          <svg width={size} height={size} viewBox="0 0 20 20">
            <polygon points="10,1.5 18.5,10 10,18.5 1.5,10" fill="none" stroke={c} strokeWidth="2.2" />
          </svg>
        );
      default:
        /* ↓ (BASE) and · (IGNITER) render in-font — keep them as text */
        return (
          <div
            style={{
              display: "flex",
              width: size,
              height: size,
              alignItems: "center",
              justifyContent: "center",
              fontSize: size,
              fontWeight: 900,
              color: c,
              lineHeight: 1,
            }}
          >
            {glyph}
          </div>
        );
    }
  })();
  return body;
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
        <div style={{ display: "flex", fontSize: 80, fontWeight: 900, color: C_CORAL }}>
          SigRank
        </div>
        <div style={{ display: "flex", fontSize: 28, color: C_DIM, marginTop: 12 }}>
          Operator not found
        </div>
      </div>,
      { ...size },
    );
  }

  const { operator, snapshot } = row;
  const c = snapshot.cascade;
  const ranked = c && !c.nonCompounding;
  const classTier = snapshot.class_tier;
  const classGlyph = glyphFor(classTier);
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
              alignItems: "center",
            }}
          >
            <ClassMark glyph={classGlyph} size={20} color={INK} />
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

      {/* ═══ RIGHT — black terminal printout (720px) ═══
          The static twin of the operator-profile flip card: telemetry rows,
          column header, scanlines — Prism phosphor instead of green. */}
      <div
        style={{
          width: 720,
          height: 630,
          background: INK,
          display: "flex",
          flexDirection: "column",
          padding: "24px 30px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* CRT scanline overlay — the printout signature */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0.16) 3px)",
          }}
        />

        {/* Column header — TELEMETRY | WELCOME OPERATOR */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 10,
            borderBottom: "1px solid #2b4048",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.2,
            color: C_DULL,
          }}
        >
          <div
            style={{
              display: "flex",
              color: C_GREEN,
              textShadow: "0 0 8px rgba(54,230,194,0.5)",
            }}
          >
            TELEMETRY
          </div>
          <div style={{ display: "flex" }}>WELCOME OPERATOR</div>
        </div>

        {/* Cascade printout — six rows, phosphor labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 10,
          }}
        >
          <PrintRow ticker="Υ"   label="YIELD"      value={yieldStr} accent />
          <PrintRow ticker="LEV" label="LEVERAGE"   value={levStr} />
          <PrintRow ticker="VEL" label="VELOCITY"   value={velStr} />
          <PrintRow ticker="EFF" label="EFFICIENCY" value={effStr} />
          <PrintRow ticker="SNR" label="SNR"        value={snrStr} />
          <PrintRow ticker="10×" label="10×DEV"     value={devStr} />
        </div>

        {/* ── Hall of Signal — printout section (gold = medal hardware) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 16,
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                color: C_GOLD,
                textShadow: "0 0 8px rgba(240,200,98,0.4)",
              }}
            >
              {"» HALL OF SIGNAL"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 700,
                color: C_DULL,
              }}
            >
              {topTen > 0 ? `${topTen} TOP-10 FINISHES` : "NO RECORDS YET"}
            </div>
          </div>

          {topTen > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* medal tally row — printout language, medals as glyphs */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 18,
                  padding: "7px 4px",
                  borderBottom: "1px solid rgba(62,70,76,0.55)",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                <div style={{ display: "flex", color: C_GOLD }}>#1 ×{gold}</div>
                <div style={{ display: "flex", color: C_BONE }}>#2 ×{silver}</div>
                <div style={{ display: "flex", color: "#cd7f32" }}>#3 ×{bronze}</div>
              </div>
              {top3Entries.map((e) => (
                <div
                  key={e.canonId}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 14,
                    padding: "6px 4px",
                    borderBottom: "1px solid rgba(62,70,76,0.35)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 30,
                      fontSize: 14,
                      fontWeight: 900,
                      flexShrink: 0,
                      color:
                        e.rank === 1 ? C_GOLD : e.rank === 2 ? C_BONE : "#cd7f32",
                    }}
                  >
                    {`#${e.rank}`}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexGrow: 1,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: C_DULL,
                    }}
                  >
                    {e.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 15,
                      fontWeight: 900,
                      color: e.rank === 1 ? C_GOLD : C_BONE,
                    }}
                  >
                    {e.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 12,
                color: C_DIM,
                padding: "6px 4px",
              }}
            >
              {"// no top-10 records yet — submit to climb the boards"}
            </div>
          )}
        </div>

        {/* ── CTA footer — printout command line ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 1,
              background: "rgba(62,70,76,0.8)",
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
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                fontWeight: 800,
                color: C_GREEN,
                letterSpacing: 0.5,
                textShadow: "0 0 8px rgba(54,230,194,0.4)",
              }}
            >
              {"$ npx sigrank"}
              <span style={{ color: C_GREEN, fontWeight: 800 }}>{"_"}</span>
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
