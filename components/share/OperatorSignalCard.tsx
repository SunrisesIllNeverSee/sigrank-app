/**
 * components/share/OperatorSignalCard.tsx — the canonical operator share card
 * (SC-01 rank card) for the /s/<codename> surface (Phase-2B WS-5).
 *
 * This is the frozen reference design from live-board-prototype/cards.js +
 * share-live/*.html — dark "sc-dark" rank card: signalaf brand + verification
 * badge, TOP-<pct> hero with archetype/class chips + hex mark, three stat rows
 * with history sparklines (YIELD / LEVERAGE / SNR), SIGNAL RANK line with the
 * locked movement_7d momentum semantic, and the signed-snapshot provenance
 * footer carrying the canonical share URL.
 *
 * The renderer is deliberately Satori-compatible (flexbox only, inline styles,
 * inline SVG for the hex mark + sparklines — no CSS grid, no var(), no
 * repeating gradients) so ONE component serves both render targets:
 *   - app/s/[codename]/card.png/route.tsx  → next/og ImageResponse (1200×630)
 *   - app/s/[codename]/page.tsx            → <img> of that same PNG, so the
 *     on-page surface is byte-identical to what LinkedIn/X/Slack render.
 *
 * ProfileShareCard is NOT reused: it is a client-side html-to-image download
 * widget with a different (gold/ink split-panel) composition — it cannot
 * express this card inside ImageResponse.
 *
 * Data contract (DATA_KEYS §9): every value binds to a real field — no fixture
 * literals. `signalCardData` is the single view-model builder shared by the
 * page (metadata + captions) and the card.png route so they never disagree.
 */

import type { HistoryPoint, LeaderboardRow } from "@/lib/board";
import { describeBuildArchetype } from "@/lib/analytics/build-archetypes";
import { boardWindowByEnum } from "@/lib/board/windows";
import { operatorDisplayName } from "@/lib/identity/operator-name";

// ── Palette — PRISM treatment (share-card visual system only; the board
// keeps its own theme). Coral = operator/hero accent, aqua = trust +
// field-reference accent, lavender third hue, graphite lines, cool dark
// ground. Distinct from the board's acid-lime on purpose — a share card
// should read richer and unmistakably "not the app". ────────────────────
const AC = "#ff7087"; // prism coral — operator accent
const CYAN = "#36e6c2"; // prism aqua — trust/reference accent
const BLUE = "#b391ef"; // prism lavender — third px-mark hue
const TX = "#eef6f4";
const TX2 = "#bfd4cf"; // prism ink
const MUT = "#7e8f96";
const LINE2 = "#3e464c"; // prism graphite
const UP = "#36e6c2"; // aqua up
const DN = "#f87171"; // semantic red down — not a theme color
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

/* Per-metric spark colors — the prism-family set; each stat row gets its
   own hue so the strip reads as three distinct series. */
const SPARK_COLORS: Record<string, string> = {
  YIELD: "#ff7087",
  LEVERAGE: "#36e6c2",
  SNR: "#b391ef",
};

export interface SignalCardRow {
  label: string;
  value: string;
  spark: number[] | null;
}

/** The resolved view-model for one operator share card. */
export interface SignalCardData {
  /** Display name via operatorDisplayName (display_name ?? codename). */
  name: string;
  /** Codename verbatim — the share slug (never normalized). */
  codename: string;
  /** Vanity handle or primary platform for the "@x" identity fragment. */
  handleOrPlatform: string | null;
  /** Verification-bound badge text, or null (never assert ✓ unconditionally). */
  badge: string | null;
  /** Top-percent hero fragment (e.g. 0.2), or null when unranked/pending. */
  topPct: number | null;
  classTier: string;
  archetype: string | null;
  rows: SignalCardRow[];
  /** "SIGNAL RANK #3 / 1,660" or the unranked/pending line. */
  rankLine: string;
  /** Locked 7d momentum — signed spots moved (movement_7d), when ranked. */
  movement7d: number | null;
  /** Footer provenance, e.g. "OCT 05, 2026 · SIGNED SNAPSHOT · ALL-TIME". */
  provenance: string;
  /** Footer right cell — "signalaf.com/s/<codename>". */
  shareLabel: string;
  /** True for identity-only operators (no cascade data yet). */
  pending: boolean;
}

// ── Formatters (match app/user/[codename]/opengraph-image.tsx conventions) ──

function fmtYield(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M×`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K×`;
  return `${v.toFixed(0)}×`;
}

function fmtLeverage(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M×`;
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}×`;
}

function fmtSnr(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** "2026-10-05" → "OCT 05, 2026" (string-only; no clock dependence). */
export function fmtProvenanceDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return null;
  return `${month} ${m[3]}, ${m[1]}`;
}

/** metric_snapshots.window_type → compact provenance label. */
function windowLabel(windowType: string | null | undefined): string | null {
  if (!windowType) return null;
  const win = boardWindowByEnum(windowType);
  if (!win) return windowType.toUpperCase();
  return win.slug === "all" ? "ALL-TIME" : win.short.toUpperCase();
}

// ── View-model builder ─────────────────────────────────────────────────────

/**
 * signalCardData — resolve the share-card view-model from a leaderboard row.
 *
 * `history` feeds the per-metric sparklines (last N points, oldest → newest);
 * pass null/[] to render the dash placeholders. `livePopulation` is the
 * same-scope live-field denominator — the rank line only carries "/ N" for
 * claimed operators, whose global_rank is the claimed-board position (the
 * unclaimed/seed rank basis is rank_history, a different population — showing
 * the live-field denominator against it would conflate scopes, per the D-F01
 * invariant).
 */
export function signalCardData(
  row: LeaderboardRow,
  history: HistoryPoint[] | null | undefined,
  livePopulation: number | null,
): SignalCardData {
  const { operator, snapshot, telemetry } = row;
  const c = snapshot.cascade;
  const pending = row.pending === true;
  const isPrivate = operator.profile_visibility === "private";
  const hasCascade = !!c && !c.nonCompounding;
  const ranked = !pending && row.global_rank > 0;
  const name = operatorDisplayName(row);

  // Verification badge binds to operators.verification_status only — an
  // unverified operator emits NO badge rather than an unconditional ✓.
  const badge =
    operator.verification_status === "audited"
      ? "✓ AUDITED OPERATOR"
      : operator.verification_status === "verified"
        ? "✓ VERIFIED OPERATOR"
        : null;

  const topPct =
    ranked && row.percentile > 0
      ? Math.max(0.1, +(100 - row.percentile).toFixed(1))
      : null;

  // Same privacy rule as the profile page: private profiles expose codename +
  // computed metrics only — the build archetype is hidden from non-owner
  // surfaces (this surface is never owner-authenticated).
  const archetype =
    pending || isPrivate
      ? null
      : (describeBuildArchetype({
          input: telemetry?.fresh_input,
          output: telemetry?.output,
          cache_write: telemetry?.cache_create,
          cache_read: telemetry?.cache_read,
        })?.name ?? null);

  // Per-metric sparkline series — real history points, not a fixture trend.
  // yield_ is carried on the history point; leverage/SNR derive from the raw
  // pillars on the same points.
  const pts = pending ? [] : (history ?? []);
  const yieldSpark = pts.length >= 2 ? pts.map((p) => p.yield_) : null;
  const levSpark =
    pts.length >= 2
      ? pts.map((p) => {
          const i = p.input_tokens ?? 0;
          return i > 0 ? (p.cache_read_tokens ?? 0) / i : 0;
        })
      : null;
  const snrSpark =
    pts.length >= 2
      ? pts.map((p) => {
          const i = p.input_tokens ?? 0;
          const o = p.output_tokens ?? 0;
          return i + o > 0 ? o / (i + o) : 0;
        })
      : null;

  // Value semantics mirror the public serializer (app/api/v1/operators/
  // [codename]/route.ts): yield/leverage are null-rendered ("—") when the
  // cascade is absent or non-compounding; SNR falls back to compression_ratio
  // whenever a snapshot exists. Pending rows render "—" across the board.
  const rows: SignalCardRow[] = [
    {
      label: "YIELD",
      value: hasCascade ? fmtYield(c.yield_) : "—",
      spark: yieldSpark,
    },
    {
      label: "LEVERAGE",
      value: hasCascade ? fmtLeverage(c.leverage) : "—",
      spark: levSpark,
    },
    {
      label: "SNR",
      value: pending ? "—" : fmtSnr(c ? c.snr : snapshot.compression_ratio),
      spark: snrSpark,
    },
  ];

  const rankLine = ranked
    ? `SIGNAL RANK #${row.global_rank}${
        operator.claimed && livePopulation && livePopulation > 0
          ? ` / ${livePopulation.toLocaleString("en-US")}`
          : ""
      }`
    : pending
      ? "AWAITING FIRST SIGNED SNAPSHOT"
      : "AWAITING BOARD PLACEMENT";

  // Provenance: real snapshot date + window. "SIGNED SNAPSHOT" is asserted only
  // where a signed submission backs the row (claimed operator or a recorded
  // source submission); imported/seed rows say "SNAPSHOT" instead.
  const date = fmtProvenanceDate(snapshot.snapshot_date ?? row.snapshot_date);
  const win = windowLabel(row.window_type);
  const signed = operator.claimed || row.source_submission_id != null;
  const provenance = pending
    ? "IDENTITY ONLY · AWAITING FIRST SIGNED SNAPSHOT"
    : [date, signed ? "SIGNED SNAPSHOT" : "SNAPSHOT", win]
        .filter(Boolean)
        .join(" · ");

  return {
    name,
    codename: operator.codename,
    handleOrPlatform:
      !isPrivate && operator.handle ? operator.handle : operator.primary_domain || null,
    badge,
    topPct,
    classTier: snapshot.class_tier,
    archetype,
    rows,
    rankLine,
    // movement_7d is the locked momentum semantic (owner 2026-10-05); only
    // meaningful on a ranked row — 0/undefined movement renders nothing.
    movement7d: ranked ? (snapshot.movement_7d ?? null) : null,
    provenance,
    shareLabel: `signalaf.com/s/${operator.codename}`,
    pending,
  };
}

// ── Card chrome ────────────────────────────────────────────────────────────

/** The 2×2 "px" brand mark (ac / cyan / blue / ac). */
function PxMark({ size = 14 }: { size?: number }) {
  const cell = size / 2 - 1;
  const colors = [AC, CYAN, BLUE, AC];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: size,
        height: size,
      }}
    >
      {colors.map((col, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: cell,
            height: cell,
            background: col,
            margin: 0.5,
          }}
        />
      ))}
    </div>
  );
}

/** Nested-hexagon signature mark — Prism two-tone: coral operator rings
 *  on the outside, aqua reference ring in the middle, vertex dots like
 *  the radar's marker language (decorative mark, not measured data). */
function HexMark({ size = 150 }: { size?: number }) {
  const verts = [0, 1, 2, 3, 4, 5].map((i) => [
    43 + 37 * Math.cos(-Math.PI / 2 + (i * Math.PI) / 3),
    43 + 37 * Math.sin(-Math.PI / 2 + (i * Math.PI) / 3),
  ]);
  return (
    <svg width={size} height={size} viewBox="0 0 86 86">
      <polygon
        points="43,6 78,24 78,62 43,80 8,62 8,24"
        fill="none"
        stroke={AC}
        strokeWidth="1.4"
        opacity="0.5"
      />
      {verts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill={AC} opacity="0.65" />
      ))}
      <polygon
        points="43,16 68,29 68,57 43,70 18,57 18,29"
        fill="none"
        stroke={CYAN}
        strokeWidth="1.2"
        strokeDasharray="3 3"
        opacity="0.7"
      />
      <polygon
        points="43,27 57,35 57,51 43,59 29,51 29,35"
        fill={AC}
        opacity="0.9"
      />
    </svg>
  );
}

/** History sparkline (polyline + faint area fill), matching cards.js spark(). */
function Spark({
  points,
  width = 200,
  height = 40,
  stroke = AC,
}: {
  points: number[] | null;
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!points || points.length < 2) {
    return (
      <div
        style={{
          display: "flex",
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
          color: MUT,
          fontSize: 14,
        }}
      >
        —
      </div>
    );
  }
  const mx = Math.max(...points);
  const mn = Math.min(...points);
  const rg = mx - mn || 1;
  const line = points
    .map(
      (v, i) =>
        `${((i / (points.length - 1)) * width).toFixed(1)},${(
          height -
          3 -
          ((v - mn) / rg) * (height - 6)
        ).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
      />
      <polygon
        points={`0,${height} ${line} ${width},${height}`}
        fill={stroke}
        opacity="0.12"
      />
    </svg>
  );
}

function Chip({ text, color = TX }: { text: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 13,
        letterSpacing: 1.8,
        color,
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: "7px 13px",
        opacity: 0.85,
      }}
    >
      {text}
    </div>
  );
}

/**
 * The 1200×630 share card. Every element carries explicit `display: flex` —
 * the same discipline as app/user/[codename]/opengraph-image.tsx — so the tree
 * renders identically under Satori (ImageResponse) and the DOM.
 */
export function OperatorSignalCard({ data }: { data: SignalCardData }) {
  const d = data;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(150deg,#151b20,#0b0e12)",
        border: `1px solid ${LINE2}`,
        borderRadius: 14,
        color: TX,
        fontFamily: MONO,
        padding: 40,
      }}
    >
      {/* ── top: brand + verification badge ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <PxMark size={16} />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
            signalaf
          </div>
        </div>
        {d.badge ? (
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: 1.6,
              color: CYAN,
              border: `1px solid ${CYAN}`,
              borderRadius: 6,
              padding: "8px 14px",
            }}
          >
            {d.badge}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: 1.6,
              color: MUT,
            }}
          >
            SIGRANK
          </div>
        )}
      </div>

      {/* ── hero: identity + TOP % + chips | hex mark ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexGrow: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              letterSpacing: 2.4,
              color: MUT,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {`${d.name}${d.handleOrPlatform ? ` · @${d.handleOrPlatform}` : ""}`}
          </div>
          {d.topPct != null ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "baseline",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                <div style={{ display: "flex" }}>TOP&nbsp;</div>
                <div style={{ display: "flex", color: AC }}>{`${d.topPct}%`}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                OF AI OPERATORS
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                SIGRANK
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                  color: AC,
                }}
              >
                OPERATOR
              </div>
            </>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 12,
              marginTop: 18,
            }}
          >
            <Chip text={d.classTier} color={CYAN} />
            {d.archetype && <Chip text={`ARCHETYPE · ${d.archetype}`} />}
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <HexMark />
        </div>
      </div>

      {/* ── stat rows: label | sparkline | value ── */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {d.rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderTop: "1px solid rgba(126,143,150,0.22)",
              paddingTop: 12,
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                flexGrow: 1,
                fontSize: 15,
                letterSpacing: 2.2,
                color: MUT,
              }}
            >
              {r.label}
            </div>
            <Spark points={r.spark} stroke={SPARK_COLORS[r.label] ?? AC} />
            <div
              style={{
                display: "flex",
                width: 220,
                justifyContent: "flex-end",
                fontSize: 30,
                fontWeight: 700,
                color: TX,
              }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── rank line (+ locked movement_7d momentum) ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "baseline",
          fontSize: 16,
          letterSpacing: 2.6,
          color: TX2,
          marginTop: 20,
        }}
      >
        <div style={{ display: "flex" }}>{d.rankLine}</div>
        {d.movement7d != null && d.movement7d !== 0 && (
          <div
            style={{
              display: "flex",
              color: d.movement7d > 0 ? UP : DN,
              marginLeft: 14,
            }}
          >
            {`${d.movement7d > 0 ? "▲" : "▼"} ${Math.abs(d.movement7d)} · 7D`}
          </div>
        )}
      </div>

      {/* ── footer: provenance | canonical share URL ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          fontSize: 13,
          letterSpacing: 1.2,
          color: MUT,
          borderTop: "1px solid rgba(126,143,150,0.24)",
          paddingTop: 14,
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex" }}>{d.provenance}</div>
        <div style={{ display: "flex" }}>{d.shareLabel}</div>
      </div>
    </div>
  );
}
