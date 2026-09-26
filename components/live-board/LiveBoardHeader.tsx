/**
 * LiveBoardHeader — the compact hero that replaces the full-viewport WaveHero
 * on live board routes. Carries the canonical "AI User Leaderboard" /
 * "AI Operator" language and an honest provenance strip:
 *
 *   source  'supabase'    → "Live data · Supabase · snapshots through <date>"
 *   source  'snapshot'    → "Cached snapshot · captured <date> · live data
 *                          temporarily unavailable"
 *   source  'unavailable' → "Live data unavailable — no verified snapshot
 *                          on file"
 *
 * No realtime claims: Supabase Realtime is configuration-dependent and was
 * observed failing its handshake locally, so the copy says what the data
 * contract can prove — where the numbers came from and how fresh they are.
 * Server component.
 */
import type { LiveBoardSource } from "@/lib/board/live";
import styles from "./live-board.module.css";

interface Props {
  /** e.g. "AI User" (all-time) or "30-Day". */
  boardLabel: string;
  /** Eligible live operators in this window (before filters/limit). */
  population: number;
  /** Window short label, e.g. "30d" / "all-time". */
  windowShort: string;
  source: LiveBoardSource;
  /** Latest snapshot date ('YYYY-MM-DD') or cold-store capture date. */
  sourceDate: string | null;
}

const SOURCE_LABEL: Record<LiveBoardSource, string> = {
  supabase: "Live data",
  snapshot: "Cached snapshot",
  unavailable: "Data unavailable",
};

export function LiveBoardHeader({
  boardLabel,
  population,
  windowShort,
  source,
  sourceDate,
}: Props) {
  const dotClass =
    source === "supabase"
      ? styles.liveDot
      : source === "snapshot"
        ? `${styles.liveDot} ${styles.liveDotStale}`
        : `${styles.liveDot} ${styles.liveDotDown}`;

  return (
    <header className={styles.header}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>Signalboard</span>
        <span className={dotClass}>{SOURCE_LABEL[source]}</span>
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
      <p className={styles.provenance}>
        <span>
          <strong>{population}</strong> live{" "}
          {population === 1 ? "operator" : "operators"}
        </span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>
          window <strong>{windowShort}</strong>
        </span>
        {source === "supabase" && sourceDate ? (
          <>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <span>
              snapshots through <strong>{sourceDate}</strong>
            </span>
          </>
        ) : null}
        {source === "snapshot" && sourceDate ? (
          <>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <span>
              captured <strong>{sourceDate}</strong> — live data temporarily
              unavailable
            </span>
          </>
        ) : null}
        {source === "unavailable" ? (
          <>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <span>no verified snapshot on file</span>
          </>
        ) : null}
      </p>
    </header>
  );
}
