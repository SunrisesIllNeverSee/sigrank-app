import React from "react";
import { colors, fonts, radius } from "./tokens";
import type { SignalClass, TierName } from "./types";

interface Props {
  signalClass: SignalClass;
  size?: "sm" | "md";
  showFull?: boolean;
}

const TIER_ABBREV: Record<TierName, string> = {
  "ARCH+": "Arch+",
  ARCH: "Arch",
  POWER: "Power",
  BASE: "Base",
  SEEKER: "Seeker",
  REFINER: "Refiner",
  BEARER: "Bearer",
  IGNITER: "Igniter",
};

/** Extract the base tier name from a SignalClass (e.g. "ARCH+ I" → "ARCH+"). */
function tierOf(cls: SignalClass): TierName | "TRANSMITTER" {
  if (cls === "TRANSMITTER") return "TRANSMITTER";
  return cls.split(" ").slice(0, -1).join(" ") as TierName;
}

export function SignalClassBadge({
  signalClass,
  size = "md",
  showFull = false,
}: Props) {
  const tier = tierOf(signalClass);
  const color =
    tier === "TRANSMITTER"
      ? colors.class.TRANSMITTER
      : colors.class[tier as keyof typeof colors.class] ?? colors.text.muted;
  const label =
    signalClass === "TRANSMITTER"
      ? "Trans"
      : showFull
        ? signalClass
        : TIER_ABBREV[tier as TierName] ?? signalClass;

  const style: React.CSSProperties = {
    display: "inline-block",
    fontFamily: fonts.mono,
    fontSize: size === "sm" ? "10px" : "11px",
    fontWeight: 600,
    color,
    background: `${color}18`,
    border: `1px solid ${color}40`,
    borderRadius: radius.xs,
    padding: size === "sm" ? "1px 5px" : "2px 7px",
    letterSpacing: "0.03em",
    whiteSpace: "nowrap" as const,
  };

  return <span style={style}>{label}</span>;
}
