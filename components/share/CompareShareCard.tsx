"use client";

/**
 * components/share/CompareShareCard.tsx — the downloadable head-to-head snapshot.
 *
 * Sibling of ProfileShareCard. Owner ask (2026-06-27): at the compare, a button to
 * download a refined A-vs-B card for socials instead of screenshotting. Same
 * approach — a real on-page element (off-screen) captured to PNG via html-to-image,
 * no server route / Satori.
 *
 * Design matches ProfileShareCard: two-panel 1200×630 — gold identity panel on the
 * left (A vs B names, classes, § marks, diverging metric bars) + black terminal
 * panel on the right (CRT scanlines, phosphor green, paired metric readout with
 * leader highlighted). Same palette, same fonts, same footer language.
 */

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { track } from "@/lib/posthog/events";

export interface CompareOperand {
  name: string;
  signalClass: string;
  /** Per-metric raw values, same order/labels as the other operand. */
  metrics: { label: string; value: string; raw: number; higherWins: boolean }[];
}

export interface CompareShareCardProps {
  a: CompareOperand;
  b: CompareOperand;
  /** URL slug for the shared link (?a=&b=). */
  href: string;
}

// ── Palette — mirrors ProfileShareCard exactly ──────────────────────────────
const GOLD_BG = "#c4923a";
const INK = "#0a0a0a";
const C_GREEN = "#8ae89a";
const C_GOLD = "#f0c862";
const C_DULL = "#6e8a6e";
const A_COLOR = "#e8a0d0"; // pink — matches the site's compare A
const B_COLOR = "#f0c862"; // gold — matches the site's compare B

/** Build an SVG radar chart with two overlapping polygons (A vs B). */
function RadarGraphic({ a, b }: { a: CompareOperand; b: CompareOperand }) {
  const n = a.metrics.length;
  const cx = 300;
  const cy = 315;
  const r = 200;
  const angles = a.metrics.map(
    (_, i) => (-90 + (i * 360) / n) * (Math.PI / 180),
  );

  const norm = (val: number, max: number, higherWins: boolean) => {
    const m = Math.max(max, 1);
    return Math.max(0.05, Math.min(1, higherWins ? val / m : 1 - val / m));
  };

  const pt = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const polygon = (op: CompareOperand) =>
    op.metrics
      .map((m, i) => {
        const max = Math.max(a.metrics[i].raw, b.metrics[i].raw, 1);
        const v = norm(m.raw, max, m.higherWins);
        const p = pt(angles[i], r * v);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

  const gridRing = (frac: number) =>
    angles
      .map((ang) => {
        const p = pt(ang, r * frac);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

  const axisLabels = a.metrics.map((m, i) => {
    const p = pt(angles[i], r + 26);
    return { x: p.x, y: p.y, label: m.label.toUpperCase() };
  });

  return (
    <svg width={600} height={630} style={{ display: "block" }}>
      {/* Grid rings */}
      {[0.33, 0.66, 1.0].map((f) => (
        <polygon
          key={f}
          points={gridRing(f)}
          fill="none"
          stroke="#1a3a1a"
          strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {angles.map((ang, i) => {
        const p = pt(ang, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#1a3a1a"
            strokeWidth={1}
          />
        );
      })}
      {/* A polygon (pink) */}
      <polygon
        points={polygon(a)}
        fill={A_COLOR}
        fillOpacity={0.15}
        stroke={A_COLOR}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* B polygon (gold) */}
      <polygon
        points={polygon(b)}
        fill={B_COLOR}
        fillOpacity={0.15}
        stroke={B_COLOR}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Axis labels */}
      {axisLabels.map((al, i) => (
        <text
          key={i}
          x={al.x}
          y={al.y}
          fill={C_DULL}
          fontSize={11}
          fontWeight={700}
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          textAnchor="middle"
          dominantBaseline="middle"
          letterSpacing={0.5}
        >
          {al.label}
        </text>
      ))}
    </svg>
  );
}

function Card({
  cardRef,
  a,
  b,
}: { cardRef: React.RefObject<HTMLDivElement | null> } & Omit<
  CompareShareCardProps,
  "href"
>) {
  const leaderOf = (i: number): "a" | "b" | "tie" => {
    const am = a.metrics[i],
      bm = b.metrics[i];
    if (!am || !bm || am.raw === bm.raw) return "tie";
    return (am.higherWins ? am.raw > bm.raw : am.raw < bm.raw) ? "a" : "b";
  };

  const aUpper = a.name.toUpperCase();
  const bUpper = b.name.toUpperCase();
  const aNameSize =
    aUpper.length <= 10
      ? 38
      : aUpper.length <= 16
        ? 30
        : aUpper.length <= 24
          ? 24
          : 20;
  const bNameSize =
    bUpper.length <= 10
      ? 38
      : bUpper.length <= 16
        ? 30
        : bUpper.length <= 24
          ? 24
          : 20;

  // Count wins per operator for the title contender record
  let aWins = 0,
    bWins = 0;
  for (let i = 0; i < a.metrics.length; i++) {
    const l = leaderOf(i);
    if (l === "a") aWins++;
    else if (l === "b") bWins++;
  }

  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 630,
        background: "#050605",
        fontFamily:
          'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
        display: "flex",
        flexDirection: "row",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ═══ LEFT — gold title contender panel (A on top, B on bottom) ═══ */}
      <div
        style={{
          width: 600,
          height: 630,
          background: GOLD_BG,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        {/* ── A — top half ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px 22px 12px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: aNameSize,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: 0.5,
                  lineHeight: 1.05,
                  overflow: "hidden",
                }}
              >
                {aUpper}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: 0.3,
                  opacity: 0.85,
                  marginTop: 4,
                  display: "block",
                }}
              >
                {a.signalClass}
              </span>
            </div>
            {/* § circle */}
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: `4px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                flexShrink: 0,
                boxSizing: "border-box",
              }}
            >
              {"§"}
            </span>
          </div>
          {/* A's metric values — ink on gold, compact */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 16px",
              marginTop: 14,
            }}
          >
            {a.metrics.map((m, i) => (
              <span
                key={m.label}
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: leaderOf(i) === "a" ? INK : "rgba(10,10,10,0.4)",
                }}
              >
                {m.value}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.6,
                    marginLeft: 3,
                  }}
                >
                  {m.label.toUpperCase()}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── VS divider ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 22px",
          }}
        >
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
          <div
            style={{
              width: 8,
              height: 8,
              background: INK,
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: INK,
              letterSpacing: 3,
            }}
          >
            VS
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              background: INK,
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
        </div>

        {/* ── B — bottom half ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "12px 22px 24px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* § circle */}
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: `4px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                flexShrink: 0,
                boxSizing: "border-box",
              }}
            >
              {"§"}
            </span>
            <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: bNameSize,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: 0.5,
                  lineHeight: 1.05,
                  overflow: "hidden",
                  textAlign: "right",
                }}
              >
                {bUpper}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: 0.3,
                  opacity: 0.85,
                  marginTop: 4,
                  display: "block",
                }}
              >
                {b.signalClass}
              </span>
            </div>
          </div>
          {/* B's metric values — ink on gold, compact */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 16px",
              marginTop: 14,
              justifyContent: "flex-end",
            }}
          >
            {b.metrics.map((m, i) => (
              <span
                key={m.label}
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: leaderOf(i) === "b" ? INK : "rgba(10,10,10,0.4)",
                }}
              >
                {m.value}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.6,
                    marginLeft: 3,
                  }}
                >
                  {m.label.toUpperCase()}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Footer divider + url */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 22px 8px",
          }}
        >
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
          <div
            style={{
              width: 7,
              height: 7,
              background: INK,
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 9,
            color: INK,
            opacity: 0.3,
            letterSpacing: 1,
            textAlign: "center",
            paddingBottom: 10,
          }}
        >
          signalaf.com/compare
        </div>
      </div>

      {/* ═══ RIGHT — black terminal with dual radar ═══ */}
      <div
        style={{
          width: 600,
          height: 630,
          background: INK,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* CRT scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)",
          }}
        />

        {/* Column header row — same style as Profile card */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 28px 12px",
            borderBottom: "1px solid #2a5a2a",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            color: C_DULL,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span
            style={{
              color: C_GREEN,
              textShadow: "0 0 8px rgba(138,232,154,0.5)",
            }}
          >
            TELEMETRY
          </span>
          <span>HEAD TO HEAD</span>
        </div>

        {/* Dual radar chart */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <RadarGraphic a={a} b={b} />
        </div>

        {/* Footer — A (pink, wins) | B (gold, wins), same position as Profile's AVERAGE USER footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 18px",
            borderTop: "1px solid #1a3a1a",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.5,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span style={{ color: A_COLOR }}>{aWins} WINS</span>
          <span style={{ color: "#4a6a4a", fontSize: 11 }}>LEADER GLOWS</span>
          <span style={{ color: C_GOLD }}>{bWins} WINS</span>
        </div>
      </div>
    </div>
  );
}

export function CompareShareCard({ a, b, href }: CompareShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://signalaf.com${href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      track.compareShared("copy", { href });
    } catch {
      /* clipboard blocked */
    }
  };

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `sigrank-compare.png`;
      link.click();
      track.compareShared("download");
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50";

  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={shareLink} className={btn}>
        {copied ? "Copied ✓" : "Share matchup"}
      </button>
      <button type="button" onClick={() => setPreview(true)} className={btn}>
        Preview
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? "Rendering…" : "Download card"}
      </button>

      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <Card cardRef={cardRef} a={a} b={b} />
      </div>

      {/* Preview modal — shows the card scaled to fit the viewport */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative max-h-full max-w-full overflow-auto rounded-lg border border-bg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-bg-border bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover"
            >
              Close ✕
            </button>
            <div
              style={{
                transform:
                  "scale(min(1, calc((100vw - 2rem) / 1200), calc((100vh - 2rem) / 630)))",
                transformOrigin: "top left",
              }}
            >
              <Card cardRef={cardRef} a={a} b={b} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
