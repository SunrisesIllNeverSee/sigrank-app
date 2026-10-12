"use client";
/**
 * components/live/ProfileActions.tsx — the two-button action row for
 * an operator: profile and watch. Shared by the peek rail
 * and the inspector's operator-profile module.
 */
import Link from "next/link";
import type { LiveOperator } from "@/lib/board/live-types";
import { WatchButton } from "./WatchButton";

export function ProfileActions({
  op,
}: {
  op: LiveOperator;
  compareHref?: string;
}) {
  return (
    <div className="peek-actions">
      <Link
        className="pkbtn"
        href={`/user/${encodeURIComponent(op.codename)}`}
        onClick={(e) => e.stopPropagation()}
      >
        PROFILE
      </Link>
      <WatchButton codename={op.codename} />
    </div>
  );
}
