import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

// Mock next/navigation — LeaderboardTable uses useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/board/30d",
}));

import { LeaderboardTable } from "@/components/sigrank/LeaderboardTable";
import type { LeaderboardEntry } from "@/components/sigrank/types";

const mockEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    anonId: "TestOperator",
    codename: "TestOperator",
    signalClass: "TRANSMITTER",
    isSeed: false,
    yield_: 1000,
    leverage: 5.2,
    snr: 0.45,
    dev10x: 3.1,
    velocity: 2.1,
    totalTokens: 1_000,
    input: 100,
    output: 200,
    cacheWrite: 300,
    cacheRead: 400,
    acctAge: "30d",
    lastSeen: "2026-07-04",
  },
];

describe("LeaderboardTable", () => {
  it("renders without crashing", () => {
    const { container } = render(<LeaderboardTable entries={mockEntries} />);
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("shows operator codename", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    // Codename appears in the table — use getAllByText since it may render in multiple places
    const matches = screen.getAllByText("TestOperator");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows raw I/O/W/R pillars in the default metrics view", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(
      screen.getByText("I 100 · O 200 · W 300 · R 400"),
    ).toBeInTheDocument();
  });

  it("renders seed operators with italic styling", () => {
    const seedEntries: LeaderboardEntry[] = [
      {
        ...mockEntries[0],
        isSeed: true,
        anonId: "SeedOperator",
        codename: "SeedOperator",
      },
    ];
    render(<LeaderboardTable entries={seedEntries} />);
    // The seed operator's name span has fontStyle: 'italic' (inline style via
    // e.isSeed ? 'italic' : 'normal'). jsdom's getComputedStyle reads inline styles.
    const matches = screen.getAllByText("SeedOperator");
    const hasItalic = matches.some(
      (el) => window.getComputedStyle(el).fontStyle === "italic",
    );
    expect(hasItalic).toBe(true);
  });

  it("renders non-seed operators without italic styling", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    const matches = screen.getAllByText("TestOperator");
    const hasItalic = matches.some(
      (el) => window.getComputedStyle(el).fontStyle === "italic",
    );
    expect(hasItalic).toBe(false);
  });

  it("opens All and offers HITL and Agentic workflow views", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByRole("button", { name: "HITL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agentic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveStyle({ fontWeight: 700 });
    expect(screen.queryByRole("button", { name: /outliers/i })).not.toBeInTheDocument();
  });

  it("uses shareable mode URLs and keeps All as the clean default", () => {
    push.mockClear();
    render(<LeaderboardTable entries={mockEntries} window="all" />);
    fireEvent.click(screen.getByRole("button", { name: "Agentic" }));
    expect(push).toHaveBeenCalledWith("/board/all?mode=agentic");
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(push).toHaveBeenLastCalledWith("/board/all");
  });
});
