/**
 * LiveWorldNav — the board's own navigation strip: the four window tabs
 * (7d / 30d / 90d / all-time) plus the board's first-class destinations
 * (Compare, Hall of Signal). Server component — plain links, no state.
 *
 * Compare stays a two-operand workflow — the tab just routes to /compare
 * (which pre-loads The Field as the baseline opponent).
 */
import Link from "next/link";
import { BOARD_WINDOWS } from "@/lib/board/windows";
import styles from "./live-board.module.css";

export function LiveWorldNav({ active }: { active: string }) {
  return (
    <nav className={styles.worldNav} aria-label="Board windows and destinations">
      {/* Plain page navigations, not tab widgets — no tablist/tab roles,
          aria-current="page" carries the active state. */}
      <div className={styles.windowTabs} aria-label="Board window">
        {BOARD_WINDOWS.map((w) => (
          <Link
            key={w.slug}
            href={`/board/${w.slug}`}
            aria-current={w.slug === active ? "page" : undefined}
            className={
              w.slug === active
                ? `${styles.windowTab} ${styles.windowTabActive}`
                : styles.windowTab
            }
          >
            {w.short}
          </Link>
        ))}
      </div>
      <div className={styles.destinations}>
        <Link
          href="/compare"
          className={`${styles.destination} ${styles.destinationPrimary}`}
        >
          Compare
        </Link>
        <Link href="/hall" className={styles.destination}>
          Hall of Signal
        </Link>
      </div>
    </nav>
  );
}
