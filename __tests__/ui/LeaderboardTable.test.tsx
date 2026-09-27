import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation — LeaderboardTable uses useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
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
});

describe("LeaderboardTable — population labels", () => {
  const threeOps: LeaderboardEntry[] = [0, 1, 2].map((i) => ({
    rank: i + 1,
    anonId: `Op${i}`,
    codename: `Op${i}`,
    signalClass: "IGNITER I",
    isSeed: false,
    yield_: 10 - i,
    leverage: null,
    dev10x: null,
    velocity: null,
    acctAge: "—",
    lastSeen: null,
  }));

  it("platform view labels rows vs operators distinctly", () => {
    render(
      <LeaderboardTable
        entries={threeOps}
        totalUsers={2}
        view="platforms"
      />,
    );
    // 3 (operator × platform) rows over 2 distinct operators — the footer
    // must not call both sides 'operators'.
    expect(screen.getByText(/platform rows/)).toBeTruthy();
    expect(screen.getByText(/2 operators/)).toBeTruthy();
  });

  it("total view splits claimed vs baseline operators", () => {
    render(
      <LeaderboardTable entries={threeOps} totalUsers={3} baselineCount={1} />,
    );
    expect(screen.getByText(/2 claimed \+ 1 baseline/)).toBeTruthy();
  });
});
