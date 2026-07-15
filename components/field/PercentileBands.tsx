/**
 * PercentileBands — the "Where am I?" percentile ladder.
 *
 * Shows yield percentiles (Top 0.1%, 1%, 5%, 10%, 25%, Median) as horizontal
 * bars on a log scale. If the user is logged in and their yield is known,
 * a "YOU" marker appears at their position. Otherwise, the marker sits at
 * the median with an invitation.
 *
 * Uses the pre-generated PNG (09-percentile-ladder.png) as the base, with
 * an optional client-side overlay for the user's position.
 */

import Image from "next/image";

export interface PercentileBandsProps {
  /** User's yield value, if known (shows "YOU" marker at their position). */
  userYield?: number;
  /** Median yield for the "you're probably here" fallback. */
  medianYield?: number;
}

export default function PercentileBands({
  userYield,
  medianYield = 1.69,
}: PercentileBandsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
        <Image
          src="/article-charts/09-percentile-ladder.png"
          alt="Yield percentile ladder: Top 0.1%, 1%, 5%, 10%, 25%, and Median. YOU marker at median yield 1.69."
          width={1000}
          height={800}
          className="h-auto w-full"
        />
      </div>
      <p className="text-center text-sm text-text-secondary">
        {userYield ? (
          <>
            Your yield is{" "}
            <span className="font-mono font-bold text-gold">
              {userYield >= 1000
                ? `${(userYield / 1000).toFixed(1)}K`
                : userYield.toFixed(2)}
            </span>
            .{" "}
          </>
        ) : (
          <>
            Median yield is{" "}
            <span className="font-mono font-bold text-gold">
              {medianYield.toFixed(2)}
            </span>
            . You are probably here.{" "}
          </>
        )}
        <a href="/login" className="text-gold underline hover:text-text-primary">
          Claim your profile to see exactly where you land
        </a>
      </p>
    </div>
  );
}
