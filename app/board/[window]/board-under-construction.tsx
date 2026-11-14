/**
 * app/board/[window]/board-under-construction.tsx — shown in place of the live
 * board while the live data is unavailable (database unreachable or blocked).
 *
 * Added 2026-11-14 for the Supabase egress block (every read returned 402 and
 * the board said "No operators on this board", which read as "the board is
 * empty"). It is NOT a redirect: an ISR-cached redirect could stick after the
 * data recovers and hurt search. The page renders this only while
 * getLeaderboardResult() reports `unavailable`; once Supabase answers again,
 * the next revalidation renders the real board and this disappears by itself.
 */

import Link from "next/link";

export function BoardUnderConstruction({
  heading,
}: {
  heading: { a: string; b: string };
}) {
  return (
    <section
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-16"
      data-testid="board-under-construction"
    >
      <h1 className="font-sans text-3xl font-semibold text-text-primary">
        {heading.a}
        <span className="bg-gradient-to-r from-gold to-text-accent bg-clip-text text-transparent">
          {heading.b}
        </span>
      </h1>
      <div
        role="status"
        className="mt-6 rounded-lg border border-bg-border bg-bg-surface p-6"
      >
        <p className="font-sans text-lg text-text-primary">
          Live board under construction — back shortly.
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          The live data is temporarily unavailable. Nothing has been lost; the
          board returns on its own as soon as the data is back.
        </p>
        <Link
          href="/board/history"
          className="mt-5 inline-block rounded-md border border-gold px-5 py-2.5 font-sans text-sm font-semibold text-gold hover:bg-bg-elevated hover:text-text-primary"
        >
          See the original board
        </Link>
      </div>
    </section>
  );
}
