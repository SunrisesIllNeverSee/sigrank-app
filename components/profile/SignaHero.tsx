/**
 * components/profile/SignaHero.tsx — the SIGNA RATE hero block (profile.html port).
 *
 * Server component: pure render from props, no hooks / no client state. Shows the
 * big gold SIGNA RATE (128px, gold glow), the class pill
 * (e.g. "◈ TRANSMITTER · Rank #1 Global"), and the 24h / 7d movement + streak line.
 *
 * Movement and streak are placeholders on mock data (gold-star treatment). The
 * SIGNA RATE itself is the real C.01 value for MO§ES.
 */

import { CanonId } from "@/components/ui/CanonId";
import { Placeholder } from "@/components/ui/Placeholder";
import { CLASS_NAME_TO_ID, CLASS_TIERS } from "@/lib/identity/canon-ids";
import type { SignalClass } from "@/components/sigrank/types";

interface Props {
  /** C.01 SIGNA RATE [0,100]. */
  signaRate: number;
  /** K.xx class assignment. */
  classTier: SignalClass;
  /** Global rank for the "Rank #N Global" line. */
  globalRank: number;
  /** 24h rank movement (positive = climbed). */
  movement24h: number;
  /** 7d rank movement (positive = climbed). */
  movement7d: number;
  /** Whether the underlying snapshot is a placeholder (mock) row. */
  isPlaceholder?: boolean;
}

function MovementChip({ delta, label }: { delta: number; label: string }) {
  const up = delta >= 0;
  const arrow = up ? "↑" : "↓";
  const sign = up ? "+" : "";
  return (
    <span className="font-mono text-[13px] font-medium text-text-secondary">
      <span className={up ? "text-class-seeker" : "text-class-refiner"}>
        {arrow} {sign}
        {delta}
      </span>{" "}
      · {label}
    </span>
  );
}

export function SignaHero({
  signaRate,
  classTier,
  globalRank,
  movement24h,
  movement7d,
  isPlaceholder = false,
}: Props) {
  const classId = CLASS_NAME_TO_ID[classTier];
  const glyph = CLASS_TIERS[classId]?.glyph ?? "◈";
  const signaDisplay = signaRate.toFixed(1);

  return (
    <div className="relative z-[1]">
      <div className="font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
        SIGNA RATE · 30-day rolling
      </div>

      <div className="mb-4 mt-2 flex items-end leading-none">
        <span className="text-[128px] font-bold leading-none tracking-[-0.05em] text-gold">
          {isPlaceholder ? <Placeholder value={signaDisplay} /> : signaDisplay}
          <CanonId id="C.01" real title="SIGNA RATE composite (CANON C.01)" />
        </span>
        <span className="ml-2 font-mono text-lg font-normal text-text-muted">
          / 100
        </span>
      </div>

      <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold/[0.08] px-4 py-2 font-mono text-sm font-semibold tracking-[0.04em] text-gold">
        <span className="text-base">{glyph}</span>
        {classTier}
        <CanonId id={classId} real title={`Signal class ${classId}`} />
        <span className="text-text-muted">·</span>
        Rank #{globalRank} Global
      </div>

      <div className="mt-2 flex gap-4">
        <MovementChip delta={movement24h} label="24h" />
        <MovementChip delta={movement7d} label="7d" />
        <span className="font-mono text-[13px] font-medium text-text-secondary">
          <Placeholder
            value="38-day streak"
            title="Placeholder · streak not yet computed"
          />
        </span>
      </div>
    </div>
  );
}
