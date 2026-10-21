import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardBriefings, buildUpdates } from "@/components/live/BoardBriefings";

let reducedMotion = false;
beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

const op = (codename: string, name: string, last: string, age: number) =>
  ({ codename, name, last, age } as unknown as import("@/lib/board/live-types").LiveOperator);
const ops = [op("a", "Alpha", "10/20/26", 30), op("b", "Beta", "10/19/26", 2)];
const stats = [{ field: "median_yield", value: "12.5" }, { field: "top_yield", value: "99.1" }];
const mount = (o = ops, s = stats) => render(<BoardBriefings ops={o} stats={s} />);
const pager = () => screen.getByRole("button", { name: /^Open Wire/ }).textContent ?? "";
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

describe("leaderboard briefings", () => {
  it("builds only real updates and hides empty categories", () => {
    const keys = buildUpdates(ops, stats).map((u) => u.kind);
    expect(keys).toEqual(["Submission", "Submission", "New operator", "Field stat", "Field stat"]);
    expect(buildUpdates([], [])).toEqual([]);
  });

  it("adds newest badge and newest article, hiding them when absent", () => {
    const kinds = buildUpdates(ops, stats, [], [], null,
      { codename: "a", name: "Alpha", badge: "Top 1% Legend", date: "2026-10-20" },
      { slug: "hello", title: "Hello World" });
    expect(kinds.map((u) => u.kind)).toEqual(
      ["Submission", "Submission", "New operator", "New badge", "New article", "Field stat", "Field stat"]);
    expect(kinds.find((u) => u.kind === "New badge")?.text).toBe("Alpha earned Top 1% Legend");
    const post = kinds.find((u) => u.kind === "New article");
    expect(post?.text).toBe("Hello World");
    expect(post?.href).toBe("/blog/hello");
  });

  it("sorts submissions by real date across a year boundary", () => {
    const o = [op("old", "Old", "12/30/25", 5), op("new", "New", "01/02/26", 9)];
    expect(buildUpdates(o, [])[0].codename).toBe("new");
    const iso = [{ ...op("x", "X", "12/30/25", 1), lastIso: "2026-01-05" }, op("y", "Y", "01/02/26", 2)] as never[];
    expect(buildUpdates(iso, [])[0].codename).toBe("x");
  });

  it("rotates every 6 seconds with a pager and pauses while hovered", async () => {
    mount();
    expect(pager()).toContain("1 / 5");
    await advance(6000);
    expect(pager()).toContain("2 / 5");
    const root = screen.getByRole("button", { name: /^Open Wire/ }).closest(".board-briefings")!;
    fireEvent.mouseEnter(root);
    await advance(30000);
    expect(pager()).toContain("2 / 5");
    fireEvent.mouseLeave(root);
    await advance(6000);
    expect(pager()).toContain("3 / 5");
  });

  it("lists every update in the popup and resumes after closing", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /^Open Wire/ }));
    const region = screen.getByRole("region", { name: "All updates" });
    expect(region).toHaveTextContent("Alpha");
    expect(region).toHaveTextContent("Median Yield 12.5");
    expect(region).toHaveTextContent("Top Yield 99.1");
    await advance(12000);
    expect(pager()).toContain("1 / 5");
    fireEvent.click(screen.getByRole("button", { name: "Close Wire / Notes" }));
    await advance(6000);
    expect(pager()).toContain("2 / 5");
  });

  it("does not rotate under reduced motion", async () => {
    reducedMotion = true;
    mount();
    await advance(30000);
    expect(pager()).toContain("1 / 5");
  });

  it("shows an empty state when there is no data", () => {
    mount([], []);
    expect(screen.getAllByText("No recent updates in this board view.").length).toBeGreaterThan(0);
  });
});
