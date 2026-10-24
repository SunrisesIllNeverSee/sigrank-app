import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import subset from "../fixtures/history-subset.json";
import type { HistoricalEntry } from "@/lib/history/types";
import { HISTORY_METRIC_COLUMNS } from "@/components/history/legacy/LeaderboardTable";
import { ComparePanel } from "@/components/history/ComparePanel";

const rows = subset as unknown as HistoricalEntry[];
const byCode = (c: string) => rows.find((e) => e.codename === c)!;

afterEach(cleanup);

describe("ComparePanel", () => {
  it("shows two empty slots", () => {
    render(<ComparePanel slots={[null, null]} entries={rows} onPick={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getAllByText("Pick an operator")).toHaveLength(2);
  });

  it("picker searches the snapshot and fills a slot", () => {
    const onPick = vi.fn();
    render(<ComparePanel slots={[null, null]} entries={rows} onPick={onPick} onClear={vi.fn()} />);
    fireEvent.change(screen.getAllByLabelText("Find a July 31 operator")[0], { target: { value: "honggilgim" } });
    fireEvent.click(screen.getByRole("button", { name: /honggilgim/ }));
    expect(onPick).toHaveBeenCalledWith(0, byCode("honggilgim"));
  });

  it("with both slots filled shows archived ranks and one row per metric", () => {
    render(<ComparePanel slots={[byCode("furic"), byCode("honggilgim")]} entries={rows} onPick={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByTestId("hist-cmp-rank-0").textContent).toBe("#1");
    expect(screen.getByTestId("hist-cmp-rank-1").textContent).toBe("#3");
    expect(document.querySelectorAll("[data-cmp-key]").length).toBe(HISTORY_METRIC_COLUMNS.length);
  });

  it("marks the better value, which is the lower one for $/1M", () => {
    const a = byCode("furic"), b = byCode("honggilgim");
    render(<ComparePanel slots={[a, b]} entries={rows} onPick={vi.fn()} onClear={vi.fn()} />);
    const cost = document.querySelector('[data-cmp-key="costPerMillion"]')!;
    const cells = cost.querySelectorAll("td");
    const lowerIsA = a.costPerMillion! < b.costPerMillion!;
    expect(cells[lowerIsA ? 0 : 1].className).toBe("hi");
    expect(cells[lowerIsA ? 1 : 0].className).toBe("");
  });

  it("clear empties a slot", () => {
    const onClear = vi.fn();
    render(<ComparePanel slots={[byCode("furic"), null]} entries={rows} onPick={vi.fn()} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear A" }));
    expect(onClear).toHaveBeenCalledWith(0);
  });

  it("never links to live Compare or live profiles", () => {
    const { container } = render(<ComparePanel slots={[byCode("furic"), byCode("zachlagden")]} entries={rows} onPick={vi.fn()} onClear={vi.fn()} />);
    expect(container.querySelectorAll('a[href^="/compare"], a[href^="/user/"]').length).toBe(0);
  });
});
