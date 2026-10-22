/**
 * components/profile-v2/PassportCard.tsx — the holographic operator passport
 * card for the /user/[codename] Overview opening split.
 *
 * Ported from _workspace/profile-mocks/shell.html §0 (.pcard-scope > .card):
 *   YIELD rating + position tag | class badge + rank chip
 *   hex background + ringed avatar + name/codename + six-axis mini radar
 *   stats block (YLD SNR VEL LEV DEV SCV)
 *   footer (platform chip + medal dots + signalaf.com watermark)
 *
 * Server component — pure render from props. All values are the displayed
 * operator's real telemetry/cascade numbers; nothing is mocked. Radar axes
 * normalize so the field average sits at 50% (the same convention
 * SplitFlapCard documents for radarAxes): norm = clamp(v / (avg * 2), 0..1).
 * Missing/undefined data renders "—", never a fabricated zero.
 *
 * With `radar` (owner 2026-10-22) the mini radar draws roto points instead
 * (lib/radar/points, the shared metric ring: SNR VEL LEV 10X SCV EFF) over the
 * field's first / middle / last operator in white.
 */

import type { Operator, CascadeMetrics } from "@/lib/analytics/scoring-types";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import type { FieldAverages } from "@/lib/analytics/field-average";
import type { WorkflowCohortRank } from "@/lib/analytics/workflow-cohort";
import type { ProfileMarkOption } from "@/lib/profile/profile-marks";
import { MedalHex } from "./RecordMarks";
import { PixelArtwork } from "@/components/profile-v2/BadgeArtwork";
import { RADAR_REF_STYLE, radarFractions, type RadarField } from "@/lib/radar/points";

interface PassportCardProps {
  operator: Pick<Operator, "codename" | "display_name" | "avatar_url" | "primary_domain">;
  snapshot: {
    class_tier: string;
    cascade: Pick<CascadeMetrics, "yield_" | "snr" | "velocity" | "leverage" | "dev10x" | "scaleV" | "nonCompounding"> | null;
  };
  globalRank: number;
  pending: boolean;
  archetype: Pick<BuildArchetype, "name"> | null;
  trophyCounts: TrophyCounts | null;
  fieldAvg: FieldAverages | null;
  /** Workflow-cohort rank context (item 13) — shown under the combined-field
   *  rank on the card face. Null for pending/unranked operators. */
  cohort?: WorkflowCohortRank | null;
  selectedPixelBadge?: ProfileMarkOption | null;
  selectedSecondaryBadge?: ProfileMarkOption | null;
  showSignature?: boolean;
  rankLabel?: string;
  id?: string;
  /** All-time roto metric ring for the mini radar; absent = field-average scale. */
  radar?: RadarField | null;
}

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function initialsOf(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N} _-]/gu, " ")
    .split(/[\s_-]+|(?<=[a-z0-9])(?=[A-Z])/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Field-average-at-50% normalization shared with SplitFlapCard radarAxes. */
function normAxis(v: number | null | undefined, avg: number | null | undefined): number {
  if (v == null || !Number.isFinite(v) || v <= 0) return 0;
  if (avg != null && Number.isFinite(avg) && avg > 0) {
    return Math.min(1, v / (avg * 2));
  }
  return 1;
}

/** Polar point for a 6-axis radar in a 120×120 box: axis i at -90° + i·60°. */
function radarPoint(i: number, frac: number): [number, number] {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  const r = 50 * frac;
  return [60 + r * Math.cos(angle), 60 + r * Math.sin(angle)];
}

export function PassportCard({
  id,
  operator,
  snapshot,
  globalRank,
  pending,
  archetype,
  trophyCounts,
  fieldAvg,
  cohort,
  selectedPixelBadge,
  selectedSecondaryBadge,
  showSignature = true,
  rankLabel = "FIELD",
  radar,
}: PassportCardProps) {
  const c = snapshot.cascade;
  const show = !pending && c && !c.nonCompounding ? c : null;
  const name = operator.display_name ?? operator.codename;
  const initials = initialsOf(name);

  const axes: { label: string; value: number | null; avg: number | null }[] = [
    { label: "YLD", value: show ? show.yield_ : null, avg: fieldAvg?.yield_ ?? null },
    { label: "SNR", value: show ? show.snr : null, avg: fieldAvg?.snr ?? null },
    { label: "VEL", value: show ? show.velocity : null, avg: fieldAvg?.velocity ?? null },
    { label: "LEV", value: show ? show.leverage : null, avg: fieldAvg?.leverage ?? null },
    { label: "DEV", value: show ? show.dev10x : null, avg: fieldAvg?.dev10x ?? null },
    { label: "SCV", value: show ? show.scaleV : null, avg: fieldAvg?.scaleV ?? null },
  ];
  const rotoPts = radar?.points[operator.codename];
  const fracs: number[] = radar && rotoPts
    ? radarFractions(rotoPts, radar.max).map((v) => v ?? 0)
    : axes.map((a) => normAxis(a.value, a.avg));
  const refPolys = radar && rotoPts
    ? radar.refs.map((r) => ({
        role: r.role,
        points: radarFractions(r.pts, radar.max)
          .map((v, i) => radarPoint(i, v ?? 0).map((n) => n.toFixed(2)).join(","))
          .join(" "),
      }))
    : [];
  const polygon = fracs
    .map((f, i) => radarPoint(i, f).map((n) => n.toFixed(2)).join(","))
    .join(" ");
  const dotAt = (i: number) => {
    const [x, y] = radarPoint(i, fracs[i]);
    return { x: x.toFixed(2), y: y.toFixed(2) };
  };

  const statFmt = [
    show ? `${compact(show.yield_)}` : "—",
    show ? show.snr.toFixed(3) : "—",
    show ? show.velocity.toFixed(2) : "—",
    show ? `${Math.round(show.leverage).toLocaleString("en-US")}x` : "—",
    show && show.dev10x != null ? show.dev10x.toFixed(2) : "—",
    show ? show.scaleV.toFixed(2) : "—",
  ];

  const medals: { rank: 1 | 2 | 3; label: string }[] = [];
  const pushMedals = (n: number, rank: 1 | 2 | 3, label: string) => {
    for (let i = 0; i < Math.min(n, 3) && medals.length < 5; i++) medals.push({ rank, label });
  };
  if (trophyCounts) {
    pushMedals(trophyCounts.gold, 1, "gold");
    pushMedals(trophyCounts.silver, 2, "silver");
    pushMedals(trophyCounts.bronze, 3, "bronze");
  }
  const medalLabel = trophyCounts
    ? `${trophyCounts.gold} gold, ${trophyCounts.silver} silver, ${trophyCounts.bronze} bronze medals`
    : "no medals";

  return (
    <div id={id ?? `holocard-${operator.codename}`} className="pv2-card-shell">
      <div className="pv2-card">
        {/* Holo shine — iridescent foil band sweeping the card face. A real
            element (not ::after) so the sweep is transform-based: GPU-only,
            Safari-safe, and disabled under prefers-reduced-motion. */}
        <div className="pv2-shine" aria-hidden="true" />
        <div className="pv2-card-inner">
          <div className="pv2-top-strip">
            <div className="pv2-rating-block">
              <div className="pv2-rating-label">Yield</div>
              <div className="pv2-rating-number">{show ? compact(show.yield_) : "—"}</div>
              <div className="pv2-position-tag">
                {archetype?.name ?? (pending ? "Pending" : "Operator")}
              </div>
            </div>
            <div className="pv2-class-block">
              <div className="pv2-class-badge">{pending ? "UNRANKED" : snapshot.class_tier}</div>
              <div className="pv2-rank-chip pv2-rank-chip--field" data-rank-digits={pending || !globalRank ? "0" : String(globalRank).length}>
                {rankLabel}{" "}
                <strong>{pending || !globalRank ? "—" : `#${globalRank}`}</strong>
              </div>
              {cohort && cohort.rank != null && (
                <div className="pv2-rank-chip pv2-rank-chip--wf">
                  {cohort.cohortShort}{" "}
                  <strong>#{cohort.rank}</strong>
                  <span className="pv2-rank-of">/{cohort.size}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pv2-center-block">
            <svg className="pv2-hex-bg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <path d="M50 5 L90.5 27.5 V72.5 L50 95 L9.5 72.5 V27.5 Z" stroke="#A855F7" strokeWidth="0.6" strokeOpacity="0.35" />
              <path d="M50 22 L75.5 36.75 V66.25 L50 81 L24.5 66.25 V36.75 Z" stroke="#A855F7" strokeWidth="0.4" strokeOpacity="0.22" />
              <circle cx="50" cy="50" r="46" stroke="#A855F7" strokeWidth="0.3" strokeOpacity="0.15" strokeDasharray="2 4" />
            </svg>
            <div className="pv2-avatar-wrap">
              <div className="pv2-avatar-ring" />
              <div className="pv2-avatar">
                {operator.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar inside the card face */
                  <img
                    src={operator.avatar_url}
                    alt={name}
                    width={120}
                    height={120}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <span className="pv2-avatar-initials">{initials}</span>
                )}
              </div>
              {selectedPixelBadge?.pattern && (
                <span title={`Selected Pixel badge: ${selectedPixelBadge.label}`} aria-label={`Selected Pixel badge: ${selectedPixelBadge.label}`} className="absolute -right-2 -top-1 z-10 flex h-8 w-8 items-center justify-center">
                  <PixelArtwork pattern={selectedPixelBadge.pattern} size={28} />
                </span>
              )}
              {selectedSecondaryBadge && (
                <span title={`Selected earned badge: ${selectedSecondaryBadge.label}`} aria-label={`Selected earned badge: ${selectedSecondaryBadge.label}`} className="absolute -bottom-1 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded bg-bg-base shadow-lg">
                  <MedalHex rank={selectedSecondaryBadge.rank} sigil={selectedSecondaryBadge.sigil ?? "★"} ink={selectedSecondaryBadge.accent} size={30} />
                </span>
              )}
            </div>
            <div className="pv2-operator-name">{name}</div>
            <div className="pv2-operator-code">{operator.codename}</div>
            {show && showSignature && (
              <svg className="pv2-radar-wrap" viewBox="0 0 120 120" aria-hidden="true">
                <g opacity="0.9">
                  {[12.5, 25, 37.5, 50].map((r) => (
                    <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="#A855F7" strokeWidth="0.5" strokeOpacity="0.18" />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const [x, y] = radarPoint(i, 1);
                    return (
                      <line key={i} x1="60" y1="60" x2={x} y2={y} stroke="#A855F7" strokeWidth="0.5" strokeOpacity="0.18" />
                    );
                  })}
                  {refPolys.map((r) => (
                    <polygon
                      key={r.role}
                      points={r.points}
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity={RADAR_REF_STYLE[r.role].opacity}
                      strokeWidth={RADAR_REF_STYLE[r.role].width * 0.6}
                      strokeDasharray={RADAR_REF_STYLE[r.role].dash ? RADAR_REF_STYLE[r.role].dash?.split(" ").map((n) => Number(n) * 0.5).join(" ") : undefined}
                      strokeLinejoin="round"
                    />
                  ))}
                  <polygon
                    points={polygon}
                    fill="rgba(168,85,247,0.18)"
                    stroke="#A855F7"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {axes.map((_, i) => {
                    const p = dotAt(i);
                    return <circle key={i} cx={p.x} cy={p.y} r="2" fill={i < 4 ? "#a6ff00" : "#4ade80"} />;
                  })}
                </g>
              </svg>
            )}
          </div>

          <div className="pv2-stats-block">
            {axes.map((a, i) => (
              <div className="pv2-stat" key={a.label}>
                <span className={`pv2-stat-value ${i < 4 ? "pv2-stat-gold" : "pv2-stat-green"}`}>
                  {statFmt[i]}
                </span>
                <span className="pv2-stat-label">{a.label}</span>
              </div>
            ))}
          </div>

          <div className="pv2-card-footer">
            <div className="pv2-platform-chip">
              <svg className="pv2-platform-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {operator.primary_domain ?? "other"}
            </div>
            <div className="pv2-medals" aria-label={medalLabel}>
              {medals.map((m, i) => (
                <span key={i} title={`${m.label} standing medal`} style={{ display: "inline-flex", alignItems: "center" }}>
                  <MedalHex rank={m.rank} sigil="★" size={15} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="pv2-command-footer">npx sigrank</div>
      </div>
    </div>
  );
}
