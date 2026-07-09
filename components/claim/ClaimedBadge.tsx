import React from "react";

/**
 * ClaimedBadge — shared "✓ Claimed" pill (G4-owned, imported by other groups).
 *
 * Contract (OPERATOR OVERRIDE): props { claimed }. Renders a "✓ Claimed" pill
 * when claimed, otherwise null. Pure presentational server component (no hooks).
 */

interface Props {
  claimed: boolean;
}

export function ClaimedBadge({ claimed }: Props) {
  if (!claimed) return null;
  return (
    <span
      title="This operator has been claimed by its owner."
      className="inline-flex items-center gap-1 rounded-sm border border-class-seeker/40 bg-class-seeker/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-class-seeker"
    >
      ✓ Claimed
    </span>
  );
}
