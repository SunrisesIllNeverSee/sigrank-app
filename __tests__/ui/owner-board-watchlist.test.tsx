import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const session = vi.hoisted(() => ({ linked: { loaded: true, signedIn: true, codename: "signal-owner", displayName: "Owner", rank: 3, pixelBadge: null } }));
vi.mock("@/components/live/session", () => ({ useBoardSession: () => session.linked }));
vi.mock("@/components/live/WatchButton", () => ({ WatchButton: ({ codename }: { codename: string }) => <button>WATCH {codename}</button> }));

import { MyWatchlist } from "@/components/profile-v2/MyWatchlist";
import { BoardHead } from "@/components/live/rows";
import { ProfileActions } from "@/components/live/ProfileActions";
import { CONTROLS, SORT_KEY } from "@/components/live/utils";
import type { LiveOperator } from "@/lib/board/live-types";

describe("Scale V leaderboard", () => {
  it("shows sortable Scale V with linked Wiki definition and leaves Total present", () => {
    const sort = vi.fn();
    const { container } = render(<table><thead><BoardHead mode="metrics" sortKey="Scale V" sortDir="desc" onSort={sort}/></thead></table>);
    expect(screen.getByRole("button", { name: /SCALE V/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Scale V definition in Wiki/ })).toHaveAttribute("href", "/wiki/metrics/scale-v");
    expect(container.querySelector('th[aria-sort="descending"]')).toHaveTextContent("SCALE V");
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /SCALE V/ }));
    expect(sort).toHaveBeenCalledWith("Scale V");
    expect(CONTROLS.sorts).toContain("Scale V");
  });
  it("orders by the existing calculated Scale V rather than the compact total", () => {
    const op = { scalev: 7.5 } as LiveOperator;
    expect(SORT_KEY["Scale V"](op)).toBe(7.5);
    expect(SORT_KEY["Scale V"]({ scalev: Number.NaN } as LiveOperator)).toBe(-1);
  });
});

describe("Operator dock actions", () => {
  it("contains only PROFILE and WATCH, never COMPARE", () => {
    const op = { codename: "signal-example" } as LiveOperator;
    render(<ProfileActions op={op} />);
    expect(screen.getByRole("link", { name: "PROFILE" })).toHaveAttribute("href", "/user/signal-example");
    expect(screen.getByRole("button", { name: "WATCH signal-example" })).toBeInTheDocument();
    expect(screen.queryByText("COMPARE")).not.toBeInTheDocument();
  });
  it("conditionally offers COMPARE with the signed-in viewer and other operator", () => {
    const op = { codename: "other-operator" } as LiveOperator;
    const { container } = render(<ProfileActions
      op={op}
      showCompare
      compareHref="/compare?a=my-operator&b=other-operator"
    />);
    expect(screen.getByRole("link", { name: "PROFILE" })).toHaveAttribute("href", "/user/other-operator");
    expect(screen.getByRole("button", { name: "WATCH other-operator" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "COMPARE" })).toHaveAttribute(
      "href", "/compare?a=my-operator&b=other-operator",
    );
    expect(container.querySelector(".peek-actions.compare-enabled")).toBeInTheDocument();
    expect([...container.querySelectorAll(".peek-actions > *")].map((el) => el.textContent)).toEqual([
      "PROFILE", "WATCH other-operator", "COMPARE",
    ]);
  });
});

describe("private profile watchlist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    session.linked = { loaded: true, signedIn: true, codename: "signal-owner", displayName: "Owner", rank: 3, pixelBadge: null };
  });
  it("does not fetch or reveal watchlist for somebody else's profile", () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ watches: [] }) } as Response);
    const { container } = render(<MyWatchlist codename="signal-other" />);
    expect(container).toBeEmptyDOMElement();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("loads only the signed-in owner watches and offers unwatch controls", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ watches: [{ codename: "signal-example", name: "Operator Example", watchedAt: "2026-10-12T00:00:00Z" }] }) } as Response);
    render(<MyWatchlist codename="signal-owner" />);
    await waitFor(() => expect(screen.getByText("Operator Example")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Operator Example" })).toHaveAttribute("href", "/user/signal-example");
    expect(screen.getByRole("button", { name: "WATCH signal-example" })).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/v1/me/watches", expect.objectContaining({ cache: "no-store" }));
    fireEvent(window, new Event("operator-watch-changed"));
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThan(1));
  });
});
