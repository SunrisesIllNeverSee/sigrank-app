import React from "react";
import Link from "next/link";
import type { SignalClass } from "@/components/sigrank/types";
import { colors } from "@/components/sigrank/tokens";
import { glyphFor } from "@/lib/canon/ids";
import { Placeholder } from "@/components/ui/Placeholder";
import { Trophy } from "@/components/hall/Trophy";

interface Props {
  /** Display rank within the board. */
  rank: number;
  /** Operator codename (used for the profile link, never displayed directly). */
  codename: string;
  /** Display name — the operator's real name when present, else the codename. */
  displayName?: string | null;
  /** Whether the operator profile has been claimed (group brief requirement). */
  claimed: boolean;
  /** Optional class tier for the badge. */
  classTier?: SignalClass;
  /** Optional platform domain (e.g. 'claude'). */
  platform?: string;
  /** The displayed metric value (already formatted). */
  value: React.ReactNode;
  /** Canonical id for the value's source (e.g. 'M.01'). */
  canonId?: string;
  /** When true, the value is a placeholder (gold star); else real (green canon id). */
  isPlaceholder?: boolean;
  /** Optional href to the operator profile. */
  href?: string;
}

/**
 * HallSubmissionRow — one ranked row in a Hall board (points board or metric
 * top-ten). Server component (no interactivity). Renders the operator codename
 * with a claimed indicator, an optional class badge, and the metric value with
 * the placeholder/canonical-id treatment per the value protocol.
 */
export function HallSubmissionRow({
  rank,
  codename,
  displayName,
  claimed,
  classTier,
  platform,
  value,
  isPlaceholder = true,
  href,
}: Props) {
  // Rank cell: 1–3 get a tinted trophy (gold/silver/bronze), 4–10 the bare
  // number in trophy-purple, >10 the muted number. Trophies are visually distinct
  // from the class glyph (◈ ▲ ▽) that also sits in this row.
  const rankNode =
    rank >= 1 && rank <= 3 ? (
      <>
        <Trophy tier={rank as 1 | 2 | 3} />
        <span className="sr-only">{`rank ${rank}`}</span>
      </>
    ) : (
      <span className={rank <= 10 ? "text-rank-low" : "text-text-muted"}>
        {rank}
      </span>
    );

  // Value: placeholder rows keep the gold-star; real rows show the bare value
  // (the little green canon-id superscript was removed per owner 2026-06-21).
  const valueNode = isPlaceholder ? (
    <Placeholder value={value} />
  ) : (
    <span>{value}</span>
  );

  // Display name: show the operator's real name (display_name) when present,
  // else fall back to the codename. Mirrors to-entry.ts's anonId logic so the
  // Hall matches the main board's identity treatment.
  const displayLabel = displayName || codename;

  // Unclaimed rows are the seed corpus (italic, matching the live board's
  // isSeed treatment in to-entry.ts) so a reader can tell a real claimed
  // operator from a placeholder seed at a glance — the Hall's whole pitch is
  // verification honesty, so seed rows get a visual class of their own rather
  // than ranking indistinguishably from claimed operators.
  const nameNode = href ? (
    <Link
      href={href}
      className="text-text-primary transition-colors hover:text-accent"
      style={{ fontStyle: claimed ? "normal" : "italic" }}
    >
      {displayLabel}
    </Link>
  ) : (
    <span
      className="text-text-primary"
      style={{ fontStyle: claimed ? "normal" : "italic" }}
    >
      {displayLabel}
    </span>
  );

  // Class is now the canonical GLYPH (◈ ▲ ▽ …) in its class color, not the "Trans"
  // text badge (owner 2026-06-21: "swap the trans class title with the symbol").
  const classGlyph = classTier ? (
    <span
      aria-label={classTier}
      title={classTier}
      className="font-mono text-xs leading-none"
      style={{ color: colors.class[classTier] ?? colors.text.muted }}
    >
      {glyphFor(classTier)}
    </span>
  ) : null;

  return (
    // 2 rows per entry (owner 2026-06-21): row 1 = rank · name · class glyph · claimed;
    // row 2 = the metric value, right-aligned and emphasized.
    <div className="flex flex-col gap-0.5 border-b border-bg-border-subtle px-2 py-2 text-sm last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex w-7 shrink-0 items-center justify-center font-mono font-bold leading-none">
          {rankNode}
        </span>
        {classGlyph}
        <span className="min-w-0 flex-1 truncate">{nameNode}</span>
        {claimed ? (
          <span
            title="Claimed operator"
            className="font-mono text-[10px] text-text-gold"
            aria-label="claimed"
          >
            ✓
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline justify-end gap-2 pl-9">
        {platform ? (
          <span className="mr-auto font-mono text-[10px] uppercase text-text-muted">
            {platform}
          </span>
        ) : null}
        <span className="shrink-0 font-mono text-base font-semibold tabular-nums text-text-primary">
          {valueNode}
        </span>
      </div>
    </div>
  );
}
