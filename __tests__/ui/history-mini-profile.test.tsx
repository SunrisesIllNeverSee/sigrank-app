import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import subset from "../fixtures/history-subset.json";
import type { HistoricalEntry } from "@/lib/history/types";
import { claimMailto } from "@/lib/identity/claim-contact";
import { MiniProfile } from "@/components/history/MiniProfile";

const rows = subset as unknown as HistoricalEntry[];
const byCode = (c: string) => rows.find((e) => e.codename === c)!;
const nullYield = rows.find((e) => e.yield_ === null)!;

afterEach(cleanup);

describe("MiniProfile", () => {
  it("shows an empty state with no selection", () => {
    render(<MiniProfile entry={null} onAddToCompare={vi.fn()} />);
    expect(screen.getByText("Select an operator")).toBeTruthy();
  });

  it("shows the archived identity, rank, class and snapshot banner", () => {
    render(<MiniProfile entry={byCode("furic")} onAddToCompare={vi.fn()} />);
    expect(screen.getByText("Richard Fu")).toBeTruthy();
    expect(screen.getByText("@furic")).toBeTruthy();
    expect(screen.getByText("furic")).toBeTruthy();
    expect(screen.getByTestId("hist-archived-rank").textContent).toBe("#1");
    expect(screen.getByText(byCode("furic").signalClass)).toBeTruthy();
    expect(screen.getByText("Snapshot from July 31, 2026. Not linked to a live profile.")).toBeTruthy();
  });

  it("claim link is the existing email claim path", () => {
    render(<MiniProfile entry={byCode("furic")} onAddToCompare={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Claim this profile" }).getAttribute("href")).toBe(claimMailto("furic"));
  });

  it("never links to a live profile, even when the codename exists live", () => {
    const { container } = render(<MiniProfile entry={byCode("zachlagden")} onAddToCompare={vi.fn()} />);
    expect(container.querySelectorAll('a[href^="/user/"], a[href^="/me"]').length).toBe(0);
  });

  it("shows — for a null metric", () => {
    render(<MiniProfile entry={nullYield} onAddToCompare={vi.fn()} />);
    expect(screen.getByTestId("hist-metric-yield_").textContent).toContain("—");
  });

  it("Add to compare passes the entry up", () => {
    const add = vi.fn();
    render(<MiniProfile entry={byCode("furic")} onAddToCompare={add} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to compare" }));
    expect(add).toHaveBeenCalledWith(byCode("furic"));
  });
});
