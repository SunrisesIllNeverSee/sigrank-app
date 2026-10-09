"use client";
/**
 * components/live/ProfileActions.tsx — the three-button action row for
 * an operator: full profile, compare, watch. Shared by the peek rail
 * and the inspector's operator-profile module.
 */
import Link from "next/link";
import type { LiveOperator } from "@/lib/board/live-types";
import { WatchButton } from "./WatchButton";

export function ProfileActions({
  op,
  compareHref,
}: {
  op: LiveOperator;
  compareHref: string;
}) {
  return (
    <div className="peek-actions">
      <Link
        className="pkbtn"
        href={`/user/${encodeURIComponent(op.codename)}`}
        onClick={(e) => e.stopPropagation()}
      >
        SEE PROFILE
      </Link>
      <Link
        className="pkbtn"
        href={compareHref}
        onClick={(e) => e.stopPropagation()}
      >
        COMPARE
      </Link>
      <WatchButton codename={op.codename} />
    </div>
  );
}
