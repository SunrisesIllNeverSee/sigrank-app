/**
 * LiveBoardHeader — the compact hero that replaces the full-viewport WaveHero
 * on live board routes. Carries the canonical "AI User Leaderboard" language.
 *
 * Provenance (source badge, population count, freshness date) deliberately
 * does NOT live here: the header is SSR chrome, and the client island can
 * replace SSR rows with fetched data whose provenance differs. Rendering
 * source claims here would leave stale "Live data" labels attached to rows
 * the server never sent — so all provenance renders inside BoardTableClient,
 * bound to the dataset actually on screen. The single exception: an SSR
 * 'unavailable' badge, which can never go stale (the board column mounts the
 * unavailable panel instead of the client table, and retry reloads the page).
 * Server component.
 */
import type { LiveBoardSource } from "@/lib/board/live";
import styles from "./live-board.module.css";

interface Props {
  /** e.g. "AI User" (all-time) or "30-Day". */
  boardLabel: string;
  source: LiveBoardSource;
}

export function LiveBoardHeader({ boardLabel, source }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>Signalboard</span>
        {source === "unavailable" ? (
          <span className={`${styles.liveDot} ${styles.liveDotDown}`}>
            Data unavailable
          </span>
        ) : null}
      </div>
      <h1 className={styles.title}>
        {boardLabel} <span className={styles.titleAccent}>Leaderboard</span>
      </h1>
      <p className={styles.subline}>
        The SigRank <strong>AI User Leaderboard</strong> — AI operators ranked
        by <strong>Υ Yield</strong> (cache_read × output / input²): the
        architecture of the cascade, not raw spend. Claimed operators plus The
        Field baseline; the seeded archive lives on sigeconomy.com.
      </p>
    </header>
  );
}
