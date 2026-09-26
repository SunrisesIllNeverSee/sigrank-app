/**
 * FieldRail — the restrained right-hand rail on the live board. Phase 1 keeps
 * it deliberately thin: who The Field is (the baseline every ranking is
 * measured against) and doors into the two first-class destinations —
 * Compare and the Hall. No invented movers, sparklines, or stat blocks.
 * Server component.
 */
import Link from "next/link";
import styles from "./live-board.module.css";

interface Props {
  /** Window label shown in the rail's context line, e.g. "all-time". */
  windowLabel: string;
  /** Eligible live population for the current window. */
  population: number;
}

export function FieldRail({ windowLabel, population }: Props) {
  return (
    <aside className={styles.rail} aria-label="Board context">
      <div className={styles.railCard}>
        <h2 className={styles.railTitle}>The Field</h2>
        <p className={styles.railBody}>
          The Field is the baseline AI operator — the field average every rank
          is measured against. Beat The Field and you beat the average.
        </p>
        <Link href="/compare" className={styles.railLink}>
          You vs. The Field →
        </Link>
      </div>
      <div className={styles.railCard}>
        <h2 className={styles.railTitle}>Board context</h2>
        <div className={styles.railStat}>
          <span>Window</span>
          <strong>{windowLabel}</strong>
        </div>
        <div className={styles.railStat}>
          <span>Live operators</span>
          <strong>{population}</strong>
        </div>
        <Link href="/hall" className={styles.railLink}>
          Full Hall of Signal →
        </Link>
      </div>
    </aside>
  );
}
