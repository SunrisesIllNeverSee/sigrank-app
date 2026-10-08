/* components/live/SignalHardware.tsx — reusable vector hardware for the
 * board: placement medals (gold/silver/bronze) and achievement awards.
 * Ported from the approved graphics experiment (ledger LB-G01/LB-G04
 * direction; canonical source git show 93b6ec1:components/live/SignalHardware.tsx).
 * Status badges stay in PixelBadge — these are intentionally larger hardware.
 * Styles: proto-scoped.css (.sig-medal / .sig-award / .vacancy). */

export type MedalRank = 1 | 2 | 3;
export type SignalAwardType = "class" | "top1" | "days100" | "records" | "tokens10m";

const MEDAL = {
  1: { metal: "#e8b93c", inner: "#fff0a3", label: "GOLD" },
  2: { metal: "#b9c4cc", inner: "#eef4f7", label: "SILVER" },
  3: { metal: "#b0722e", inner: "#e7a45d", label: "BRONZE" },
} as const;

export function SignalMedal({
  rank,
  size = 32,
  muted = false,
}: {
  rank: MedalRank;
  size?: number;
  muted?: boolean;
}) {
  const m = MEDAL[rank];
  return (
    <span
      className={`sig-medal${muted ? " muted" : ""}`}
      title={`${m.label} · #${rank}`}
      role="img"
      aria-label={`${m.label} medal · rank ${rank}`}
      style={{ width: size, height: Math.round(size * 1.08) }}
    >
      <svg viewBox="0 0 64 70" width="100%" height="100%" aria-hidden="true">
        <path
          d="M32 2 58 17v36L32 68 6 53V17Z"
          fill="rgba(6,9,6,.92)"
          stroke={m.metal}
          strokeWidth="3"
        />
        <path
          d="M32 10 51 21v27L32 59 13 48V21Z"
          fill={m.metal}
          fillOpacity=".14"
          stroke={m.metal}
          strokeWidth="1.5"
        />
        <path
          d="m32 18 4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4-8.4-4.4-8.4 4.4 1.6-9.4-6.9-6.7 9.5-1.4Z"
          fill={m.inner}
        />
        <circle cx="32" cy="35" r="5.2" fill={m.metal} />
        <text
          x="32"
          y="38.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill="#080b08"
        >
          {rank}
        </text>
      </svg>
    </span>
  );
}

const AWARD_META: Record<
  SignalAwardType,
  { color: string; label: string; glyph: "diamond" | "ring" | "hourglass" | "record" | "stack" }
> = {
  class: { color: "#e8b93c", label: "CLASS MILESTONE", glyph: "diamond" },
  top1: { color: "#a6ff00", label: "TOP 1% LEGEND", glyph: "diamond" },
  days100: { color: "#b565ff", label: "100 DAYS", glyph: "hourglass" },
  records: { color: "#00e5ff", label: "RECORD HOLDER", glyph: "record" },
  tokens10m: { color: "#7ec8ff", label: "TOKEN MILESTONE", glyph: "stack" },
};

function AwardGlyph({ type, color }: { type: SignalAwardType; color: string }) {
  const meta = AWARD_META[type];
  if (meta.glyph === "hourglass") {
    return <path d="M25 20h14M25 44h14M27 21c0 8 10 7 10 12s-10 5-10 11M37 21c0 8-10 7-10 12s10 5 10 11" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />;
  }
  if (meta.glyph === "record") {
    return (
      <>
        <circle cx="32" cy="32" r="11" fill="none" stroke={color} strokeWidth="2.5" />
        <circle cx="32" cy="32" r="4" fill={color} />
        <path d="M32 13v6M32 45v6M13 32h6M45 32h6" stroke={color} strokeWidth="2" />
      </>
    );
  }
  if (meta.glyph === "stack") {
    return (
      <>
        <path d="m32 18 13 7-13 7-13-7Z" fill={color} fillOpacity=".75" stroke={color} strokeWidth="1.5" />
        <path d="m19 32 13 7 13-7M19 39l13 7 13-7" fill="none" stroke={color} strokeWidth="2" />
      </>
    );
  }
  return (
    <>
      <path d="m32 17 12 15-12 15-12-15Z" fill={color} fillOpacity=".18" stroke={color} strokeWidth="2" />
      <path d="m32 23 7 9-7 9-7-9Z" fill={color} />
    </>
  );
}

export function SignalAward({
  type,
  size = 48,
  locked = false,
}: {
  type: SignalAwardType;
  size?: number;
  locked?: boolean;
}) {
  const meta = AWARD_META[type];
  const color = locked ? "#596259" : meta.color;
  return (
    <span
      className={`sig-award${locked ? " locked" : ""}`}
      title={meta.label}
      role="img"
      aria-label={`${meta.label}${locked ? " · locked" : ""}`}
      style={{ width: size, height: Math.round(size * 1.08) }}
    >
      <svg viewBox="0 0 64 70" width="100%" height="100%" aria-hidden="true">
        <path d="M32 2 59 17v36L32 68 5 53V17Z" fill="rgba(8,12,10,.95)" stroke={color} strokeWidth="2.8" />
        <path d="M32 9 52 21v26L32 59 12 47V21Z" fill={color} fillOpacity={locked ? ".04" : ".08"} stroke={color} strokeOpacity=".48" strokeWidth="1.3" />
        <AwardGlyph type={type} color={color} />
      </svg>
    </span>
  );
}
