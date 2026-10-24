import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import subset from "../fixtures/history-subset.json";
import type { HistoricalEntry } from "@/lib/history/types";
import { HistoricalLeaderboardTable } from "@/components/history/legacy/LeaderboardTable";

const entries = subset as unknown as HistoricalEntry[];
const truth = new Map(entries.map((e) => [e.codename, { rank: e.rank, seed: e.isSeed ? "1" : "0" }]));

afterEach(cleanup);

function renderTable(onSelect = vi.fn()) {
  render(<HistoricalLeaderboardTable entries={entries} totalUsers={1642} onSelect={onSelect} />);
  return onSelect;
}

/** Desktop rows on the current page (the mobile card list duplicates them). */
const pageRows = () => Array.from(document.querySelectorAll<HTMLTableRowElement>("tr[data-archived-rank]"));

/** Walk every page from the first and collect desktop rows in display order. */
function allRows(): HTMLTableRowElement[] {
  const out: HTMLTableRowElement[] = [];
  while (screen.queryByRole("button", { name: "← Prev" }) && !(screen.getByRole("button", { name: "← Prev" }) as HTMLButtonElement).disabled) {
    fireEvent.click(screen.getByRole("button", { name: "← Prev" }));
  }
  for (;;) {
    out.push(...pageRows());
    const next = screen.queryByRole("button", { name: "Next →" }) as HTMLButtonElement | null;
    if (!next || next.disabled) break;
    fireEvent.click(next);
  }
  return out;
}

const codenameOf = (tr: HTMLTableRowElement) => tr.getAttribute("data-codename")!;

function expectRanksIntact(rows: HTMLTableRowElement[]) {
  for (const tr of rows) {
    const t = truth.get(codenameOf(tr))!;
    expect(tr.getAttribute("data-archived-rank")).toBe(String(t.rank));
    expect(tr.getAttribute("data-seed")).toBe(t.seed);
    expect(tr.querySelector("td")!.textContent).toContain(String(t.rank));
  }
}

describe("HistoricalLeaderboardTable", () => {
  it("shows every fixture row by default, rank 1 = Richard Fu @furic", () => {
    renderTable();
    const rows = allRows();
    expect(rows).toHaveLength(entries.length);
    const first = pageRowsAfterReset()[0];
    expect(first.getAttribute("data-archived-rank")).toBe("1");
    expect(first.textContent).toContain("Richard Fu");
    expect(first.textContent).toContain("@furic");
  });

  it("keeps archived rank and seed flag on every row under every sort, both directions", () => {
    renderTable();
    const headers = Array.from(document.querySelectorAll<HTMLElement>("th[title^='Sort by']"));
    expect(headers.length).toBeGreaterThanOrEqual(8);
    for (const th of headers) {
      for (let k = 0; k < 2; k++) {
        fireEvent.click(th);
        const rows = allRows();
        expect(rows).toHaveLength(entries.length);
        expectRanksIntact(rows);
      }
    }
  }, 30_000);

  it("puts null Yield rows last when sorted by Yield, in both directions", () => {
    renderTable();
    const yieldTh = document.querySelector<HTMLElement>("th[title='Sort by Υ Yield']")!;
    for (let k = 0; k < 2; k++) {
      fireEvent.click(yieldTh);
      const rows = allRows();
      const nulls = rows.filter((tr) => entries.find((e) => e.codename === codenameOf(tr))!.yield_ === null);
      expect(nulls).toHaveLength(3);
      expect(rows.slice(-3)).toEqual(nulls);
      for (const tr of nulls) expect(tr.textContent).toContain("—");
    }
  });

  it("Seeded only hides the 16 real rows and keeps rank gaps", () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Seeded only" }));
    const rows = allRows();
    expect(rows).toHaveLength(entries.filter((e) => e.isSeed).length);
    expect(rows.every((tr) => tr.getAttribute("data-seed") === "1")).toBe(true);
    expectRanksIntact(rows);
  });

  it("does not crash filtering by class with the null-class row present", () => {
    renderTable();
    fireEvent.change(screen.getByLabelText("Class filter"), { target: { value: "power" } });
    const rows = allRows();
    expect(rows.length).toBeGreaterThan(0);
    expectRanksIntact(rows);
  });

  it("platform filter matches any declared platform, not only the primary one", () => {
    renderTable();
    fireEvent.change(screen.getByLabelText("Platform filter"), { target: { value: "Claude" } });
    const rows = allRows();
    const expected = entries.filter(
      (e) => e.platform === "claude" || (e.platforms ?? []).some((p) => p.toLowerCase() === "claude"),
    );
    expect(rows).toHaveLength(expected.length);
    expect(rows.some((tr) => entries.find((e) => e.codename === codenameOf(tr))!.platform === "multi")).toBe(true);
    expectRanksIntact(rows);
  });

  it("searches by codename and by display name", () => {
    renderTable();
    const search = screen.getByLabelText("Search operators");
    fireEvent.change(search, { target: { value: "zachlagden" } });
    expect(pageRows().map(codenameOf)).toEqual(["zachlagden"]);
    fireEvent.change(search, { target: { value: "Richard" } });
    expect(pageRows().map((tr) => tr.getAttribute("data-archived-rank"))).toContain("1");
  });

  it("row click calls onSelect with that entry and never links to a live profile", () => {
    const onSelect = renderTable();
    const first = pageRows()[0];
    fireEvent.click(within(first).getByRole("button", { name: /Richard Fu/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ codename: "furic", rank: 1 }));
    expect(document.querySelectorAll('a[href^="/user/"]').length).toBe(0);
  });

  it("has no window, breakdown or capture controls", () => {
    renderTable();
    expect(screen.queryByLabelText("Window filter")).toBeNull();
    expect(screen.queryByRole("button", { name: "By platform" })).toBeNull();
  });
});

function pageRowsAfterReset() {
  while (!(screen.getByRole("button", { name: "← Prev" }) as HTMLButtonElement).disabled) {
    fireEvent.click(screen.getByRole("button", { name: "← Prev" }));
  }
  return pageRows();
}
