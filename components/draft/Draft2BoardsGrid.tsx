import React from 'react'
import Link from 'next/link'
import { MiniBoard } from '@/components/home/MiniBoard'
import type { LeaderboardRow } from '@/lib/data'

/**
 * Draft2BoardsGrid — the "live proof" section for /draft2.
 *
 * Frames four real top-5 MiniBoards (yield · leverage · 10xDEV · volume) under a
 * section header, with a "full board" link. Server component: it receives the
 * already-fetched rows from the page and only composes the (server) MiniBoards —
 * no data reads here, no client island.
 */
export function Draft2BoardsGrid({
  topYield,
  topLeverage,
  topDev,
  topVolume,
}: {
  topYield: LeaderboardRow[]
  topLeverage: LeaderboardRow[]
  topDev: LeaderboardRow[]
  topVolume: LeaderboardRow[]
}) {
  return (
    <section className="my-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-gold">
            ⊙ Live boards
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Real operators. Real cascades.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            The leaderboard is the product. These are live top-fives across the
            four headline metrics — sorted by the same engine that scores you.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="shrink-0 font-mono text-xs uppercase tracking-wide text-gold transition-colors hover:text-text-primary"
        >
          Full board →
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MiniBoard metric="yield" rows={topYield} />
        <MiniBoard metric="leverage" rows={topLeverage} />
        <MiniBoard metric="dev10x" rows={topDev} />
        <MiniBoard metric="volume" rows={topVolume} />
      </div>
    </section>
  )
}
