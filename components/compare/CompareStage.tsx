import type { ReactNode } from "react";

export function CompareStage({
  matchup,
  ledger,
}: {
  matchup: ReactNode;
  ledger: ReactNode;
}) {
  return (
    <fieldset className="ws-cmp-stage">
      <legend className="sr-only">Compare view</legend>
      <input className="ws-cmp-view-input" type="radio" name="compare-view" id="compare-matchup" defaultChecked aria-controls="compare-matchup-panel" />
      <input className="ws-cmp-view-input" type="radio" name="compare-view" id="compare-ledger" aria-controls="compare-ledger-panel" />
      <div className="ws-cmp-view-switch">
        <label id="compare-matchup-label" htmlFor="compare-matchup">Matchup</label>
        <label id="compare-ledger-label" htmlFor="compare-ledger">Ledger</label>
      </div>
      <section id="compare-matchup-panel" aria-labelledby="compare-matchup-label" className="ws-cmp-matchup-view">{matchup}</section>
      <section id="compare-ledger-panel" aria-labelledby="compare-ledger-label" className="ws-cmp-ledger-view">{ledger}</section>
    </fieldset>
  );
}
