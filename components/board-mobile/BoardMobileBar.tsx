"use client";

/**
 * BoardMobileBar — the sticky phone bar above the card list (owner 2026-10-21):
 * HITL / Hybrid / Auto-Review toggle, a window chip, and a Filters button that
 * opens a Sheet with every other control (window, platform, class, sort,
 * metrics/raw, table filter). All state is the workspace's own — this is a
 * controlled view over the same setters the desktop filter bar uses.
 */
import { Sheet } from "../mobile/Sheet";
import { CONTROLS } from "../live/utils";
import type { ColMode } from "../live/rows";

export type Wf = "hybrid" | "hitl" | "agentic";

export interface BoardFilterState {
  windowSel: string;
  onWindow: (label: string) => void;
  platformSel: string;
  onPlatform: (v: string) => void;
  classSel: string;
  onClass: (v: string) => void;
  sortSel: string;
  onSort: (v: string) => void;
  colMode: ColMode;
  onColMode: (m: ColMode) => void;
  search: string;
  onSearch: (v: string) => void;
  /** rows currently matching, for the sheet's "Show N" button */
  matchCount: number;
}

export interface BoardMobileBarProps extends BoardFilterState {
  wfSel: Wf;
  onWf: (w: Wf) => void;
  filtersOpen: boolean;
  onOpenFilters: () => void;
}

const activeFilters = (p: BoardFilterState) =>
  (p.platformSel !== CONTROLS.platforms[0] ? 1 : 0) +
  (p.classSel !== CONTROLS.classes[0] ? 1 : 0) +
  (p.sortSel !== CONTROLS.sorts[0] ? 1 : 0) +
  (p.colMode !== "metrics" ? 1 : 0) +
  (p.search.trim() ? 1 : 0);

const WF: { id: Wf; label: string; full: string }[] = [
  { id: "hitl", label: "HITL", full: "Human in the loop" },
  { id: "hybrid", label: "Hybrid", full: "Hybrid, combined view" },
  { id: "agentic", label: "Auto/Review", full: "Autonomous and review" },
];

export function BoardMobileBar(p: BoardMobileBarProps) {
  const active = activeFilters(p);
  return (
    <div className="bm-bar" role="group" aria-label="Leaderboard controls">
      <div className="bm-seg" role="group" aria-label="Workflow view">
        {WF.map((w) => (
          <button
            key={w.id}
            type="button"
            className={p.wfSel === w.id ? "on" : ""}
            aria-pressed={p.wfSel === w.id}
            aria-label={w.full}
            onClick={() => p.onWf(w.id)}
          >
            {w.label}
          </button>
        ))}
      </div>
      <div className="bm-row">
        <label className="bm-chip bm-win">
          <span className="bm-sr">Window</span>
          <select aria-label="Window" value={p.windowSel} onChange={(e) => p.onWindow(e.target.value)}>
            {CONTROLS.windows.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <button type="button" className="bm-chip bm-filters" aria-haspopup="dialog" aria-expanded={p.filtersOpen} onClick={p.onOpenFilters}>
          Filters{active ? <span className="bm-n" aria-label={`${active} active`}>{active}</span> : null}
        </button>
      </div>
    </div>
  );
}

/** Rendered at the workspace root (outside the stage) so its fixed layer is not
 *  trapped under the stage's stacking context. */
export function BoardFilterSheet({ open, onClose, ...p }: BoardFilterState & { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Filters">
        <div className="bm-sheet">
          <Field label="Window">
            <select value={p.windowSel} onChange={(e) => p.onWindow(e.target.value)}>
              {CONTROLS.windows.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Platform">
            <select value={p.platformSel} onChange={(e) => p.onPlatform(e.target.value)}>
              {CONTROLS.platforms.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Class">
            <select value={p.classSel} onChange={(e) => p.onClass(e.target.value)}>
              {CONTROLS.classes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort by">
            <select value={p.sortSel} onChange={(e) => p.onSort(e.target.value)}>
              {CONTROLS.sorts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <div className="bm-field">
            <span className="bm-lbl" id="bm-cols-l">Columns</span>
            <div className="bm-seg" role="group" aria-labelledby="bm-cols-l">
              {(["metrics", "raw"] as const).map((m) => (
                <button key={m} type="button" className={p.colMode === m ? "on" : ""} aria-pressed={p.colMode === m} onClick={() => p.onColMode(m)}>
                  {m === "metrics" ? "Metrics" : "Raw"}
                </button>
              ))}
            </div>
          </div>
          <Field label="Filter table">
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Name or codename"
              value={p.search}
              onChange={(e) => p.onSearch(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </Field>
          <div className="bm-actions">
            <button
              type="button"
              className="bm-btn ghost"
              onClick={() => {
                p.onPlatform(CONTROLS.platforms[0]);
                p.onClass(CONTROLS.classes[0]);
                p.onSort(CONTROLS.sorts[0]);
                p.onColMode("metrics");
                p.onSearch("");
              }}
            >
              Reset
            </button>
            <button type="button" className="bm-btn" onClick={onClose}>
              Show {p.matchCount.toLocaleString()}
            </button>
          </div>
        </div>
      </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="bm-field">
      <span className="bm-lbl">{label}</span>
      {children}
    </label>
  );
}
