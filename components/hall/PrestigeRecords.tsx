import React from "react";
import Link from "next/link";
import { getHallOfSignal } from "@/lib/data";

/**
 * PrestigeRecords — the curated permanent-record section for the Hall of Signal.
 *
 * Server component: pulls the 6 static curated records (RW.28–RW.34) from
 * `getHallOfSignal()` and renders them as a card grid. Each card shows the
 * record name, headline value, holder (linked to /user/[codename]), date
 * achieved, and an italic "seed" badge when the record is a placeholder.
 * Gold/black aesthetic, monospace, 2–3 columns on desktop / 1 on mobile.
 */
export async function PrestigeRecords() {
  const records = await getHallOfSignal();
  if (records.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-1 font-mono text-lg font-bold tracking-wide text-gold">
        Triumphus Famae Et Gloriae
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The curated all-time marks — the highest compression, the deepest
        sessions, the longest streaks ever recorded on the SigRank leaderboard.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {records.map((r) => (
          <article
            key={r.reward_id}
            className="flex flex-col gap-3 rounded-md border border-bg-border bg-bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-sm font-bold tracking-wide text-text-primary">
                {r.title}
              </h3>
              <span className="shrink-0 rounded bg-bg-base/60 px-1.5 py-0.5 font-mono text-[10px] text-gold">
                {r.reward_id}
              </span>
            </div>

            <div className="font-mono text-2xl font-semibold tabular-nums text-gold">
              {r.value}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-bg-border-subtle pt-3">
              <Link
                href={`/user/${r.operator_codename}`}
                className="truncate font-mono text-xs text-text-primary transition-colors hover:text-accent"
              >
                {r.operator_codename}
              </Link>
              <time
                dateTime={r.date}
                className="shrink-0 font-mono text-[10px] text-text-muted"
              >
                {r.date}
              </time>
            </div>

            {r.isPlaceholder ? (
              <span className="font-sans text-[10px] italic text-text-muted">
                seed
              </span>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
