/**
 * LiveBoardShell — the structural wrapper for the four live board routes
 * (/board/all · /7d · /30d · /90d). Phase 1 (2026-09-26): one tokenized
 * layout that renders under every existing theme via the --live-* aliases
 * in live-board.module.css — green (terminal) is the tuned default;
 * carbon/railway/paper stay structurally compatible.
 *
 * Composition (server-side):
 *   header   — compact hero + provenance strip (LiveBoardHeader)
 *   worldNav — window tabs + Compare/Hall destinations (LiveWorldNav)
 *   grid     — board column (children) + FieldRail context aside
 *
 * The children render inside .boardCol, which carries min-width:0 so the
 * table's own horizontal scroll stays contained — no page-level overflow.
 */
import type { ReactNode } from "react";
import { LiveBoardHeader } from "./LiveBoardHeader";
import { LiveWorldNav } from "./LiveWorldNav";
import { FieldRail } from "./FieldRail";
import type { LiveBoardSource } from "@/lib/board/live";
import styles from "./live-board.module.css";

interface Props {
  /** Active window slug ('7d' | '30d' | '90d' | 'all'). */
  windowSlug: string;
  /** H1 lead-in: 'AI User' (all-time) or '<n>-Day'. */
  boardLabel: string;
  /** Window short label for the provenance strip, e.g. '30d' / 'all-time'. */
  windowShort: string;
  /** Window label for the rail, e.g. 'All time' / '30 day'. */
  windowLabel: string;
  population: number;
  source: LiveBoardSource;
  sourceDate: string | null;
  /** When the data source is unavailable, the board column renders an honest
   *  unavailable state instead of an empty table. */
  children: ReactNode;
}

export function LiveBoardShell({
  windowSlug,
  boardLabel,
  windowShort,
  windowLabel,
  population,
  source,
  sourceDate,
  children,
}: Props) {
  return (
    <section className={styles.shell} aria-label="Live board">
      <LiveBoardHeader
        boardLabel={boardLabel}
        population={population}
        windowShort={windowShort}
        source={source}
        sourceDate={sourceDate}
      />
      <LiveWorldNav active={windowSlug} />
      <div className={styles.grid}>
        <div className={styles.boardCol}>
          {source === "unavailable" ? (
            <div className={styles.unavailable} role="status">
              <h2 className={styles.unavailableTitle}>
                Live board data is unavailable
              </h2>
              <p className={styles.unavailableBody}>
                SigRank could not reach live data and no verified cold-store
                snapshot is on file. The board never shows synthetic rows —
                check back shortly, or browse the seeded archive on{" "}
                <a href="https://sigeconomy.com/all-time" rel="noopener">
                  sigeconomy.com
                </a>
                .
              </p>
            </div>
          ) : (
            children
          )}
        </div>
        <FieldRail windowLabel={windowLabel} population={population} />
      </div>
    </section>
  );
}
