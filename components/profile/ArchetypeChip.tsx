import React from "react";
import { colors, fonts, radius } from "@/components/sigrank/tokens";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";

interface Props {
  archetype: BuildArchetype;
  size?: "sm" | "md";
}

const NEUTRAL = colors.text.muted;

export function ArchetypeChip({ archetype, size = "md" }: Props) {
  const style: React.CSSProperties = {
    display: "inline-block",
    fontFamily: fonts.mono,
    fontSize: size === "sm" ? "10px" : "11px",
    fontWeight: 600,
    color: NEUTRAL,
    background: `${NEUTRAL}12`,
    border: `1px solid ${NEUTRAL}40`,
    borderRadius: radius.xs,
    padding: size === "sm" ? "1px 5px" : "2px 7px",
    letterSpacing: "0.03em",
    whiteSpace: "nowrap" as const,
  };

  return (
    <span style={style} title={archetype.blurb}>
      {archetype.word} · {archetype.familyLabel}
    </span>
  );
}
