"use client";
/**
 * components/live/ProfileActions.tsx — PROFILE + WATCH for all operators.
 * Adds COMPARE only when a signed-in operator selects someone else.
 * Shared by the peek rail and inspector; compare visibility is explicit.
 */
import Link from "next/link";
import type { LiveOperator } from "@/lib/board/live-types";
import { WatchButton } from "./WatchButton";

export function ProfileActions({
  op,
  showCompare = false,
  compareHref,
}: {
  op: LiveOperator;
  showCompare?: boolean;
  compareHref?: string;
}) {
  return (
    <div className={`peek-actions${showCompare ? " compare-enabled" : ""}`} aria-label="Operator actions">
      <Link
        className="pkbtn"
        href={`/user/${encodeURIComponent(op.codename)}`}
        onClick={(e) => e.stopPropagation()}
      >
        PROFILE
      </Link>
      <WatchButton codename={op.codename} />
      {showCompare && (
        <Link
          className="pkbtn pkbtn-compare"
          href={compareHref ?? `/compare?a=${encodeURIComponent(op.codename)}`}
          onClick={(e) => e.stopPropagation()}
        >
          COMPARE
        </Link>
      )}
    </div>
  );
}
